const MedicationModel = require("../models/medicationModel");

exports.listMedications = async (req, res) => {
    try {
        const { patientId } = req.params;
        const medications = await MedicationModel.getByPatientId(patientId);
        return res.status(200).json({ success: true, data: medications });
    } catch (error) {
        console.log("Error fetching medications:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.addMedication = async (req, res) => {
    try {
        const created_by = req.user.id;
        const data = { ...req.body, created_by };

        const newMedication = await MedicationModel.create(data);
        return res.status(201).json({ success: true, data: newMedication });
    } catch (error) {
        console.log("Error adding medication:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updateMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMedication = await MedicationModel.update(id, req.body);

        if (!updatedMedication)
            return res.status(404).json({ success: false, message: "Medication not found" });

        return res.status(200).json({ success: true, data: updatedMedication });
    } catch (error) {
        console.log("Error updating medication:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.deleteMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MedicationModel.delete(id);

        if (!deleted)
            return res.status(404).json({ success: false, message: "Medication not found" });

        return res.status(200).json({ success: true, message: "Medication removed" });
    } catch (error) {
        console.log("Error deleting medication:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
