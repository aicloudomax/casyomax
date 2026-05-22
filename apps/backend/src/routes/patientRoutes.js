const express = require("express");
const router = express.Router();
const controller = require("../controllers/patientController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/user/:userId", verifyToken, controller.getPatientByUserId);
router.get("/:id", verifyToken, controller.getPatientProfile);

module.exports = router;
