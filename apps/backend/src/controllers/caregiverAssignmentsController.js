const caregiverAssignmentsModel = require("../models/caregiverAssignmentsModel");
const patientModel = require("../models/patientModel");

exports.getPatientsForCaretaker = async (req, res) => {
    try {
        const { caretakerId } = req.params;
        const result = await caregiverAssignmentsModel.getPatientsByCaretaker(caretakerId);
        res.status(200).json({ success: true, patients: result.rows });
    } catch (error) {
        console.error("Error fetching assigned patients:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.assignCaretaker = async (req, res) => {
    try {
        const { patientId: userId, caretakerId, assignedBy } = req.body;

        let patientId = await caregiverAssignmentsModel.getPatientIdByUserId(userId);

        if (!patientId) {
            // Auto-create patient profile if missing
            try {
                // We use userId to copy details from users table to patients table
                patientId = await patientModel.createPatientProfile(userId);
            } catch (err) {
                console.error("Error creating patient profile:", err);
                return res.status(500).json({ success: false, message: "Failed to create patient profile" });
            }
        }

        if (!patientId) {
            return res.status(404).json({ success: false, message: "Patient record not found for this user" });
        }

        const result = await caregiverAssignmentsModel.assignCaretakerToPatient(patientId, caretakerId, assignedBy);
        res.status(200).json({ success: true, message: "Caretaker assigned successfully", assignment: result });
    } catch (error) {
        console.error("Error assigning caretaker:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            detail: error.detail // Postgres often provides this
        });
    }
};

exports.removeAssignment = async (req, res) => {
    try {
        const { patientId: userId, caretakerId } = req.body;
        const patientId = await caregiverAssignmentsModel.getPatientIdByUserId(userId);

        if (!patientId) {
            return res.status(404).json({ success: false, message: "Patient record not found. Cannot remove assignment." });
        }

        await caregiverAssignmentsModel.removeCaretakerFromPatient(patientId, caretakerId);
        res.status(200).json({ success: true, message: "Assignment removed successfully" });
    } catch (error) {
        console.error("Error removing assignment:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            detail: error.detail
        });
    }
};

exports.getAssignedCaretakers = async (req, res) => {
    try {
        const { patientId: userId } = req.params;
        const patientId = await caregiverAssignmentsModel.getPatientIdByUserId(userId);

        if (!patientId) {
            return res.status(200).json({ success: true, caretakers: [] });
        }

        const caretakers = await caregiverAssignmentsModel.getCaretakersForPatient(patientId);
        res.status(200).json({ success: true, caretakers });
    } catch (error) {
        console.error("Error fetching caretakers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
