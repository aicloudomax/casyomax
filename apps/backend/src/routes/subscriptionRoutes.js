/**
 * FILE: src/routes/subscriptionRoutes.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Routes for Subscription & Plan management.
 * -----------------------------------------------------------------------------
 */
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Patient Routes
router.get("/my-plan", verifyToken, subscriptionController.getMyPlan);

// Admin Routes
router.put("/set-plan", verifyToken, isAdmin, subscriptionController.setPlan);
router.get("/usage/:userId", verifyToken, isAdmin, subscriptionController.getUserUsage);

module.exports = router;
