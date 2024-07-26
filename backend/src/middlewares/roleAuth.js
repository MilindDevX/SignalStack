const { ApiError } = require('./errorHandler');
const prisma = require('../config/db');

/**
 * @param {string[]} allowedRoles
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.headers['x-user-id'];
            const teamId = req.params.teamId || req.body.teamId || req.headers['x-team-id'];

            if (!userId) {
                throw new ApiError('User ID is required', 401);
            }

            if (!teamId) {
                throw new ApiError('Team ID is required', 400);
            }

            const membership = await prisma.teamMember.findUnique({
                where: {
                    userId_teamId: {
                        userId,
                        teamId
                    }
                }
            });

            if (!membership) {
                throw new ApiError('You are not a member of this team', 403);
            }

            if (!membership.isActive) {
                throw new ApiError('Your membership is inactive', 403);
            }

            if (!allowedRoles.includes(membership.role)) {
                throw new ApiError('You do not have permission to access this resource', 403);
            }

            // Attach user info to request for downstream use
            req.userRole = membership.role;
            req.userId = userId;
            req.teamId = teamId;

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if user is a member of the team (any role)
 */
const requireMembership = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        const teamId = req.params.teamId || req.body.teamId || req.headers['x-team-id'];

        if (!userId) {
            throw new ApiError('User ID is required', 401);
        }

        if (!teamId) {
            throw new ApiError('Team ID is required', 400);
        }

        const membership = await prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId
                }
            }
        });

        if (!membership || !membership.isActive) {
            throw new ApiError('You are not an active member of this team', 403);
        }

        req.userRole = membership.role;
        req.userId = userId;
        req.teamId = teamId;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requireRole,
    requireMembership
};
