const axios = require('axios');
const pool = require('./src/config/db');

// CONFIG
const API_URL = 'http://localhost:5000/api';
// We need a test user. Function to create a temporary user directly in DB to test deletion.
// Or we can use the signup endpoint if available. Let's use direct DB insertion for speed and knowing the ID.

async function createTestUser() {
    const email = `test_delete_${Date.now()}@example.com`;
    const password_hash = 'hash_test';
    const first_name = 'Test';
    const last_name = 'Delete';
    const res = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, 'patient') RETURNING id, email`,
        [email, password_hash, first_name, last_name]
    );
    return res.rows[0];
}

async function createTestPatient(userId) {
    const res = await pool.query(
        `INSERT INTO patients (user_id, first_name, last_name, phone) 
         VALUES ($1, 'Test', 'Delete', '1234567890') RETURNING id`,
        [userId]
    );
    return res.rows[0];
}

async function createTestMedication(patientId, userId) {
    const res = await pool.query(
        `INSERT INTO medications (patient_id, created_by, medicine_name, dosage, form, instructions) 
         VALUES ($1, $2, 'Test Med', '10mg', 'tablet', 'Take once') RETURNING id`,
        [patientId, userId]
    );
    return res.rows[0];
}

async function generateToken(userId) {
    // We might need to mock a token or use the helper in utils if we want to call the API authenticated.
    // However, if we run this script locally we might not have easy access to the JWT_SECRET from .env if it's not loaded.
    // Let's assume .env is loaded (node -r dotenv/config) or we manual inject.
    // Actually, calling the controller directly requires req/res mocks.
    // Calling the API requires a running server and valid token.

    // Easier approach: Test the model function directly first to verify logic.
    // Then assume controller/route glue is simple enough or test manually.
    // Let's test the model function `deleteUserCompletely` directly.
    return require('./src/controllers/authController').generateToken({ id: userId, role: 'patient' });
}

async function testDeletion() {
    console.log('--- Starting Deletion Test ---');
    try {
        // 1. Setup Data
        const user = await createTestUser();
        console.log(`Created User: ${user.id}`);

        const patient = await createTestPatient(user.id);
        console.log(`Created Patient: ${patient.id}`);

        const med = await createTestMedication(patient.id, user.id);
        console.log(`Created Medication: ${med.id}`);

        // 2. Verify Data Exists
        // (Skipping detailed existence check, insert success implies existence)

        // 3. Perform Deletion
        console.log('Running deleteUserCompletely...');
        const userModel = require('./src/models/userModel');
        await userModel.deleteUserCompletely(user.id);
        console.log('Deletion function returned.');

        // 4. Verify Deletion
        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        const patientCheck = await pool.query('SELECT * FROM patients WHERE id = $1', [patient.id]);
        const medCheck = await pool.query('SELECT * FROM medications WHERE id = $1', [med.id]);

        if (userCheck.rowCount === 0 && patientCheck.rowCount === 0 && medCheck.rowCount === 0) {
            console.log('SUCCESS: All records deleted!');
        } else {
            console.error('FAILURE: Some records remain.');
            console.log('User:', userCheck.rowCount);
            console.log('Patient:', patientCheck.rowCount);
            console.log('Medication:', medCheck.rowCount);
        }

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        pool.end();
    }
}

testDeletion();
