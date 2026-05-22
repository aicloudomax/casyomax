const axios = require('axios');

async function test() {
    try {
        console.log("Fetching medication logs for Patient 1...");
        const res = await axios.get('http://localhost:5000/api/medication-logs/patient/1');
        console.log("Logs found:", res.data.history.length);
        if (res.data.history.length > 0) {
            console.log("First log:", res.data.history[0]);
        }
    } catch (err) {
        console.error("Fetch failed:", err.response ? err.response.data : err.message);
    }
}

test();
