import { motion } from 'framer-motion'

export function StatCard({ icon: Icon, label, value, trend, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'from-primary-400 to-primary-700',
    accent: 'from-accent-400 to-accent-600',
    success: 'from-success-400 to-success-600',
    danger: 'from-danger-400 to-danger-600',
    warning: 'from-warning-400 to-warning-500',
  }

  const glowMap = {
    primary: 'rgba(17, 213, 148, 0.18)',
    accent: 'rgba(24, 215, 180, 0.18)',
    success: 'rgba(50, 220, 86, 0.18)',
    danger: 'rgba(239, 68, 68, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-6 relative overflow-hidden group"
      style={{ boxShadow: `0 4px 24px ${glowMap[color]}` }}
    >
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-surface-400 text-[11px] font-medium uppercase tracking-[0.22em] mb-2">{label}</p>
          <p className="text-4xl font-bold text-white leading-none">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from yesterday
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10"
    >
      <div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-surface-400 text-sm mt-2">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  )
}

export function LoadingSpinner({ size = 'md', text }) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizeMap[size]} border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin`} />
      {text && <p className="text-surface-400 text-sm">{text}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-800/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-300 mb-1">{title}</h3>
      <p className="text-surface-500 text-sm text-center max-w-sm mb-4">{description}</p>
      {action}
    </motion.div>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-700 text-surface-300',
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
    success: 'bg-success-500/20 text-success-300 border border-success-500/30',
    danger: 'bg-danger-500/20 text-danger-300 border border-danger-500/30',
    warning: 'bg-warning-500/20 text-warning-400 border border-warning-500/30',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, className = '', type = 'button' }) {
  const variants = {
    primary: 'gradient-primary text-surface-950 hover:opacity-90 shadow-lg shadow-primary-600/25',
    secondary: 'bg-surface-700/50 text-surface-300 hover:bg-surface-600/50 border border-surface-600/50',
    danger: 'gradient-danger text-white hover:opacity-90',
    ghost: 'text-surface-400 hover:text-white hover:bg-white/5',
    success: 'gradient-success text-white hover:opacity-90',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-300 mb-1.5">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-3 bg-surface-800/50 border rounded-2xl text-white placeholder-surface-500
          transition-all duration-200 text-sm
          ${error ? 'border-danger-500' : 'border-surface-600/50 hover:border-surface-500/50'}
        `}
        {...props}
      />
      {error && <p className="text-danger-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, options, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-300 mb-1.5">{label}</label>
      )}
      <select
        className={`
          w-full px-4 py-3 bg-surface-800/50 border rounded-2xl text-white
          transition-all duration-200 text-sm appearance-none cursor-pointer
          ${error ? 'border-danger-500' : 'border-surface-600/50 hover:border-surface-500/50'}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-surface-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-danger-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
