/**
 * FILE: src/middleware/caretakerGuard.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Ensures a caregiver has at least one assigned patient before
 * accessing patient-data routes. If not assigned, returns 403.
 * -----------------------------------------------------------------------------
 * USAGE (in routes):
 *   const { caregiverGuard } = require('../middleware/caretakerGuard');
 *   router.get('/patients', verifyToken, caregiverGuard, controller.getPatients);
 */
const pool = require("../config/db");

const caregiverGuard = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        // Only applies to caregiver role.
        if (!role || !["caregiver", "caretaker"].includes(role.toLowerCase())) {
            return next();
        }

        // Check if this caregiver has any active patient assignments.
        const result = await pool.query(
            `SELECT id FROM caregiver_assignments WHERE caregiver_id = $1 LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: "No patients assigned",
                message:
                    "You have not been assigned to any patients yet. Please contact your administrator.",
                code: "CAREGIVER_NO_PATIENTS",
            });
        }

        next();
    } catch (err) {
        console.error("caregiverGuard error:", err);
        next(); // Fail open
    }
};

exports.caregiverGuard = caregiverGuard;
exports.caretakerGuard = caregiverGuard;
