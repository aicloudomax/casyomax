const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicationScheduleController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, controller.createSchedule);
router.put("/:id", verifyToken, controller.updateSchedule);
router.delete("/:id", verifyToken, controller.deleteSchedule);
router.get("/medication/:id", verifyToken, controller.getSchedulesByMedication);
router.get("/patient/:id", verifyToken, controller.getSchedulesByPatient);

module.exports = router;
