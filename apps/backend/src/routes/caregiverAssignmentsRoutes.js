const express = require("express");
const router = express.Router();
const controller = require("../controllers/caregiverAssignmentsController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/patients/:caretakerId", verifyToken, controller.getPatientsForCaretaker);

router.post("/assign", verifyToken, controller.assignCaretaker);
router.delete("/assign", verifyToken, controller.removeAssignment);
router.get("/patient/:patientId", verifyToken, controller.getAssignedCaretakers);

module.exports = router;
