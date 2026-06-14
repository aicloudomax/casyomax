const cron = require('node-cron');
const { DateTime } = require('luxon');
const scheduledMessageModel = require('../models/scheduledMessageModel');
const scheduleModel = require('../models/scheduleModel');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

const initScheduler = () => {
    console.log("Scheduler Service Started: checking every minute...");

    cron.schedule('* * * * *', async () => {
        try {
            await processScheduledMessages();
            await processMedicationReminders();
            await processSnoozedMedicationReminders();
            await processMissedMedicationAlerts();
        } catch (error) {
            console.error("Scheduler check error:", error);
        }
    });
};

const processScheduledMessages = async () => {
    const result = await scheduledMessageModel.getPendingMessagesDue();
    const messages = result.rows;

    if (messages.length > 0) {
        console.log(`Found ${messages.length} due scheduled message(s).`);

        for (const msg of messages) {
            await processMessage(msg);
        }
    }
};

const processMessage = async (msg) => {
    console.log(`Sending scheduled ${msg.message_type} ID ${msg.id} to ${msg.recipient_email}`);

    try {
        if (msg.message_type === 'EMAIL') {
            await emailService.sendCustomEmail(
                msg.recipient_email,
                msg.content.subject,
                msg.content.body.replace(/\n/g, '<br>')
            );
        } else if (msg.message_type === 'SMS') {
            console.log("SMS sending is not implemented yet.");
        }

        await scheduledMessageModel.updateMessageStatus(msg.id, 'SENT');
        console.log(`Message ID ${msg.id} marked as SENT.`);
    } catch (error) {
        console.error(`Failed to send message ID ${msg.id}`, error);
        await scheduledMessageModel.updateMessageStatus(msg.id, 'FAILED');
    }
};

const normalizeDaysOfWeek = (daysOfWeek) => {
    if (Array.isArray(daysOfWeek)) {
        return daysOfWeek.map(Number).filter(day => Number.isInteger(day));
    }

    if (typeof daysOfWeek === 'string') {
        return daysOfWeek
            .replace(/[{}[\]\s]/g, '')
            .split(',')
            .filter(Boolean)
            .map(Number)
            .filter(day => Number.isInteger(day));
    }

    return [];
};

const calculateNextMedicationRun = (schedule, fromUtc = DateTime.utc()) => {
    const zone = schedule.schedule_timezone || 'UTC';
    const localNow = fromUtc.setZone(zone);
    const [rawHour = 0, rawMinute = 0] = String(schedule.time_of_day || '00:00')
        .split(':')
        .map(value => parseInt(value, 10));
    const hour = Number.isInteger(rawHour) ? rawHour : 0;
    const minute = Number.isInteger(rawMinute) ? rawMinute : 0;

    const type = String(schedule.schedule_type || 'daily').toLowerCase();
    const days = normalizeDaysOfWeek(schedule.days_of_week);
    const restrictedDays = (type === 'weekly' || type === 'specific_days') && days.length > 0;

    for (let offset = 0; offset <= 14; offset++) {
        const candidateDay = localNow.plus({ days: offset });
        const dayIndex = candidateDay.weekday % 7; // Luxon uses Monday=1..Sunday=7; app stores Sunday=0.

        if (restrictedDays && !days.includes(dayIndex)) {
            continue;
        }

        const candidate = candidateDay.set({
            hour,
            minute,
            second: 0,
            millisecond: 0
        });

        if (candidate > localNow) {
            return candidate.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
        }
    }

    return localNow.plus({ days: 1 }).set({
        hour,
        minute,
        second: 0,
        millisecond: 0
    }).toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
};

const processMedicationReminders = async () => {
    const schedules = await scheduleModel.getDueSchedules();

    if (schedules.length === 0) {
        return;
    }

    console.log(`Found ${schedules.length} due medication schedule(s).`);

    for (const schedule of schedules) {
        try {
            const alreadyLogged = await scheduleModel.checkExistingLog(schedule.id);
            if (alreadyLogged) {
                await scheduleModel.updateNextRunTime(schedule.id, calculateNextMedicationRun(schedule));
                continue;
            }

            const log = await scheduleModel.createMedicationLog({
                schedule_id: schedule.id,
                patient_id: schedule.patient_user_id,
                status: 'pending',
                scheduled_at: schedule.scheduled_time_utc || new Date(),
                reminder_sent_at: new Date()
            });

            await notificationService.sendMedicationNotification(
                schedule.patient_user_id,
                schedule.medicine_name,
                schedule.id,
                log.id,
                schedule.expo_push_token
            );

            await scheduleModel.updateNextRunTime(schedule.id, calculateNextMedicationRun(schedule));
        } catch (error) {
            console.error(`Medication reminder failed for schedule ${schedule.id}:`, error);
        }
    }
};

const processSnoozedMedicationReminders = async () => {
    const olderThan = new Date(Date.now() - 5 * 60 * 1000);
    const logs = await scheduleModel.getSnoozedLogs(olderThan);

    for (const log of logs) {
        try {
            const updatedLog = await scheduleModel.updateLogStatus(log.id, 'pending', {
                reminder_sent_at: new Date(),
                response_method: 'snooze_retry'
            });

            await notificationService.sendMedicationNotification(
                log.patient_user_id,
                log.medicine_name,
                log.schedule_id,
                updatedLog.id,
                log.expo_push_token
            );
        } catch (error) {
            console.error(`Snoozed reminder failed for log ${log.id}:`, error);
        }
    }
};

const processMissedMedicationAlerts = async () => {
    const olderThan = new Date(Date.now() - 10 * 60 * 1000);
    const logs = await scheduleModel.getPendingLogs(olderThan);

    for (const log of logs) {
        try {
            await notificationService.sendCaregiverAlert(
                log.caregiver_id,
                log.patient_name,
                log.medicine_name,
                log.caregiver_token
            );

            await scheduleModel.updateLogStatus(log.id, 'missed', {
                response_method: 'timeout',
                notes: 'Automatically marked missed after 10 minutes without confirmation.'
            });
        } catch (error) {
            console.error(`Missed medication alert failed for log ${log.id}:`, error);
        }
    }
};

module.exports = { initScheduler };
