/**
 * FILE: src/routes/authRoutes.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Defines API Endpoints for Authentication.
 * -----------------------------------------------------------------------------
 * ROUTES:
 * - POST /register        -> authController.register
 * - POST /login           -> authController.login
 * - POST /forgot-password -> authController.forgotPassword
 * - POST /reset-password  -> authController.resetPassword
 */
const express = require("express");
const router = express.Router();
const { login, register, forgotPassword, resetPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
