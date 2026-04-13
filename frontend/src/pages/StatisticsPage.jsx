import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Search, 
  Download, 
  TrendingUp, 
  TrendingDown,
  User,
  GraduationCap,
  CalendarCheck
} from 'lucide-react'
import { attendanceAPI, studentAPI } from '../services/api'
import { PageHeader, Button, Select, Badge, LoadingSpinner, EmptyState } from '../components/ui'

export default function StatisticsPage() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [classFilter])

  const fetchClasses = async () => {
    try {
      const { data } = await studentAPI.getClasses()
      setClasses(data.classes || [])
    } catch (err) { console.error(err) }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const { data } = await attendanceAPI.studentStats(classFilter)
      setStats(data.stats || [])
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportStats = () => {
    if (stats.length === 0) return
    const headers = ['Student Name', 'ID', 'Class', 'Attended', 'Total Classes', 'Percentage']
    const csvContent = [
      headers.join(','),
      ...stats.map(s => `"${s.name}","${s.student_id}","${s.class_section}",${s.attended},${s.total},${s.percentage}%`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student_statistics_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredStats = stats.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  )

  const getAttendanceGrade = (percentage) => {
    if (percentage >= 90) return { label: 'Excellent', variant: 'success' }
    if (percentage >= 75) return { label: 'Good', variant: 'success' }
    if (percentage >= 60) return { label: 'Average', variant: 'warning' }
    return { label: 'Poor', variant: 'danger' }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Statistics" subtitle="Long-term attendance performance of students">
        <Button icon={Download} variant="secondary" onClick={exportStats}>
          Export Stats
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-surface-400">Avg. Attendance</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.length > 0 
              ? (stats.reduce((acc, curr) => acc + curr.percentage, 0) / stats.length).toFixed(1) 
              : 0}%
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success-500/10 text-success-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-surface-400">Regular Students (75%+)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.filter(s => s.percentage >= 75).length}
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-danger-500/10 text-danger-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-surface-400">At Risk (Below 60%)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.filter(s => s.percentage < 60).length}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-800/50 border border-surface-600/50 rounded-xl text-white text-sm placeholder-surface-500 focus:border-primary-500 transition-all"
          />
        </div>
        <Select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          options={[
            { value: '', label: 'All Classes' },
            ...classes.map(c => ({ value: c, label: c }))
          ]}
          className="sm:w-48"
        />
      </motion.div>

      {/* Stats Table */}
      {loading ? (
        <LoadingSpinner text="Analyzing records..." />
      ) : filteredStats.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data found"
          description="Attend some classes to see statistical performance here."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Attendance</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Progress</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((s, i) => {
                  const grade = getAttendanceGrade(s.percentage)
                  return (
                    <motion.tr
                      key={s.student_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 1) }}
                      className="border-b border-surface-800/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-surface-200">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-surface-400 font-mono">{s.student_id}</td>
                      <td className="py-3 px-4"><Badge>{s.class_section}</Badge></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                           <CalendarCheck className="w-4 h-4 text-primary-400" />
                           <span className="text-sm text-surface-200 font-semibold">{s.attended}</span>
                           <span className="text-xs text-surface-500">/ {s.total}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-surface-400 uppercase">
                            <span>{s.percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${s.percentage}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className={`h-full rounded-full ${
                                s.percentage >= 75 ? 'bg-success-500' : 
                                s.percentage >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={grade.variant}>{grade.label}</Badge>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
