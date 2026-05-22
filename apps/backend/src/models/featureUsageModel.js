/**
 * FILE: src/models/featureUsageModel.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Track daily feature usage per user (for free-tier limits).
 * Uses the 'feature_usage' table where usage_date auto-resets daily.
 * -----------------------------------------------------------------------------
 * FEATURES TRACKED:
 *   'ai_chat'    → Free limit: 10/day
 *   'voice_chat' → Free limit: 5/day
 */
const pool = require("../config/db");

/**
 * Get today's usage count for a specific feature.
 * Returns 0 if no usage for today yet.
 */
exports.getUsageCount = async (userId, feature) => {
    const query = `
    SELECT count FROM feature_usage
    WHERE user_id = $1 AND feature = $2 AND usage_date = CURRENT_DATE
  `;
    const result = await pool.query(query, [userId, feature]);
    return result.rows[0]?.count || 0;
};

/**
 * Increment usage count for today (upsert).
 * Creates the row if it doesn't exist yet.
 */
exports.incrementUsage = async (userId, feature) => {
    const query = `
    INSERT INTO feature_usage (user_id, feature, usage_date, count)
    VALUES ($1, $2, CURRENT_DATE, 1)
    ON CONFLICT (user_id, feature, usage_date)
    DO UPDATE SET count = feature_usage.count + 1
    RETURNING count
  `;
    const result = await pool.query(query, [userId, feature]);
    return result.rows[0]?.count || 1;
};

/**
 * Get full usage summary for a user (all features, today).
 * Returns array of { feature, count } for admin view.
 */
exports.getTodayUsage = async (userId) => {
    const query = `
    SELECT feature, count FROM feature_usage
    WHERE user_id = $1 AND usage_date = CURRENT_DATE
  `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

/**
 * Manual reset — admin use only.
 */
exports.resetUsage = async (userId, feature) => {
    const query = `
    DELETE FROM feature_usage
    WHERE user_id = $1 AND feature = $2 AND usage_date = CURRENT_DATE
  `;
    await pool.query(query, [userId, feature]);
};
