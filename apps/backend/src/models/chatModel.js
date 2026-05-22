/**
 * FILE: src/models/chatModel.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Raw SQL Queries for 'caresync.chat_sessions', 'caresync.chat_messages', etc.
 * -----------------------------------------------------------------------------
 */
const pool = require("../config/db");

// 1. Create or Get User's Active Session
exports.getOrCreateSession = async (patientId) => {
    // Check for an active session
    const findQuery = `
    SELECT * FROM caresync.chat_sessions 
    WHERE patient_id = $1 AND status = 'active' 
    ORDER BY last_activity_at DESC 
    LIMIT 1
  `;
    const findResult = await pool.query(findQuery, [patientId]);

    if (findResult.rows.length > 0) {
        return findResult.rows[0];
    }

    // Create new session if none exists
    const insertQuery = `
    INSERT INTO caresync.chat_sessions (patient_id, status)
    VALUES ($1, 'active')
    RETURNING *
  `;
    const insertResult = await pool.query(insertQuery, [patientId]);
    return insertResult.rows[0];
};

// 2. Add Message to Session
exports.addMessage = async ({ sessionId, senderType, senderId, role, contentText, contentType = 'text' }) => {
    const query = `
    INSERT INTO caresync.chat_messages 
    (session_id, sender_type, sender_id, role, content_text, content_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
    const values = [sessionId, senderType, senderId, role, contentText, contentType];
    const result = await pool.query(query, values);

    // Update session last activity
    await pool.query(
        `UPDATE caresync.chat_sessions SET last_activity_at = NOW() WHERE id = $1`,
        [sessionId]
    );

    return result.rows[0];
};

// 3. Get Recent Messages (for Context)
exports.getRecentMessages = async (sessionId, limit = 10) => {
    const query = `
    SELECT * FROM caresync.chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC
  `;
    // We want the *last* N messages, but ordered chronologically for the LLM
    // So we subquery sort DESC limit N, then sort ASC
    const wrappedQuery = `
    SELECT * FROM (
        SELECT * FROM caresync.chat_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2
    ) sub
    ORDER BY created_at ASC
  `;

    const result = await pool.query(wrappedQuery, [sessionId, limit]);
    return result.rows;
};

// 4. Close Session
exports.closeSession = async (sessionId) => {
    const query = `
    UPDATE caresync.chat_sessions 
    SET status = 'closed', last_activity_at = NOW() 
    WHERE id = $1 
    RETURNING *
  `;
    const result = await pool.query(query, [sessionId]);
    return result.rows[0];
};
