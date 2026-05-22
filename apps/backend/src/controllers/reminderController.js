const Reminder = require("../models/reminderModel");

// Create a new reminder
exports.createReminder = async (req, res) => {
  try {
    const { patient_id, caregiver_id, message, schedule_at } = req.body;

    if (!patient_id || !caregiver_id || !message || !schedule_at) {
      return res.status(400).json({
        success: false,
        message:
          "patient_id, caregiver_id, message, and schedule_at are required",
      });
    }

    // No need to generate ID manually; DB will handle it
    await Reminder.createReminder({
      patient_id,
      caregiver_id,
      message,
      schedule_at,
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully",
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create reminder",
      error: error.message,
    });
  }
};

// Get all due reminders (pending and schedule_at <= now)
exports.getDueReminders = async (req, res) => {
  try {
    const now = new Date();
    const { rows } = await Reminder.getDueReminders(now);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
      error: error.message,
    });
  }
};

// Update reminder status to 'sent'
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await Reminder.updateStatus(id);

    return res.status(200).json({
      success: true,
      message: "Reminder status updated to sent",
    });
  } catch (error) {
    console.error("Error updating reminder status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reminder status",
      error: error.message,
    });
  }
};
