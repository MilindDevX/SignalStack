const {
    getParticipationMetrics,
    getResponseLatency,
    getDominantSpeakers,
    getChannelActivity,
    getDecisions,
    getRecentActivity,
    getTeamAnalyticsSummary
} = require('../services/analyticsService');

const { asyncHandler } = require('../middlewares/errorHandler');

const getTeamMetrics = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const metrics = await getParticipationMetrics(teamId);
    res.json({ success: true, data: metrics });
});

const getLatency = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const latency = await getResponseLatency(channelId);
    res.json({ success: true, data: latency });
});

const getSpeakers = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const speakers = await getDominantSpeakers(teamId);
    res.json({ success: true, data: speakers });
});

const getActivity = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const activity = await getChannelActivity(channelId);
    res.json({ success: true, data: activity });
});

const getTeamDecisions = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const decisions = await getDecisions(teamId);
    res.json({ success: true, data: decisions });
});

const getTeamRecentActivity = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const activity = await getRecentActivity(teamId, limit);
    res.json({ success: true, data: activity });
});

const getTeamSummary = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const summary = await getTeamAnalyticsSummary(teamId);
    res.json({ success: true, data: summary });
});

module.exports = {
    getTeamMetrics,
    getLatency,
    getSpeakers,
    getActivity,
    getTeamDecisions,
    getTeamRecentActivity,
    getTeamSummary
};
