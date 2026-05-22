const expoService = require("./expoService");

exports.sendMedicationNotification = async (patientId, medicationName, scheduleId, logId, token) => {
    if (!token) {
        console.log(`No token for patient ${patientId}`);
        return;
    }

    const title = "Time for your medicine!";
    const body = `It's time to take ${medicationName}. Please confirm.`;

    // We can pass data in the notification payload if needed, but for now simple push
    // Ideally we send data so the app can show the card immediately
    const data = {
        type: "medication_reminder",
        scheduleId,
        logId,
        medicationName
    };

    try {
        // Expo service might need update to accept data
        // For now, let's assume we can just send title/body or update expoService
        // Let's update expoService to accept data as well, or just send title/body
        // We pass channelId for Android and sound filename for iOS/Android
        await expoService.sendPush(token, title, body, data, {
            channelId: 'medication-reminders',
            sound: 'medicine_alert.wav'
        });
        console.log(`Notification sent to patient ${patientId}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

exports.sendCaretakerAlert = async (caretakerId, patientName, medicationName, token) => {
    if (!token) {
        console.log(`No token for caretaker ${caretakerId}`);
        return;
    }

    const title = "Missed Medication Alert";
    const body = `${patientName} has not taken ${medicationName} for 10 minutes.`;

    try {
        await expoService.sendPush(token, title, body, { type: "alert" });
        console.log(`Alert sent to caretaker ${caretakerId}`);
    } catch (error) {
        console.error("Error sending alert:", error);
    }
};
