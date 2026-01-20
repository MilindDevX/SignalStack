const prisma = require("../config/db");
const { ApiError } = require("../middlewares/errorHandler");
const notificationService = require("./notificationService");

async function getAllTeams() {
  const teams = await prisma.team.findMany({
    where: { isDeleted: false },
    include: {
      _count: {
        select: { members: true, channels: true },
      },
      members: {
        where: { role: { in: ['OWNER', 'MANAGER'] } },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        take: 1,
      },
    },
  });
  return teams;
}

async function getTeamById(id) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        where: { isActive: true },
      },
      channels: { where: { isArchived: false } },
    },
  });

  if (!team) {
    throw new ApiError("Team not found", 404);
  }
  
  // Check if team is deleted
  if (team.isDeleted) {
    throw new ApiError("This team has been deleted", 404);
  }
  
  return team;
}

async function createTeam(data) {
  const { name, description, ownerId } = data;

  if (!name || !ownerId) {
    throw new ApiError("Name and ownerId are required", 400);
  }

  // Create team with owner and default general channel
  const team = await prisma.team.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId: ownerId,
          role: "MANAGER",
        },
      },
      channels: {
        create: {
          name: "general",
          description: "General discussion channel",
          type: "PUBLIC",
        },
      },
    },
    include: { 
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      channels: true,
    },
  });

  return team;
}

async function addMemberToTeam(teamId, userId, role = "MEMBER") {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new ApiError("Team not found", 404);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (existingMember) {
    throw new ApiError("User is already a member of this team", 400);
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role,
    },
    include: { user: true },
  });

  return member;
}

// Get teams the user is a member of
async function getUserTeams(userId) {
  const memberships = await prisma.teamMember.findMany({
    where: { 
      userId, 
      isActive: true,
      team: { isDeleted: false }
    },
    include: {
      team: {
        include: {
          channels: { where: { isArchived: false } },
          _count: { select: { members: true, channels: true } },
        },
      },
    },
  });
  return memberships.map(m => ({ ...m.team, role: m.role }));
}

// ============================================================================
// JOIN REQUESTS
// ============================================================================

