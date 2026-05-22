require("dotenv").config();
const pool = require("./src/config/db");
const azureAIService = require("./src/services/azureAIService");
const fs = require('fs');

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync('debug_log.txt', msg + '\n');
    } catch (e) { }
}

async function check() {
    // Clear log
    fs.writeFileSync('debug_log.txt', '--- DEBUG START ---\n');

    log("--- DEBUG CHECK ---");
    log("Endpoint (env): " + (process.env.AZURE_OPENAI_ENDPOINT || "MISSING"));
    log("Key (env): " + (process.env.AZURE_OPENAI_KEY ? "PRESENT" : "MISSING"));
    log("Deployment (code): " + "gpt-4o-care-sync"); // Hardcoded in service, checking knowledge

    // 1. Check DB
    try {
        const res = await pool.query("SELECT * FROM caresync.patients WHERE id = 1");
        if (res.rows.length === 0) {
            log("❌ Patient ID 1 NOT FOUND in DB.");
        } else {
            log("✅ Patient ID 1 FOUND.");
        }
    } catch (err) {
        log("❌ DB Query Error: " + err.message);
    }

    // 2. Test Azure OpenAI
    try {
        log("Testing Azure OpenAI request...");
        const response = await azureAIService.generateChatResponse([
            { role: "user", content: "Test message" }
        ]);
        log("✅ Azure Response: " + response);
    } catch (err) {
        log("❌ Azure Error: " + err.message);
        log("Full Error: " + JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    }

    process.exit();
}

check();
