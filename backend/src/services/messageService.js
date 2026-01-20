const prisma = require('../config/db');
const { analyzeForDecisionSuggestion } = require('./decisionService');

async function getMessagesByChannel(channelId, limit = 50, offset = 0){
    const messages = await prisma.message.findMany({
        where: { channelId },
        include: { author: { select: { id: true, name: true, email: true } }, replies: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
    });
    return messages;
}

async function getMessageById(id){
    const message = await prisma.message.findUnique({ where: { id } , include: { author: { select: { id: true, name: true, email: true } }, replies: true }});
    return message;
}

async function createMessage(channelId, authorId, messageData){
    const newMessage = await prisma.message.create({
        data: {
            ...messageData,
            channelId,
            authorId,
        },
        include: {
            author: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    // Analyze message for decision suggestion (returns metadata, not auto-create)
    const decisionAnalysis = analyzeForDecisionSuggestion(newMessage.content);

    // Return message with decision suggestion metadata
    return {
        ...newMessage,
        decisionSuggestion: decisionAnalysis
    };
}

async function updateMessage(id, updateData){
    const updatedMessage = await prisma.message.update({
        where: { id },
        data: updateData,
    });
    return updatedMessage;
}

async function deleteMessage(id){
    await prisma.message.delete({ where: { id } });
}

module.exports = {
    getMessagesByChannel,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage
};