const pool = require("../config/db");

exports.createInvite = async (email, role, invitedBy, patientId = null) => {
    const query = `
        INSERT INTO invites (email, role, invited_by, patient_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [email, role, invitedBy, patientId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

exports.getAllInvites = async (search = null) => {
    let query = `
        SELECT DISTINCT ON (LOWER(i.email)) i.*, 
               CASE WHEN u.id IS NOT NULL THEN 'registered' ELSE 'pending' END as status,
               u.first_name as registered_first_name,
               u.last_name as registered_last_name
        FROM invites i
        LEFT JOIN users u ON LOWER(i.email) = LOWER(u.email)
    `;

    const values = [];
    if (search) {
        query += ` WHERE i.email ILIKE $1`;
        values.push(`%${search}%`);
    }

    query += ` ORDER BY LOWER(i.email), i.created_at DESC;`;

    const result = await pool.query(query, values);
    return result.rows;
};

exports.getInviteById = async (id) => {
    const query = `SELECT * FROM invites WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

exports.findInviteByEmail = async (email) => {
    const query = `SELECT * FROM invites WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0]; // Returns undefined if not found
};

exports.updateReinviteInfo = async (id) => {
    const query = `
        UPDATE invites 
        SET reinvite_count = reinvite_count + 1, 
            last_invited_at = NOW() 
        WHERE id = $1 
        RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};
