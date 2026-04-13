# Attendo - AI Smart Classroom Attendance System

A professional, AI-powered attendance system that recognizes multiple students from a single classroom photo and automatically sends personalized Telegram notifications.

## 🌟 Features

- **Multi-Face Recognition**: Upload a single classroom photo and detect all student faces
- **AI-Powered Matching**: Uses DeepFace (Facenet512) for accurate face embedding and matching
- **Telegram Notifications**: Automatic personalized attendance messages to each student
- **Student Registration**: Register students with multiple face images for better accuracy
- **Class-Based Filtering**: Filter attendance by class/section
- **Dashboard Analytics**: Visual charts and statistics for attendance trends
- **Attendance Statistics**: View long-term attendance percentage and class counts per student
- **CSV Export**: Export attendance records and statistical reports
- **Admin Authentication**: JWT-based secure admin login
- **Duplicate Prevention**: One attendance record per student per day

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python FastAPI |
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Database | MongoDB |
| AI/ML | DeepFace (Facenet512 + OpenCV) |
| Notifications | Telegram Bot API |
| Auth | JWT (python-jose) |

## 📁 Project Structure

```
attendo/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment config
│   │   ├── database.py          # MongoDB connection
│   │   ├── models.py            # Pydantic models
│   │   ├── routes/
│   │   │   ├── auth_routes.py   # Login endpoints
│   │   │   ├── student_routes.py # Student CRUD + face upload
│   │   │   ├── attendance_routes.py # Attendance processing
│   │   │   └── telegram_routes.py  # Telegram webhook
│   │   └── services/
│   │       ├── face_service.py  # DeepFace integration
│   │       ├── telegram_service.py # Telegram Bot API
│   │       └── auth_service.py  # JWT authentication
│   ├── requirements.txt
│   ├── .env
│   └── uploads/                 # Stored face images
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── ui.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── StudentsPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── StatisticsPage.jsx
│   │   │   ├── TelegramPage.jsx
│   │   │   └── LoginPage.jsx
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (running locally or cloud URI)
- Telegram Bot Token (from @BotFather)

### 1. Clone & Configure

```bash
cd attendo

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and Telegram Bot Token
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Default Login

- **Username**: `admin` (or as set in `.env`)
- **Password**: As set in your `backend/.env` file

## 📱 Telegram Bot Setup

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the bot token
4. Paste token in `backend/.env` as `TELEGRAM_BOT_TOKEN`
5. Students link accounts by sending: `/start STUDENT_ID`

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `attendo` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from BotFather | — |
| `JWT_SECRET` | Secret key for JWT tokens | — |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/students/` | List students |
| POST | `/api/students/register` | Register student |
| POST | `/api/students/{id}/upload-face` | Upload face image |
| POST | `/api/attendance/process` | Process group photo |
| GET | `/api/attendance/history` | Get attendance logs |
| GET | `/api/attendance/dashboard` | Dashboard stats |
| GET | `/api/attendance/student-stats` | Student-wise statistics |
| GET | `/api/attendance/export` | Export as CSV data |
| POST | `/api/telegram/webhook` | Telegram webhook |

## 📝 License

MIT
