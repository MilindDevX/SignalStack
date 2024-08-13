const express = require('express');
const teamRouter = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const {
    getAll,
    getById,
    createTeam,
    addMember,
    getMyTeams,
    requestJoin,
    getJoinRequests,
    getMyJoinRequests,
    handleJoinRequest,
    sendInvitation,
    getMyInvitations,
    getTeamInvites,
    handleInvitation,
    getNonMembers,
    getMembers,
    promoteToAdmin,
    removeMember,
    deleteTeam,
    previewTeamByCode,
    joinViaCode,
    regenerateCode,
    getInviteCode,
} = require('../controllers/teamController');

// All routes require authentication
teamRouter.use(authMiddleware);

// Basic team routes
teamRouter.get('/', getAll);
teamRouter.get('/my-teams', getMyTeams);
teamRouter.get('/:id', getById);
teamRouter.post('/', createTeam);
teamRouter.post('/:id/members', addMember);

// Team members management
teamRouter.get('/:teamId/members', getMembers);
teamRouter.patch('/:teamId/members/:memberId/promote', promoteToAdmin);
teamRouter.delete('/:teamId/members/:memberId', removeMember);

// Team deletion (soft delete)
teamRouter.post('/:teamId/delete', deleteTeam);

// Invite code routes
teamRouter.get('/join/:code/preview', previewTeamByCode);
teamRouter.post('/join/:code', joinViaCode);
teamRouter.get('/:teamId/invite-code', getInviteCode);
teamRouter.post('/:teamId/regenerate-code', regenerateCode);

// Join requests
teamRouter.get('/requests/my', getMyJoinRequests);
teamRouter.post('/:teamId/request-join', requestJoin);
teamRouter.get('/:teamId/join-requests', getJoinRequests);
teamRouter.patch('/join-requests/:requestId', handleJoinRequest);

// Invitations
teamRouter.get('/invitations/my', getMyInvitations);
teamRouter.post('/:teamId/invite', sendInvitation);
teamRouter.get('/:teamId/invitations', getTeamInvites);
teamRouter.patch('/invitations/:invitationId', handleInvitation);

// Get non-members for invitation
teamRouter.get('/:teamId/non-members', getNonMembers);

module.exports = teamRouter;