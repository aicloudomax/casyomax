/**
 * FILE: src/controllers/authController.js
 * -----------------------------------------------------------------------------
 * PURPOSE: Handles Authentication Requests.
 * -----------------------------------------------------------------------------
 * RESPONSIBILITIES:
 * 1. Register: Validates input -> Calls Service to create user -> Returns Token.
 * 2. Login: Validates creds -> Calls Service to verify -> Returns Token.
 * 3. Invite: Handles logic for generating/accepting invite links.
 */
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser, updateSessionId } = require("../models/userModel");
const inviteModel = require("../models/inviteModel");
const PatientModel = require("../models/patientModel");
const subscriptionModel = require("../models/subscriptionModel");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");


// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role } = req.body;

    // 1. Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check Exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 2.5 Determine Role
    // Check if an invite exists for this email to assign the correct role.
    // If no invite, default role to the role provided in the request (for open registration).
    const invite = await inviteModel.findInviteByEmail(email);
    const assignedRole = invite ? invite.role : role;

    // 2.7 Hash Password (SECURITY)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await createUser({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      phone,
      role: assignedRole
    });

    // 3.5 Create Patient Profile if role is patient
    if (user.role === 'patient') {
      await PatientModel.createPatientProfile(user.id);
    }

    // 3.6 Create subscription record (free plan by default)
    await subscriptionModel.createSubscription(user.id);

    // 4. Generate Token (include plan from subscription)
    const sessionId = uuidv4();
    await updateSessionId(user.id, sessionId);

    const subscription = await subscriptionModel.getSubscription(user.id);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: subscription.plan,
        sessionId: sessionId,
      },
      process.env.JWT_SECRET || "MY_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // 5. Response
    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

// For now we validate password with plain compare. Replace later with bcrypt.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password (Bcrypt)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Fallback: If bcrypt fails, check if it's an old plain-text password (temporary migration)
    if (!isMatch && password === user.password_hash) {
      // Ideally, we should re-hash and save here, but for now we just allow login.
      // console.log("Old plain text password used. Recommended: Update to hash.");
    } else if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT (include plan from subscription)
    const sessionId = uuidv4();
    await updateSessionId(user.id, sessionId);

    const subscription = await subscriptionModel.getSubscription(user.id);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: subscription.plan,
        sessionId: sessionId,
      },
      process.env.JWT_SECRET || "MY_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Return user info + token
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists - security best practice
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a reset code."
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    const userModel = require("../models/userModel");
    await userModel.saveResetOTP(email, otp);

    // Send email
    const emailService = require("../services/emailService");
    await emailService.sendPasswordResetEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Password reset code sent to your email."
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to send reset code" });
  }
};

// Reset Password - Verify OTP and Update Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Verify OTP
    const userModel = require("../models/userModel");
    const verification = await userModel.verifyResetOTP(email, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.reason
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await userModel.updatePassword(verification.userId, hashedPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};
