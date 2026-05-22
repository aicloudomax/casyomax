console.log("Starting server...");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Environment loaded");
console.log("🔹 AZURE_SPEECH_KEY:", process.env.AZURE_SPEECH_KEY ? "LOADED (Starts with " + process.env.AZURE_SPEECH_KEY.substring(0, 5) + ")" : "MISSING");
console.log("🔹 AZURE_SPEECH_REGION:", process.env.AZURE_SPEECH_REGION || "MISSING");

// const reminderRoutes = require("./src/routes/reminderRoutes"); // Redundant
// const deviceRoutes = require("./src/routes/deviceRoutes"); // Redundant if using userModel
const { initScheduler } = require("./src/services/schedulerService");
const authRoutes = require("./src/routes/authRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const caregiverAssignmentsRoutes = require("./src/routes/caregiverAssignmentsRoutes");
const medicationScheduleRoutes = require("./src/routes/medicationScheduleRoutes");
const medicationLogsRoutes = require("./src/routes/medicationLogsRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const medicationRoutes = require("./src/routes/medicationRoutes");
const voiceRoutes = require("./src/routes/voiceRoutes");
const userRoutes = require("./src/routes/userRoutes");
const inviteRoutes = require("./src/routes/inviteRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const pushTokenRoutes = require("./src/routes/deviceRoutes");
console.log("Routes imported");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

console.log("Initializing scheduler... K");
try {
  initScheduler();
  console.log("Scheduler initialized");
} catch (error) {
  console.error("Scheduler failed to start:", error);
}

// Routes
app.use("/api/invites", inviteRoutes);
app.use("/api/caregiver-assignments", caregiverAssignmentsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/medication-schedules", medicationScheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/medication-logs", medicationLogsRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/push", pushTokenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contacts", contactRoutes);

console.log("Routes registered");

// Fallback route
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, message: "Server Error", error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
