const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const { verifyToken: auth } = require("../middleware/authMiddleware");

router.get("/:patientId", auth, medicationController.listMedications);
router.post("/", auth, medicationController.addMedication);
router.put("/:id", auth, medicationController.updateMedication);
router.delete("/:id", auth, medicationController.deleteMedication);

module.exports = router;
