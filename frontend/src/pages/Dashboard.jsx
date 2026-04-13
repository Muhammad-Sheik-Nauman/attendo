import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  BookOpen,
  Activity,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { attendanceAPI } from '../services/api'
import { StatCard, PageHeader, LoadingSpinner, Badge } from '../components/ui'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const { data } = await attendanceAPI.dashboard()
      setStats(data)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="My Dashboard"
        subtitle={today}
      />

      {/* Hero Card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-glow glass-card p-5 sm:p-7 lg:p-8"
      >
        <div className="rounded-[1.6rem] border border-primary-500/20 bg-gradient-to-br from-primary-800/35 via-surface-900/70 to-surface-950/80 p-5 sm:p-7 lg:p-8">
          <p className="text-surface-300 text-xs sm:text-sm uppercase tracking-[0.22em]">Attendance Rate</p>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-none">{stats?.attendance_rate || 0}</p>
            <p className="text-3xl sm:text-4xl text-primary-300 pb-1">%</p>
          </div>
          <p className="mt-4 text-surface-300 text-sm sm:text-base">
            +{stats?.present_today || 0} students marked present today
          </p>
          <div 
            onClick={() => navigate('/statistics')}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary-400 hover:text-primary-300 cursor-pointer transition-colors group"
          >
            View Detailed Statistics <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="rounded-2xl gradient-primary px-5 py-3.5 text-surface-950 font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Take Attendance
            </button>
            <button
              onClick={() => navigate('/students')}
              className="rounded-2xl border border-surface-600/45 bg-surface-800/50 px-5 py-3.5 text-white font-semibold text-base hover:bg-surface-700/60 transition-colors"
            >
              Manage Students
            </button>
          </div>
        </div>
      </motion.section>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.total_students || 0}
          color="primary"
          delay={0.05}
        />
        <StatCard
          icon={UserCheck}
          label="Present Today"
          value={stats?.present_today || 0}
          color="success"
          delay={0.1}
        />
        <StatCard
          icon={UserX}
          label="Absent Today"
          value={stats?.absent_today || 0}
          color="danger"
          delay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {/* Weekly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 sm:p-7"
        >
          <h3 className="text-xl font-semibold text-white mb-1">Weekly Attendance Trend</h3>
          <p className="text-surface-400 text-sm mb-5">Last 7 days overview</p>
          
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weekly_trend || []}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10c98d" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10c98d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#28473f" />
                <XAxis dataKey="day" stroke="#77a597" fontSize={12} />
                <YAxis stroke="#77a597" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 24, 22, 0.95)',
                    border: '1px solid rgba(16, 201, 141, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#73e9c4' }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#10c98d"
                  strokeWidth={2}
                  fill="url(#colorPresent)"
                  dot={{ fill: '#10c98d', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#4df9d6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Classes Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 sm:p-7"
        >
          <h3 className="text-xl font-semibold text-white mb-1">Class Overview</h3>
          <p className="text-surface-400 text-sm mb-5">{stats?.total_classes || 0} classes registered</p>
          
          <div className="space-y-3.5">
            {(stats?.classes || []).length === 0 ? (
              <div className="text-center py-8 text-surface-500">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No classes registered yet</p>
              </div>
            ) : (
              (stats?.classes || []).map((cls, i) => (
                <motion.div
                  key={cls}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-800/35 border border-surface-700/30 hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-surface-950">
                      {cls.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-surface-200">{cls}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-300 text-xs font-medium">
                    Active <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Attendance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6 sm:p-7"
      >
        <h3 className="text-xl font-semibold text-white mb-1">Recent Attendance</h3>
        <p className="text-surface-400 text-sm mb-5">Latest records</p>

        {(stats?.recent_attendance || []).length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_attendance || []).map((record, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="border-b border-surface-800/50 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-surface-200">{record.student_name}</td>
                    <td className="py-3 px-4 text-sm text-surface-400 font-mono">{record.student_id}</td>
                    <td className="py-3 px-4"><Badge>{record.class_section}</Badge></td>
                    <td className="py-3 px-4">
                      <Badge variant={record.status === 'present' ? 'success' : 'danger'}>
                        {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-400">{record.date}</td>
                    <td className="py-3 px-4 text-sm text-surface-400">{record.time}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
