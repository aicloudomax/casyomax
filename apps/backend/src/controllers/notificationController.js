const userModel = require("../models/userModel");
const scheduleModel = require("../models/scheduleModel");
const notificationService = require("../services/notificationService");

exports.registerToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!token) {
            return res
                .status(400)
                .json({ success: false, message: "Token is required" });
        }

        await userModel.updatePushToken(userId, token);

        res.status(200).json({ success: true, message: "Token registered successfully" });
    } catch (error) {
        console.error("Error registering token:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.unregisterToken = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware
        await userModel.updatePushToken(userId, null);
        res.status(200).json({ success: true, message: "Token unregistered successfully" });
    } catch (error) {
        console.error("Error unregistering token:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.handleMedicationAction = async (req, res) => {
    try {
        const { logId, action } = req.body; // action: 'taken', 'missed', 'snooze'
        const userId = req.user.id;

        if (!logId || !action) {
            return res.status(400).json({ success: false, message: "logId and action are required" });
        }

        let status = action;
        if (action === 'snooze') {
            status = 'snoozed';
        }

        const updatedLog = await scheduleModel.updateLogStatus(logId, status, {
            responded_at: new Date(),
            response_method: 'button',
            confirmed_by: userId
        });

        res.status(200).json({ success: true, data: updatedLog });
    } catch (error) {
        console.error("Error handling action:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const logs = await scheduleModel.getPatientLogs(userId);
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
