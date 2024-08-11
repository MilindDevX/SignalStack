const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authMiddleware);

// Get all notifications for the current user
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Mark a specific notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
