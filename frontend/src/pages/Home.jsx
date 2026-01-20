import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Plus, 
  Hash,
  ChevronRight,
  Building2,
  Link2,
  LogIn,
  UserPlus,
  Crown,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function Home() {
  const navigate = useNavigate()
  const { currentUser, setCurrentTeam } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [teamPreview, setTeamPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const data = await apiClient.getMyTeams()
      setTeams(data)
    } catch (err) {
      console.error('Failed to load teams:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setCreating(true)
    try {
      const newTeam = await apiClient.createTeam({
        name: newTeamName,
        description: newTeamDescription,
        ownerId: currentUser.id
      })
      setShowCreateModal(false)
      setNewTeamName('')
      setNewTeamDescription('')
      setToast({ message: 'Team created successfully!', type: 'success' })
      
      if (newTeam) {
        setCurrentTeam({
          id: newTeam.id,
          name: newTeam.name,
          role: 'MANAGER'
        })
        setTimeout(() => navigate('/my-channels'), 1000)
      }
      loadTeams()
    } catch (err) {
      console.error('Failed to create team:', err)
      setToast({ message: err.message || 'Failed to create team', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const handlePreviewTeam = async () => {
    if (!joinCode.trim() || joinCode.length < 6) return
    
    setPreviewLoading(true)
    setTeamPreview(null)
    try {
      const preview = await apiClient.previewTeamByCode(joinCode.toUpperCase())
      setTeamPreview(preview)
    } catch (err) {
      setToast({ message: err.message || 'Invalid invite code', type: 'error' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!teamPreview) return

    setJoining(true)
    try {
      await apiClient.joinTeamViaCode(joinCode.toUpperCase())
      setShowJoinModal(false)
      setJoinCode('')
      setTeamPreview(null)
      setToast({ message: 'Join request sent! Waiting for approval from team lead.', type: 'success' })
      loadTeams()
    } catch (err) {
      setToast({ message: err.message || 'Failed to join team', type: 'error' })
    } finally {
      setJoining(false)
    }
  }

  const handleSelectTeam = (team) => {
    setCurrentTeam({
      id: team.id,
      name: team.name,
      role: team.role
    })
    navigate('/my-channels')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500">Loading...</span>
        </div>
      </div>
    )
  }

  // Show welcome screen for users with no teams
  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
        
        <div className="w-full max-w-2xl">
          {/* Welcome Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-2xl mb-6">
              <Building2 size={40} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Welcome to SignalStack, {currentUser?.name?.split(' ')[0]}!
            </h1>
            <p className="text-lg text-slate-600">
              Get started by creating a new team or joining an existing one with an invite code.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button 
              className="group bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg hover:shadow-xl transition-all text-left"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Plus size={28} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Create a Team</h3>
                  <p className="text-sm text-slate-500">Start a new workspace and become the team lead.</p>
                </div>
                <ChevronRight size={20} className="text-indigo-400 mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button 
              className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all text-left"
              onClick={() => setShowJoinModal(true)}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <UserPlus size={28} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Join with Code</h3>
                  <p className="text-sm text-slate-500">Have an invite code? Request access to a team.</p>
                </div>
                <ChevronRight size={20} className="text-slate-400 mt-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-white/60 backdrop-blur rounded-xl p-6 border border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-3">How invite codes work</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Link2 size={16} className="text-indigo-500" />
                Each team has a unique invite code (like Google Meet)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <LogIn size={16} className="text-indigo-500" />
                Enter the code or use a direct URL to request to join
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Users size={16} className="text-indigo-500" />
                Team leads review and approve your request
              </li>
            </ul>
          </div>
        </div>

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Create a New Team</h2>
              <p className="text-sm text-slate-500 mb-6">You'll be the team lead with full access to manage members and view analytics.</p>
              <form onSubmit={handleCreateTeam}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Engineering Team"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="What is this team about?"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={creating || !newTeamName.trim()}
                  >
                    {creating ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Team Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowJoinModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Join a Team</h2>
              <p className="text-sm text-slate-500 mb-6">Enter the invite code shared by your team lead.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Invite Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase())
                      setTeamPreview(null)
                    }}
                    placeholder="e.g., ABC12XYZ"
                    maxLength={12}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest font-mono"
                  />
                  <button 
                    type="button"
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handlePreviewTeam}
                    disabled={previewLoading || joinCode.length < 6}
                  >
                    {previewLoading ? 'Checking...' : 'Preview'}
                  </button>
                </div>
              </div>

              {teamPreview && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-xl font-bold text-indigo-600">
                      {teamPreview.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{teamPreview.name}</h4>
                      {teamPreview.description && <p className="text-sm text-slate-500 line-clamp-1">{teamPreview.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Users size={14} /> {teamPreview.memberCount} members</span>
                    <span className="flex items-center gap-1"><Hash size={14} /> {teamPreview.channelCount} channels</span>
                  </div>
                  {teamPreview.leads?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">Led by: {teamPreview.leads.map(l => l.name).join(', ')}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setShowJoinModal(false)
                    setJoinCode('')
                    setTeamPreview(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleJoinTeam}
                  disabled={joining || !teamPreview}
                >
                  {joining ? 'Requesting...' : 'Request to Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show team selection for users with 1+ teams
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back, {currentUser?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600">Select a team to continue</p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-3 mb-8">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Team
          </button>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={() => setShowJoinModal(true)}
          >
            <UserPlus size={16} />
            Join with Code
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <button 
              key={team.id} 
              className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg text-left transition-all"
              onClick={() => handleSelectTeam(team)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 truncate">{team.name}</h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    team.role === 'MANAGER' || team.role === 'OWNER' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(team.role === 'MANAGER' || team.role === 'OWNER') && <Crown size={10} />}
                    {team.role === 'MANAGER' || team.role === 'OWNER' ? 'Team Lead' : 'Member'}
                  </span>
                </div>
              </div>
              
              {team.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{team.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {team._count?.members || 0} members
                </span>
                <span className="flex items-center gap-1">
                  <Hash size={12} />
                  {team._count?.channels || 0} channels
                </span>
              </div>
              
              <div className="flex items-center justify-end text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight size={14} className="ml-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create a New Team</h2>
            <p className="text-sm text-slate-500 mb-6">You'll be the team lead with full access to manage members and view analytics.</p>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Engineering Team"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What is this team about?"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={creating || !newTeamName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Join a Team</h2>
            <p className="text-sm text-slate-500 mb-6">Enter the invite code shared by your team lead.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Invite Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setTeamPreview(null)
                  }}
                  placeholder="e.g., ABC12XYZ"
                  maxLength={12}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest font-mono"
                />
                <button 
                  type="button"
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handlePreviewTeam}
                  disabled={previewLoading || joinCode.length < 6}
                >
                  {previewLoading ? 'Checking...' : 'Preview'}
                </button>
              </div>
            </div>

            {teamPreview && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-xl font-bold text-indigo-600">
                    {teamPreview.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{teamPreview.name}</h4>
                    {teamPreview.description && <p className="text-sm text-slate-500 line-clamp-1">{teamPreview.description}</p>}
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Users size={14} /> {teamPreview.memberCount} members</span>
                  <span className="flex items-center gap-1"><Hash size={14} /> {teamPreview.channelCount} channels</span>
                </div>
                {teamPreview.leads?.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">Led by: {teamPreview.leads.map(l => l.name).join(', ')}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                type="button" 
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinCode('')
                  setTeamPreview(null)
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleJoinTeam}
                disabled={joining || !teamPreview}
              >
                {joining ? 'Requesting...' : 'Request to Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
