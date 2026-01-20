import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { apiClient } from '../services/api'
import Toast from '../components/Toast'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [toast, setToast] = useState(null)
  const [resetLink, setResetLink] = useState(null) // For development only

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setToast({ message: 'Please enter your email address', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.forgotPassword(email)
      setSent(true)
      // In development, show the reset link
      if (result.resetLink) {
        setResetLink(result.resetLink)
      }
      setToast({ message: 'Reset instructions sent!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Something went wrong', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-slate-900 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SignalStack</span>
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Reset Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Password
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md">
              Don't worry, it happens to the best of us. We'll help you get back into your account.
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">SignalStack</span>
          </div>

          {!sent ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Forgot Password?</h2>
                <p className="text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <Mail size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
              <p className="text-slate-500 mb-6">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>, you'll receive password reset instructions.
              </p>

              {/* Development only - show reset link */}
              {resetLink && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-left">
                  <p className="text-xs text-amber-600 font-medium mb-2">Development Only - Reset Link:</p>
                  <a
                    href={resetLink}
                    className="text-sm text-indigo-600 hover:text-indigo-700 break-all underline"
                  >
                    {resetLink}
                  </a>
                </div>
              )}

              <button
                onClick={() => { setSent(false); setEmail(''); setResetLink(null); }}
                className="text-indigo-600 font-medium hover:text-indigo-700"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
