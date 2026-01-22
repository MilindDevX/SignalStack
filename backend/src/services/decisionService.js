const prisma = require('../config/db');

// ============================================================================
// DECISION DETECTION PATTERNS
// ============================================================================

// Category 1: Explicit final decisions
const EXPLICIT_DECISION_PATTERNS = [
    /\bdecision:\s*/i,
    /\bfinal decision\s*(is)?\b/i,
    /\bthis is finalized\b/i,
    /\bwe'?re going with\b/i,
    /\blet'?s go with\b/i,
    /\bwe decided\b/i,
    /\bdecided to\b/i,
    /\bit'?s decided\b/i,
    /\bour decision is\b/i,
    /\bfinal answer\b/i,
];

// Category 2: Approval or confirmation statements
const APPROVAL_PATTERNS = [
    /^approved\.?$/i,
    /^confirmed\.?$/i,
    /\blooks good,?\s*proceed\b/i,
    /\byes,?\s*go ahead\b/i,
    /\bgo ahead\b/i,
    /\bapproved and closed\b/i,
    /\bapproved:\s*/i,
    /\bconfirmed:\s*/i,
];

// Category 3: Ownership or responsibility acceptance
const OWNERSHIP_PATTERNS = [
    /\bi'?ll handle this\b/i,
    /\bi'?ll take care of (it|this)\b/i,
    /\bi'?ll own this\b/i,
    /\bassigned to me\b/i,
    /\bi'?ll take this\b/i,
    /\bi'?m on (it|this)\b/i,
    /\bi got (it|this)\b/i,
];

// Category 4: Task assignment to others
const ASSIGNMENT_PATTERNS = [
    /\bassign(ed)?\s+(this\s+)?to\s+\w+/i,
    /\b\w+\s+will handle (this|it)\b/i,
    /\bthis goes to\s+\w+/i,
    /\bgoes to the\s+\w+\s+team\b/i,
    /\b@\w+\s+(please\s+)?(handle|take|own)\b/i,
];

// Category 5: Commitment to an action or plan
const COMMITMENT_PATTERNS = [
    /\bwe will\s+\w+/i,
    /\bwe'?ll\s+\w+/i,
    /\bwe'?re switching to\b/i,
    /\bwe'?re moving to\b/i,
    /\bwe'?ll ship (this|it)\b/i,
    /\bwe'?ll postpone\b/i,
    /\bwe'?ll proceed with\b/i,
    /\bproceeding with\b/i,
    /\bmoving forward with\b/i,
    /\bwe chose\b/i,
    /\bwe'?ve chosen\b/i,
    /\bwe picked\b/i,
    /\bwe selected\b/i,
    /\bthe plan is\b/i,
];

// Category 6: Declarative decision keywords
const DECLARATIVE_PATTERNS = [
    /^decision made\.?$/i,
    /^finalized\.?$/i,
    /\bfinalized:\s*/i,
    /\baction item:\s*/i,
    /\btodo:\s*/i,
];

// Combine all patterns
const ALL_DECISION_PATTERNS = [
    ...EXPLICIT_DECISION_PATTERNS,
    ...APPROVAL_PATTERNS,
    ...OWNERSHIP_PATTERNS,
    ...ASSIGNMENT_PATTERNS,
    ...COMMITMENT_PATTERNS,
    ...DECLARATIVE_PATTERNS,
];

// ============================================================================
// EXCLUSION RULES
// ============================================================================

// Uncertainty/suggestion language to exclude
const UNCERTAINTY_PATTERNS = [
    /\bmaybe\b/i,
    /\bmight\b/i,
    /\bcould\b/i,
    /\bshould\b/i,
    /\bi think\b/i,
    /\bi suggest\b/i,
    /\bperhaps\b/i,
    /\bpossibly\b/i,
    /\bwhat if\b/i,
    /\bwhat about\b/i,
    /\bany thoughts\b/i,
    /\bwhat do you think\b/i,
    /\bdo you think\b/i,
    /\blet me know\b/i,
    /\bopen to suggestions\b/i,
    /\bnot sure\b/i,
    /\bconsidering\b/i,
    /\blooking into\b/i,
];

