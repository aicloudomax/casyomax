const caregiverAssignmentsModel = require("../models/caregiverAssignmentsModel");
const patientModel = require("../models/patientModel");

exports.getPatientsForCaretaker = async (req, res) => {
    try {
        const caregiverId = req.params.caregiverId || req.params.caretakerId;
        const result = await caregiverAssignmentsModel.getPatientsByCaretaker(caregiverId);
        res.status(200).json({ success: true, patients: result.rows });
    } catch (error) {
        console.error("Error fetching assigned patients:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.assignCaretaker = async (req, res) => {
    try {
        const { patientId: userId, assignedBy } = req.body;
        const caregiverId = req.body.caregiverId || req.body.caretakerId;

        if (!userId || !caregiverId) {
            return res.status(400).json({ success: false, message: "patientId and caregiverId are required" });
        }

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

        const result = await caregiverAssignmentsModel.assignCaretakerToPatient(patientId, caregiverId, assignedBy);
        res.status(200).json({ success: true, message: "Caregiver assigned successfully", assignment: result });
    } catch (error) {
        console.error("Error assigning caregiver:", error);
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
        const { patientId: userId } = req.body;
        const caregiverId = req.body.caregiverId || req.body.caretakerId;

        if (!userId || !caregiverId) {
            return res.status(400).json({ success: false, message: "patientId and caregiverId are required" });
        }

        const patientId = await caregiverAssignmentsModel.getPatientIdByUserId(userId);

        if (!patientId) {
            return res.status(404).json({ success: false, message: "Patient record not found. Cannot remove assignment." });
        }

        await caregiverAssignmentsModel.removeCaretakerFromPatient(patientId, caregiverId);
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
            return res.status(200).json({ success: true, caregivers: [], caretakers: [] });
        }

        const caregivers = await caregiverAssignmentsModel.getCaretakersForPatient(patientId);
        res.status(200).json({ success: true, caregivers, caretakers: caregivers });
    } catch (error) {
        console.error("Error fetching caregivers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
