const inviteModel = require('../models/inviteModel');
const emailService = require('../services/emailService');

exports.sendInvite = async (req, res) => {
    try {
        const { email, role, patientId } = req.body;
        const invitedBy = req.user.id; // Admin ID from auth middleware

        if (!email || !role) {
            return res.status(400).json({ success: false, message: "Email and Role are required." });
        }

        // 1. Create Invite in DB (Simple Schema)
        const invite = await inviteModel.createInvite(email, role, invitedBy, patientId);

        // 2. Send Welcome Email
        await emailService.sendWelcomeEmail(email, role);

        res.status(201).json({ success: true, message: "Invite sent successfully", invite });

    } catch (error) {
        console.error("Error sending invite:", error);
        res.status(500).json({ success: false, message: "Failed to send invite", error: error.message });
    }
};

exports.listInvites = async (req, res) => {
    try {
        const { search } = req.query;
        const invites = await inviteModel.getAllInvites(search);
        res.status(200).json({ success: true, invites });
    } catch (error) {
        console.error("Error listing invites:", error);
        res.status(500).json({ success: false, message: "Failed to list invites", error: error.message });
    }
};

exports.resendInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const invite = await inviteModel.getInviteById(id);

        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }

        // Resend Email
        await emailService.sendWelcomeEmail(invite.email, invite.role);

        // Update Stats
        const updatedInvite = await inviteModel.updateReinviteInfo(id);

        res.status(200).json({ success: true, message: "Invite rescinded successfully", invite: updatedInvite });
    } catch (error) {
        console.error("Error resending invite:", error);
        res.status(500).json({ success: false, message: "Failed to resend invite", error: error.message });
    }
};