async function createJoinRequest(userId, teamId, message) {
  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (existingMember) {
    throw new ApiError("You are already a member of this team", 400);
  }

  // Check for existing pending request
  const existingRequest = await prisma.joinRequest.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      throw new ApiError("You already have a pending request for this team", 400);
    }
    // Update existing request to pending again
    return prisma.joinRequest.update({
      where: { id: existingRequest.id },
      data: { status: 'PENDING', message },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  return prisma.joinRequest.create({
    data: { userId, teamId, message },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

async function getTeamJoinRequests(teamId) {
  return prisma.joinRequest.findMany({
    where: { teamId, status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getUserJoinRequests(userId) {
  return prisma.joinRequest.findMany({
    where: { userId },
    include: {
      team: { select: { id: true, name: true, description: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function respondToJoinRequest(requestId, status, responderId) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { team: { include: { members: true } } },
  });

  if (!request) {
    throw new ApiError("Join request not found", 404);
  }

  // Check if responder is a manager of the team
  const isManager = request.team.members.some(
    m => m.userId === responderId && ['MANAGER', 'OWNER'].includes(m.role)
  );
  if (!isManager) {
    throw new ApiError("Only team managers can respond to join requests", 403);
  }

  const updatedRequest = await prisma.joinRequest.update({
    where: { id: requestId },
    data: { status },
  });

  // If approved, add user to team
  if (status === 'APPROVED') {
    await prisma.teamMember.create({
      data: {
        userId: request.userId,
        teamId: request.teamId,
        role: 'MEMBER',
      },
    });
    // Send notification to the user
    await notificationService.notifyRequestApproved(
      request.userId,
      request.team.name,
      request.teamId
    );
  } else if (status === 'REJECTED') {
    // Send notification to the user
    await notificationService.notifyRequestRejected(
      request.userId,
      request.team.name,
      request.teamId
    );
  }

  return updatedRequest;
}

// ============================================================================
// INVITATIONS
// ============================================================================

async function createInvitation(inviterId, inviteeId, teamId, message) {
  // Check if inviter is a manager
  const inviterMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: inviterId, teamId } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!inviterMember || !['MANAGER', 'OWNER'].includes(inviterMember.role)) {
    throw new ApiError("Only team managers can send invitations", 403);
  }

  // Check if invitee is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: inviteeId, teamId } },
  });
  if (existingMember) {
    throw new ApiError("User is already a member of this team", 400);
  }

  // Get team details for notification
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });

  // Check for existing invitation
  const existingInvitation = await prisma.invitation.findUnique({
    where: { inviteeId_teamId: { inviteeId, teamId } },
  });
  if (existingInvitation) {
    if (existingInvitation.status === 'PENDING') {
      throw new ApiError("User already has a pending invitation", 400);
    }
    // Resend invitation
    const updated = await prisma.invitation.update({
      where: { id: existingInvitation.id },
      data: { status: 'PENDING', message, inviterId },
      include: {
        invitee: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    // Send notification
    await notificationService.notifyInviteReceived(
      inviteeId,
      team.name,
      inviterId,
      inviterMember.user.name,
      teamId
    );
    return updated;
  }

  const invitation = await prisma.invitation.create({
    data: { inviterId, inviteeId, teamId, message },
    include: {
      invitee: { select: { id: true, name: true, email: true } },
      inviter: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  // Send notification to invitee
  await notificationService.notifyInviteReceived(
    inviteeId,
    team.name,
    inviterId,
    inviterMember.user.name,
    teamId
  );

  return invitation;
}

async function getUserInvitations(userId) {
  return prisma.invitation.findMany({
    where: { inviteeId: userId, status: 'PENDING' },
    include: {
      inviter: { select: { id: true, name: true } },
      team: { 
        select: { 
          id: true, 
          name: true, 
          description: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getTeamInvitations(teamId) {
  return prisma.invitation.findMany({
    where: { teamId, status: 'PENDING' },
    include: {
      invitee: { select: { id: true, name: true, email: true } },
      inviter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function respondToInvitation(invitationId, status, userId) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      invitee: { select: { id: true, name: true } },
      team: { 
        select: { id: true, name: true },
      },
    },
  });

  if (!invitation) {
    throw new ApiError("Invitation not found", 404);
  }

  if (invitation.inviteeId !== userId) {
    throw new ApiError("You can only respond to your own invitations", 403);
  }

  const updatedInvitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status },
  });

  // If accepted, add user to team and notify admins
  if (status === 'ACCEPTED') {
    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: invitation.inviteeId,
          teamId: invitation.teamId,
        },
      },
    });

    if (!existingMember) {
      await prisma.teamMember.create({
        data: {
          userId: invitation.inviteeId,
          teamId: invitation.teamId,
          role: 'MEMBER',
        },
      });

      // Notify all team managers that a new member joined
      const teamManagers = await prisma.teamMember.findMany({
        where: { 
          teamId: invitation.teamId, 
          role: { in: ['MANAGER', 'OWNER'] } 
        },
        select: { userId: true },
      });

      for (const manager of teamManagers) {
        await notificationService.notifyMemberJoined(
          manager.userId,
          invitation.invitee.name,
          invitation.team.name,
          invitation.teamId
        );
      }
    }
  }

  return updatedInvitation;
}

// Get all users not in a specific team (for inviting)
async function getNonTeamMembers(teamId) {
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });
  const memberIds = teamMembers.map(m => m.userId);

  return prisma.user.findMany({
    where: { id: { notIn: memberIds } },
    select: { id: true, name: true, email: true },
  });
}

// Get team members (for admin to manage)
async function getTeamMembers(teamId) {
  return prisma.teamMember.findMany({
    where: { teamId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [
      { role: 'asc' }, // MANAGER first
      { joinedAt: 'asc' },
    ],
  });
}

// Promote a member to admin/manager
async function promoteMember(teamId, memberId, promoterId) {
  // Check if promoter is a manager of the team
  const promoterMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: promoterId, teamId } },
  });

  if (!promoterMember || !['MANAGER', 'OWNER'].includes(promoterMember.role)) {
    throw new ApiError("Only team managers can promote members", 403);
  }

  // Find the member to promote
  const memberToPromote = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
  });

  if (!memberToPromote) {
    throw new ApiError("Member not found in this team", 404);
  }

  if (memberToPromote.role === 'MANAGER' || memberToPromote.role === 'OWNER') {
    throw new ApiError("This member is already an admin", 400);
  }

  // Get team name for notification
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  // Promote to MANAGER
  const updatedMember = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: 'MANAGER' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Send notification to the promoted member
  await notificationService.notifyPromotedToAdmin(
    memberToPromote.userId,
    team.name,
    teamId
  );

  return updatedMember;
}

// Remove a member from the team
async function removeMember(teamId, memberId, removerId) {
  // Check if remover is a manager of the team
  const removerMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: removerId, teamId } },
  });

  if (!removerMember || !['MANAGER', 'OWNER'].includes(removerMember.role)) {
    throw new ApiError("Only team managers can remove members", 403);
  }

  // Find the member to remove
  const memberToRemove = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!memberToRemove) {
    throw new ApiError("Member not found in this team", 404);
  }

  // Can't remove yourself
  if (memberToRemove.userId === removerId) {
    throw new ApiError("You cannot remove yourself from the team", 400);
  }

  // Can't remove another manager/owner
  if (['MANAGER', 'OWNER'].includes(memberToRemove.role)) {
    throw new ApiError("Cannot remove another manager from the team", 400);
  }

  // Get team name for notification
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  // Delete the team membership
  await prisma.teamMember.delete({
    where: { id: memberId },
  });

  // Send notification to the removed member
  await notificationService.createNotification({
    userId: memberToRemove.userId,
    type: 'REMOVED_FROM_TEAM',
    title: 'Removed from Team',
    message: `You have been removed from ${team.name}`,
    data: { teamId },
  });

  return { success: true, removedMember: memberToRemove.user };
}

/**
 * Soft delete a team
 * Only MANAGER/OWNER can delete a team
 * Requires explicit confirmation string
 */