// Check if content is a question
function isQuestion(content) {
    return content.trim().endsWith('?');
}

// Check if content has uncertainty language
function hasUncertainty(content) {
    return UNCERTAINTY_PATTERNS.some(pattern => pattern.test(content));
}

// ============================================================================
// DECISION DETECTION
// ============================================================================

/**
 * Analyze message content for decision-like patterns
 * Returns suggestion for user confirmation, NOT auto-detection
 */
function analyzeForDecisionSuggestion(content) {
    if (!content || typeof content !== 'string') {
        return {
            suggestAsDecision: false,
            reason: 'Empty content',
            matchedCategory: null,
            matchedPattern: null
        };
    }

    // Exclusion: Questions
    if (isQuestion(content)) {
        return {
            suggestAsDecision: false,
            reason: 'Message is a question',
            matchedCategory: null,
            matchedPattern: null
        };
    }

    // Exclusion: Uncertainty language
    if (hasUncertainty(content)) {
        return {
            suggestAsDecision: false,
            reason: 'Message contains uncertainty language',
            matchedCategory: null,
            matchedPattern: null
        };
    }

    // Check each category
    const categories = [
        { name: 'Explicit Decision', patterns: EXPLICIT_DECISION_PATTERNS },
        { name: 'Approval/Confirmation', patterns: APPROVAL_PATTERNS },
        { name: 'Ownership Acceptance', patterns: OWNERSHIP_PATTERNS },
        { name: 'Task Assignment', patterns: ASSIGNMENT_PATTERNS },
        { name: 'Commitment to Action', patterns: COMMITMENT_PATTERNS },
        { name: 'Declarative Statement', patterns: DECLARATIVE_PATTERNS },
    ];

    for (const category of categories) {
        for (const pattern of category.patterns) {
            if (pattern.test(content)) {
                return {
                    suggestAsDecision: true,
                    reason: `Matches ${category.name} pattern`,
                    matchedCategory: category.name,
                    matchedPattern: pattern.toString()
                };
            }
        }
    }

    return {
        suggestAsDecision: false,
        reason: 'No decision patterns matched',
        matchedCategory: null,
        matchedPattern: null
    };
}

// Legacy function for backward compatibility
function detectDecisionInContent(content) {
    const analysis = analyzeForDecisionSuggestion(content);
    return {
        isDecision: analysis.suggestAsDecision,
        matchedPattern: analysis.matchedPattern
    };
}

// ============================================================================
// DECISION CRUD OPERATIONS
// ============================================================================

const DECISION_INCLUDE = {
    owner: { select: { id: true, name: true, email: true } },
    channel: { select: { id: true, name: true, teamId: true } },
    message: { select: { id: true, content: true, createdAt: true, authorId: true } },
    supersedesDecision: {
        select: { id: true, title: true, status: true, createdAt: true }
    },
    supersededBy: {
        select: { id: true, title: true, status: true, createdAt: true }
    }
};

