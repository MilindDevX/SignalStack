const express = require('express');
const router = express.Router();
const {
    register,
    login,
    verify,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify', verify);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.put('/change-password', authMiddleware, changePassword);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
