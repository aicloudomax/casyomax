/**
 * FILE: src/models/subscriptionModel.js
 * -----------------------------------------------------------------------------
 * PURPOSE: All queries for the 'user_subscriptions' table.
 * This model is the ONLY place that reads/writes subscription/plan data.
 * The 'users' table is never modified for subscription logic.
 * -----------------------------------------------------------------------------
 */
const pool = require("../config/db");

/**
 * Create a free-tier subscription row when a new user registers.
 * Called automatically inside authController.register()
 */
exports.createSubscription = async (userId) => {
    const query = `
    INSERT INTO user_subscriptions (user_id, plan, status)
    VALUES ($1, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

/**
 * Get full subscription row for a user.
 * Returns { id, user_id, plan, status, plan_started_at, plan_expires_at }
 */
exports.getSubscription = async (userId) => {
    const query = `
    SELECT * FROM user_subscriptions WHERE user_id = $1
  `;
    const result = await pool.query(query, [userId]);
    // If no subscription row yet, return a default free plan
    return result.rows[0] || { user_id: userId, plan: 'free', status: 'active' };
};

/**
 * Get just the plan string ('free' | 'premium') for a user.
 */
exports.getUserPlan = async (userId) => {
    const query = `
    SELECT plan FROM user_subscriptions WHERE user_id = $1
  `;
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.plan || 'free';
};

/**
 * Update a user's plan. Used by admin to manually upgrade/downgrade.
 */
exports.updatePlan = async (userId, plan) => {
    const query = `
    UPDATE user_subscriptions
    SET plan = $1, plan_started_at = NOW(), updated_at = NOW()
    WHERE user_id = $2
    RETURNING *
  `;
    const result = await pool.query(query, [plan, userId]);
    return result.rows[0];
};

/**
 * Deactivate a subscription (e.g. when account is cancelled).
 */
exports.deactivateSubscription = async (userId) => {
    const query = `
    UPDATE user_subscriptions
    SET status = 'inactive', updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

/**
 * Get all users with a specific plan (for admin dashboard).
 */
exports.getUsersByPlan = async (plan) => {
    const query = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.role, s.plan, s.status, s.plan_started_at
    FROM user_subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.plan = $1
    ORDER BY s.plan_started_at DESC
  `;
    const result = await pool.query(query, [plan]);
    return result.rows;
};
