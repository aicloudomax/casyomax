const contactModel = require('./src/models/contactModel');
const pool = require('./src/config/db');

// Mock pool query to simulate DB returning "Koushik"
// We need to override the pool imported by contactModel
// Since contactModel requires pool from ../config/db, and we run from root...
// Actually, let's just use the real DB since it's running.

async function test() {
    console.log("--- Testing Fuzzy Search ---");

    // Test with user_id 1 (Assuming Koushik is there)
    const queries = [
        "Kaushik",
        "Koushik",
        "Kaushik tomorrow"
    ];

    for (const q of queries) {
        console.log(`\nSearching for: "${q}"`);
        try {
            // We need to use the real contactModel which uses the real pool
            const results = await contactModel.searchContacts(1, q);
            console.log(`Found: ${results.length} matches`);
            results.forEach(r => console.log(`   - ${r.name} (${r.email})`));
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
    // pool.end(); // contactModel doesn't export pool, so process might hang, but we see logs.
    process.exit(0);
}

test();
