/**
 * FILE: src/models/userModel.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Raw SQL Queries for the 'Users' table.
 * -----------------------------------------------------------------------------
 * RESPONSIBILITIES:
 * 1. Insert new users.
 * 2. Find user by Email (for login).
 * 3. Find user by ID.
 * * NOTE: Only this file interacts directly with the 'users' table in the DB.
 */
const pool = require("../config/db");

exports.createUser = async ({ email, password_hash, first_name, last_name, phone, role }) => {
  const query = `
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, first_name, last_name, phone, role, profile_image_url, is_active, created_at
  `;
  const values = [email, password_hash, first_name, last_name, phone, role];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.findUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1 LIMIT 1";
  const values = [email];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getUserById = async (id) => {
  const query = "SELECT id, email, first_name, last_name, phone, role, profile_image_url, is_active FROM users WHERE id = $1";
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getUserPasswordHash = async (id) => {
  const query = "SELECT password_hash FROM users WHERE id = $1";
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getAllUsers = async (searchQuery, role) => {
  let queryText = "SELECT id, email, first_name, last_name, phone, role, profile_image_url, is_active FROM users";
  const values = [];
  let paramCount = 1;

  const conditions = [];

  if (searchQuery) {
    conditions.push(`(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
    values.push(`%${searchQuery}%`);
    paramCount++;
  }

  if (role && role !== 'All') {
    conditions.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }

  if (conditions.length > 0) {
    queryText += " WHERE " + conditions.join(" AND ");
  }

  queryText += " ORDER BY id ASC";

  const result = await pool.query(queryText, values);
  return result.rows;
};

exports.updateUser = async (id, data) => {
  const { first_name, last_name, phone, profile_image_url } = data;
  const query = `
    UPDATE users 
    SET first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        profile_image_url = COALESCE($4, profile_image_url),
        updated_at = NOW()
    WHERE id = $5
    RETURNING id, email, first_name, last_name, phone, role, profile_image_url, is_active
  `;
  const values = [first_name, last_name, phone, profile_image_url, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.deleteUser = async (id) => {
  const query = "DELETE FROM users WHERE id = $1 RETURNING id";
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.updatePushToken = async (userId, token) => {
  const query = "UPDATE users SET expo_push_token = $1 WHERE id = $2 RETURNING *";
  const values = [token, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.updateSessionId = async (userId, sessionId) => {
  const query = "UPDATE users SET session_id = $1 WHERE id = $2 RETURNING *";
  const values = [sessionId, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Save password reset OTP (expires in 10 minutes)
exports.saveResetOTP = async (email, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const query = `
    UPDATE users 
    SET reset_otp = $1, reset_otp_expiry = $2, updated_at = NOW()
    WHERE LOWER(email) = LOWER($3)
    RETURNING id, email
  `;
  const result = await pool.query(query, [otp, expiresAt, email]);
  return result.rows[0];
};

// Verify OTP and check expiry
exports.verifyResetOTP = async (email, otp) => {
  const query = `
    SELECT id, email, reset_otp, reset_otp_expiry 
    FROM users 
    WHERE LOWER(email) = LOWER($1) AND reset_otp = $2
  `;
  const result = await pool.query(query, [email, otp]);
  const user = result.rows[0];

  if (!user) return { valid: false, reason: 'Invalid OTP' };
  if (new Date() > new Date(user.reset_otp_expiry)) {
    return { valid: false, reason: 'OTP has expired' };
  }
  return { valid: true, userId: user.id };
};

// Update password and clear OTP
exports.updatePassword = async (userId, hashedPassword) => {
  const query = `
    UPDATE users 
    SET password_hash = $1, reset_otp = NULL, reset_otp_expiry = NULL, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email
  `;
  const result = await pool.query(query, [hashedPassword, userId]);
  return result.rows[0];
};

// Delete user and all associated data
exports.deleteUserCompletely = async (userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get patient ID if exists
    const patientRes = await client.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    const patientId = patientRes.rows[0]?.id;

    if (patientId) {
      // 2. Delete caregiver assignments where this user is the patient
      await client.query('DELETE FROM caregiver_assignments WHERE patient_id = $1', [patientId]);

      // 3. Delete medications and related schedules/logs
      // First get medication IDs
      const medRes = await client.query('SELECT id FROM medications WHERE patient_id = $1', [patientId]);
      const medIds = medRes.rows.map(r => r.id);

      if (medIds.length > 0) {
        // Get schedule IDs to delete logs
        const schedRes = await client.query('SELECT id FROM medication_schedules WHERE medication_id = ANY($1)', [medIds]);
        const schedIds = schedRes.rows.map(r => r.id);

        if (schedIds.length > 0) {
          await client.query('DELETE FROM medication_logs WHERE schedule_id = ANY($1)', [schedIds]);
          // Delete schedules
          await client.query('DELETE FROM medication_schedules WHERE id = ANY($1)', [schedIds]);
        }

        // Delete medications
        await client.query('DELETE FROM medications WHERE id = ANY($1)', [medIds]);
      }




      // 4. Delete Chat Sessions & Messages
      // Chat schema 'caresync' may not exist in all environments, leading to transaction aborts.
      // Temporarily disabling automatic chat deletion to ensure core account key deletion works.
      /*
      const tableCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'caresync' AND table_name = 'chat_sessions')"
      );
      if (tableCheck.rows[0].exists) {
        const sessionRes = await client.query('SELECT id FROM caresync.chat_sessions WHERE patient_id = $1', [patientId]);
        const sessionIds = sessionRes.rows.map(s => s.id);
        if (sessionIds.length > 0) {
          await client.query('DELETE FROM caresync.chat_messages WHERE session_id = ANY($1)', [sessionIds]);
          await client.query('DELETE FROM caresync.chat_sessions WHERE id = ANY($1)', [sessionIds]);
        }
      }
      */

      // 5. Delete Reminders for the patient
      await client.query('DELETE FROM reminders WHERE patient_id = $1', [patientId]);

      // 6. Delete patient record
      await client.query('DELETE FROM patients WHERE id = $1', [patientId]);
    }


    // Helper to safely delete from tables that might not exist in all environments
    const safeDelete = async (text, params) => {
      try {
        await client.query('SAVEPOINT safe_delete');
        await client.query(text, params);
        await client.query('RELEASE SAVEPOINT safe_delete');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT safe_delete');
        // Ignore "undefined table" error (42P01)
        if (err.code !== '42P01') {
          throw err;
        }
      }
    };

    // 7. Delete caregiver assignments where this user is the caregiver
    await safeDelete('DELETE FROM caregiver_assignments WHERE caregiver_id = $1', [userId]);

    // 8. Delete Reminders where user is the caregiver
    await safeDelete('DELETE FROM reminders WHERE caregiver_id = $1', [userId]);

    // 9. Delete User Devices (Push Tokens)
    await safeDelete('DELETE FROM user_devices WHERE user_id = $1', [userId]);

    // 10. Delete Invites sent by this user
    await safeDelete('DELETE FROM invites WHERE invited_by = $1', [userId]);

    // 11. Finally, delete the user record (This MUST exist, so we use normal query)
    const res = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

    await client.query('COMMIT');
    return res.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};
