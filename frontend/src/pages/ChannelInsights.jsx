import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  MessageSquare, 
  Clock,
  TrendingUp,
  Hash,
  Activity,
  Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import {
  ActivityChart,
  InsightCard
} from '../components/Analytics'

function ChannelInsights() {
  const { channelId } = useParams()
  const { currentTeam } = useAuth()
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(channelId || null)
  const [channelActivity, setChannelActivity] = useState([])
  const [responseLatency, setResponseLatency] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChannels = async () => {
      try {
        if (currentTeam?.id) {
          setLoading(true)
          const channelsData = await apiClient.getChannelsByTeam(currentTeam.id)
          setChannels(channelsData)
          if (channelsData.length > 0 && !selectedChannel) {
            setSelectedChannel(channelsData[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load channels:', err)
      } finally {
        setLoading(false)
      }
    }
    loadChannels()
  }, [currentTeam?.id])

  useEffect(() => {
    const loadChannelAnalytics = async () => {
      try {
        if (selectedChannel) {
          const activity = await apiClient.getChannelActivity(selectedChannel)
          const latency = await apiClient.getResponseLatency(selectedChannel)
          setChannelActivity(activity)
          setResponseLatency(latency)
        }
      } catch (err) {
        console.error('Failed to load channel analytics:', err)
      }
    }
    loadChannelAnalytics()
  }, [selectedChannel])

  const currentChannel = channels.find(c => c.id === selectedChannel)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const totalMessages = channelActivity.reduce((sum, day) => sum + day.messageCount, 0)
  const avgMessagesPerDay = channelActivity.length > 0 
    ? Math.round(totalMessages / channelActivity.length) 
    : 0
  const avgLatency = responseLatency.length > 0 
    ? Math.floor(responseLatency.reduce((sum, item) => sum + item.responseTimeMs, 0) / responseLatency.length / 1000)
    : 0

  return (
    <div className="flex h-full -m-6">
      {/* Channel Selector Sidebar */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Channels</h2>
          <span className="text-sm text-slate-500">{channels.length} channels</span>
        </div>
        <div className="divide-y divide-slate-100">
          {channels.length > 0 ? channels.map(ch => (
            <button
              key={ch.id}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedChannel === ch.id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : 'hover:bg-slate-100'}`}
              onClick={() => setSelectedChannel(ch.id)}
            >
              <Hash size={16} className={selectedChannel === ch.id ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="flex-1 font-medium text-slate-700 truncate">{ch.name}</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {ch._count?.messages || 0}
              </span>
            </button>
          )) : (
            <p className="p-8 text-center text-slate-500">No channels found</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Channel Header */}
        {currentChannel && (
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Hash size={24} />
                {currentChannel.name}
              </h2>
              <p className="text-indigo-100 mt-1">{currentChannel.description || 'No description'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              currentChannel.type === 'PRIVATE' ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {currentChannel.type || 'PUBLIC'}
            </span>
          </div>
        )}

        {/* Channel Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <MessageSquare size={20} className="text-indigo-500 mb-2" />
            <span className="block text-2xl font-bold text-slate-800">{totalMessages.toLocaleString()}</span>
            <span className="text-sm text-slate-500">Total Messages</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <Calendar size={20} className="text-indigo-500 mb-2" />
            <span className="block text-2xl font-bold text-slate-800">{channelActivity.length}</span>
            <span className="text-sm text-slate-500">Active Days</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <Clock size={20} className="text-indigo-500 mb-2" />
            <span className="block text-2xl font-bold text-slate-800">{avgLatency > 0 ? `${avgLatency}s` : 'N/A'}</span>
            <span className="text-sm text-slate-500">Avg Response Time</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <Activity size={20} className="text-indigo-500 mb-2" />
            <span className="block text-2xl font-bold text-slate-800">{avgMessagesPerDay}</span>
            <span className="text-sm text-slate-500">Messages/Day</span>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <TrendingUp size={18} className="text-indigo-500" />
            Channel Activity
          </h3>
          {channelActivity.length > 0 ? (
            <InsightCard
              type="info"
              title="Activity Summary"
              description={`${channelActivity.length} active days with ${totalMessages} total messages`}
              metric={avgMessagesPerDay}
              metricLabel="messages/day"
            />
          ) : (
            <p className="text-slate-500 text-center py-4">No activity data available</p>
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Message Activity</h3>
            {channelActivity.length > 0 ? (
              <ActivityChart
                data={channelActivity.map(item => ({
                  date: item.date,
                  messages: item.messageCount
                }))}
                title="Message Activity"
                dataKey="messages"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400">No activity data</div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Response Latency (minutes)</h3>
            {responseLatency.length > 0 ? (
              <ActivityChart
                data={responseLatency.slice(0, 20).map((item, idx) => ({
                  date: `Msg ${idx + 1}`,
                  latency: Math.floor(item.responseTimeMs / 1000 / 60)
                }))}
                title="Response Latency (minutes)"
                dataKey="latency"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400">No latency data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelInsights
