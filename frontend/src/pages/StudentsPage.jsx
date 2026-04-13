import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Webcam from 'react-webcam'
import {
  Users,
  UserPlus,
  Search,
  Camera,
  Upload,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  ChevronDown,
  Send,
  Shield,
} from 'lucide-react'
import { studentAPI } from '../services/api'
import { PageHeader, Button, Input, Select, Badge, LoadingSpinner, EmptyState } from '../components/ui'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [classes, setClasses] = useState([])
  const [showRegister, setShowRegister] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [showUploadFace, setShowUploadFace] = useState(null) // student_id
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300)
    return () => clearTimeout(timer)
  }, [search, classFilter])

  const fetchStudents = async () => {
    try {
      const { data } = await studentAPI.list(classFilter, search)
      setStudents(data.students || [])
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const { data } = await studentAPI.getClasses()
      setClasses(data.classes || [])
    } catch (err) {
      console.error(err)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const deleteStudent = async (studentId) => {
    if (!confirm(`Delete student ${studentId}? This cannot be undone.`)) return
    try {
      await studentAPI.delete(studentId)
      showToast('Student deleted')
      fetchStudents()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="Manage student registrations and face data">
        <Button icon={UserPlus} onClick={() => setShowRegister(true)}>
          Register Student
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
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-800/50 border border-surface-600/50 rounded-xl text-white text-sm placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
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

      {/* Students Grid */}
      {loading ? (
        <LoadingSpinner text="Loading students..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Register your first student to get started with face recognition"
          action={
            <Button icon={UserPlus} onClick={() => setShowRegister(true)}>
              Register Student
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student, i) => (
            <motion.div
              key={student.student_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{student.name}</h3>
                    <p className="text-xs text-surface-400 font-mono">{student.student_id}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingStudent(student)}
                    className="p-1.5 rounded-lg hover:bg-primary-500/10 text-surface-500 hover:text-primary-400 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteStudent(student.student_id)}
                    className="p-1.5 rounded-lg hover:bg-danger-500/10 text-surface-500 hover:text-danger-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">Class</span>
                  <Badge>{student.class_section}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">Face Images</span>
                  <Badge variant={student.image_count > 0 ? 'success' : 'warning'}>
                    {student.image_count} images
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">Embeddings</span>
                  <Badge variant={student.has_embeddings ? 'success' : 'danger'}>
                    {student.has_embeddings ? '✓ Ready' : '✗ No data'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">Telegram</span>
                  <Badge variant={student.telegram_chat_id ? 'success' : 'warning'}>
                    {student.telegram_chat_id ? '✓ Linked' : '✗ Not linked'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-700/30">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Camera}
                  onClick={() => setShowUploadFace(student.student_id)}
                  className="w-full"
                >
                  Upload Face Images
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      <AnimatePresence>
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onSuccess={() => {
              setShowRegister(false)
              fetchStudents()
              fetchClasses()
              showToast('Student registered successfully!')
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <EditStudentModal
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onSuccess={() => {
              setEditingStudent(null)
              fetchStudents()
              fetchClasses()
              showToast('Student updated successfully!')
            }}
          />
        )}
      </AnimatePresence>

      {/* Upload Face Modal */}
      <AnimatePresence>
        {showUploadFace && (
          <UploadFaceModal
            studentId={showUploadFace}
            onClose={() => {
              setShowUploadFace(null)
              fetchStudents()
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-danger-600 text-white'
                : 'bg-success-600 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ──── Register Modal ────

function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', student_id: '', class_section: '', telegram_chat_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('student_id', form.student_id)
      formData.append('class_section', form.class_section)
      if (form.telegram_chat_id) {
        formData.append('telegram_chat_id', form.telegram_chat_id)
      }

      await studentAPI.register(formData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" />
            Register Student
          </h2>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Nauman Ahmed"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Student ID"
            placeholder="e.g. STU001"
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            required
          />
          <Input
            label="Class / Section"
            placeholder="e.g. CS-A-2024"
            value={form.class_section}
            onChange={(e) => setForm({ ...form, class_section: e.target.value })}
            required
          />
          <Input
            label="Telegram Chat ID (Optional)"
            placeholder="Will be auto-filled via bot"
            value={form.telegram_chat_id}
            onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
          />

          {error && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}


// ──── Upload Face Modal ────

function UploadFaceModal({ studentId, onClose }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'camera'
  const [uploading, setUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState(null)
  const fileInputRef = useRef()
  const webcamRef = useRef(null)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    await processFiles(files)
  }

  const processFiles = async (files) => {
    setUploading(true)
    setError(null)
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        await studentAPI.uploadFace(studentId, formData)
        setUploadedCount(prev => prev + 1)
      } catch (err) {
        setError(`Failed to process ${file.name}: ${err.response?.data?.detail || 'Unknown error'}`)
      }
    }
    setUploading(false)
  }

  const captureFromCamera = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
          processFiles([file])
        })
    }
  }, [studentId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md my-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-400" />
            Upload Face Images
          </h2>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-surface-400">
            Upload or capture 5–10 clear face photos for <span className="text-white font-medium">{studentId}</span>. 
            Each image should contain a single face clearly visible.
          </p>

          {/* Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-surface-600/50 mb-4">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                mode === 'upload'
                  ? 'gradient-primary text-white'
                  : 'bg-surface-800/50 text-surface-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                mode === 'camera'
                  ? 'gradient-primary text-white'
                  : 'bg-surface-800/50 text-surface-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-surface-600/50 rounded-2xl p-8 cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-center"
            >
              <Upload className="w-10 h-10 text-surface-500 mx-auto mb-3" />
              <p className="text-surface-300 text-sm font-medium">Click to select face images</p>
              <p className="text-surface-500 text-xs mt-1">JPG, PNG supported • Multiple files</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-surface-900 border border-surface-700">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-auto aspect-video object-cover"
                  videoConstraints={{ facingMode: 'environment' }}
                />
              </div>
              <Button onClick={captureFromCamera} icon={Camera} disabled={uploading} className="w-full">
                Capture & Upload Photo
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <div className="w-5 h-5 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
              <span className="text-sm text-primary-300">Processing face images...</span>
            </div>
          )}

          {uploadedCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success-500/10 border border-success-500/20">
              <CheckCircle2 className="w-5 h-5 text-success-400" />
              <span className="text-sm text-success-300">{uploadedCount} image(s) uploaded & processed</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <Button variant="secondary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ──── Edit Modal ────

function EditStudentModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({ 
    name: student.name, 
    student_id: student.student_id,
    class_section: student.class_section, 
    telegram_chat_id: student.telegram_chat_id || '' 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('class_section', form.class_section)
      // Send the new student ID to the backend
      formData.append('new_student_id', form.student_id)
      formData.append('telegram_chat_id', form.telegram_chat_id || '')

      // Send to the OLD student ID endpoint
      await studentAPI.update(student.student_id, formData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary-400" />
            Edit Student
          </h2>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Student ID"
            placeholder="e.g. STU001"
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            required
          />
          <Input
            label="Full Name"
            placeholder="e.g. Nauman Ahmed"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Class / Section"
            placeholder="e.g. CS-A-2024"
            value={form.class_section}
            onChange={(e) => setForm({ ...form, class_section: e.target.value })}
            required
          />
          <Input
            label="Telegram Chat ID (Optional)"
            placeholder="For notifications"
            value={form.telegram_chat_id}
            onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
          />

          {error && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
