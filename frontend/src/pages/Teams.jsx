import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Check,
  X,
  Hash,
  ChevronDown,
  ChevronRight,
  Clock,
  Building2,
  Shield,
  Crown,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Copy,
  RefreshCw,
  Link,
  LogIn,
  UserMinus,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function Teams() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Core state
  const [myTeams, setMyTeams] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)

  // Per-team expanded state
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [activeTab, setActiveTab] = useState({}) // teamId -> 'channels' | 'members'
  const [teamData, setTeamData] = useState({}) // teamId -> { channels, members }
  const [loadingTeam, setLoadingTeam] = useState(null)

  // Modal state
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(null) // teamId
  const [showInviteModal, setShowInviteModal] = useState(null) // teamId
  const [showJoinModal, setShowJoinModal] = useState(false)

  // Form state
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [nonMembers, setNonMembers] = useState([])
  const [selectedInvitee, setSelectedInvitee] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  // Join by code state
  const [joinCode, setJoinCode] = useState('')
  const [teamPreview, setTeamPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [joining, setJoining] = useState(false)

  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadData()
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userTeams, userInvitations] = await Promise.all([
        apiClient.getMyTeams(),
        apiClient.getMyInvitations()
      ])
      setMyTeams(userTeams)
      setInvitations(userInvitations)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamDetails = async (team) => {
    if (expandedTeam === team.id) {
      setExpandedTeam(null)
      return
    }

    setExpandedTeam(team.id)
    setLoadingTeam(team.id)

    // Set default tab
    if (!activeTab[team.id]) {
      setActiveTab(prev => ({ ...prev, [team.id]: 'channels' }))
    }

    try {
      const [channels, members] = await Promise.all([
        apiClient.getChannelsByTeam(team.id),
        apiClient.getTeamMembers(team.id)
      ])

      setTeamData(prev => ({
        ...prev,
        [team.id]: { channels, members }
      }))
    } catch (err) {
      console.error('Failed to load team details:', err)
    } finally {
      setLoadingTeam(null)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setToast({ type: 'success', message: `${label} copied!` })
  }

  const loadNonMembers = async (teamId) => {
    try {
      const users = await apiClient.getNonTeamMembers(teamId)
      setNonMembers(users)
    } catch (err) {
      console.error('Failed to load non-members:', err)
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    try {
      const newTeam = await apiClient.createTeam({
        name: newTeamName,
        description: newTeamDesc
      })
      const teamWithRole = { ...newTeam, role: 'MANAGER' }
      setMyTeams([...myTeams, teamWithRole])
      setNewTeamName('')
      setNewTeamDesc('')
      setShowCreateTeam(false)
      setToast({ type: 'success', message: `Team "${newTeam.name}" created!` })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create team' })
    }
  }

  const handleCreateChannel = async (e, teamId) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    try {
      const channel = await apiClient.createChannel(teamId, {
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: newChannelDesc
      })
      setTeamData(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], channels: [...(prev[teamId]?.channels || []), channel] }
      }))
      setNewChannelName('')
      setNewChannelDesc('')
      setShowCreateChannel(null)
      setToast({ type: 'success', message: `Channel #${channel.name} created!` })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create channel' })
    }
  }

  const handleSendInvitation = async (e, teamId) => {
    e.preventDefault()
    if (!selectedInvitee) return

    try {
      await apiClient.sendInvitation(teamId, selectedInvitee, inviteMessage)
      setToast({ type: 'success', message: 'Invitation sent!' })
      setSelectedInvitee('')
      setInviteMessage('')
      setShowInviteModal(null)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send invitation' })
    }
  }

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      await apiClient.respondToInvitation(invitationId, status)
      setToast({ type: 'success', message: status === 'ACCEPTED' ? 'Joined team!' : 'Invitation declined' })
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to respond' })
    }
  }

  const handlePromoteMember = async (teamId, memberId) => {
    try {
      await apiClient.promoteMember(teamId, memberId)
      setToast({ type: 'success', message: 'Member promoted to Admin!' })
      const team = myTeams.find(t => t.id === teamId)
      if (team) {
        setExpandedTeam(null)
        setTimeout(() => loadTeamDetails(team), 100)
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to promote member' })
    }
  }

  const handleRemoveMember = async (teamId, memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await apiClient.removeMember(teamId, memberId)
      setToast({ type: 'success', message: 'Member removed' })
      const team = myTeams.find(t => t.id === teamId)
      if (team) {
        setExpandedTeam(null)
        setTimeout(() => loadTeamDetails(team), 100)
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to remove member' })
    }
  }

  // Join by code handlers
  const handlePreviewTeam = async () => {
    if (!joinCode.trim() || joinCode.length < 6) return

    setPreviewLoading(true)
    setTeamPreview(null)
    try {
      const preview = await apiClient.previewTeamByCode(joinCode.toUpperCase())
      setTeamPreview(preview)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid invite code' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!teamPreview) return

    setJoining(true)
    try {
      await apiClient.joinTeamViaCode(joinCode.toUpperCase())
      setToast({ type: 'success', message: `Joined ${teamPreview.name}!` })
      setShowJoinModal(false)
      setJoinCode('')
      setTeamPreview(null)
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to join team' })
    } finally {
      setJoining(false)
    }
  }

  const isTeamAdmin = (team) => team.role === 'MANAGER' || team.role === 'OWNER'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-500 mt-1">Your teams and collaborations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={18} />
            Join Team
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => setShowCreateTeam(true)}
          >
            <Plus size={18} />
            New Team
          </button>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">Pending Invitations ({invitations.length})</h3>
          </div>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                <div>
                  <span className="font-medium text-slate-800">{inv.team?.name}</span>
                  <span className="text-sm text-slate-500 ml-2">invited by {inv.inviter?.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => handleRespondToInvitation(inv.id, 'ACCEPTED')}
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                    onClick={() => handleRespondToInvitation(inv.id, 'REJECTED')}
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams List */}
      {myTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
            <Building2 size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Your First Team</h2>
          <p className="text-slate-500 mb-8 text-center max-w-md">Teams help you organize your work and collaborate with others. Get started by creating or joining a team.</p>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl font-medium"
              onClick={() => setShowCreateTeam(true)}
            >
              <Plus size={20} /> Create Team
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium"
              onClick={() => setShowJoinModal(true)}
            >
              <LogIn size={20} /> Join Team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {myTeams.map(team => {
            const data = teamData[team.id] || {}
            const isAdmin = isTeamAdmin(team)
            const currentTab = activeTab[team.id] || 'channels'
            const isExpanded = expandedTeam === team.id

            return (
              <div key={team.id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-indigo-200 shadow-lg shadow-indigo-500/5' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                {/* Team Header */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => loadTeamDetails(team)}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{team.name}</h3>
                      {isAdmin && (
                        <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                          <Crown size={12} /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{team.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Users size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{team._count?.members || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Hash size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{team._count?.channels || 0}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {loadingTeam === team.id ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Tabs */}
                        <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100">
                          <button
                            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              currentTab === 'channels'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab(prev => ({ ...prev, [team.id]: 'channels' })) }}
                          >
                            <Hash size={14} className="inline mr-1.5" />
                            Channels
                          </button>
                          <button
                            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              currentTab === 'members'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab(prev => ({ ...prev, [team.id]: 'members' })) }}
                          >
                            <Users size={14} className="inline mr-1.5" />
                            Members
                          </button>
                          {isAdmin && (
                            <button
                              className="px-6 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-colors"
                              onClick={(e) => { e.stopPropagation(); navigate('/team-analytics') }}
                            >
                              <BarChart3 size={14} className="inline mr-1.5" />
                              Analytics & Settings
                            </button>
                          )}
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                          {/* Channels Tab */}
                          {currentTab === 'channels' && (
                            <div>
                              {isAdmin && (
                                <div className="flex justify-end mb-3">
                                  <button
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    onClick={(e) => { e.stopPropagation(); setShowCreateChannel(team.id) }}
                                  >
                                    + Add Channel
                                  </button>
                                </div>
                              )}
                              {(data.channels?.length || 0) === 0 ? (
                                <p className="text-sm text-slate-400 py-4 text-center">No channels yet</p>
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {data.channels?.map(channel => (
                                    <div
                                      key={channel.id}
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/my-channels/${channel.id}`) }}
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Hash size={16} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-medium text-slate-800 block truncate">{channel.name}</span>
                                        <span className="text-xs text-slate-400">{channel._count?.messages || 0} messages</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Members Tab */}
                          {currentTab === 'members' && (
                            <div>
                              {isAdmin && (
                                <div className="flex justify-end mb-3">
                                  <button
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    onClick={(e) => { e.stopPropagation(); loadNonMembers(team.id); setShowInviteModal(team.id) }}
                                  >
                                    + Invite Member
                                  </button>
                                </div>
                              )}
                              <div className="space-y-2">
                                {data.members?.map(member => (
                                  <div key={member.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                        {member.user?.name?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                      <div>
                                        <span className="font-medium text-slate-800">{member.user?.name}</span>
                                        <span className="text-xs text-slate-500 block">{member.user?.email}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(member.role === 'MANAGER' || member.role === 'OWNER') ? (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                                          <Crown size={10} /> Admin
                                        </span>
                                      ) : isAdmin && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handlePromoteMember(team.id, member.id) }}
                                            title="Promote to Admin"
                                          >
                                            <Shield size={14} />
                                          </button>
                                          {member.userId !== currentUser?.id && (
                                            <button
                                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                              onClick={(e) => { e.stopPropagation(); handleRemoveMember(team.id, member.id) }}
                                              title="Remove Member"
                                            >
                                              <UserMinus size={14} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateTeam(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Create New Team</h3>
              <button className="p-1 hover:bg-slate-100 rounded-lg" onClick={() => setShowCreateTeam(false)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Marketing Team"
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="What's this team about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setShowCreateTeam(false)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={!newTeamName.trim()}>
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateChannel(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Create Channel</h3>
              <button className="p-1 hover:bg-slate-100 rounded-lg" onClick={() => setShowCreateChannel(null)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={(e) => handleCreateChannel(e, showCreateChannel)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Channel Name *</label>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500">
                  <Hash size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g., announcements"
                    autoFocus
                    required
                    className="flex-1 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel for?"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setShowCreateChannel(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={!newChannelName.trim()}>
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Invite Member</h3>
              <button className="p-1 hover:bg-slate-100 rounded-lg" onClick={() => setShowInviteModal(null)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={(e) => handleSendInvitation(e, showInviteModal)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select User *</label>
                <select
                  value={selectedInvitee}
                  onChange={(e) => setSelectedInvitee(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Message (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setShowInviteModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={!selectedInvitee}>
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowJoinModal(false); setTeamPreview(null); setJoinCode('') }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Join a Team</h3>
              <button className="p-1 hover:bg-slate-100 rounded-lg" onClick={() => { setShowJoinModal(false); setTeamPreview(null); setJoinCode('') }}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Invite Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setTeamPreview(null) }}
                    placeholder="Enter invite code"
                    maxLength={8}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-center uppercase tracking-widest"
                  />
                  <button
                    onClick={handlePreviewTeam}
                    disabled={joinCode.length < 6 || previewLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {previewLoading ? '...' : 'Preview'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the invite code shared with you</p>
              </div>

              {teamPreview && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {teamPreview.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{teamPreview.name}</h4>
                      <p className="text-sm text-slate-500">{teamPreview.memberCount} members</p>
                    </div>
                  </div>
                  {teamPreview.description && (
                    <p className="text-sm text-slate-600 mb-3">{teamPreview.description}</p>
                  )}
                  <button
                    onClick={handleJoinTeam}
                    disabled={joining}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {joining ? 'Joining...' : 'Join Team'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Teams
