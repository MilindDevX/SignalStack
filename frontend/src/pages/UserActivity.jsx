import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  MessageSquare,
  TrendingUp,
  Activity,
  User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'

function UserActivity() {
  const { userId } = useParams()
  const { currentTeam } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(userId || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (currentTeam?.id) {
          setLoading(true)
          const usersData = await apiClient.getTeamUsers(currentTeam.id)
          setUsers(usersData)
          if (usersData.length > 0 && !selectedUser) {
            setSelectedUser(usersData[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [currentTeam?.id])

  const user = users.find(u => u.id === selectedUser) || users[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500']
  
  const getColorClass = (name) => {
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  return (
    <div className="flex h-full -m-6">
      {/* User Selector Sidebar */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Team Members</h2>
          <span className="text-sm text-slate-500">{users.length} members</span>
        </div>
        <div className="divide-y divide-slate-100">
          {users.length > 0 ? users.map(u => (
            <button
              key={u.id}
              className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${selectedUser === u.id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : 'hover:bg-slate-100'}`}
              onClick={() => setSelectedUser(u.id)}
            >
              <div className={`w-10 h-10 rounded-full ${getColorClass(u.name)} flex items-center justify-center text-white font-medium`}>
                {getInitials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-medium text-slate-800 truncate">{u.name}</span>
                <span className="text-sm text-slate-500">{u.role}</span>
              </div>
            </button>
          )) : (
            <p className="p-8 text-center text-slate-500">No users found</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* User Header */}
        {user && (
          <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white">
            <div className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-indigo-100">{user.email || ''}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{user.role}</span>
                {user._count?.messages > 10 && (
                  <span className="px-3 py-1 bg-green-500/80 rounded-full text-sm">Active Contributor</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageSquare size={20} className="text-indigo-600" />
              </div>
              <span className="text-sm text-slate-500">Messages in Team</span>
            </div>
            <span className="text-3xl font-bold text-slate-800">{user?._count?.messages || 0}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity size={20} className="text-green-600" />
              </div>
              <span className="text-sm text-slate-500">Decisions Made</span>
            </div>
            <span className="text-3xl font-bold text-slate-800">{user?._count?.decisions || 0}</span>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <TrendingUp size={18} className="text-indigo-500" />
            Activity Summary
          </h3>
          <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-600">
            {user?._count?.messages > 0 
              ? `${user?.name} has contributed ${user._count.messages} messages to this team.`
              : 'No activity data available for this user in this team yet.'}
          </div>
        </div>

        {/* Other Team Members */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <User size={18} className="text-indigo-500" />
            Other Team Members
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {users.filter(u => u.id !== selectedUser).slice(0, 6).map((collaborator) => (
              <div 
                key={collaborator.id} 
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setSelectedUser(collaborator.id)}
              >
                <div className={`w-10 h-10 rounded-full ${getColorClass(collaborator.name)} flex items-center justify-center text-white font-medium text-sm`}>
                  {getInitials(collaborator.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-medium text-slate-800 truncate">{collaborator.name}</span>
                  <span className="text-sm text-slate-500">{collaborator.role}</span>
                </div>
                <span className="text-sm text-slate-500">{collaborator._count?.messages || 0} msgs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserActivity
