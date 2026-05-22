const userModel = require('../models/userModel');
const bcrypt = require("bcryptjs");

exports.getAllUsers = async (req, res) => {
    try {
        const { search, role } = req.query;
        const users = await userModel.getAllUsers(search, role);
        return res.status(200).json({ success: true, users });
    } catch (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUser = await userModel.updateUser(userId, req.body);

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found or update failed" });
        }

        return res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await userModel.deleteUser(userId);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.deleteMe = async (req, res) => {
    try {
        const userId = req.user.id; // From verifyToken middleware
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required to delete your account" });
        }

        // Get user's password hash
        const user = await userModel.getUserPasswordHash(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        await userModel.deleteUserCompletely(userId);
        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (err) {
        console.error("Error deleting account:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