// Create decision from message (only leads can supersede)
async function createFromMessage(messageId, userId, options = {}) {
    const { supersedesDecisionId = null, userRole = null } = options;

    if (supersedesDecisionId && userRole && !['LEAD', 'MANAGER', 'OWNER'].includes(userRole)) {
        throw new Error('Only leads can supersede decisions');
    }

    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            author: { select: { id: true, name: true } },
            channel: { select: { id: true, teamId: true } }
        }
    });

    if (!message) {
        throw new Error('Message not found');
    }

    if (message.hasDecision) {
        throw new Error('This message is already marked as a decision');
    }

    // If superseding, validate the decision exists and is OPEN
    if (supersedesDecisionId) {
        const existingDecision = await prisma.decision.findUnique({
            where: { id: supersedesDecisionId }
        });

        if (!existingDecision) {
            throw new Error('Decision to supersede not found');
        }

        if (existingDecision.status === 'CLOSED') {
            throw new Error('Cannot supersede a closed decision');
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // If superseding, close the existing decision
        if (supersedesDecisionId) {
            await tx.decision.update({
                where: { id: supersedesDecisionId },
                data: {
                    status: 'CLOSED',
                    closedAt: new Date(),
                    closureReason: 'Superseded by new decision'
                }
            });
        }

        // Mark message as having a decision
        await tx.message.update({
            where: { id: messageId },
            data: { hasDecision: true }
        });

        const title = message.content.length > 100
            ? message.content.substring(0, 100) + '...'
            : message.content;

        // Create the new decision
        const decision = await tx.decision.create({
            data: {
                title,
                description: message.content,
                status: 'OPEN',
                ownerId: message.authorId,
                channelId: message.channelId,
                messageId: messageId,
                supersedesDecisionId: supersedesDecisionId
            },
            include: DECISION_INCLUDE
        });

        return decision;
    });

    return result;
}

// Create manual decision (only leads can supersede)
async function createManual(channelId, userId, decisionData) {
    const { title, status = 'OPEN', supersedesDecisionId = null, userRole = null } = decisionData;

    if (!title || !title.trim()) {
        throw new Error('Decision title is required');
    }

    if (supersedesDecisionId && userRole && !['LEAD', 'MANAGER', 'OWNER'].includes(userRole)) {
        throw new Error('Only leads can supersede decisions');
    }

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { id: true, teamId: true }
    });

    if (!channel) {
        throw new Error('Channel not found');
    }

    // If superseding, validate the decision exists and is OPEN
    if (supersedesDecisionId) {
        const existingDecision = await prisma.decision.findUnique({
            where: { id: supersedesDecisionId }
        });

        if (!existingDecision) {
            throw new Error('Decision to supersede not found');
        }

        if (existingDecision.status === 'CLOSED') {
            throw new Error('Cannot supersede a closed decision');
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // If superseding, close the existing decision
        if (supersedesDecisionId) {
            await tx.decision.update({
                where: { id: supersedesDecisionId },
                data: {
                    status: 'CLOSED',
                    closedAt: new Date(),
                    closureReason: 'Superseded by new decision'
                }
            });
        }

        const decision = await tx.decision.create({
            data: {
                title: title.trim(),
                status: status === 'CLOSED' ? 'CLOSED' : 'OPEN',
                ownerId: userId,
                channelId: channelId,
                closedAt: status === 'CLOSED' ? new Date() : null,
                supersedesDecisionId: supersedesDecisionId
            },
            include: DECISION_INCLUDE
        });

        return decision;
    });

    return result;
}

/**
 * Update decision status
 */
async function updateStatus(decisionId, status, userId, closureReason = null) {
    const decision = await prisma.decision.findUnique({
        where: { id: decisionId }
    });

    if (!decision) {
        throw new Error('Decision not found');
    }

    // Prevent reopening a superseded decision
    if (status === 'OPEN' && decision.closureReason === 'Superseded by new decision') {
        throw new Error('Cannot reopen a superseded decision');
    }

    const updateData = {
        status: status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        closedAt: status === 'CLOSED' ? new Date() : null,
        closureReason: status === 'CLOSED' ? (closureReason || 'Manually closed') : null
    };

    const updated = await prisma.decision.update({
        where: { id: decisionId },
        data: updateData,
        include: DECISION_INCLUDE
    });

    return updated;
}

/**
 * Get decisions by team with optional status filter
 */
async function getByTeam(teamId, options = {}) {
    const { status = null, includeSuperseded = false } = options;

    const where = {
        channel: { teamId }
    };

    if (status) {
        where.status = status;
    }

    // By default, don't show superseded decisions unless requested
    if (!includeSuperseded) {
        where.OR = [
            { closureReason: { not: 'Superseded by new decision' } },
            { closureReason: null }
        ];
    }

    const decisions = await prisma.decision.findMany({
        where,
        include: DECISION_INCLUDE,
        orderBy: { createdAt: 'desc' }
    });

    return decisions;
}

