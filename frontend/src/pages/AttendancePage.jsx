import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import Webcam from 'react-webcam'
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  Send,
  RefreshCw,
  Scan,
  Sparkles,
  Eye,
} from 'lucide-react'
import { attendanceAPI, studentAPI } from '../services/api'
import { PageHeader, Button, Select, Badge, LoadingSpinner } from '../components/ui'

export default function AttendancePage() {
  const [mode, setMode] = useState('upload') // 'upload' | 'camera'
  const [classSection, setClassSection] = useState('')
  const [classes, setClasses] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  const webcamRef = useRef(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await studentAPI.getClasses()
      setClasses(data.classes || [])
      if (data.classes?.length > 0) {
        setClassSection(data.classes[0])
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const captureFromCamera = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      // Convert base64 to blob
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
          setSelectedFile(file)
          setPreviewUrl(imageSrc)
          setResult(null)
          setError(null)
        })
    }
  }, [])

  const processAttendance = async () => {
    if (!selectedFile || !classSection) {
      setError('Please select a class and upload/capture an image')
      return
    }

    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('class_section', classSection)

      const { data } = await attendanceAPI.process(formData)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process attendance')
    } finally {
      setProcessing(false)
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Take Attendance"
        subtitle="Upload a classroom photo or capture one to mark attendance"
      />

      {/* Class Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Select
            label="Select Class / Section"
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
            options={[
              { value: '', label: '-- Select Class --' },
              ...classes.map(c => ({ value: c, label: c }))
            ]}
            className="flex-1"
          />
          
          {/* Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-surface-600/50">
            <button
              onClick={() => setMode('upload')}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-all ${
                mode === 'upload'
                  ? 'gradient-primary text-white'
                  : 'bg-surface-800/50 text-surface-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-all ${
                mode === 'camera'
                  ? 'gradient-primary text-white'
                  : 'bg-surface-800/50 text-surface-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-400" />
            {mode === 'upload' ? 'Upload Photo' : 'Live Camera'}
          </h3>

          {mode === 'upload' ? (
            <>
              {!previewUrl ? (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300
                    flex flex-col items-center justify-center text-center
                    ${isDragActive
                      ? 'border-primary-400 bg-primary-500/10'
                      : 'border-surface-600/50 hover:border-primary-500/50 hover:bg-primary-500/5'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-surface-300 font-medium mb-1">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop classroom photo'}
                  </p>
                  <p className="text-surface-500 text-sm">or click to browse (max 10MB)</p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-2xl" />
                  <button
                    onClick={resetState}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-surface-900">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-auto"
                  videoConstraints={{
                    facingMode: 'environment',
                    width: 1280,
                    height: 720,
                  }}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={captureFromCamera} icon={Camera} className="flex-1">
                  Capture Photo
                </Button>
                {previewUrl && (
                  <Button onClick={resetState} variant="secondary" icon={RefreshCw}>
                    Retake
                  </Button>
                )}
              </div>
              {previewUrl && (
                <div className="rounded-2xl overflow-hidden border border-primary-500/20">
                  <img src={previewUrl} alt="Captured" className="w-full h-auto" />
                </div>
              )}
            </div>
          )}

          {/* Process Button */}
          <div className="mt-6">
            <Button
              onClick={processAttendance}
              disabled={!selectedFile || !classSection || processing}
              icon={processing ? Loader2 : Scan}
              size="lg"
              className={`w-full ${processing ? 'animate-pulse' : ''}`}
            >
              {processing ? 'Processing Faces...' : 'Process Attendance'}
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
              <p className="text-danger-300 text-sm">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Right: Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-400" />
            Recognition Results
          </h3>

          {processing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary-500/20 border-t-primary-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-primary-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-surface-300 font-medium mt-6">Analyzing faces...</p>
              <p className="text-surface-500 text-sm mt-1">This may take a few seconds</p>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Result Image */}
              {result.image_base64 && (
                <div className="rounded-2xl overflow-hidden border border-primary-500/20">
                  <img
                    src={`data:image/jpeg;base64,${result.image_base64}`}
                    alt="Processed"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-800/50 text-center">
                  <p className="text-2xl font-bold text-white">{result.total_faces}</p>
                  <p className="text-xs text-surface-400">Total Faces</p>
                </div>
                <div className="p-3 rounded-xl bg-success-500/10 text-center border border-success-500/20">
                  <p className="text-2xl font-bold text-success-400">{result.recognized}</p>
                  <p className="text-xs text-surface-400">Recognized</p>
                </div>
                <div className="p-3 rounded-xl bg-warning-500/10 text-center border border-warning-500/20">
                  <p className="text-2xl font-bold text-warning-400">{result.unknown}</p>
                  <p className="text-xs text-surface-400">Unknown</p>
                </div>
              </div>

              {/* Individual Face Results */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-surface-300">Detected Faces</h4>
                {result.faces?.map((face, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-colors
                      ${face.status === 'recognized'
                        ? 'bg-success-500/5 border-success-500/20'
                        : 'bg-warning-500/5 border-warning-500/20'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        face.status === 'recognized' ? 'bg-success-500/20' : 'bg-warning-500/20'
                      }`}>
                        {face.status === 'recognized' ? (
                          <CheckCircle2 className="w-4 h-4 text-success-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-warning-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-200">{face.name}</p>
                        {face.student_id && (
                          <p className="text-xs text-surface-500 font-mono">{face.student_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={face.status === 'recognized' ? 'success' : 'warning'}>
                        {face.confidence.toFixed(0)}%
                      </Badge>
                      {face.telegram_sent && (
                        <p className="text-[10px] text-accent-400 mt-1 flex items-center gap-1 justify-end">
                          <Send className="w-3 h-3" /> Notified
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Timestamp */}
              <div className="text-center text-xs text-surface-500">
                📅 {result.date} • 🕒 {result.time}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800/50 flex items-center justify-center mb-4">
                <Scan className="w-8 h-8 text-surface-500" />
              </div>
              <p className="text-surface-400 font-medium">No results yet</p>
              <p className="text-surface-500 text-sm mt-1">Upload or capture a photo to begin</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
