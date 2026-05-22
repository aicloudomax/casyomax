const MedicationLogsModel = require("../models/medicationLogsModel");

exports.getMedicationHistory = async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await MedicationLogsModel.getMedicationHistoryByPatient(patientId);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            history: result.rows,
        });
    } catch (error) {
        console.error("Error fetching medication history:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
