const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

// Register push token
router.post("/register-token", verifyToken, notificationController.registerToken);

// Respond to medication notification
router.post("/respond", verifyToken, notificationController.handleMedicationAction);

// Get notification history
router.get("/history", verifyToken, notificationController.getNotifications);

module.exports = router;
