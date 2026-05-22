const contactModel = require('./src/models/contactModel');
const pool = require('./src/config/db');

// Mock pool query to simulate DB returning "Koushik"
pool.query = async (query, values) => {
    // Return Koushik for any user_id query
    return {
        rows: [
            { id: 1, user_id: 1, name: 'Koushik', email: 'itskoushik007@gmail.com', relation: 'Friend' },
            { id: 2, user_id: 1, name: 'Alice', email: 'alice@example.com', relation: 'Caregiver' }
        ]
    };
};

async function test() {
    console.log("--- Testing Fuzzy Search ---");

    const queries = [
        "Kaushik",          // Expect: match (dist 1)
        "Kousik",           // Expect: match (dist 1)
        "Kaushik tomorrow", // Expect: fail (dist large) -> This confirms LLM extraction issue
        "Koushik"           // Expect: match (dist 0)
    ];

    for (const q of queries) {
        const results = await contactModel.searchContacts(1, q);
        console.log(`Query: "${q}" -> Found: ${results.length} matches`);
        results.forEach(r => console.log(`   - ${r.name} (${r.email})`));
    }
}

test().catch(console.error);
