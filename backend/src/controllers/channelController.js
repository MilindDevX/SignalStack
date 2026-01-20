const {
    getChannelsByTeam,
    getChannelById,
    createChannel,
    getChannelMessages,
} = require("../services/channelService");

const { asyncHandler } = require("../middlewares/errorHandler");

const getByTeam = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    const channels = await getChannelsByTeam(teamId);
    res.status(200).json({ success: true, data: channels });
});

const getById = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    const channel = await getChannelById(channelId);
    res.status(200).json({ success: true, data: channel });
});

const createChannelController = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    const channelData = req.body;
    const newChannel = await createChannel(teamId, channelData);
    res.status(201).json({ success: true, data: newChannel });
});

const getMessages = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const messages = await getChannelMessages(channelId, limit, offset);
    res.status(200).json({ success: true, data: messages });
});

module.exports = {
    getByTeam,
    getById,
    createChannelController,
    getMessages,
};