/**
 * Read-only diagnostic: check whether users have an Expo push token stored.
 * Usage:
 *   node scripts/check-push-token.js              -> summary + 15 most recent users
 *   node scripts/check-push-token.js <email>      -> details for one user (token masked)
 *
 * Hits whatever database apps/backend/.env points to (same DB the API uses).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

const mask = (t) => {
    if (!t) return '(none)';
    const s = String(t);
    return `${s.slice(0, 18)}…${s.slice(-6)} (len ${s.length})`;
};

(async () => {
    const email = process.argv[2];
    try {
        if (email) {
            const { rows } = await pool.query(
                'SELECT id, email, role, expo_push_token FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            if (!rows[0]) { console.log(`No user found with email "${email}".`); return; }
            const u = rows[0];
            console.log(`User ${u.email} (id ${u.id}, role ${u.role})`);
            console.log(`  expo_push_token: ${mask(u.expo_push_token)}`);
            console.log(`  valid Expo token format: ${/^ExponentPushToken\[/.test(u.expo_push_token || '')}`);
            return;
        }

        const summary = await pool.query(
            `SELECT COUNT(*) AS total,
                    COUNT(expo_push_token) AS with_token,
                    COUNT(*) FILTER (WHERE expo_push_token LIKE 'ExponentPushToken[%') AS valid_format
             FROM users`
        );
        const s = summary.rows[0];
        console.log(`Users total: ${s.total} | with a stored token: ${s.with_token} | valid Expo format: ${s.valid_format}`);
        console.log('--- 15 most recent users ---');
        const recent = await pool.query(
            `SELECT id, email, role, expo_push_token FROM users ORDER BY id DESC LIMIT 15`
        );
        for (const u of recent.rows) {
            console.log(`  #${u.id} ${u.email} [${u.role}] -> ${mask(u.expo_push_token)}`);
        }
    } catch (e) {
        console.error('Check failed:', e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
