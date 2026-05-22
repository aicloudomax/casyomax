/**
 * FILE: src/routes/chatRoutes.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Routes for AI Chat.
 * -----------------------------------------------------------------------------
 */
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkFeatureLimit } = require("../middleware/planMiddleware");
const multer = require("multer");

const path = require("path");

// Configure Multer for Audio Uploads
// We'll store temporarily in 'temp_uploads'
const upload = multer({
    dest: path.join(__dirname, "../../temp_uploads"),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper to ensure temp folder exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, "../../temp_uploads"))) {
    fs.mkdirSync(path.join(__dirname, "../../temp_uploads"));
}

// Routes
router.post("/text", verifyToken, checkFeatureLimit('ai_chat'), chatController.handleTextChat);
router.post("/voice", verifyToken, checkFeatureLimit('voice_chat'), upload.single("audio"), chatController.handleVoiceChat);


module.exports = router;
