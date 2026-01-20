import { useState, useEffect } from 'react'
import { Hash, ChevronRight, Send, Users, Lock, CheckCircle2, MoreHorizontal, Plus, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'

function MyChannels() {
  const { currentUser, currentTeam } = useAuth()
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMessageMenu, setActiveMessageMenu] = useState(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionStatus, setDecisionStatus] = useState('OPEN')
  const [creatingDecision, setCreatingDecision] = useState(false)
  
  // Superseding workflow state
  const [showSupersedeModal, setShowSupersedeModal] = useState(false)
  const [pendingDecisionMessageId, setPendingDecisionMessageId] = useState(null)
  const [openDecisions, setOpenDecisions] = useState([])
  const [selectedSupersedeId, setSelectedSupersedeId] = useState(null)
  const [loadingOpenDecisions, setLoadingOpenDecisions] = useState(false)
  
  // For manual decision superseding
  const [supersedesDecisionId, setSupersedesDecisionId] = useState(null)

  // Load channels from API
  useEffect(() => {
    const loadChannels = async () => {
      try {
        if (currentTeam?.id) {
          const channelsData = await apiClient.getChannelsByTeam(currentTeam.id)
          setChannels(channelsData)
          // Reset selected channel when team changes
          setSelectedChannel(null)
          setMessages([])
        } else {
          setChannels([])
        }
      } catch (err) {
        console.error('Failed to load channels:', err)
      } finally {
        setLoading(false)
      }
    }
    loadChannels()
  }, [currentTeam?.id])

  // Load messages when channel is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedChannel) {
        try {
          const messagesData = await apiClient.getChannelMessages(selectedChannel.id)
          setMessages(messagesData)
        } catch (err) {
          console.error('Failed to load messages:', err)
        }
      }
    }
    loadMessages()
  }, [selectedChannel])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChannel) return

    try {
      const messageData = {
        content: newMessage,
        authorId: currentUser.id
      }
      const newMsg = await apiClient.createMessage(selectedChannel.id, messageData)
      setMessages([...messages, newMsg])
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // Mark a message as decision - show supersede modal first
  const handleMarkAsDecision = async (messageId) => {
    setPendingDecisionMessageId(messageId)
    setActiveMessageMenu(null)
    
    // Load open decisions for superseding selection
    if (currentTeam?.id) {
      setLoadingOpenDecisions(true)
      try {
        const decisions = await apiClient.getOpenDecisionsByTeam(currentTeam.id)
        setOpenDecisions(decisions)
      } catch (err) {
        console.error('Failed to load open decisions:', err)
        setOpenDecisions([])
      } finally {
        setLoadingOpenDecisions(false)
      }
    }
    
    setShowSupersedeModal(true)
  }

  // Confirm decision creation (with or without superseding)
  const confirmMarkAsDecision = async () => {
    if (!pendingDecisionMessageId) return

    try {
      await apiClient.markMessageAsDecision(pendingDecisionMessageId, selectedSupersedeId)
      setMessages(messages.map(msg => 
        msg.id === pendingDecisionMessageId ? { ...msg, hasDecision: true } : msg
      ))
      setShowSupersedeModal(false)
      setPendingDecisionMessageId(null)
      setSelectedSupersedeId(null)
    } catch (err) {
      console.error('Failed to mark as decision:', err)
      alert(err.message || 'Failed to mark as decision')
    }
  }

  // Unmark a message as decision
  const handleUnmarkDecision = async (messageId) => {
    try {
      await apiClient.unmarkMessageAsDecision(messageId)
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, hasDecision: false } : msg
      ))
      setActiveMessageMenu(null)
    } catch (err) {
      console.error('Failed to unmark decision:', err)
      alert(err.message || 'Failed to unmark decision')
    }
  }

  // Create manual decision (secondary workflow)
  const handleCreateManualDecision = async (e) => {
    e.preventDefault()
    if (!decisionTitle.trim() || !selectedChannel) return

    setCreatingDecision(true)
    try {
      await apiClient.createManualDecision(selectedChannel.id, {
        title: decisionTitle.trim(),
        status: decisionStatus,
        supersedesDecisionId: supersedesDecisionId
      })
      setShowDecisionModal(false)
      setDecisionTitle('')
      setDecisionStatus('OPEN')
      setSupersedesDecisionId(null)
      alert('Decision logged successfully')
    } catch (err) {
      console.error('Failed to create decision:', err)
      alert(err.message || 'Failed to create decision')
    } finally {
      setCreatingDecision(false)
    }
  }

  // Open manual decision modal and load open decisions
  const openDecisionModal = async () => {
    setShowDecisionModal(true)
    if (currentTeam?.id) {
      try {
        const decisions = await apiClient.getOpenDecisionsByTeam(currentTeam.id)
        setOpenDecisions(decisions)
      } catch (err) {
        console.error('Failed to load open decisions:', err)
      }
    }
  }

  const getChannelIcon = (type) => {
    switch (type) {
      case 'PRIVATE':
        return <Lock size={16} />
      case 'PUBLIC':
      default:
        return <Hash size={16} />
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full -m-6">
      {/* Channel List */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">My Channels</h2>
          <span className="text-sm text-slate-500">{channels.length} channels</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels.length > 0 ? channels.map(channel => (
            <div
              key={channel.id}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-slate-100 ${
                selectedChannel?.id === channel.id 
                  ? 'bg-indigo-50 border-l-2 border-l-indigo-600' 
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => setSelectedChannel(channel)}
            >
              <div className={`p-2 rounded-lg ${selectedChannel?.id === channel.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                {getChannelIcon(channel.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 truncate">{channel.name}</span>
                  {channel._count?.messages > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded-full">{channel._count.messages}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {channel.description || 'No description'}
                </p>
              </div>
              <ChevronRight className="text-slate-400" size={16} />
            </div>
          )) : (
            <p className="p-8 text-center text-slate-500">No channels found</p>
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChannel ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{getChannelIcon(selectedChannel.type)}</span>
                <h3 className="text-lg font-semibold text-slate-800">{selectedChannel.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={openDecisionModal}
                  title="Log a decision"
                >
                  <Plus size={14} />
                  <span>Log Decision</span>
                </button>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Users size={14} />
                  <span>{selectedChannel._count?.messages || 0} messages</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`group max-w-2xl ${msg.authorId === currentUser?.id ? 'ml-auto' : ''}`}
                >
                  <div className={`rounded-2xl p-4 ${
                    msg.hasDecision 
                      ? 'bg-green-50 border-2 border-green-200' 
                      : msg.authorId === currentUser?.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${msg.authorId === currentUser?.id && !msg.hasDecision ? 'text-indigo-100' : 'text-slate-600'}`}>
                          {msg.author?.name || 'Unknown'}
                        </span>
                        <span className={`text-xs ${msg.authorId === currentUser?.id && !msg.hasDecision ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.hasDecision && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle2 size={12} />
                            Decision
                          </span>
                        )}
                      </div>
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className={`p-1 rounded hover:bg-black/10 ${msg.authorId === currentUser?.id && !msg.hasDecision ? 'text-indigo-200' : 'text-slate-400'}`}
                          onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {activeMessageMenu === msg.id && (
                          <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[160px]">
                            {msg.hasDecision ? (
                              <button 
                                onClick={() => handleUnmarkDecision(msg.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <X size={14} />
                                Remove Decision
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleMarkAsDecision(msg.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <CheckCircle2 size={14} />
                                Mark as Decision
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={msg.authorId === currentUser?.id && !msg.hasDecision ? 'text-white' : 'text-slate-800'}>{msg.content}</p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p>No messages yet. Be the first to say something!</p>
                </div>
              )}
            </div>

            <form className="p-4 border-t border-slate-200" onSubmit={handleSendMessage}>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder={`Message #${selectedChannel.name}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Hash size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-600">Select a channel</h3>
            <p>Choose a channel from the list to view messages</p>
          </div>
        )}
      </div>

      {/* Manual Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDecisionModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Log Decision</h2>
              <p className="text-sm text-slate-500">Record a decision for #{selectedChannel?.name}</p>
            </div>
            
            <form onSubmit={handleCreateManualDecision} className="p-4 space-y-4">
              <div>
                <label htmlFor="decisionTitle" className="block text-sm font-medium text-slate-700 mb-1">Decision Title *</label>
                <input
                  id="decisionTitle"
                  type="text"
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  placeholder="What was decided?"
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="decisionStatus" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  id="decisionStatus"
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Supersede selection */}
              {openDecisions.length > 0 && (
                <div>
                  <label htmlFor="supersedeDecision" className="block text-sm font-medium text-slate-700 mb-1">Replaces existing decision?</label>
                  <select
                    id="supersedeDecision"
                    value={supersedesDecisionId || ''}
                    onChange={(e) => setSupersedesDecisionId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">No - This is a new decision</option>
                    {openDecisions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title?.substring(0, 60)}{d.title?.length > 60 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                  {supersedesDecisionId && (
                    <p className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <ArrowRight size={12} />
                      The selected decision will be marked as closed and superseded.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={() => {
                    setShowDecisionModal(false)
                    setSupersedesDecisionId(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!decisionTitle.trim() || creatingDecision}
                >
                  {creatingDecision ? 'Saving...' : 'Log Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supersede Confirmation Modal (for marking messages as decisions) */}
      {showSupersedeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
          setShowSupersedeModal(false)
          setPendingDecisionMessageId(null)
          setSelectedSupersedeId(null)
        }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Mark as Decision</h2>
              <p className="text-sm text-slate-500">Does this decision replace an existing decision?</p>
            </div>
            
            <div className="p-4">
              {loadingOpenDecisions ? (
                <p className="text-slate-500">Loading existing decisions...</p>
              ) : (
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${!selectedSupersedeId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="supersede"
                      value=""
                      checked={!selectedSupersedeId}
                      onChange={() => setSelectedSupersedeId(null)}
                      className="mt-1"
                    />
                    <div>
                      <span className="block font-medium text-slate-800">No - This is a new decision</span>
                      <span className="text-sm text-slate-500">Create as a standalone decision</span>
                    </div>
                  </label>

                  {openDecisions.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-xs text-slate-400">Or select a decision to replace:</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                      </div>
                      {openDecisions.map(d => (
                        <label 
                          key={d.id} 
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSupersedeId === d.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <input
                            type="radio"
                            name="supersede"
                            value={d.id}
                            checked={selectedSupersedeId === d.id}
                            onChange={() => setSelectedSupersedeId(d.id)}
                            className="mt-1"
                          />
                          <div>
                            <span className="block font-medium text-slate-800 truncate">{d.title?.substring(0, 60)}{d.title?.length > 60 ? '...' : ''}</span>
                            <span className="text-sm text-slate-500">#{d.channel?.name} • {d.owner?.name}</span>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}

              {selectedSupersedeId && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <ArrowRight size={14} />
                  <span>The selected decision will be marked as closed and superseded.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button 
                type="button" 
                className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                onClick={() => {
                  setShowSupersedeModal(false)
                  setPendingDecisionMessageId(null)
                  setSelectedSupersedeId(null)
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={confirmMarkAsDecision}
              >
                {selectedSupersedeId ? 'Replace & Create Decision' : 'Create Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyChannels
