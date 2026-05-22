require('dotenv').config();
console.log('Loading db config...');
const db = require('./src/config/db');
console.log('Db config loaded.');

async function testConnection() {
    console.log('Testing connection...');
    try {
        const res = await db.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

testConnection();
