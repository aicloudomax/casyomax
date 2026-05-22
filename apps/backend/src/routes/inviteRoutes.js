const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Define Routes
// POST /api/invites/send - Admin only
router.post('/send', verifyToken, isAdmin, inviteController.sendInvite);

// GET /api/invites/ - List all invites (Admin only)
router.get('/', verifyToken, isAdmin, inviteController.listInvites);

// POST /api/invites/:id/resend - Resend invite (Admin only)
router.post('/:id/resend', verifyToken, isAdmin, inviteController.resendInvite);

module.exports = router;
