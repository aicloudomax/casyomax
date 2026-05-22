/**
 * FILE: src/controllers/subscriptionController.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Logic for managing user plans and usage status.
 * -----------------------------------------------------------------------------
 */
const subscriptionModel = require("../models/subscriptionModel");
const featureUsageModel = require("../models/featureUsageModel");

/**
 * Get the current user's subscription and today's usage stats.
 */
exports.getMyPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await subscriptionModel.getSubscription(userId);
        const usage = await featureUsageModel.getTodayUsage(userId);

        res.json({
            subscription,
            usage
        });
    } catch (error) {
        console.error("Get My Plan Error:", error);
        res.status(500).json({ error: "Failed to fetch subscription data" });
    }
};

/**
 * Admin: Set a user's plan.
 */
exports.setPlan = async (req, res) => {
    try {
        const { userId, plan } = req.body;

        if (!userId || !plan) {
            return res.status(400).json({ error: "Missing userId or plan" });
        }

        if (!['free', 'premium'].includes(plan)) {
            return res.status(400).json({ error: "Invalid plan type" });
        }

        const updated = await subscriptionModel.updatePlan(userId, plan);
        res.json({
            message: `User plan updated to ${plan}`,
            subscription: updated
        });
    } catch (error) {
        console.error("Set Plan Error:", error);
        res.status(500).json({ error: "Failed to update user plan" });
    }
};

/**
 * Admin: Get usage report for a specific user.
 */
exports.getUserUsage = async (req, res) => {
    try {
        const { userId } = req.params;
        const usage = await featureUsageModel.getTodayUsage(userId);
        res.json({ usage });
    } catch (error) {
        console.error("Get User Usage Error:", error);
        res.status(500).json({ error: "Failed to fetch usage data" });
    }
};
