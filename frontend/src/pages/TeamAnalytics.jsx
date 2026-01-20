import { useState, useEffect } from 'react'
import { Users, MessageSquare, TrendingUp, BarChart3, ChevronDown, Settings, Link, Copy, RefreshCw, Clock, AlertTriangle, Trash2, Crown, Shield, UserMinus, X, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function TeamAnalytics() {
  const { currentTeam, currentUser } = useAuth()
  const [period, setPeriod] = useState('7d')
  const [teamMetrics, setTeamMetrics] = useState([])
  const [dominantSpeakers, setDominantSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')

  // Team management state
  const [teamMembers, setTeamMembers] = useState([])
  const [inviteCode, setInviteCode] = useState(null)
  const [joinRequests, setJoinRequests] = useState([])
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [toast, setToast] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [nonMembers, setNonMembers] = useState([])
  const [selectedInvitee, setSelectedInvitee] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  const periodOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ]

  const isAdmin = userRole === 'MANAGER' || userRole === 'OWNER'

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        if (currentTeam?.id) {
          setLoading(true)

          // Load basic analytics
          const [metrics, speakers] = await Promise.all([
            apiClient.getTeamMetrics(currentTeam.id),
            apiClient.getDominantSpeakers(currentTeam.id)
          ])
          setTeamMetrics(metrics)
          setDominantSpeakers(speakers)

          // Get current user's role in this team
          const myTeams = await apiClient.getMyTeams()
          const thisTeam = myTeams.find(t => t.id === currentTeam.id)
          if (thisTeam) {
            setUserRole(thisTeam.role)

            // Load admin-only data if user is admin
            if (thisTeam.role === 'MANAGER' || thisTeam.role === 'OWNER') {
              const [members, requests, codeRes] = await Promise.all([
                apiClient.getTeamMembers(currentTeam.id),
                apiClient.getTeamJoinRequests(currentTeam.id).catch(() => []),
                apiClient.getTeamInviteCode(currentTeam.id).catch(() => ({ inviteCode: null }))
              ])
              setTeamMembers(members)
              setJoinRequests(requests)
              setInviteCode(codeRes.inviteCode)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load team analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [currentTeam?.id])

  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure? The old invite code will no longer work.')) return

    setRegeneratingCode(true)
    try {
      const response = await apiClient.regenerateTeamInviteCode(currentTeam.id)
      setInviteCode(response.inviteCode)
      setToast({ type: 'success', message: 'Invite code regenerated!' })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to regenerate code' })
    } finally {
      setRegeneratingCode(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setToast({ type: 'success', message: `${label} copied!` })
  }

  const handleRespondToJoinRequest = async (requestId, status) => {
    try {
      await apiClient.respondToJoinRequest(requestId, status)
      setToast({ type: 'success', message: status === 'APPROVED' ? 'Member added!' : 'Request rejected' })
      setJoinRequests(prev => prev.filter(r => r.id !== requestId))
      if (status === 'APPROVED') {
        const members = await apiClient.getTeamMembers(currentTeam.id)
        setTeamMembers(members)
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to respond' })
    }
  }

  const handlePromoteMember = async (memberId) => {
    try {
      await apiClient.promoteMember(currentTeam.id, memberId)
      setToast({ type: 'success', message: 'Member promoted to Admin!' })
      const members = await apiClient.getTeamMembers(currentTeam.id)
      setTeamMembers(members)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to promote member' })
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await apiClient.removeMember(currentTeam.id, memberId)
      setToast({ type: 'success', message: 'Member removed' })
      const members = await apiClient.getTeamMembers(currentTeam.id)
      setTeamMembers(members)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to remove member' })
    }
  }

  const loadNonMembers = async () => {
    try {
      const users = await apiClient.getNonTeamMembers(currentTeam.id)
      setNonMembers(users)
    } catch (err) {
      console.error('Failed to load non-members:', err)
    }
  }

  const handleSendInvitation = async (e) => {
    e.preventDefault()
    if (!selectedInvitee) return

    try {
      await apiClient.sendInvitation(currentTeam.id, selectedInvitee, inviteMessage)
      setToast({ type: 'success', message: 'Invitation sent!' })
      setSelectedInvitee('')
      setInviteMessage('')
      setShowInviteModal(false)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send invitation' })
    }
  }

  const handleDeleteTeam = async () => {
    const expectedText = `DELETE ${currentTeam.name}`
    if (deleteConfirmText !== expectedText) {
      setToast({ type: 'error', message: `Please type exactly: "${expectedText}"` })
      return
    }

    setDeleting(true)
    try {
      await apiClient.deleteTeam(currentTeam.id, deleteConfirmText)
      setToast({ type: 'success', message: `Team "${currentTeam.name}" deleted` })
      setShowDeleteModal(false)
      setDeleteConfirmText('')
      // Redirect to teams page
      window.location.href = '/teams'
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete team' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate team metrics
  const totalMessages = teamMetrics.reduce((sum, u) => sum + u.messageCount, 0)
  const avgMessages = teamMetrics.length > 0 ? Math.round(totalMessages / teamMetrics.length) : 0
  const activeContributors = teamMetrics.filter(u => u.messageCount > 0).length

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{currentTeam?.name || 'Your Team'}</h1>
              {isAdmin && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <Crown size={12} /> Admin
                </span>
              )}
            </div>
            <p className="text-indigo-100 mt-1">
              {activeTab === 'analytics'
                ? 'Analyze team collaboration patterns, participation balance, and communication health'
                : 'Manage team settings, members, and access controls'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'analytics' && (
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                >
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs for Admin */}
        {isAdmin && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Settings size={16} className="inline mr-2" />
              Team Settings
            </button>
          </div>
        )}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Team Size */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">Team Size</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{teamMetrics.length}</div>
              <p className="text-sm text-slate-500 mt-1">Active members</p>
            </div>

            {/* Total Messages */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-500">Total Messages</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalMessages.toLocaleString()}</div>
              <p className="text-sm text-green-600 mt-1">Team activity</p>
            </div>

            {/* Avg Messages/User */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">Avg Messages/User</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{avgMessages}</div>
              <p className="text-sm text-slate-500 mt-1">Per member</p>
            </div>

            {/* Top Contributor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-500">Top Contributor</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 truncate">
                {dominantSpeakers[0]?.name || 'N/A'}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {dominantSpeakers[0]?.messageCount || 0} messages
              </p>
            </div>
          </div>

          {/* Participation Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">Participation Analysis</h2>
            </div>
            <p className="text-slate-500 mb-6">
              Compare individual contributions across the team. High variance may indicate
              communication imbalance or different roles.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Participation Chart */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-slate-700 mb-4">Messages by User</h3>
                {teamMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {teamMetrics.slice(0, 8).map((user, idx) => {
                      const maxMessages = Math.max(...teamMetrics.map(u => u.messageCount))
                      const percentage = maxMessages > 0 ? (user.messageCount / maxMessages) * 100 : 0
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-slate-600 truncate">{user.name}</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 w-12 text-right">
                            {user.messageCount}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">No participation data</p>
                )}
              </div>

              {/* Stats Cards */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-medium text-slate-900 mb-2">Team Members</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-indigo-600">{teamMetrics.length}</span>
                    <span className="text-slate-500">total members</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Active team members contributing to channels.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-medium text-slate-900 mb-2">Active Contributors</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600">{activeContributors}</span>
                    <span className="text-slate-500">users with messages</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Members who have sent at least one message.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-medium text-slate-900 mb-2">Top Contributors</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-600">{dominantSpeakers.length}</span>
                    <span className="text-slate-500">most active users</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Users with the highest message count in the team.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Rankings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Team Rankings</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Name</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Messages</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {dominantSpeakers.length > 0 ? (
                    dominantSpeakers.map((user, idx) => {
                      const percentage = totalMessages > 0
                        ? ((user.messageCount / totalMessages) * 100).toFixed(1)
                        : 0
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                              idx === 0 ? 'bg-amber-100 text-amber-700' :
                              idx === 1 ? 'bg-slate-200 text-slate-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-slate-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            {user.messageCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-600 w-12">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        No ranking data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Team Settings Tab - Admin Only */}
      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          {/* Invite Code Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Link className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Invite Code</h3>
                  <p className="text-sm text-slate-500">Share this code or link to let people join your team</p>
                </div>
              </div>
            </div>

            {inviteCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-mono text-lg font-semibold text-slate-900 tracking-wider">{inviteCode}</span>
                  </div>
                  <button
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    onClick={() => copyToClipboard(inviteCode, 'Invite code')}
                  >
                    <Copy size={20} className="text-indigo-600" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-sm text-slate-500 break-all">{window.location.origin}/join/{inviteCode}</span>
                  </div>
                  <button
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    onClick={() => copyToClipboard(`${window.location.origin}/join/${inviteCode}`, 'Invite link')}
                  >
                    <Copy size={20} className="text-indigo-600" />
                  </button>
                </div>
                <button
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors mt-2"
                  onClick={handleRegenerateCode}
                  disabled={regeneratingCode}
                >
                  <RefreshCw size={16} className={regeneratingCode ? 'animate-spin' : ''} />
                  {regeneratingCode ? 'Regenerating...' : 'Generate New Code'}
                </button>
              </div>
            ) : (
              <p className="text-red-500 text-sm">Failed to load invite code</p>
            )}
          </div>

          {/* Pending Join Requests */}
          {joinRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Pending Join Requests</h3>
                  <p className="text-sm text-slate-500">{joinRequests.length} people waiting to join</p>
                </div>
              </div>

              <div className="space-y-3">
                {joinRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                        {req.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 block">{req.user?.name}</span>
                        <span className="text-sm text-slate-500">{req.user?.email}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                        onClick={() => handleRespondToJoinRequest(req.id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors font-medium"
                        onClick={() => handleRespondToJoinRequest(req.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Management */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Team Members</h3>
                  <p className="text-sm text-slate-500">Manage your team members and their roles</p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                onClick={() => { loadNonMembers(); setShowInviteModal(true) }}
              >
                <UserPlus size={16} />
                Invite Member
              </button>
            </div>

            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="font-medium text-slate-800 block">{member.user?.name}</span>
                      <span className="text-sm text-slate-500">{member.user?.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(member.role === 'MANAGER' || member.role === 'OWNER') ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
                        <Crown size={12} /> Admin
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          onClick={() => handlePromoteMember(member.id)}
                          title="Promote to Admin"
                        >
                          <Shield size={16} />
                        </button>
                        {member.userId !== currentUser?.id && (
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Remove Member"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-700">Danger Zone</h3>
                <p className="text-sm text-red-600">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">Delete this team</h4>
              <p className="text-sm text-red-600 mb-4">
                Once you delete a team, there is no going back. All channels, messages, and member data will be permanently removed.
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} /> Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-6 border-b border-red-200 bg-red-50 rounded-t-2xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-700">Delete Team</h3>
                <p className="text-sm text-red-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700">
                You are about to delete <strong className="text-red-600">{currentTeam?.name}</strong>.
                All channels, messages, and member data will be permanently removed.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type <strong className="text-red-600">DELETE {currentTeam?.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`DELETE ${currentTeam?.name}`}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                className="flex-1 px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                onClick={handleDeleteTeam}
                disabled={deleteConfirmText !== `DELETE ${currentTeam?.name}` || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Invite Member</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setShowInviteModal(false)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select User</label>
                <select
                  value={selectedInvitee}
                  onChange={(e) => setSelectedInvitee(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose a user...</option>
                  {nonMembers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
                  disabled={!selectedInvitee}
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamAnalytics
