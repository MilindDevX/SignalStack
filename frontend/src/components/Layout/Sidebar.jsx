import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Settings,
  HelpCircle,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  BarChart3,
  Activity,
  Target,
  Check,
  Mail
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../services/api'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isManager, user, currentTeam, setCurrentTeam } = useAuth()
  const [teams, setTeams] = useState([])
  const [channels, setChannels] = useState([])
  const [invitations, setInvitations] = useState([])
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    analytics: true,
    channels: true,
  })

  useEffect(() => {
    fetchTeams()
    fetchInvitations()
  }, [])

  // Refresh teams when dropdown is opened to catch any deleted/left teams
  useEffect(() => {
    if (showTeamSwitcher) {
      fetchTeams()
    }
  }, [showTeamSwitcher])

  useEffect(() => {
    if (currentTeam?.id) {
      fetchChannels(currentTeam.id)
    } else {
      setChannels([])
    }
  }, [currentTeam?.id])

  const fetchTeams = async () => {
    try {
      const data = await apiClient.getMyTeams()
      setTeams(data)

      // Check if currentTeam still exists in the fetched teams
      if (currentTeam?.id) {
        const teamStillExists = data.find(t => t.id === currentTeam.id)
        if (!teamStillExists) {
          // Current team was deleted or user left - switch to first available team
          if (data.length > 0) {
            const firstTeam = data[0]
            setCurrentTeam({
              id: firstTeam.id,
              name: firstTeam.name,
              role: firstTeam.role
            })
          } else {
            setCurrentTeam(null)
          }
        }
      } else if (data.length > 0 && !currentTeam) {
        // Auto-select first team if none selected
        const firstTeam = data[0]
        setCurrentTeam({
          id: firstTeam.id,
          name: firstTeam.name,
          role: firstTeam.role
        })
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const data = await apiClient.getMyInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    }
  }

  const fetchChannels = async (teamId) => {
    try {
      const data = await apiClient.getChannelsByTeam(teamId)
      setChannels(data)
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    }
  }

  const handleSelectTeam = (team) => {
    setCurrentTeam({
      id: team.id,
      name: team.name,
      role: team.role
    })
    setShowTeamSwitcher(false)
  }

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      await apiClient.respondToInvitation(invitationId, status)
      fetchTeams()
      fetchInvitations()
    } catch (error) {
      console.error('Failed to respond to invitation:', error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getInitials = (name) => {
    if (!name) return 'T'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      {/* Team Selector Header */}
      <div className="p-3 border-b border-slate-700">
        <div
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
            {currentTeam ? getInitials(currentTeam.name) : 'SS'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold truncate">{currentTeam?.name || 'Select Team'}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {currentTeam?.role === 'MANAGER' || currentTeam?.role === 'OWNER' ? 'Admin' : 'Member'}
            </span>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showTeamSwitcher ? 'rotate-180' : ''}`} />
        </div>

        {/* Team Switcher Dropdown */}
        {showTeamSwitcher && (
          <div className="absolute left-3 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Teams</div>
            {teams.map(team => (
              <div
                key={team.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-700 transition-colors ${currentTeam?.id === team.id ? 'bg-slate-700' : ''}`}
                onClick={() => handleSelectTeam(team)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold">
                  {getInitials(team.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{team.name}</span>
                  <span className="text-xs text-slate-400">{team._count?.members || 0} members</span>
                </div>
                {currentTeam?.id === team.id && <Check size={16} className="text-indigo-400" />}
              </div>
            ))}

            {invitations.length > 0 && (
              <>
                <div className="border-t border-slate-700 my-1" />
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} /> Invitations ({invitations.length})
                </div>
                {invitations.slice(0, 3).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-700">
                    <span className="text-sm truncate">{inv.team?.name}</span>
                    <button
                      className="p-1 bg-indigo-600 rounded hover:bg-indigo-700"
                      onClick={(e) => { e.stopPropagation(); handleRespondToInvitation(inv.id, 'ACCEPTED') }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}

            <div className="border-t border-slate-700 my-1" />
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:bg-slate-700 transition-colors"
              onClick={() => { setShowTeamSwitcher(false); navigate('/teams') }}
            >
              <Plus size={16} /> Create or Join Team
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Teams Link - Primary navigation */}
        <div className="mb-4">
          <NavLink
            to="/teams"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={18} />
            <span>Teams</span>
          </NavLink>
        </div>

        {/* Analytics Section - Manager Only */}
        {isManager && (
          <div className="mb-4">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300"
              onClick={() => toggleSection('analytics')}
            >
              {expandedSections.analytics ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Analytics</span>
            </button>
            {expandedSections.analytics && (
              <div className="mt-1 space-y-1">
                <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/team-analytics" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Users size={18} />
                  <span>Team Insights</span>
                </NavLink>
                <NavLink to="/channels" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <BarChart3 size={18} />
                  <span>Channel Stats</span>
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Activity size={18} />
                  <span>User Activity</span>
                </NavLink>
                <NavLink to="/decisions" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Target size={18} />
                  <span>Decisions</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Channels Section */}
        <div className="mb-4">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300"
            onClick={() => toggleSection('channels')}
          >
            {expandedSections.channels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="flex-1 text-left">Channels</span>
          </button>
          {expandedSections.channels && (
            <div className="mt-1 space-y-1">
              {channels.length > 0 ? (
                channels.slice(0, 8).map(channel => (
                  <NavLink
                    key={channel.id}
                    to={`/my-channels/${channel.id}`}
                    className={({ isActive }) => `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    <Hash size={16} className="text-slate-500" />
                    <span className="truncate">{channel.name}</span>
                  </NavLink>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-slate-500">No channels yet</p>
              )}
              {channels.length > 8 && (
                <NavLink to="/my-channels" className="flex items-center px-3 py-1.5 text-sm text-indigo-400 hover:text-indigo-300">
                  <span>+ {channels.length - 8} more channels</span>
                </NavLink>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <NavLink to="/help" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <HelpCircle size={18} />
          <span>Help</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
