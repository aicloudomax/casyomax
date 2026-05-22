const pool = require("../config/db");

exports.getMedicationHistoryByPatient = async (patientId) => {
  const query = `
    SELECT 
      ml.id,
      ml.status,
      ml.scheduled_at,
      ml.reminder_sent_at,
      ml.responded_at,
      ml.response_method,
      ml.confirmed_by,
      ml.notes,
      ml.created_at,
      ms.time_of_day,
      ms.schedule_type,
      m.medicine_name,
      m.dosage,
      m.form
    FROM medication_logs ml
    JOIN medication_schedules ms ON ml.schedule_id = ms.id
    JOIN medications m ON ms.medication_id = m.id
    JOIN users u ON ml.patient_id = u.id
    JOIN patients p ON u.id = p.user_id
    WHERE p.id = $1
    ORDER BY ml.scheduled_at DESC
  `;

  return pool.query(query, [patientId]);
};
