const { asyncHandler } = require('../middlewares/errorHandler');
const { 
    registerUser, 
    loginUser, 
    verifyToken,
    generatePasswordResetToken,
    resetPassword,
    changePassword,
    updateUserProfile
} = require('../services/authService');

const register = asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json({
            success: false,
            error: { message: 'Email, name, and password are required' }
        });
    }

    const result = await registerUser(email, name, password);
    res.status(201).json({
        success: true,
        data: result
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: { message: 'Email and password are required' }
        });
    }

    const result = await loginUser(email, password);
    res.json({
        success: true,
        data: result
    });
});

const verify = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'No token provided' }
        });
    }

    const result = await verifyToken(token);
    res.json({
        success: true,
        data: result
    });
});

// Forgot password - request reset token
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: { message: 'Email is required' }
        });
    }

    const result = await generatePasswordResetToken(email);
    res.json({
        success: true,
        data: result
    });
});

// Reset password with token
const resetPasswordHandler = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            error: { message: 'Token and new password are required' }
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: { message: 'Password must be at least 6 characters' }
        });
    }

    const result = await resetPassword(token, newPassword);
    res.json({
        success: true,
        data: result
    });
});

// Change password (authenticated)
const changePasswordHandler = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: { message: 'Current password and new password are required' }
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: { message: 'Password must be at least 6 characters' }
        });
    }

    const result = await changePassword(userId, currentPassword, newPassword);
    res.json({
        success: true,
        data: result
    });
});

// Update profile (name)
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    const result = await updateUserProfile(userId, { name });
    res.json({
        success: true,
        data: result
    });
});

module.exports = {
    register,
    login,
    verify,
    forgotPassword,
    resetPassword: resetPasswordHandler,
    changePassword: changePasswordHandler,
    updateProfile
};
