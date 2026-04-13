import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Bot,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Copy,
  Users,
} from 'lucide-react'
import { telegramAPI, studentAPI } from '../services/api'
import { PageHeader, Button, Badge, LoadingSpinner } from '../components/ui'

export default function TelegramPage() {
  const [botInfo, setBotInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [botRes, studentsRes] = await Promise.all([
        telegramAPI.getBotInfo().catch(() => ({ data: { configured: false } })),
        studentAPI.list()
      ])
      setBotInfo(botRes.data)
      setStudents(studentsRes.data.students || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, studentId) => {
    navigator.clipboard.writeText(text)
    setCopied(studentId)
    setTimeout(() => setCopied(null), 2000)
  }

  const linkedStudents = students.filter(s => s.telegram_chat_id)
  const unlinkedStudents = students.filter(s => !s.telegram_chat_id)

  if (loading) return <LoadingSpinner text="Loading Telegram info..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telegram Integration"
        subtitle="Manage Telegram bot and student notifications"
      />

      {/* Bot Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            botInfo?.configured ? 'gradient-success' : 'gradient-danger'
          }`}>
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Telegram Bot Status</h3>
            {botInfo?.configured ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-400" />
                  <span className="text-sm text-success-300">Bot is connected and active</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-surface-400">
                  <span>🤖 <span className="text-white">{botInfo.bot_name}</span></span>
                  <span>@{botInfo.bot_username}</span>
                </div>
                <a
                  href={`https://t.me/${botInfo.bot_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors mt-1"
                >
                  Open in Telegram <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning-400" />
                  <span className="text-sm text-warning-300">Bot token not configured</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/30">
                  <h4 className="text-sm font-medium text-surface-300 mb-2">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-surface-400">
                    <li>Open Telegram and search for <span className="text-white font-mono">@BotFather</span></li>
                    <li>Send <span className="text-white font-mono">/newbot</span> and follow the steps</li>
                    <li>Copy the bot token provided</li>
                    <li>Add the token to <span className="text-white font-mono">backend/.env</span> as <span className="text-white font-mono">TELEGRAM_BOT_TOKEN</span></li>
                    <li>Restart the backend server</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          How Students Link Their Telegram
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Open Bot',
              desc: 'Student opens the Telegram bot link or searches for the bot',
              color: 'from-primary-500 to-primary-700',
            },
            {
              step: '2',
              title: 'Send Command',
              desc: 'Student sends /start STUDENT_ID (e.g., /start STU001)',
              color: 'from-accent-500 to-accent-600',
            },
            {
              step: '3',
              title: 'Automatic Link',
              desc: 'Bot automatically links the Telegram account and sends confirmation',
              color: 'from-success-500 to-success-600',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-4 rounded-xl bg-surface-800/30 border border-surface-700/30"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm mb-3`}>
                {item.step}
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-surface-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Student Link Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Students */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-400" />
              Linked Students
            </h3>
            <Badge variant="success">{linkedStudents.length}</Badge>
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {linkedStudents.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-6">No linked students yet</p>
            ) : (
              linkedStudents.map(student => (
                <div
                  key={student.student_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-success-500/5 border border-success-500/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center text-success-400 text-xs font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200">{student.name}</p>
                      <p className="text-[10px] text-surface-500 font-mono">{student.student_id}</p>
                    </div>
                  </div>
                  <Send className="w-3 h-3 text-success-400" />
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Unlinked Students */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning-400" />
              Unlinked Students
            </h3>
            <Badge variant="warning">{unlinkedStudents.length}</Badge>
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {unlinkedStudents.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-6">All students are linked! 🎉</p>
            ) : (
              unlinkedStudents.map(student => (
                <div
                  key={student.student_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-700/50 flex items-center justify-center text-surface-400 text-xs font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200">{student.name}</p>
                      <p className="text-[10px] text-surface-500 font-mono">{student.student_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`/start ${student.student_id}`, student.student_id)}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    {copied === student.student_id ? (
                      <><CheckCircle2 className="w-3 h-3" /> Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy cmd</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
