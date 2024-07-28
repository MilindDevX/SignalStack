const express = require('express');
const analyticsRouter = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const {
    getTeamMetrics,
    getLatency,
    getSpeakers,
    getActivity,
    getTeamDecisions,
    getTeamRecentActivity,
    getTeamSummary
} = require('../controllers/analyticsController');

// All analytics routes require authentication
analyticsRouter.use(authMiddleware);

// Team-level analytics
analyticsRouter.get('/team/:teamId/metrics', getTeamMetrics);
analyticsRouter.get('/team/:teamId/speakers', getSpeakers);
analyticsRouter.get('/team/:teamId/decisions', getTeamDecisions);
analyticsRouter.get('/team/:teamId/activity', getTeamRecentActivity);
analyticsRouter.get('/team/:teamId/summary', getTeamSummary);

// Channel-level analytics
analyticsRouter.get('/channel/:channelId/activity', getActivity);
analyticsRouter.get('/channel/:channelId/latency', getLatency);

module.exports = analyticsRouter;