async function deleteTeam(teamId, userId, confirmationText) {
  // Get the team first
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  if (!team) {
    throw new ApiError("Team not found", 404);
  }

  if (team.isDeleted) {
    throw new ApiError("Team has already been deleted", 400);
  }

  // Check if user is a manager/owner of the team
  const requesterMember = team.members.find(m => m.userId === userId);
  if (!requesterMember || !['MANAGER', 'OWNER'].includes(requesterMember.role)) {
    throw new ApiError("Only team leads (admins) can delete a team", 403);
  }

  // Require explicit confirmation
  const expectedConfirmation = `DELETE ${team.name}`;
  if (confirmationText !== expectedConfirmation) {
    throw new ApiError(
      `Confirmation required. Please type exactly: "${expectedConfirmation}"`,
      400
    );
  }

  // Check if there are other managers - warn if this is the only lead
  const managers = team.members.filter(m => ['MANAGER', 'OWNER'].includes(m.role));
  if (managers.length === 1 && managers[0].userId === userId) {
    // Proceed anyway, but this is the only lead - all data will become inaccessible
    console.log(`Warning: ${userId} is the only lead deleting team ${teamId}`);
  }

  // Soft delete the team
  const deletedTeam = await prisma.team.update({
    where: { id: teamId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId
    }
  });

  // Notify all team members about the deletion
  const otherMembers = team.members.filter(m => m.userId !== userId);
  for (const member of otherMembers) {
    await notificationService.createNotification({
      userId: member.userId,
      type: 'TEAM_DELETED',
      title: 'Team Deleted',
      message: `The team "${team.name}" has been deleted by an admin. All channels and messages are no longer accessible.`,
      data: { teamId, teamName: team.name }
    });
  }

  return { 
    success: true, 
    message: `Team "${team.name}" has been deleted`,
    membersNotified: otherMembers.length
  };
}

// ============================================================================
// INVITE CODE FUNCTIONS
// ============================================================================

// Generate a short unique invite code (8 characters)
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get team by invite code
async function getTeamByInviteCode(inviteCode) {
  const team = await prisma.team.findFirst({
    where: { 
      inviteCode: inviteCode.toUpperCase(),
      isDeleted: false
    },
    include: {
      _count: { select: { members: true, channels: true } },
      members: {
        where: { role: { in: ['OWNER', 'MANAGER'] } },
        include: { user: { select: { id: true, name: true } } },
        take: 3,
      },
    },
  });

  if (!team) {
    throw new ApiError("Invalid invite code or team not found", 404);
  }

  return team;
}

// Request to join a team via invite code
async function joinTeamViaCode(userId, inviteCode) {
  const team = await getTeamByInviteCode(inviteCode);

  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
  });
  if (existingMember) {
    throw new ApiError("You are already a member of this team", 400);
  }

  // Check for existing pending request
  const existingRequest = await prisma.joinRequest.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
  });
  if (existingRequest && existingRequest.status === 'PENDING') {
    throw new ApiError("You already have a pending request for this team", 400);
  }

  // Create join request
  const request = await prisma.joinRequest.upsert({
    where: { userId_teamId: { userId, teamId: team.id } },
    update: { 
      status: 'PENDING', 
      message: `Joined via invite code: ${inviteCode}`,
      updatedAt: new Date()
    },
    create: { 
      userId, 
      teamId: team.id, 
      message: `Joined via invite code: ${inviteCode}`
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  // Notify team leads
  const leads = await prisma.teamMember.findMany({
    where: { teamId: team.id, role: { in: ['OWNER', 'MANAGER'] } },
    select: { userId: true },
  });

  for (const lead of leads) {
    await notificationService.createNotification({
      userId: lead.userId,
      type: 'JOIN_REQUEST',
      title: 'New Join Request',
      message: `${request.user.name} wants to join ${team.name}`,
      data: { teamId: team.id, requestId: request.id },
    });
  }

  return request;
}

// Regenerate invite code for a team (only leads can do this)
async function regenerateInviteCode(teamId, userId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    throw new ApiError("Team not found", 404);
  }

  // Check if user is a manager
  const isManager = team.members.some(
    m => m.userId === userId && ['MANAGER', 'OWNER'].includes(m.role)
  );
  if (!isManager) {
    throw new ApiError("Only team leads can regenerate invite codes", 403);
  }

  const newCode = generateInviteCode();
  
  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: newCode },
  });

  return { inviteCode: updatedTeam.inviteCode };
}

// Get invite code for a team (only leads can see it)
async function getTeamInviteCode(teamId, userId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    throw new ApiError("Team not found", 404);
  }

  // Check if user is a manager
  const isManager = team.members.some(
    m => m.userId === userId && ['MANAGER', 'OWNER'].includes(m.role)
  );
  if (!isManager) {
    throw new ApiError("Only team leads can view invite codes", 403);
  }

  return { inviteCode: team.inviteCode };
}

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
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
  removeMember,
  deleteTeam,
  getTeamByInviteCode,
  joinTeamViaCode,
  regenerateInviteCode,
  getTeamInviteCode,
};
