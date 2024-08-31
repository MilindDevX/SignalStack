import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Shield, User, Mail, Sparkles, Bell, Sun, Moon, Check, Lock, Eye, EyeOff, Edit3, Save, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function Settings() {
  const navigate = useNavigate()
  const { currentUser, isManager, logout, setCurrentUser } = useAuth()
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    teamUpdates: true
  })
  const [toast, setToast] = useState(null)
  
  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(currentUser?.name || '')
  const [savingName, setSavingName] = useState(false)
  
  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [savingPassword, setSavingPassword] = useState(false)

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' })
      return
    }
    
    setSavingName(true)
    try {
      const updated = await apiClient.updateProfile(newName.trim())
      setCurrentUser(prev => ({ ...prev, name: updated.name }))
      setIsEditingName(false)
      setToast({ message: 'Name updated successfully!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to update name', type: 'error' })
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ message: 'All password fields are required', type: 'error' })
      return
    }
    
    if (newPassword.length < 6) {
      setToast({ message: 'New password must be at least 6 characters', type: 'error' })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' })
      return
    }
    
    setSavingPassword(true)
    try {
      await apiClient.changePassword(currentPassword, newPassword)
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setToast({ message: 'Password changed successfully!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to change password', type: 'error' })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Header with Profile Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/30 shadow-xl">
            {getInitials(currentUser?.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{currentUser?.name || 'User'}</h1>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 text-xs font-medium rounded-full border border-amber-400/30 flex items-center gap-1">
                <Sparkles size={10} /> Pro
              </span>
            </div>
            <p className="text-indigo-200 flex items-center gap-2 mt-1">
              <Mail size={14} />
              {currentUser?.email || 'Not set'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isManager
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                  : 'bg-white/20 text-white border border-white/30'
              }`}>
                {isManager ? '⭐ Team Lead' : 'Team Member'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h2>
        
        {/* Name Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Display Name</p>
                {isEditingName ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-sm font-medium text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800">{currentUser?.name}</p>
                )}
              </div>
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdateName}
                  disabled={savingName}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {savingName ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setNewName(currentUser?.name || '') }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
          </div>
          
          {/* Email (read-only) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                <Mail size={20} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="text-sm font-medium text-slate-800">{currentUser?.email}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Cannot be changed</span>
          </div>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Security</h2>
        </div>
        
        {!showPasswordForm ? (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Password</p>
                <p className="text-xs text-slate-500">••••••••••••</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Edit3 size={14} />
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                Update Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
                className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Data Secure</p>
              <p className="text-xs text-slate-500">Encrypted & protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Active Account</p>
              <p className="text-xs text-slate-500">Member since 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Appearance</h2>
        <p className="text-sm text-slate-500 mb-4">Choose how SignalStack looks for you</p>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Sun size={20} className={theme === 'light' ? 'text-indigo-600' : 'text-slate-400'} />
            <span className={`font-medium ${theme === 'light' ? 'text-indigo-600' : 'text-slate-600'}`}>Light</span>
            {theme === 'light' && <Check size={16} className="text-indigo-600" />}
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Moon size={20} className={theme === 'dark' ? 'text-indigo-600' : 'text-slate-400'} />
            <span className={`font-medium ${theme === 'dark' ? 'text-indigo-600' : 'text-slate-600'}`}>Dark</span>
            {theme === 'dark' && <Check size={16} className="text-indigo-600" />}
          </button>
        </div>
        {theme === 'dark' && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded-lg">Dark mode coming soon!</p>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Notifications</h2>
        <p className="text-sm text-slate-500 mb-4">Manage how you receive notifications</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Email notifications</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Push notifications</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Team updates</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.teamUpdates}
              onChange={(e) => setNotifications(prev => ({ ...prev, teamUpdates: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Sign Out</h3>
            <p className="text-sm text-slate-500">Sign out of your SignalStack account</p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
