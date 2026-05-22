const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// GET all users (Admin only)
router.get('/', verifyToken, isAdmin, userController.getAllUsers);

// DELETE self account
router.delete('/me', verifyToken, userController.deleteMe);

// GET user by ID
router.get('/:id', verifyToken, userController.getUserById);

// PUT update user
router.put('/:id', verifyToken, userController.updateUser);

// DELETE user (Admin only)
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
