import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Users, Hash, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function JoinByCode() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, currentUser } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with the join URL as the return path
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    loadTeamPreview()
  }, [code, isAuthenticated])

  const loadTeamPreview = async () => {
    try {
      const preview = await apiClient.previewTeamByCode(code)
      setTeam(preview)
    } catch (err) {
      setError(err.message || 'Invalid or expired invite code')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setJoining(true)
    try {
      await apiClient.joinTeamViaCode(code)
      setSuccess(true)
      setToast({ message: 'Join request sent successfully!', type: 'success' })
      setTimeout(() => navigate('/teams'), 2000)
    } catch (err) {
      setToast({ message: err.message || 'Failed to join team', type: 'error' })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading team information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite Code</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            onClick={() => navigate('/teams')}
          >
            Go to Teams
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h2>
          <p className="text-slate-500 mb-6">Your request to join {team?.name} has been sent. A team lead will review it shortly.</p>
          <button 
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            onClick={() => navigate('/teams')}
          >
            Go to Teams
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Building2 size={18} />
            <span>You've been invited to join</span>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {team?.name?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{team?.name}</h1>
            {team?.description && <p className="text-slate-500">{team.description}</p>}
            
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-600">
              <span className="flex items-center gap-1"><Users size={16} /> {team?.memberCount} members</span>
              <span className="flex items-center gap-1"><Hash size={16} /> {team?.channelCount} channels</span>
            </div>

            {team?.leads?.length > 0 && (
              <p className="text-sm text-slate-500 mt-3">Led by {team.leads.map(l => l.name).join(', ')}</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-slate-600">
              Joining as <strong className="text-slate-900">{currentUser?.name}</strong> ({currentUser?.email})
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              onClick={() => navigate('/teams')}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'Sending Request...' : 'Request to Join'}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            Your request will be reviewed by a team lead before you can access this team.
          </p>
        </div>
      </div>
    </div>
  )
}

export default JoinByCode
