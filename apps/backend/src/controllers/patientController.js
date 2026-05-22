const PatientModel = require("../models/patientModel");

exports.getPatientProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await PatientModel.getPatientDetails(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            patient: result.rows[0],
        });
    } catch (error) {
        console.error("Error fetching patient details:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getPatientByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        let patient = await PatientModel.getPatientByUserId(userId);

        if (!patient) {
            // Auto-create patient profile for this user if missing
            await PatientModel.createPatientProfile(userId);
            patient = await PatientModel.getPatientByUserId(userId);
        }

        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient profile not found" });
        }

        return res.status(200).json({ success: true, patient });
    } catch (error) {
        console.error("Error fetching patient by user id:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
