const { asyncHandler } = require('../middlewares/errorHandler');
const { getAllUsers, getUserById, getUsersByTeam } = require('../services/userService');

/**
 * Get all users in a team
 */
const getAll = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const users = await getAllUsers(teamId);
    res.json({ success: true, data: users });
});

/**
 * Get single user by ID
 */
const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await getUserById(id);
    res.json({ success: true, data: user });
});

/**
 * Get all team members with roles
 */
const getByTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const users = await getUsersByTeam(teamId);
    res.json({ success: true, data: users });
});

module.exports = {
    getAll,
    getById,
    getByTeam
};
