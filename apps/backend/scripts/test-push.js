/**
 * Diagnostic: send ONE test push to a user's stored Expo token and print the
 * full Expo ticket + delivery receipt, which reveals the real error (e.g.
 * InvalidCredentials / MismatchSenderId / DeviceNotRegistered).
 *
 * Usage: node scripts/test-push.js <email>
 * Hits whatever database apps/backend/.env points to.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const pool = require('../src/config/db');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const email = process.argv[2];
    if (!email) { console.error('Usage: node scripts/test-push.js <email>'); process.exit(1); }
    try {
        const { rows } = await pool.query(
            'SELECT id, email, expo_push_token FROM users WHERE LOWER(email) = LOWER($1)', [email]
        );
        const u = rows[0];
        if (!u) { console.log(`No user "${email}".`); return; }
        if (!u.expo_push_token) { console.log(`User ${u.email} has no token stored.`); return; }
        console.log(`Sending test push to ${u.email} ...`);

        const sendRes = await axios.post('https://exp.host/--/api/v2/push/send', {
            to: u.expo_push_token,
            sound: 'default',
            title: 'Casyomax test',
            body: 'If you can see this on your locked phone, push delivery works.',
            channelId: 'medication-reminders',
            data: { type: 'test' },
        }, { headers: { 'Content-Type': 'application/json' } });

        console.log('\n=== TICKET (send response) ===');
        console.log(JSON.stringify(sendRes.data, null, 2));

        const ticket = sendRes.data?.data;
        const ticketId = Array.isArray(ticket) ? ticket[0]?.id : ticket?.id;
        if (!ticketId) {
            console.log('\nNo ticket id returned — the send itself was rejected (see ticket above).');
            return;
        }

        console.log('\nWaiting 4s for the delivery receipt...');
        await sleep(4000);
        const recRes = await axios.post('https://exp.host/--/api/v2/push/getReceipts',
            { ids: [ticketId] }, { headers: { 'Content-Type': 'application/json' } });
        console.log('\n=== RECEIPT ===');
        console.log(JSON.stringify(recRes.data, null, 2));
        console.log('\nLook for status:"error" and details.error above (e.g. InvalidCredentials, MismatchSenderId, DeviceNotRegistered).');
    } catch (e) {
        console.error('Test push failed:', e.response?.data || e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
