const express = require("express");
const router = express.Router();
const controller = require("../controllers/caregiverAssignmentsController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/patients/:caregiverId", verifyToken, controller.getPatientsForCaretaker);

router.post("/assign", verifyToken, isAdmin, controller.assignCaretaker);
router.delete("/assign", verifyToken, isAdmin, controller.removeAssignment);
router.delete("/remove", verifyToken, isAdmin, controller.removeAssignment);
router.get("/patient/:patientId", verifyToken, isAdmin, controller.getAssignedCaretakers);

module.exports = router;
