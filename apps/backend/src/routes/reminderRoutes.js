const router = require("express").Router();
const {
  createReminder,
  getDueReminders,
  updateStatus,
} = require("../controllers/reminderController");

// Create a reminder
router.post("/create", createReminder);

// Get due reminders
router.get("/due", getDueReminders);

// Update reminder status
router.patch("/status/:id", updateStatus);

module.exports = router;
