import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Settings, LogOut, User, ChevronDown, HelpCircle, Moon, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import NotificationDropdown from './NotificationDropdown'

const pageTitles = {
  '/': 'Home',
  '/home': 'Home',
  '/dashboard': 'Dashboard',
  '/team-analytics': 'Team Analytics',
  '/channels': 'Channel Insights',
  '/users': 'User Activity',
  '/decisions': 'Decisions',
  '/my-channels': 'My Channels',
  '/teams': 'Teams',
  '/settings': 'Settings',
  '/help': 'Help',
}

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isManager, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  const basePath = '/' + location.pathname.split('/')[1]
  const title = pageTitles[basePath] || pageTitles[location.pathname] || 'SignalStack'

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
          <Calendar size={14} />
          <span>{format(new Date(), 'EEE, MMM d')}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg shadow-indigo-500/25">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{isManager ? 'Manager' : 'Member'}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-in origin-top-right">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/25">
                    {getInitials(user?.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={18} className="text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={18} className="text-slate-400" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/help') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle size={18} className="text-slate-400" />
                  <span>Help & Support</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
