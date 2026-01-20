const {
    getMessagesByChannel,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage
} = require("../services/messageService");

const { asyncHandler } = require("../middlewares/errorHandler");

const getMessages = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await getMessagesByChannel(channelId, limit, offset);
    res.status(200).json({ success: true, data: messages });
});

const getById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const message = await getMessageById(id);
    res.status(200).json({ success: true, data: message });
});

const createMessageController = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    const authorId = req.body.authorId;
    const messageData = req.body;
    const newMessage = await createMessage(channelId, authorId, messageData);
    res.status(201).json({ success: true, data: newMessage });
});

const updateMessageController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedMessage = await updateMessage(id, updateData);
    res.status(200).json({ success: true, data: updatedMessage });
});

const deleteMessageController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    await deleteMessage(id);
    res.status(204).json({ success: true, data: null });
});

module.exports = {
    getMessages,
    getById,
    createMessageController,
    updateMessageController,
    deleteMessageController
};