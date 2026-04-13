import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Search,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { attendanceAPI, studentAPI } from '../services/api'
import { PageHeader, Button, Select, Badge, LoadingSpinner, EmptyState } from '../components/ui'

export default function HistoryPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [classFilter, dateFilter])

  const fetchClasses = async () => {
    try {
      const { data } = await studentAPI.getClasses()
      setClasses(data.classes || [])
    } catch (err) { console.error(err) }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data } = await attendanceAPI.history(classFilter, dateFilter)
      setRecords(data.records || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      const { data } = await attendanceAPI.export(classFilter, dateFilter)
      if (!data.data || data.data.length === 0) return

      const headers = Object.keys(data.data[0])
      const csvContent = [
        headers.join(','),
        ...data.data.map(row => headers.map(h => `"${row[h]}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${dateFilter || 'all'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const filteredRecords = records.filter(r =>
    !search || r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance History" subtitle="View and export attendance records">
        <Button icon={Download} variant="secondary" onClick={exportToCSV}>
          Export CSV
        </Button>
      </PageHeader>

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
        <div className="sm:w-48">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-800/50 border border-surface-600/50 rounded-xl text-white text-sm focus:border-primary-500 transition-all"
          />
        </div>
      </motion.div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner text="Loading records..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No records found"
          description="Attendance records will appear here after processing"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-4 border-b border-surface-700/30 flex items-center justify-between">
            <p className="text-sm text-surface-400">
              Showing <span className="text-white font-medium">{filteredRecords.length}</span> records
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Confidence</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 1) }}
                    className="border-b border-surface-800/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                          {record.student_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-surface-200">{record.student_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-400 font-mono">{record.student_id}</td>
                    <td className="py-3 px-4"><Badge>{record.class_section}</Badge></td>
                    <td className="py-3 px-4">
                      <Badge variant={record.status === 'present' ? 'success' : 'danger'}>
                        {record.status === 'present' ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Present</span>
                        ) : (
                          <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Absent</span>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-400">{record.confidence}%</td>
                    <td className="py-3 px-4 text-sm text-surface-400">{record.date}</td>
                    <td className="py-3 px-4 text-sm text-surface-400">{record.time}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
