const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NOTIFICATION_TYPES = {
  INVITE_RECEIVED: 'INVITE_RECEIVED',
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  PROMOTED_TO_ADMIN: 'PROMOTED_TO_ADMIN',
};

const createNotification = async ({ userId, type, title, message, data = null }) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
    },
  });
  return notification;
};

const getUserNotifications = async (userId, { limit = 20, unreadOnly = false } = {}) => {
  const where = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return notifications;
};

const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
  return count;
};

const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
  return notification;
};

const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

const deleteNotification = async (notificationId, userId) => {
  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
};

// Helper functions for creating specific notification types
const notifyInviteReceived = async (userId, teamName, inviterId, inviterName, teamId) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.INVITE_RECEIVED,
    title: 'Team Invitation',
    message: `${inviterName} invited you to join ${teamName}`,
    data: { teamId, inviterId },
  });
};

const notifyRequestApproved = async (userId, teamName, teamId) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.REQUEST_APPROVED,
    title: 'Request Approved',
    message: `Your request to join ${teamName} has been approved`,
    data: { teamId },
  });
};

const notifyRequestRejected = async (userId, teamName, teamId) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.REQUEST_REJECTED,
    title: 'Request Declined',
    message: `Your request to join ${teamName} has been declined`,
    data: { teamId },
  });
};

const notifyPromotedToAdmin = async (userId, teamName, teamId) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.PROMOTED_TO_ADMIN,
    title: 'Promoted to Admin',
    message: `You have been promoted to admin in ${teamName}`,
    data: { teamId },
  });
};

const notifyMemberJoined = async (adminUserId, memberName, teamName, teamId) => {
  return createNotification({
    userId: adminUserId,
    type: 'MEMBER_JOINED',
    title: 'New Team Member',
    message: `${memberName} has joined ${teamName}`,
    data: { teamId },
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyInviteReceived,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyPromotedToAdmin,
  notifyMemberJoined,
};