/**
 * Get OPEN decisions by team (for superseding selection)
 */
async function getOpenDecisionsByTeam(teamId) {
    const decisions = await prisma.decision.findMany({
        where: {
            channel: { teamId },
            status: 'OPEN'
        },
        include: {
            owner: { select: { id: true, name: true } },
            channel: { select: { id: true, name: true } },
            message: { select: { id: true, content: true, createdAt: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return decisions;
}

/**
 * Get decisions by channel
 */
async function getByChannel(channelId, options = {}) {
    const { status = null } = options;

    const where = { channelId };

    if (status) {
        where.status = status;
    }

    const decisions = await prisma.decision.findMany({
        where,
        include: DECISION_INCLUDE,
        orderBy: { createdAt: 'desc' }
    });

    return decisions;
}

/**
 * Get decision by ID with full details
 */
async function getById(decisionId) {
    const decision = await prisma.decision.findUnique({
        where: { id: decisionId },
        include: DECISION_INCLUDE
    });

    return decision;
}

/**
 * Delete a decision (only if OPEN and not superseded by another)
 */
async function deleteDecision(decisionId, userId) {
    const decision = await prisma.decision.findUnique({
        where: { id: decisionId },
        include: { supersededBy: true }
    });

    if (!decision) {
        throw new Error('Decision not found');
    }

    // Prevent deletion if this decision has superseded others
    if (decision.supersededBy && decision.supersededBy.length > 0) {
        throw new Error('Cannot delete a decision that supersedes other decisions');
    }

    await prisma.$transaction(async (tx) => {
        // If linked to a message, reset the hasDecision flag
        if (decision.messageId) {
            await tx.message.update({
                where: { id: decision.messageId },
                data: { hasDecision: false }
            });
        }

        // Delete the decision
        await tx.decision.delete({
            where: { id: decisionId }
        });
    });

    return { success: true };
}

/**
 * Unmark message as decision
 */
async function unmarkMessage(messageId, userId) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            decision: {
                include: { supersededBy: true }
            }
        }
    });

    if (!message) {
        throw new Error('Message not found');
    }

    if (!message.hasDecision || !message.decision) {
        throw new Error('This message is not marked as a decision');
    }

    // Prevent unmarking if this decision has superseded others
    if (message.decision.supersededBy && message.decision.supersededBy.length > 0) {
        throw new Error('Cannot unmark a decision that supersedes other decisions');
    }

    await prisma.$transaction(async (tx) => {
        await tx.decision.delete({
            where: { id: message.decision.id }
        });

        await tx.message.update({
            where: { id: messageId },
            data: { hasDecision: false }
        });
    });

    return { success: true };
}

/**
 * Get decision history chain (all superseded decisions)
 */
async function getDecisionHistory(decisionId) {
    const history = [];
    let currentId = decisionId;

    while (currentId) {
        const decision = await prisma.decision.findUnique({
            where: { id: currentId },
            include: {
                owner: { select: { id: true, name: true } },
                channel: { select: { id: true, name: true } },
                message: { select: { id: true, content: true, createdAt: true } }
            }
        });

        if (!decision) break;

        history.push(decision);
        currentId = decision.supersedesDecisionId;
    }

    return history;
}

module.exports = {
    // Detection (suggestion-based, not automatic)
    analyzeForDecisionSuggestion,
    detectDecisionInContent, // Legacy

    // CRUD
    createFromMessage,
    createManual,
    updateStatus,
    getByTeam,
    getByChannel,
    getById,
    deleteDecision,
    unmarkMessage,

    // Superseding workflow
    getOpenDecisionsByTeam,
    getDecisionHistory,
};
