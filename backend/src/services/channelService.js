const prisma = require('../config/db');

async function getChannelsByTeam(teamId){
    const channels = await prisma.channel.findMany({ 
        where: { teamId, isArchived: false },
        include: {_count: { select: { messages: true } } },
        orderBy: { createdAt: 'asc' }
    });
    return channels;
}

async function getChannelById(channelId){
    const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: {_count: { select: { messages: true } } } });
    return channel;
}

async function createChannel(teamId, channelData){
    const newChannel = await prisma.channel.create({
        data: {
            ...channelData,
            teamId,
        },
    });
    return newChannel;
}

async function getChannelMessages(channelId, limit = 50, offset = 0){
    const messages = await prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
            author: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    return messages;
}

module.exports = {
    getChannelsByTeam,
    getChannelById,
    createChannel,
    getChannelMessages,
};