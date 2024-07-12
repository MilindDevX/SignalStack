const {
    getAllTeams,
    getTeamById,
    createTeam: createTeamService,
    addMemberToTeam,
    getUserTeams,
    createJoinRequest,
    getTeamJoinRequests,
    getUserJoinRequests,
    respondToJoinRequest,
    createInvitation,
    getUserInvitations,
    getTeamInvitations,
    respondToInvitation,
    getNonTeamMembers,
    getTeamMembers,
    promoteMember,
    removeMember: removeMemberService,
    deleteTeam: deleteTeamService,
    getTeamByInviteCode,
    joinTeamViaCode,
    regenerateInviteCode,
    getTeamInviteCode,
} = require("../services/teamService");

const { asyncHandler } = require("../middlewares/errorHandler");

const getAll = asyncHandler(async (req, res) => {
    const teams = await getAllTeams();
    res.status(200).json({ success: true, data: teams });
});

const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const team = await getTeamById(id);
    res.status(200).json({ success: true, data: team });
});

const createTeam = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user.id;
    const newTeam = await createTeamService({ name, description, ownerId });
    res.status(201).json({ success: true, data: newTeam });
});

const addMember = asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;
    const { userId, role } = req.body;
    const member = await addMemberToTeam(teamId, userId, role);
    res.status(201).json({ success: true, data: member });
});

const getMyTeams = asyncHandler(async (req, res) => {
    const teams = await getUserTeams(req.user.id);
    res.status(200).json({ success: true, data: teams });
});

// Join Requests
const requestJoin = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { message } = req.body;
    const request = await createJoinRequest(req.user.id, teamId, message);
    res.status(201).json({ success: true, data: request });
});

const getJoinRequests = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const requests = await getTeamJoinRequests(teamId);
    res.status(200).json({ success: true, data: requests });
});

const getMyJoinRequests = asyncHandler(async (req, res) => {
    const requests = await getUserJoinRequests(req.user.id);
    res.status(200).json({ success: true, data: requests });
});

const handleJoinRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body; // APPROVED or REJECTED
    const result = await respondToJoinRequest(requestId, status, req.user.id);
    res.status(200).json({ success: true, data: result });
});

// Invitations
const sendInvitation = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { inviteeId, message } = req.body;
    const invitation = await createInvitation(req.user.id, inviteeId, teamId, message);
    res.status(201).json({ success: true, data: invitation });
});

const getMyInvitations = asyncHandler(async (req, res) => {
    const invitations = await getUserInvitations(req.user.id);
    res.status(200).json({ success: true, data: invitations });
});

const getTeamInvites = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const invitations = await getTeamInvitations(teamId);
    res.status(200).json({ success: true, data: invitations });
});

const handleInvitation = asyncHandler(async (req, res) => {
    const { invitationId } = req.params;
    const { status } = req.body; // ACCEPTED or REJECTED
    const result = await respondToInvitation(invitationId, status, req.user.id);
    res.status(200).json({ success: true, data: result });
});

const getNonMembers = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const users = await getNonTeamMembers(teamId);
    res.status(200).json({ success: true, data: users });
});

const getMembers = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const members = await getTeamMembers(teamId);
    res.status(200).json({ success: true, data: members });
});

const promoteToAdmin = asyncHandler(async (req, res) => {
    const { teamId, memberId } = req.params;
    const result = await promoteMember(teamId, memberId, req.user.id);
    res.status(200).json({ success: true, data: result });
});

const removeMember = asyncHandler(async (req, res) => {
    const { teamId, memberId } = req.params;
    const result = await removeMemberService(teamId, memberId, req.user.id);
    res.status(200).json({ success: true, data: result });
});

const deleteTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { confirmationText } = req.body;
    const result = await deleteTeamService(teamId, req.user.id, confirmationText);
    res.status(200).json({ success: true, data: result });
});

// Invite Code handlers
const previewTeamByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const team = await getTeamByInviteCode(code);
    // Return limited info for preview
    res.status(200).json({ 
        success: true, 
        data: {
            id: team.id,
            name: team.name,
            description: team.description,
            memberCount: team._count?.members || 0,
            channelCount: team._count?.channels || 0,
            leads: team.members.map(m => ({ name: m.user.name })),
        }
    });
});

const joinViaCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const result = await joinTeamViaCode(req.user.id, code);
    res.status(201).json({ success: true, data: result });
});

const regenerateCode = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const result = await regenerateInviteCode(teamId, req.user.id);
    res.status(200).json({ success: true, data: result });
});

const getInviteCode = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const result = await getTeamInviteCode(teamId, req.user.id);
    res.status(200).json({ success: true, data: result });
});

module.exports = {
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
};