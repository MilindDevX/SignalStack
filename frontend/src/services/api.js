const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  getToken() {
    return localStorage.getItem('authToken');
  }

  getHeaders(isJson = true) {
    const headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'API request failed')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================

  async register(email, name, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.data;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.data;
  }

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.data;
  }

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.data;
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async updateProfile(name) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  // ============================================================
  // TEAMS ENDPOINTS
  // ============================================================

  getTeams() {
    return this.request('/teams')
  }

  getTeamById(id) {
    return this.request(`/teams/${id}`)
  }

  getMyTeams() {
    return this.request('/teams/my-teams')
  }

  getTeam(id) {
    return this.request(`/teams/${id}`)
  }

  createTeam(data) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  getTeamMembers(teamId) {
    return this.request(`/teams/${teamId}/members`)
  }

  // Join Requests
  requestJoinTeam(teamId, message = '') {
    return this.request(`/teams/${teamId}/request-join`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  getMyJoinRequests() {
    return this.request('/teams/requests/my')
  }

  getTeamJoinRequests(teamId) {
    return this.request(`/teams/${teamId}/join-requests`)
  }

  respondToJoinRequest(requestId, status) {
    return this.request(`/teams/join-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  // Invitations
  getMyInvitations() {
    return this.request('/teams/invitations/my')
  }

  getTeamInvitations(teamId) {
    return this.request(`/teams/${teamId}/invitations`)
  }

  sendInvitation(teamId, inviteeId, message = '') {
    return this.request(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ inviteeId, message })
    })
  }

  respondToInvitation(invitationId, status) {
    return this.request(`/teams/invitations/${invitationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  getNonTeamMembers(teamId) {
    return this.request(`/teams/${teamId}/non-members`)
  }

  promoteMember(teamId, memberId) {
    return this.request(`/teams/${teamId}/members/${memberId}/promote`, {
      method: 'PATCH'
    })
  }

  removeMember(teamId, memberId) {
    return this.request(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE'
    })
  }

  deleteTeam(teamId, confirmationText) {
    return this.request(`/teams/${teamId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ confirmationText })
    })
  }

  // Invite Code
  previewTeamByCode(code) {
    return this.request(`/teams/join/${code}/preview`)
  }

  joinTeamViaCode(code) {
    return this.request(`/teams/join/${code}`, {
      method: 'POST'
    })
  }

  getTeamInviteCode(teamId) {
    return this.request(`/teams/${teamId}/invite-code`)
  }

  regenerateTeamInviteCode(teamId) {
    return this.request(`/teams/${teamId}/regenerate-code`, {
      method: 'POST'
    })
  }

  // ============================================================
  // CHANNELS ENDPOINTS
  // ============================================================

  getChannelsByTeam(teamId) {
    return this.request(`/channels/team/${teamId}`)
  }

  getChannel(id) {
    return this.request(`/channels/${id}`)
  }

  createChannel(teamId, data) {
    return this.request(`/channels/team/${teamId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  getChannelMessages(channelId, limit = 50, offset = 0) {
    return this.request(`/channels/${channelId}/messages?limit=${limit}&offset=${offset}`)
  }

  // ============================================================
  // MESSAGES ENDPOINTS
  // ============================================================

  getMessagesByChannel(channelId, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/messages/channel/${channelId}?${query}`)
  }

  getMessage(id) {
    return this.request(`/messages/${id}`)
  }

  createMessage(channelId, data) {
    return this.request(`/messages/channel/${channelId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  updateMessage(id, data) {
    return this.request(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  deleteMessage(id) {
    return this.request(`/messages/${id}`, {
      method: 'DELETE'
    })
  }

  // Mark a message as decision (with optional superseding)
  markMessageAsDecision(messageId, supersedesDecisionId = null) {
    return this.request(`/decisions/from-message/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({ supersedesDecisionId })
    })
  }

  // Unmark a message as decision
  unmarkMessageAsDecision(messageId) {
    return this.request(`/decisions/message/${messageId}`, {
      method: 'DELETE'
    })
  }

  // ============================================================
  // DECISIONS ENDPOINTS
  // ============================================================

  // Get decisions by team with optional filters
  getDecisionsByTeam(teamId, options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.includeSuperseded) params.append('includeSuperseded', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/decisions/team/${teamId}${query}`)
  }

  // Get OPEN decisions by team (for superseding selection)
  getOpenDecisionsByTeam(teamId) {
    return this.request(`/decisions/team/${teamId}/open`)
  }

  // Get decisions by channel with optional status filter
  getDecisionsByChannel(channelId, status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/decisions/channel/${channelId}${query}`)
  }

  getDecision(id) {
    return this.request(`/decisions/${id}`)
  }

  // Get decision history chain
  getDecisionHistory(id) {
    return this.request(`/decisions/${id}/history`)
  }

  // Analyze content for decision suggestion
  analyzeDecisionContent(content) {
    return this.request(`/decisions/analyze`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }

  // Create manual decision (with optional superseding)
  createManualDecision(channelId, data) {
    return this.request(`/decisions/channel/${channelId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update decision status with optional closure reason
  updateDecisionStatus(id, status, closureReason = null) {
    return this.request(`/decisions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, closureReason })
    })
  }

  deleteDecision(id) {
    return this.request(`/decisions/${id}`, {
      method: 'DELETE'
    })
  }

  // ============================================================
  // USERS ENDPOINTS
  // ============================================================

  getUsers(teamId) {
    return this.request(`/users?teamId=${teamId}`)
  }

  getUser(id) {
    return this.request(`/users/${id}`)
  }

  getTeamUsers(teamId) {
    return this.request(`/users/team/${teamId}`)
  }

  // ============================================================
  // ANALYTICS ENDPOINTS
  // ============================================================

  getTeamMetrics(teamId) {
    return this.request(`/analytics/team/${teamId}/metrics`)
  }

  getDominantSpeakers(teamId) {
    return this.request(`/analytics/team/${teamId}/speakers`)
  }

  getChannelActivity(channelId) {
    return this.request(`/analytics/channel/${channelId}/activity`)
  }

  getResponseLatency(channelId) {
    return this.request(`/analytics/channel/${channelId}/latency`)
  }

  getTeamDecisions(teamId) {
    return this.request(`/decisions/team/${teamId}`)
  }

  getTeamRecentActivity(teamId, limit = 10) {
    return this.request(`/analytics/team/${teamId}/activity?limit=${limit}`)
  }

  getTeamAnalyticsSummary(teamId) {
    return this.request(`/analytics/team/${teamId}/summary`)
  }

  // ============================================================
  // NOTIFICATIONS ENDPOINTS
  // ============================================================

  getNotifications(limit = 20, unreadOnly = false) {
    return this.request(`/notifications?limit=${limit}&unreadOnly=${unreadOnly}`)
  }

  getUnreadNotificationCount() {
    return this.request('/notifications/unread-count')
  }

  markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  }

  markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT'
    })
  }

  deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    })
  }
}


export const apiClient = new ApiClient()
export default apiClient
