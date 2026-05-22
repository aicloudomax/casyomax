const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicationLogsController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/patient/:patientId", verifyToken, controller.getMedicationHistory);

module.exports = router;
