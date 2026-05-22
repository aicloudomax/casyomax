/**
 * FILE: src/middleware/planMiddleware.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Enforce per-feature daily usage limits based on the user's plan.
 * -----------------------------------------------------------------------------
 * USAGE (in routes):
 *   const { checkFeatureLimit } = require('../middleware/planMiddleware');
 *
 *   router.post('/text',  verifyToken, checkFeatureLimit('ai_chat'),    chatController.handleTextChat);
 *   router.post('/voice', verifyToken, checkFeatureLimit('voice_chat'),  chatController.handleVoiceChat);
 *
 * LIMITS:
 *   Feature       | Free | Premium
 *   --------------|------|--------
 *   ai_chat       |  10  |  ∞
 *   voice_chat    |   5  |  ∞
 */
const featureUsageModel = require("../models/featureUsageModel");

// Define limits per plan per feature
const FEATURE_LIMITS = {
    ai_chat: { free: 10, premium: Infinity },
    voice_chat: { free: 5, premium: Infinity },
};

/**
 * Middleware factory that enforces a feature limit.
 * @param {string} feature - The feature key, e.g. 'ai_chat' or 'voice_chat'
 */
exports.checkFeatureLimit = (feature) => {
    return async (req, res, next) => {
        try {
            // Plan is stored in JWT by authController
            const plan = req.user?.plan || "free";
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Premium users have no limits
            if (plan === "premium") {
                return next();
            }

            const limits = FEATURE_LIMITS[feature];
            if (!limits) {
                // Unknown feature — allow through (fail open)
                return next();
            }

            const limit = limits[plan] ?? limits["free"];

            // Get today's usage
            const currentCount = await featureUsageModel.getUsageCount(userId, feature);

            if (currentCount >= limit) {
                return res.status(403).json({
                    error: "Daily limit reached",
                    feature,
                    limit,
                    used: currentCount,
                    plan,
                    upgradeMessage:
                        plan === "free"
                            ? "Upgrade to Premium for unlimited access."
                            : "You have reached your daily limit.",
                });
            }

            // Increment usage before allowing through
            await featureUsageModel.incrementUsage(userId, feature);
            next();
        } catch (err) {
            console.error("planMiddleware error:", err);
            // Fail open — don't block the user if our tracking has an error
            next();
        }
    };
};
