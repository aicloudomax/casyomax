const pool = require("../config/db");

// Create a new reminder
exports.createReminder = async ({
  patient_id,
  caregiver_id,
  message,
  schedule_at,
}) => {
  return pool.query(
    `INSERT INTO reminders (patient_id, caregiver_id, message, schedule_at)
     VALUES ($1, $2, $3, $4)`,
    [patient_id, caregiver_id, message, schedule_at]
  );
};

// Get due reminders (pending and schedule_at <= now)
exports.getDueReminders = async (now) => {
  return pool.query(
    `SELECT r.*, d.expo_push_token
     FROM reminders r
     JOIN user_devices d ON r.caregiver_id = d.user_id
     WHERE r.status = 'pending' AND r.schedule_at <= $1`,
    [now]
  );
};

// Update reminder status to 'sent'
exports.updateStatus = async (id) => {
  return pool.query(
    `UPDATE reminders SET status = 'sent', updated_at = NOW() WHERE id = $1`,
    [id]
  );
};
