const axios = require('axios');

async function test() {
    try {
        console.log("Fetching schedules...");
        const res = await axios.get('http://localhost:5000/api/medication-schedules/patient/1');
        console.log("Schedules:", res.data);

        if (res.data.length > 0) {
            const id = res.data[0].id;
            console.log(`Attempting to delete schedule ${id}...`);
            try {
                const delRes = await axios.delete(`http://localhost:5000/api/medication-schedules/${id}`);
                console.log("Delete response:", delRes.data);
            } catch (delErr) {
                console.error("Delete failed:", delErr.response ? delErr.response.data : delErr.message);
            }
        } else {
            console.log("No schedules found to delete.");
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

test();
