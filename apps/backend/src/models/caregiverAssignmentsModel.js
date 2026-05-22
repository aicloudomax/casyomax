const pool = require("../config/db");

exports.getPatientIdByUserId = async (userId) => {
  const result = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
  return result.rows[0]?.id;
};

exports.getPatientsByCaretaker = async (caretakerId) => {
  return pool.query(
    `SELECT 
      p.id AS patient_id,
      p.first_name,
      p.last_name,
      p.date_of_birth,
      p.gender,
      ca.relation,
      ca.start_date,
      ca.is_active,
      (
        SELECT time_of_day 
        FROM medication_schedules ms 
        JOIN medications m ON ms.medication_id = m.id 
        WHERE m.patient_id = p.id 
          AND ms.is_active = true 
        ORDER BY 
          CASE WHEN time_of_day::time > NOW()::time THEN 0 ELSE 1 END,
          time_of_day ASC
        LIMIT 1
      ) as next_medication
   FROM caregiver_assignments ca
   JOIN patients p ON p.id = ca.patient_id
   WHERE ca.caregiver_id = $1
     AND ca.is_active = TRUE`,
    [caretakerId]
  );
};

exports.assignCaretakerToPatient = async (patientId, caretakerId, assignedBy) => {
  // Check if assignment exists
  const checkQuery = `SELECT id FROM caregiver_assignments WHERE patient_id = $1 AND caregiver_id = $2`;
  const checkResult = await pool.query(checkQuery, [patientId, caretakerId]);

  if (checkResult.rows.length > 0) {
    // Update existing
    const updateQuery = `
      UPDATE caregiver_assignments 
      SET is_active = TRUE, start_date = NOW() 
      WHERE patient_id = $1 AND caregiver_id = $2
      RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [patientId, caretakerId]);
    return updateResult.rows[0];
  } else {
    // Insert new
    const insertQuery = `
  INSERT INTO caregiver_assignments (patient_id, caregiver_id, assigned_by, is_active, start_date)
  VALUES ($1, $2, $3, TRUE, NOW())
  RETURNING *;
`;
    const insertResult = await pool.query(insertQuery, [patientId, caretakerId, assignedBy]);

    return insertResult.rows[0];
  }
};

exports.removeCaretakerFromPatient = async (patientId, caretakerId) => {
  const query = `
        DELETE FROM caregiver_assignments 
        WHERE patient_id = $1 AND caregiver_id = $2
        RETURNING *;
    `;
  const values = [patientId, caretakerId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getCaretakersForPatient = async (patientId) => {
  const query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.profile_image_url
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        WHERE ca.patient_id = $1 AND ca.is_active = TRUE
    `;
  const values = [patientId];
  const result = await pool.query(query, values);
  return result.rows;
};
