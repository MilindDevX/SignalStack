const express = require("express");
const messageRouter = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const {
    getMessages,
    getById,
    createMessageController,
    updateMessageController,
    deleteMessageController
} = require("../controllers/messageController");

messageRouter.use(authMiddleware);
    
messageRouter.get("/channel/:channelId", getMessages);
messageRouter.get("/:id", getById);
messageRouter.post("/channel/:channelId", createMessageController);
messageRouter.put("/:id", updateMessageController);
messageRouter.delete("/:id", deleteMessageController);

module.exports = messageRouter;