const contactModel = require("../models/contactModel");
const emailService = require("../services/emailService");

exports.getContacts = async (req, res) => {
    try {
        const { userId } = req.params;
        const contacts = await contactModel.getContactsByUserId(userId);
        res.json({ success: true, contacts });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.createContact = async (req, res) => {
    try {
        const { userId, name, email, relation } = req.body;
        if (!userId || !name || !email) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const newContact = await contactModel.createContact(userId, name, email, relation);
        res.json({ success: true, contact: newContact });
    } catch (error) {
        console.error("Error creating contact:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, relation } = req.body;
        const updatedContact = await contactModel.updateContact(id, name, email, relation);

        if (!updatedContact) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        res.json({ success: true, contact: updatedContact });
    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.sendEmail = async (req, res) => {
    try {
        const { recipientName, recipientEmail, subject, htmlContent } = req.body;
        // Basic validation
        if (!recipientEmail || !subject || !htmlContent) {
            return res.status(400).json({ success: false, message: "Missing email details" });
        }

        // We use emailService. But emailService might be specific to Welcome/Reset?
        // Let's genericize it or add a custom method. 
        // I'll check emailService content below, but for now assuming I can add a function or reuse.
        // If emailService only has specific exports, I might need to update it too.
        // Assuming emailService has a generic send method or I can adapt:
        // Actually, I saw `emailService.js` earlier. It uses `EmailClient`.
        // I will add `sendGenericEmail` to `emailService.js` if needed, 
        // OR just implement it here if I import `EmailClient`.
        // Better: Update `emailService.js` to expose a generic sender, then use it here.
        // For now, I'll call a method I WILL create: `emailService.sendCustomEmail`.

        await emailService.sendCustomEmail(recipientEmail, subject, htmlContent);
        res.json({ success: true });

    } catch (error) {
        console.error("Send Email Error:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await contactModel.deleteContact(id);

        if (!deletedContact) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        res.json({ success: true, message: "Contact deleted" });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
