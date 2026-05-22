const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sqlPath = "C:\\Users\\N Laxmikantha Rao\\.gemini\\antigravity\\brain\\05f0b7ba-fd1e-4364-bf0a-461846300d4a\\create_scheduled_messages_table.sql";

const runSchema = async () => {
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log("Executing SQL...");
        await pool.query(sql);
        console.log("✅ Table 'scheduled_messages' created successfully.");
    } catch (err) {
        console.error("❌ Error executing SQL:", err);
    } finally {
        await pool.end();
    }
};

runSchema();
