import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Search,
  Filter,
  User,
  Hash,
  MessageSquare,
  Circle,
  Clock,
  ArrowRight,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'

const statusConfig = {
  OPEN: { label: 'Open', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Circle },
  CLOSED: { label: 'Closed', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
}

function Decisions() {
  const { currentTeam } = useAuth()
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showSuperseded, setShowSuperseded] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState({})

  useEffect(() => {
    loadDecisions()
  }, [currentTeam?.id, statusFilter, showSuperseded])

  const loadDecisions = async () => {
    try {
      if (currentTeam?.id) {
        setLoading(true)
        const data = await apiClient.getDecisionsByTeam(currentTeam.id, {
          status: statusFilter === 'all' ? null : statusFilter,
          includeSuperseded: showSuperseded
        })
        setDecisions(data)
      }
    } catch (err) {
      console.error('Failed to load decisions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (decisionId, newStatus, decision) => {
    if (newStatus === 'OPEN' && decision.closureReason === 'Superseded by new decision') {
      alert('Cannot reopen a superseded decision')
      return
    }

    try {
      const updated = await apiClient.updateDecisionStatus(decisionId, newStatus)
      setDecisions(decisions.map(d => d.id === decisionId ? updated : d))
    } catch (err) {
      console.error('Failed to update decision status:', err)
      alert(err.message || 'Failed to update status')
    }
  }

  const toggleHistory = (decisionId) => {
    setExpandedHistory(prev => ({
      ...prev,
      [decisionId]: !prev[decisionId]
    }))
  }

  const filteredDecisions = decisions.filter(decision => {
    const matchesSearch =
      decision.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.message?.content?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const openCount = decisions.filter(d => d.status === 'OPEN').length
  const closedCount = decisions.filter(d => d.status === 'CLOSED').length
  const closureRate = decisions.length > 0 ? Math.round((closedCount / decisions.length) * 100) : 0

  const isSuperseded = (decision) => decision.closureReason === 'Superseded by new decision'
  const isReadOnly = (decision) => decision.status === 'CLOSED'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Target size={24} />
            </div>
            <h1 className="text-3xl font-bold">Decisions</h1>
          </div>
          <p className="text-indigo-200 mt-2 max-w-lg">
            Track and manage team decisions. Keep your team aligned and documented.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-200">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="block text-3xl font-bold text-slate-800">{decisions.length}</span>
            <span className="text-sm text-slate-500">Total Decisions</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-amber-200">
              <Circle size={20} className="text-white" />
            </div>
            <span className="block text-3xl font-bold text-amber-600">{openCount}</span>
            <span className="text-sm text-slate-500">Open</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-green-200">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <span className="block text-3xl font-bold text-green-600">{closedCount}</span>
            <span className="text-sm text-slate-500">Closed</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="block text-3xl font-bold text-blue-600">{closureRate}%</span>
            <span className="text-sm text-slate-500">Completion Rate</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === 'OPEN'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setStatusFilter('OPEN')}
          >
            Open
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === 'CLOSED'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setStatusFilter('CLOSED')}
          >
            Closed
          </button>
        </div>

        {statusFilter === 'CLOSED' && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={showSuperseded}
              onChange={(e) => setShowSuperseded(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show superseded</span>
          </label>
        )}
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
              <Target size={40} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold text-lg">No decisions found</p>
            <p className="text-sm mt-1 max-w-md text-center">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Mark messages as decisions or use the "Log Decision" button in channels.'}
            </p>
          </div>
        ) : (
          filteredDecisions.map(decision => {
            const status = statusConfig[decision.status] || statusConfig.OPEN
            const StatusIcon = status.icon
            return (
              <div
                key={decision.id}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow ${isSuperseded(decision) ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  {isReadOnly(decision) ? (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${status.bg} ${status.text}`}>
                      {isSuperseded(decision) ? <Lock size={14} /> : <StatusIcon size={14} />}
                      {isSuperseded(decision) ? 'Superseded' : status.label}
                    </span>
                  ) : (
                    <button
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border-2 ${status.bg} ${status.text} ${status.border} hover:scale-105 transition-transform`}
                      onClick={() => handleStatusChange(decision.id, decision.status === 'OPEN' ? 'CLOSED' : 'OPEN', decision)}
                      title={`Click to mark as ${decision.status === 'OPEN' ? 'Closed' : 'Open'}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </button>
                  )}
                  <span className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Clock size={14} />
                    {format(new Date(decision.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-slate-800 mb-4">{decision.title}</h3>

                {/* Show supersession info */}
                {decision.supersedesDecision && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 mb-4">
                    <ArrowRight size={14} />
                    <span>Supersedes: "{decision.supersedesDecision.title?.substring(0, 50)}..."</span>
                    <button
                      className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => toggleHistory(decision.id)}
                    >
                      <History size={14} />
                      {expandedHistory[decision.id] ? 'Hide' : 'History'}
                      {expandedHistory[decision.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                )}

                {/* Show superseded by info */}
                {decision.supersededBy && decision.supersededBy.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 mb-4">
                    <Lock size={14} />
                    <span>Superseded by: "{decision.supersededBy[0].title?.substring(0, 50)}..."</span>
                  </div>
                )}

                {/* History panel */}
                {expandedHistory[decision.id] && decision.supersedesDecision && (
                  <div className="p-4 bg-slate-50 rounded-xl mb-4 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Previous decision:</span>
                    <p className="font-medium text-slate-700 mt-2">{decision.supersedesDecision.title}</p>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {format(new Date(decision.supersedesDecision.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Show linked message context if available */}
                {decision.message && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-2">
                      <MessageSquare size={14} />
                      From message
                    </div>
                    <p className="text-slate-700">{decision.message.content}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                    <User size={14} />
                    <span>{decision.owner?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Hash size={14} />
                    <span>{decision.channel?.name || 'No channel'}</span>
                  </div>
                  {decision.closedAt && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} />
                      <span>Closed {format(new Date(decision.closedAt), 'MMM d')}</span>
                    </div>
                  )}
                  {decision.closureReason && decision.closureReason !== 'Superseded by new decision' && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                      <span>Reason: {decision.closureReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Decisions
