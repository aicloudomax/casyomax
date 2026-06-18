/**
 * One-off admin utility: reset a user's daily feature-usage counters.
 * Usage:  node scripts/reset-usage.js <email> [feature]
 *   - email:   the user's email (required)
 *   - feature: optional ('ai_chat' | 'voice_chat'); if omitted, clears all of today's usage.
 *
 * Hits whatever database apps/backend/.env points to (same DB the API uses).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

(async () => {
    const email = process.argv[2];
    const feature = process.argv[3]; // optional
    if (!email) {
        console.error('Usage: node scripts/reset-usage.js <email> [ai_chat|voice_chat]');
        process.exit(1);
    }
    try {
        const u = await pool.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (!u.rows[0]) {
            console.log(`No user found with email "${email}".`);
            return;
        }
        const userId = u.rows[0].id;

        let result;
        if (feature) {
            result = await pool.query(
                'DELETE FROM feature_usage WHERE user_id = $1 AND feature = $2 AND usage_date = CURRENT_DATE',
                [userId, feature]
            );
        } else {
            result = await pool.query(
                'DELETE FROM feature_usage WHERE user_id = $1 AND usage_date = CURRENT_DATE',
                [userId]
            );
        }
        console.log(
            `✅ Reset today's usage for ${u.rows[0].email} (user id ${userId})` +
            `${feature ? ` [${feature}]` : ''} — removed ${result.rowCount} row(s). Limits are back to 0 used.`
        );
    } catch (e) {
        console.error('Reset failed:', e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
