import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scan, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authAPI } from '../services/api'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await authAPI.login(username, password)
      localStorage.setItem('attendo_token', data.access_token)
      onLogin()
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-primary-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center mb-4 shadow-xl shadow-primary-500/10">
            <img src="/logo.png" alt="Attendo Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-300 via-primary-400 to-accent-400 bg-clip-text text-transparent">
            Attendo
          </h1>
          <p className="text-surface-400 text-sm mt-1">AI Smart Classroom Attendance System</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-surface-400 text-sm mb-6">Sign in to access the dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-800/50 border border-surface-600/50 rounded-xl text-white text-sm placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-surface-800/50 border border-surface-600/50 rounded-xl text-white text-sm placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20"
              >
                <AlertCircle className="w-4 h-4 text-danger-400" />
                <span className="text-sm text-danger-300">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-700/30">
            <p className="text-xs text-surface-500 text-center mb-3">Demo Credentials</p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setUsername('admin'); setPassword('Att3nd0@Admin2024!') }}
              className="w-full p-3 rounded-xl bg-surface-800/60 border border-primary-500/20 hover:border-primary-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface-500 w-16">Username</span>
                    <span className="text-xs font-mono text-primary-400">admin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface-500 w-16">Password</span>
                    <span className="text-xs font-mono text-primary-400">Att3nd0@Admin2024!</span>
                  </div>
                </div>
                <span className="text-xs text-surface-500 group-hover:text-primary-400 transition-colors">Click to fill →</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Powered by AI Face Recognition & Telegram
        </p>
      </motion.div>
    </div>
  )
}
