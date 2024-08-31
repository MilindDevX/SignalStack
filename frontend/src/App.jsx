import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import TeamAnalytics from './pages/TeamAnalytics'
import ChannelInsights from './pages/ChannelInsights'
import UserActivity from './pages/UserActivity'
import Decisions from './pages/Decisions'
import MyChannels from './pages/MyChannels'
import Teams from './pages/Teams'
import Settings from './pages/Settings'
import Help from './pages/Help'
import JoinByCode from './pages/JoinByCode'

function AppRoutes() {
  const { isManager, isLoading, isAuthenticated, currentUser } = useAuth()
  const location = useLocation()
  const hasTeams = currentUser?.teams?.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/join/:code" element={<JoinByCode />} />
        <Route path="*" element={<Navigate to="/login" state={{ from: location.pathname }} replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* Join by code route (outside layout) */}
      <Route path="/join/:code" element={<JoinByCode />} />
      
      <Route path="/" element={<Layout />}>
        {/* Redirect based on whether user has teams */}
        <Route index element={hasTeams ? <Navigate to="/teams" replace /> : <Home />} />
        
        {/* Manager-only analytics routes */}
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requireManager>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="team-analytics" 
          element={
            <ProtectedRoute requireManager>
              <TeamAnalytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="channels/:channelId?" 
          element={
            <ProtectedRoute requireManager>
              <ChannelInsights />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/:userId?" 
          element={
            <ProtectedRoute requireManager>
              <UserActivity />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="decisions" 
          element={
            <ProtectedRoute requireManager>
              <Decisions />
            </ProtectedRoute>
          } 
        />

        {/* Shared routes - accessible by all */}
        <Route path="home" element={hasTeams ? <Navigate to="/teams" replace /> : <Home />} />
        <Route path="teams" element={<Teams />} />
        <Route path="my-channels" element={<MyChannels />} />
        <Route path="my-channels/:channelId" element={<MyChannels />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />

        {/* Catch-all redirect */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
