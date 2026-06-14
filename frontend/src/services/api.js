import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min timeout for image processing
  headers: {
    'Accept': 'application/json',
  }
})

// Add JWT token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('attendo_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('attendo_token')
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ──── Auth API ────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
}

// ──── Student API ────
export const studentAPI = {
  list: (classSection, search) =>
    api.get('/students/', { params: { class_section: classSection, search } }),
  
  get: (studentId) =>
    api.get(`/students/${studentId}`),
  
  register: (formData) =>
    api.post('/students/register', formData),
  
  uploadFace: (studentId, formData) =>
    api.post(`/students/${studentId}/upload-face`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (studentId, formData) =>
    api.put(`/students/${studentId}`, formData),
  
  delete: (studentId) =>
    api.delete(`/students/${studentId}`),
  
  getClasses: () =>
    api.get('/students/classes'),
  
  updateTelegram: (studentId, chatId) =>
    api.post(`/students/${studentId}/telegram`, new URLSearchParams({ chat_id: chatId })),
}

// ──── Attendance API ────
export const attendanceAPI = {
  process: (formData) =>
    api.post('/attendance/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  history: (classSection, dateFilter, studentId) =>
    api.get('/attendance/history', {
      params: { class_section: classSection, date_filter: dateFilter, student_id: studentId }
    }),
  
  summary: (classSection, dateFilter) =>
    api.get('/attendance/summary', {
      params: { class_section: classSection, date_filter: dateFilter }
    }),
  
  dashboard: () =>
    api.get('/attendance/dashboard'),
  
  export: (classSection, dateFilter) =>
    api.get('/attendance/export', {
      params: { class_section: classSection, date_filter: dateFilter }
    }),

  studentStats: (classSection) =>
    api.get('/attendance/student-stats', {
      params: { class_section: classSection }
    }),
}

// ──── Telegram API ────
export const telegramAPI = {
  getBotInfo: () =>
    api.get('/telegram/bot-info'),
}

export default api
