const express = require("express");
const channelRouter = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const {
    getByTeam,
    getById,
    createChannelController,
    getMessages,
} = require("../controllers/channelController");

// All routes require authentication
channelRouter.use(authMiddleware);

channelRouter.get("/team/:teamId", getByTeam);
channelRouter.get("/:channelId", getById);
channelRouter.post("/team/:teamId", createChannelController);
channelRouter.get("/:channelId/messages", getMessages);

module.exports = channelRouter;