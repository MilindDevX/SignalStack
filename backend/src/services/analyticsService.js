const prisma = require('../config/db');
const { ApiError } = require('../middlewares/errorHandler');

async function getParticipationMetrics(teamId) {
    // Get only users who are members of this team
    const teamMembers = await prisma.teamMember.findMany({
        where: { teamId, isActive: true },
        include: {
            user: {
                include: {
                    messages: {
                        where: { channel: { teamId } },
                        select: { id: true, createdAt: true },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }
        }
    });

    const totalMessages = teamMembers.reduce((sum, m) => sum + m.user.messages.length, 0);

    return teamMembers.map(member => ({
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        messageCount: member.user.messages.length,
        percentage: totalMessages > 0 ? Math.round((member.user.messages.length / totalMessages) * 100) : 0,
        lastActiveAt: member.user.messages[0]?.createdAt || null
    }));
}

async function getResponseLatency(channelId) {
    const messages = await prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true, authorId: true }
    });

    if (messages.length < 2) return [];

    let latencies = [];
    for (let i = 1; i < messages.length; i++) {
        const timeDiff = messages[i].createdAt - messages[i-1].createdAt;
        latencies.push({
            messageId: messages[i].id,
            responseTimeMs: timeDiff,
            authorId: messages[i].authorId
        });
    }

    // Calculate average response time
    const avgResponseTime = latencies.length > 0 
        ? latencies.reduce((sum, l) => sum + l.responseTimeMs, 0) / latencies.length 
        : 0;

    return {
        latencies,
        averageResponseTimeMs: avgResponseTime,
        totalResponses: latencies.length
    };
}

async function getDominantSpeakers(teamId, limit = 5) {
    // Get only users who are members of this team
    const teamMembers = await prisma.teamMember.findMany({
        where: { teamId, isActive: true },
        include: {
            user: {
                include: {
                    messages: { 
                        where: { channel: { teamId } },
                        select: { id: true }
                    }
                }
            }
        }
    });

    // Sort by message count
    const sorted = teamMembers
        .map(member => ({
            userId: member.user.id,
            name: member.user.name,
            role: member.role,
            messageCount: member.user.messages.length
        }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, limit);

    // Calculate percentages
    const totalMessages = sorted.reduce((sum, s) => sum + s.messageCount, 0);
    
    return sorted.map(speaker => ({
        ...speaker,
        percentage: totalMessages > 0 ? Math.round((speaker.messageCount / totalMessages) * 100) : 0
    }));
}

async function getChannelActivity(channelId) {
    const messages = await prisma.message.findMany({
        where: { channelId },
        select: { createdAt: true }
    });

    const activityByDay = {};
    messages.forEach(msg => {
        const day = msg.createdAt.toISOString().split('T')[0];
        activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    return Object.entries(activityByDay).map(([date, count]) => ({
        date,
        messageCount: count
    }));
}

async function getDecisions(teamId) {
    const decisions = await prisma.decision.findMany({
        where: { channel: { teamId } },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            channel: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return decisions;
}

async function getRecentActivity(teamId, limit = 10) {
    // Get recent messages from team channels
    const recentMessages = await prisma.message.findMany({
        where: { channel: { teamId } },
        include: {
            author: { select: { id: true, name: true } },
            channel: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    // Get recent decisions
    const recentDecisions = await prisma.decision.findMany({
        where: { channel: { teamId } },
        include: {
            owner: { select: { id: true, name: true } },
            channel: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // Combine and sort by date
    const activity = [
        ...recentMessages.map(msg => ({
            type: 'message',
            user: msg.author?.name || 'Unknown',
            action: msg.parentId ? 'replied to a thread' : 'sent a message',
            channel: msg.channel?.name || 'unknown',
            time: msg.createdAt,
            id: msg.id
        })),
        ...recentDecisions.map(dec => ({
            type: 'decision',
            user: dec.owner?.name || 'Unknown',
            action: `logged a decision: ${dec.title}`,
            channel: dec.channel?.name || 'unknown',
            time: dec.createdAt,
            id: dec.id
        }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);

    return activity;
}

async function getTeamAnalyticsSummary(teamId) {
    // Get team channels
    const channels = await prisma.channel.findMany({
        where: { teamId, isArchived: false },
        include: {
            _count: { select: { messages: true } }
        }
    });

    // Get participation metrics
    const participation = await getParticipationMetrics(teamId);
    
    // Get decisions summary (updated to use new OPEN/CLOSED statuses)
    const decisions = await getDecisions(teamId);
    const openDecisions = decisions.filter(d => d.status === 'OPEN').length;
    const closedDecisions = decisions.filter(d => d.status === 'CLOSED').length;

    // Calculate team health metrics
    const totalMembers = participation.length;
    const activeMembers = participation.filter(p => p.messageCount > 0).length;
    const participationRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    
    // Calculate participation balance (lower variance = more balanced)
    const msgCounts = participation.map(p => p.messageCount);
    const avgMsgs = msgCounts.reduce((a, b) => a + b, 0) / (msgCounts.length || 1);
    const variance = msgCounts.reduce((sum, c) => sum + Math.pow(c - avgMsgs, 2), 0) / (msgCounts.length || 1);
    const balanceScore = avgMsgs > 0 ? Math.max(0, 100 - Math.round((Math.sqrt(variance) / avgMsgs) * 50)) : 0;

    // Decision closure rate (null if no decisions)
    const decisionClosureRate = decisions.length > 0 
        ? Math.round((closedDecisions / decisions.length) * 100) 
        : null;

    // Overall health score (weighted average)
    const healthScore = Math.round(
        (participationRate * 0.4) + 
        (balanceScore * 0.3) + 
        (decisionClosureRate * 0.3)
    );

    return {
        overview: {
            totalMessages: participation.reduce((sum, p) => sum + p.messageCount, 0),
            totalMembers,
            activeMembers,
            totalChannels: channels.length,
            activeChannels: channels.filter(c => c._count.messages > 0).length
        },
        participation,
        decisions: {
            total: decisions.length,
            open: openDecisions,
            closed: closedDecisions,
            closureRate: decisionClosureRate
        },
        health: {
            overall: healthScore,
            participationRate,
            balanceScore,
            decisionClosureRate
        },
        channels: channels.map(c => ({
            id: c.id,
            name: c.name,
            messageCount: c._count.messages,
            isActive: c._count.messages > 0
        }))
    };
}

module.exports = {
    getParticipationMetrics,
    getResponseLatency,
    getDominantSpeakers,
    getChannelActivity,
    getDecisions,
    getRecentActivity,
    getTeamAnalyticsSummary
};
