/**
 * FILE: src/middleware/caretakerGuard.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Ensures a caretaker has at least one assigned patient before
 * accessing patient-data routes. If not assigned, returns 403.
 * -----------------------------------------------------------------------------
 * USAGE (in routes):
 *   const { caretakerGuard } = require('../middleware/caretakerGuard');
 *   router.get('/patients', verifyToken, caretakerGuard, controller.getPatients);
 */
const pool = require("../config/db");

exports.caretakerGuard = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        // Only applies to caretaker role
        if (!role || role.toLowerCase() !== "caretaker") {
            return next();
        }

        // Check if this caretaker has any active patient assignments
        const result = await pool.query(
            `SELECT id FROM caregiver_assignments WHERE caregiver_id = $1 LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: "No patients assigned",
                message:
                    "You have not been assigned to any patients yet. Please contact your administrator.",
                code: "CARETAKER_NO_PATIENTS",
            });
        }

        next();
    } catch (err) {
        console.error("caretakerGuard error:", err);
        next(); // Fail open
    }
};
