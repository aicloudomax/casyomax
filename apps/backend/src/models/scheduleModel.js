const pool = require("../config/db");

// Get schedules due at a specific time (UTC)
exports.getDueSchedules = async () => {
  // Current UTC time
  const query = `
  SELECT ms.*, m.medicine_name, m.dosage, m.instructions, p.user_id AS patient_user_id, u.expo_push_token, u.first_name
    FROM medication_schedules ms
    JOIN medications m ON ms.medication_id = m.id
    JOIN patients p ON m.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE ms.is_active = true
      AND ms.scheduled_time_utc <= NOW() AT TIME ZONE 'UTC'
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// Update the next run time for a schedule
exports.updateNextRunTime = async (scheduleId, nextUtcTime) => {
  const query = `
        UPDATE medication_schedules
        SET scheduled_time_utc = $1, updated_at = NOW()
        WHERE id = $2
    `;
  await pool.query(query, [nextUtcTime, scheduleId]);
};

// Check if a log already exists for a schedule around the current time
exports.checkExistingLog = async (scheduleId, date) => {
  // Check for logs created within the last 2 minutes for this schedule
  const query = `
        SELECT id FROM medication_logs 
        WHERE schedule_id = $1 
        AND created_at >= NOW() - INTERVAL '15 minutes'
    `;
  const { rows } = await pool.query(query, [scheduleId]);
  return rows.length > 0;
};

// Create a log entry for a scheduled medication
exports.createMedicationLog = async ({
  schedule_id,
  patient_id,
  status,
  scheduled_at,
  reminder_sent_at
}) => {
  const query = `
    INSERT INTO medication_logs (schedule_id, patient_id, status, scheduled_at, reminder_sent_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    schedule_id,
    patient_id,
    status,
    scheduled_at,
    reminder_sent_at
  ]);
  return rows[0];
};

// Get pending logs that are older than a certain time (for escalation)
exports.getPendingLogs = async (olderThanTime) => {
  const query = `
    SELECT ml.*, u.first_name as patient_name, m.medicine_name, c.id as caretaker_id, c.expo_push_token as caretaker_token
    FROM medication_logs ml
    JOIN users u ON ml.patient_id = u.id
    JOIN medication_schedules ms ON ml.schedule_id = ms.id
    JOIN medications m ON ms.medication_id = m.id
    LEFT JOIN users c ON m.created_by = c.id
    WHERE ml.status = 'pending'
      AND ml.scheduled_at <= $1
      AND ml.created_at <= $1
  `;
  const { rows } = await pool.query(query, [olderThanTime]);
  return rows;
};

// Get snoozed logs that are older than a certain time (for reminder)
exports.getSnoozedLogs = async (olderThanTime) => {
  const query = `
    SELECT ml.*, u.first_name as patient_name, m.medicine_name, u.expo_push_token, u.id as patient_user_id, ml.schedule_id
    FROM medication_logs ml
    JOIN users u ON ml.patient_id = u.id
    JOIN medication_schedules ms ON ml.schedule_id = ms.id
    JOIN medications m ON ms.medication_id = m.id
    WHERE ml.status = 'snoozed'
      AND ml.updated_at <= $1
  `;
  const { rows } = await pool.query(query, [olderThanTime]);
  return rows;
};

// Update the status of a log
exports.updateLogStatus = async (logId, status, { responded_at, response_method, confirmed_by, notes } = {}) => {
  const query = `
    UPDATE medication_logs
    SET status = $1, 
        updated_at = NOW(), 
        responded_at = COALESCE($3, responded_at),
        response_method = COALESCE($4, response_method),
        confirmed_by = COALESCE($5, confirmed_by),
        notes = COALESCE($6, notes)
    WHERE id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [status, logId, responded_at, response_method, confirmed_by, notes]);
  return rows[0];
};

// Get logs for a patient (for chat history)
exports.getPatientLogs = async (patientId) => {
  const query = `
    SELECT ml.*, m.medicine_name, m.dosage, ms.time_of_day
    FROM medication_logs ml
    JOIN medication_schedules ms ON ml.schedule_id = ms.id
    JOIN medications m ON ms.medication_id = m.id
    WHERE ml.patient_id = $1
    ORDER BY ml.scheduled_at DESC
    LIMIT 50
  `;
  const { rows } = await pool.query(query, [patientId]);
  return rows;
};

// Deactivate a schedule (used when end_date is reached)
exports.deleteSchedule = async (id) => {
  const query = `UPDATE medication_schedules SET is_active = false, updated_at = NOW() WHERE id = $1`;
  await pool.query(query, [id]);
};

