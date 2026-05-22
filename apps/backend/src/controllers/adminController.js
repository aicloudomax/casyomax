/**
 * FILE: src/controllers/adminController.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Handles System Administration Tasks.
 * -----------------------------------------------------------------------------
 * RESPONSIBILITIES:
 * 1. Assign Nurses to Patients.
 * 2. View system-wide statistics.
 * 3. Manage Subscription limits.
 */

const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
    try {
        // Get total users count
        const totalUsersResult = await pool.query(`SELECT COUNT(*) as count FROM users`);

        // Get active patients count (users with role 'patient' who are active)
        const activePatientsResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE role = 'patient' AND is_active = true
        `);

        // Get caretakers count (users with role 'caregiver')
        const caretakersResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE role = 'caregiver'
        `);

        // Get pending invites count (invites where user hasn't registered)
        const pendingInvitesResult = await pool.query(`
            SELECT COUNT(DISTINCT LOWER(i.email)) as count 
            FROM invites i
            LEFT JOIN users u ON LOWER(i.email) = LOWER(u.email)
            WHERE u.id IS NULL
        `);

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(totalUsersResult.rows[0].count),
                activePatients: parseInt(activePatientsResult.rows[0].count),
                caretakers: parseInt(caretakersResult.rows[0].count),
                pendingInvites: parseInt(pendingInvitesResult.rows[0].count)
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch stats", error: error.message });
    }
};
