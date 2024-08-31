import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Users,
  Activity,
  Clock,
  Target,
  Hash,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'

// Health score indicator colors
const getHealthColor = (score) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

const getHealthBgColor = (score) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function HealthIndicator({ label, score, description }) {
  const hasScore = score !== null && score !== undefined

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-sm font-semibold ${hasScore ? getHealthColor(score) : 'text-slate-400'}`}>
          {hasScore ? `${score}%` : 'N/A'}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${hasScore ? getHealthBgColor(score) : 'bg-slate-200'}`}
          style={{ width: hasScore ? `${score}%` : '0%' }}
        />
      </div>
      <span className="text-xs text-slate-500">{hasScore ? description : 'No decisions yet'}</span>
    </div>
  )
}

function ParticipationRow({ member, totalMessages }) {
  const percentage = totalMessages > 0 ? Math.round((member.messageCount / totalMessages) * 100) : 0

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
        {member.name?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">{member.name}</span>
          <span className="text-xs text-slate-400">{member.role === 'MANAGER' ? 'Lead' : 'Member'}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">{member.messageCount} ({percentage}%)</span>
        </div>
      </div>
    </div>
  )
}

function DecisionCard({ decision }) {
  const isOpen = decision.status === 'OPEN'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${isOpen ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
      <div className={`mt-0.5 ${isOpen ? 'text-amber-500' : 'text-green-500'}`}>
        {isOpen ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800 block truncate">{decision.title}</span>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users size={12} /> {decision.owner?.name || 'Unknown'}</span>
          <span className="flex items-center gap-1"><Hash size={12} /> {decision.channel?.name || 'N/A'}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(decision.createdAt), 'MMM d')}</span>
        </div>
      </div>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
    </div>
  )
}

function ChannelRow({ channel }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${channel.isActive ? 'bg-slate-50' : 'bg-slate-100 opacity-60'}`}>
      <Hash size={16} className="text-slate-400" />
      <span className="flex-1 text-sm font-medium text-slate-700">{channel.name}</span>
      <span className="text-xs text-slate-500">{channel.messageCount} messages</span>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${channel.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
        {channel.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}

function ActivityItem({ type, user, action, time, actualTime, channel }) {
  const getActivityIcon = () => {
    switch (type) {
      case 'message': return <MessageSquare size={14} />;
      case 'decision': return <Target size={14} />;
      default: return <Activity size={14} />;
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-700">
          <strong className="font-medium">{user}</strong> {action}
          {channel && <span className="text-indigo-600"> in #{channel}</span>}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">{time}</span>
          {actualTime && <span className="text-xs text-slate-300">• {actualTime}</span>}
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { currentUser, currentTeam } = useAuth()
  const [summary, setSummary] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        if (currentTeam?.id) {
          setLoading(true)
          const [summaryData, decisionsData, activityData] = await Promise.all([
            apiClient.getTeamAnalyticsSummary(currentTeam.id),
            apiClient.getTeamDecisions(currentTeam.id),
            apiClient.getTeamRecentActivity(currentTeam.id, 8)
          ])
          setSummary(summaryData)
          setDecisions(decisionsData.slice(0, 5))

          setRecentActivity(activityData.map(item => ({
            ...item,
            time: formatDistanceToNow(new Date(item.time), { addSuffix: true }),
            actualTime: format(new Date(item.time), 'h:mm a')
          })))
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [currentTeam?.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-slate-500">Loading insights...</span>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <BarChart3 size={48} />
        <h3 className="text-lg font-medium text-slate-600">No analytics available</h3>
        <p className="text-sm">Join a team to see collaboration insights</p>
      </div>
    )
  }

  const { overview, participation, health, channels } = summary

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative">
          <p className="text-indigo-200 text-sm mb-1">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {currentUser?.name?.split(' ')[0] || 'there'}! 👋
          </p>
          <h1 className="text-2xl font-bold">Team Analytics Dashboard</h1>
          <p className="text-indigo-100 mt-1">{currentTeam?.name} • High-level collaboration insights</p>
        </div>
      </div>

      {/* Overview Stats - Redesigned as cards with icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
              <MessageSquare size={20} className="text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Active</span>
          </div>
          <span className="block text-2xl font-bold text-slate-800">{overview.totalMessages.toLocaleString()}</span>
          <span className="text-sm text-slate-500">Total Messages</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{Math.round((overview.activeMembers / overview.totalMembers) * 100)}%</span>
          </div>
          <span className="block text-2xl font-bold text-slate-800">{overview.activeMembers}<span className="text-lg text-slate-400">/{overview.totalMembers}</span></span>
          <span className="text-sm text-slate-500">Active Members</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform">
              <Hash size={20} className="text-white" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{overview.totalChannels} total</span>
          </div>
          <span className="block text-2xl font-bold text-slate-800">{overview.activeChannels}</span>
          <span className="text-sm text-slate-500">Active Channels</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
              health.overall >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25' :
              health.overall >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25' :
              'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
            }`}>
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              health.overall >= 70 ? 'text-green-600 bg-green-50' :
              health.overall >= 40 ? 'text-amber-600 bg-amber-50' :
              'text-red-600 bg-red-50'
            }`}>
              {health.overall >= 70 ? 'Healthy' : health.overall >= 40 ? 'Fair' : 'Needs Attention'}
            </span>
          </div>
          <span className={`block text-2xl font-bold ${getHealthColor(health.overall)}`}>{health.overall}%</span>
          <span className="text-sm text-slate-500">Health Score</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversation Health */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800">Conversation Health</h2>
          </div>
          <div className="space-y-4">
            <HealthIndicator
              label="Participation Rate"
              score={health.participationRate}
              description="Percentage of members actively messaging"
            />
            <HealthIndicator
              label="Balance Score"
              score={health.balanceScore}
              description="How evenly distributed are messages"
            />
            <HealthIndicator
              label="Decision Closure"
              score={health.decisionClosureRate}
              description="Percentage of decisions resolved"
            />
          </div>
        </div>

        {/* Team Participation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">Message Distribution</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{participation.length} members</span>
          </div>
          <div className="space-y-1">
            {participation.slice(0, 6).map((member, idx) => (
              <ParticipationRow
                key={idx}
                member={member}
                totalMessages={overview.totalMessages}
              />
            ))}
            {participation.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p>No message data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Decision Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">Recent Decisions</h2>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{summary.decisions.open} open</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{summary.decisions.closed} closed</span>
            </div>
          </div>
          <div className="space-y-2">
            {decisions.length > 0 ? (
              decisions.map((decision, idx) => (
                <DecisionCard key={idx} decision={decision} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Target size={32} className="mx-auto mb-2 opacity-50" />
                <p>No decisions tracked yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Channel Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={18} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800">Channel Activity</h2>
          </div>
          <div className="space-y-2">
            {channels.map((channel, idx) => (
              <ChannelRow key={idx} channel={channel} />
            ))}
            {channels.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p>No channels yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
            </div>
            <span className="text-xs text-slate-400">Newest first</span>
          </div>
          <div className="space-y-0">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <ActivityItem key={idx} {...activity} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
