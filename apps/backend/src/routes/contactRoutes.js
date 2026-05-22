const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// Get all contacts for a user
router.get("/user/:userId", contactController.getContacts);

// Create a new contact
router.post("/", contactController.createContact);

// Update a contact
router.put("/:id", contactController.updateContact);

// Send an email (Draft action)
router.post("/send-email", contactController.sendEmail);

// Delete a contact
router.delete("/:id", contactController.deleteContact);

module.exports = router;
