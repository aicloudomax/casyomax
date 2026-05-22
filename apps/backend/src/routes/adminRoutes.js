const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/stats - Get dashboard statistics (Admin only)
router.get('/stats', verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router;
