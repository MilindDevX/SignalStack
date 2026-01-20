const decisionService = require('../services/decisionService');

/**
 * Create a decision from a message with optional superseding
 * POST /api/decisions/from-message/:messageId
 * Body: { supersedesDecisionId?: string }
 */
async function createFromMessage(req, res, next) {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        const { supersedesDecisionId } = req.body || {};

        const decision = await decisionService.createFromMessage(messageId, userId, {
            supersedesDecisionId
        });
        
        res.status(201).json({
            success: true,
            data: decision
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a manual decision with optional superseding
 * POST /api/decisions/channel/:channelId
 * Body: { title: string, status?: string, supersedesDecisionId?: string }
 */
async function createManual(req, res, next) {
    try {
        const { channelId } = req.params;
        const userId = req.user.id;
        const decisionData = req.body;

        const decision = await decisionService.createManual(channelId, userId, decisionData);
        
        res.status(201).json({
            success: true,
            data: decision
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update decision status
 * PATCH /api/decisions/:id/status
 * Body: { status: 'OPEN' | 'CLOSED', closureReason?: string }
 */
async function updateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status, closureReason } = req.body;
        const userId = req.user.id;

        const decision = await decisionService.updateStatus(id, status, userId, closureReason);
        
        res.json({
            success: true,
            data: decision
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get decisions by team with optional filters
 * GET /api/decisions/team/:teamId?status=OPEN|CLOSED&includeSuperseded=true
 */
async function getByTeam(req, res, next) {
    try {
        const { teamId } = req.params;
        const { status, includeSuperseded } = req.query;

        const decisions = await decisionService.getByTeam(teamId, {
            status: status || null,
            includeSuperseded: includeSuperseded === 'true'
        });
        
        res.json({
            success: true,
            data: decisions
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get OPEN decisions by team (for superseding selection)
 * GET /api/decisions/team/:teamId/open
 */
async function getOpenDecisionsByTeam(req, res, next) {
    try {
        const { teamId } = req.params;

        const decisions = await decisionService.getOpenDecisionsByTeam(teamId);
        
        res.json({
            success: true,
            data: decisions
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get decisions by channel with optional status filter
 * GET /api/decisions/channel/:channelId?status=OPEN|CLOSED
 */
async function getByChannel(req, res, next) {
    try {
        const { channelId } = req.params;
        const { status } = req.query;

        const decisions = await decisionService.getByChannel(channelId, {
            status: status || null
        });
        
        res.json({
            success: true,
            data: decisions
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a single decision by ID
 * GET /api/decisions/:id
 */
async function getById(req, res, next) {
    try {
        const { id } = req.params;

        const decision = await decisionService.getById(id);
        
        if (!decision) {
            return res.status(404).json({
                success: false,
                error: { message: 'Decision not found' }
            });
        }

        res.json({
            success: true,
            data: decision
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a decision
 * DELETE /api/decisions/:id
 */
async function deleteDecision(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await decisionService.deleteDecision(id, userId);
        
        res.json({
            success: true,
            message: 'Decision deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Unmark a message as decision
 * DELETE /api/decisions/message/:messageId
 */
async function unmarkMessage(req, res, next) {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        await decisionService.unmarkMessage(messageId, userId);
        
        res.json({
            success: true,
            message: 'Message unmarked as decision'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get decision history chain (superseded decisions)
 * GET /api/decisions/:id/history
 */
async function getDecisionHistory(req, res, next) {
    try {
        const { id } = req.params;

        const history = await decisionService.getDecisionHistory(id);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Analyze message content for decision suggestion
 * POST /api/decisions/analyze
 * Body: { content: string }
 */
async function analyzeContent(req, res, next) {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: { message: 'Content is required' }
            });
        }

        const analysis = decisionService.analyzeForDecisionSuggestion(content);
        
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createFromMessage,
    createManual,
    updateStatus,
    getByTeam,
    getOpenDecisionsByTeam,
    getByChannel,
    getById,
    deleteDecision,
    unmarkMessage,
    getDecisionHistory,
    analyzeContent
};
