const express = require('express');
const decisionRouter = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/decisionController');

// All routes require authentication
decisionRouter.use(authMiddleware);

// Analyze content for decision suggestion
decisionRouter.post('/analyze', analyzeContent);

// Get decisions by team (with optional ?status=OPEN|CLOSED&includeSuperseded=true)
decisionRouter.get('/team/:teamId', getByTeam);

// Get OPEN decisions by team (for superseding selection)
decisionRouter.get('/team/:teamId/open', getOpenDecisionsByTeam);

// Get decisions by channel (with optional ?status=OPEN|CLOSED)
decisionRouter.get('/channel/:channelId', getByChannel);

// Get decision history chain
decisionRouter.get('/:id/history', getDecisionHistory);

// Get a single decision
decisionRouter.get('/:id', getById);

// Create decision from message (with optional supersedesDecisionId in body)
decisionRouter.post('/from-message/:messageId', createFromMessage);

// Create manual decision (with optional supersedesDecisionId in body)
decisionRouter.post('/channel/:channelId', createManual);

// Update decision status
decisionRouter.patch('/:id/status', updateStatus);

// Delete a decision
decisionRouter.delete('/:id', deleteDecision);

// Unmark a message as decision
decisionRouter.delete('/message/:messageId', unmarkMessage);

module.exports = decisionRouter;
