const prisma = require('../config/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ApiError } = require('../middlewares/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'abrakadabra';
const JWT_EXPIRE = '1d';
const RESET_TOKEN_EXPIRE = '1h';

// Store reset tokens in memory (in production, use Redis or database)
const resetTokens = new Map();

async function registerUser(email, name, password) {
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new ApiError('User with this email already exists', 400);
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user without assigning to any team
    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword
        }
    });

    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            teams: []
        },
        token
    };
}

async function loginUser(email, password) {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new ApiError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError('Invalid email or password', 401);
    }

    const token = generateToken(user.id);

    const memberships = await prisma.teamMember.findMany({
        where: { userId: user.id },
        include: { team: true }
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            teams: memberships.map(m => ({
                teamId: m.teamId,
                teamName: m.team.name,
                role: m.role
            }))
        },
        token
    };
}

async function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            throw new ApiError('User not found', 404);
        }

        const memberships = await prisma.teamMember.findMany({
            where: { userId: user.id },
            include: { team: true }
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                teams: memberships.map(m => ({
                    teamId: m.teamId,
                    teamName: m.team.name,
                    role: m.role
                }))
            },
            token
        };
    } catch (error) {
        throw new ApiError('Invalid or expired token', 401);
    }
}

function generateToken(userId) {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
}

// Generate password reset token
async function generatePasswordResetToken(email) {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        // Don't reveal if user exists or not for security
        return { message: 'If an account exists with this email, you will receive a reset link.' };
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store token with expiry (1 hour)
    resetTokens.set(hashedToken, {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    // In production, send email with reset link
    // For now, we'll return the token (in real app, this would be sent via email)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Log only in development (not in production for security)
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Password reset link generated for testing`);
    }

    return {
        message: 'If an account exists with this email, you will receive a reset link.',
        // Only include token in development for testing
        ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink })
    };
}

// Reset password with token
async function resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
        throw new ApiError('Invalid or expired reset token', 400);
    }

    if (Date.now() > tokenData.expiresAt) {
        resetTokens.delete(hashedToken);
        throw new ApiError('Reset token has expired', 400);
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: tokenData.userId },
        data: { password: hashedPassword }
    });

    // Remove used token
    resetTokens.delete(hashedToken);

    return { message: 'Password has been reset successfully' };
}

// Change password (authenticated user)
async function changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new ApiError('User not found', 404);
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new ApiError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    return { message: 'Password changed successfully' };
}

// Update user profile (name)
async function updateUserProfile(userId, updates) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new ApiError('User not found', 404);
    }

    const allowedUpdates = {};

    if (updates.name && updates.name.trim()) {
        allowedUpdates.name = updates.name.trim();
    }

    if (Object.keys(allowedUpdates).length === 0) {
        throw new ApiError('No valid updates provided', 400);
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: allowedUpdates,
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true
        }
    });

    return updatedUser;
}

module.exports = {
    registerUser,
    loginUser,
    verifyToken,
    generateToken,
    generatePasswordResetToken,
    resetPassword,
    changePassword,
    updateUserProfile
};
