const prisma = require('../config/db');
const { ApiError } = require('../middlewares/errorHandler');

async function getAllUsers(teamId) {
    // If teamId provided, return only team members with team-scoped counts
    if (teamId) {
        return getUsersByTeam(teamId);
    }
    
    // Fallback: return all users (for admin purposes)
    const users = await prisma.user.findMany({
        include: {
            teamMemberships: {
                include: { team: true }
            },
            _count: {
                select: {
                    messages: true,
                    decisions: true,
                    reactions: true
                }
            }
        }
    });

    return users.filter(user => user.teamMemberships.length > 0);
}

async function getUserById(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            teamMemberships: {
                include: { team: true }
            },
            messages: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    messages: true,
                    decisions: true,
                    reactions: true,
                    mentions: true
                }
            }
        }
    });

    if (!user) {
        throw new ApiError('User not found', 404);
    }

    return user;
}

async function getUsersByTeam(teamId) {
    // First get all channels for this team
    const teamChannelIds = await prisma.channel.findMany({
        where: { teamId },
        select: { id: true }
    }).then(channels => channels.map(c => c.id));

    const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    createdAt: true
                }
            }
        }
    });

    if (teamMembers.length === 0) {
        throw new ApiError('Team not found', 404);
    }

    // Get team-scoped counts for each user
    const membersWithCounts = await Promise.all(
        teamMembers.map(async (member) => {
            // Count messages in team's channels only
            const messagesCount = await prisma.message.count({
                where: {
                    authorId: member.userId,
                    channelId: { in: teamChannelIds }
                }
            });

            // Count decisions in team's channels only
            const decisionsCount = await prisma.decision.count({
                where: {
                    ownerId: member.userId,
                    channelId: { in: teamChannelIds }
                }
            });

            return {
                ...member.user,
                role: member.role,
                joinedAt: member.joinedAt,
                isActive: member.isActive,
                _count: {
                    messages: messagesCount,
                    decisions: decisionsCount
                }
            };
        })
    );

    return membersWithCounts;
}

module.exports = {
    getAllUsers,
    getUserById,
    getUsersByTeam
};