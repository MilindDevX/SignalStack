const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getAll, getById, getByTeam } = require('../controllers/userController');

// All routes require authentication
router.use(authMiddleware);

// Get all users (general)
router.get('/', getAll);

// Get single user by ID
router.get('/:id', getById);

// Get all users in a specific team
router.get('/team/:teamId', getByTeam);

module.exports = router;
