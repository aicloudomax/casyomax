const cron = require('node-cron');
const scheduledMessageModel = require('../models/scheduledMessageModel');
const emailService = require('../services/emailService');

const initScheduler = () => {
    console.log("⏳ Scheduler Service Started: Checking every minute...");

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Get Due Messages
            const result = await scheduledMessageModel.getPendingMessagesDue();
            const messages = result.rows;

            if (messages.length > 0) {
                console.log(`⚡ Found ${messages.length} due messages.`);

                // 2. Process Each Message
                for (const msg of messages) {
                    await processMessage(msg);
                }
            }
        } catch (error) {
            console.error("❌ Scheduler Check Error:", error);
        }
    });
};

const processMessage = async (msg) => {
    console.log(`🚀 Sending Scheduled ${msg.message_type} ID: ${msg.id} to ${msg.recipient_email}`);

    try {
        if (msg.message_type === 'EMAIL') {
            await emailService.sendCustomEmail(
                msg.recipient_email,
                msg.content.subject,
                msg.content.body.replace(/\n/g, '<br>') // Convert newlines to HTML breaks
            );
        } else if (msg.message_type === 'SMS') {
            console.log("⚠️ SMS Sending not implemented yet.");
        }

        // 3. Update Status to SENT
        await scheduledMessageModel.updateMessageStatus(msg.id, 'SENT');
        console.log(`✅ Message ID: ${msg.id} marked as SENT.`);

    } catch (error) {
        console.error(`❌ Failed to send Message ID: ${msg.id}`, error);
        // 4. Update Status to FAILED
        await scheduledMessageModel.updateMessageStatus(msg.id, 'FAILED');
    }
};

module.exports = { initScheduler };
