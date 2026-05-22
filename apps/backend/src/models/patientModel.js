const pool = require("../config/db");

exports.getPatientDetails = async (patientId) => {
  const query = `
    SELECT 
      p.id as patient_id,
      p.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.profile_image_url,
      p.date_of_birth,
      p.gender,
      p.address,
      p.medical_notes,
      p.created_at,
      p.updated_at
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1
  `;

  return pool.query(query, [patientId]);
};

exports.getPatientById = async (patientId) => {
  // Same query as above but returns rows[0]
  const result = await exports.getPatientDetails(patientId);
  return result.rows[0];
};

exports.createPatientProfile = async (userId) => {
  // 1. Check existence first to avoid ON CONFLICT errors if constraint is missing
  const existing = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // 2. Attempt Insertion
  try {
    const query = `
          INSERT INTO patients(user_id, first_name, last_name, phone)
          SELECT id, first_name, last_name, phone
          FROM users
          WHERE id = $1
          RETURNING id;
        `;
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.id;
  } catch (error) {
    console.error("Error creating patient profile, checking if it exists now:", error.message);
    // If insertion failed (e.g. race condition), check one last time
    const retry = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    return retry.rows[0]?.id;
  }
};

exports.getPatientByUserId = async (userId) => {
  const query = `
    SELECT 
      p.id as patient_id,
      p.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.profile_image_url,
      p.date_of_birth,
      p.gender,
      p.address,
      p.medical_notes,
      p.created_at,
      p.updated_at
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE u.id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};
