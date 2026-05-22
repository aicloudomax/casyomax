const medicationScheduleModel = require("../models/medicationScheduleModel");
const { DateTime } = require("luxon");

// Helper: Calculate initial UTC execution time
const calculateNextRun = (timeOfDay, timeZone) => {
    // 1. Create a Luxon DateTime for "Today" at the given HH:MM in the user's timezone
    const [hours, minutes] = timeOfDay.split(':');

    // Default to 'UTC' if timeZone is missing/null to prevent crash, though it should be validated
    const validZone = timeZone || 'UTC';

    let candidate = DateTime.now().setZone(validZone).set({
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: 0,
        millisecond: 0
    });

    // 2. If the time has already passed in THAT timezone, schedule for tomorrow
    if (candidate <= DateTime.now().setZone(validZone)) {
        candidate = candidate.plus({ days: 1 });
    }

    // 3. Return as DB-ready string (prevent PG driver from converting to local time)
    return candidate.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
};

exports.createSchedule = async (req, res) => {
    try {
        const { time_of_day, timezone } = req.body;

        // Calculate initial run time
        const scheduled_time_utc = calculateNextRun(time_of_day, timezone);

        const result = await medicationScheduleModel.createSchedule({
            ...req.body,
            schedule_timezone: timezone || 'UTC',
            scheduled_time_utc: scheduled_time_utc
        });
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Create Schedule Error:", err);
        res.status(500).json({ error: "Failed to create schedule" });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { time_of_day, timezone } = req.body;
        let updateData = { ...req.body, id: req.params.id };

        // If time or timezone changes, recalculate the next run
        // For simplicity in this refactor, we assume if one is sent, we use it.
        // If we really only get one, we might need to query DB first. 
        // But let's assume valid payloads for now as per plan.
        if (time_of_day && timezone) {
            const newUtc = calculateNextRun(time_of_day, timezone);
            updateData.scheduled_time_utc = newUtc;
            updateData.schedule_timezone = timezone;
        }

        const result = await medicationScheduleModel.updateSchedule(updateData);

        return res.json(result.rows[0]);
    } catch (err) {
        console.error("Update Schedule Error:", err);
        res.status(500).json({ error: "Failed to update schedule" });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        await medicationScheduleModel.deleteSchedule(req.params.id);
        res.json({ message: "Schedule deleted successfully" });
    } catch (err) {
        console.error("Delete Schedule Error:", err);
        res.status(500).json({ error: "Failed to delete schedule" });
    }
};

exports.getSchedulesByMedication = async (req, res) => {
    try {
        const result = await medicationScheduleModel.getSchedulesByMedication(
            req.params.id
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Get by Medication Error:", err);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
};

exports.getSchedulesByPatient = async (req, res) => {
    try {
        const result = await medicationScheduleModel.getSchedulesByPatient(
            req.params.id
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Get by Patient Error:", err);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
};
