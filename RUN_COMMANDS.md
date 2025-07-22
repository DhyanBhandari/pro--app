# Universal Connection Platform - Run Commands Guide

## Prerequisites

Ensure you have the following installed:
- Node.js (v16 or higher)
- Python 3.8+
- PostgreSQL (if running locally, otherwise Supabase handles it)
- Expo CLI
- Git

## 🚀 Quick Start Commands

### 1. Frontend (React Native/Expo)

```bash
# Navigate to project root
cd D:\V1.2\pro--app

# Install dependencies
npm install

# Start Expo development server
npm start

# Alternative commands:
npm run android     # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator (Mac only)
npm run web        # Run in web browser
```

### 2. Backend (FastAPI)

```bash
# Navigate to backend directory
cd D:\V1.2\pro--app\backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
venv\Scripts\activate.bat

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install additional dependencies for advanced matching
pip install google-generativeai spacy firebase-admin
python -m spacy download en_core_web_sm

# Run the backend server
# Option 1: Simple test server (no database required)
python main_simple.py

# Option 2: Full server with database
python main.py
```

## 🔧 Detailed Setup Commands

### First-Time Setup

```bash
# 1. Clone the repository (if not already done)
git clone <your-repo-url>
cd pro--app

# 2. Setup Frontend
npm install
npx expo install

# 3. Setup Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
pip install google-generativeai spacy firebase-admin
python -m spacy download en_core_web_sm

# 4. Setup Database (Supabase)
# Run the SQL setup scripts
cd scripts
# Copy the SQL content from setup_advanced_matching.sql and run in Supabase SQL editor
```

### Environment Configuration

```bash
# 1. Create backend .env file
cd backend
# Create .env file with the following content:

# Backend .env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
FIREBASE_ADMIN_SDK_PATH=./serviceAccountKey.json
GEMINI_API_KEY=your-gemini-api-key
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 2. Setup Firebase Admin SDK
# Download serviceAccountKey.json from Firebase Console
# Place it in backend/ directory
```

## 🏃 Running the Project

### Development Mode (Recommended)

```bash
# Terminal 1: Start Backend
cd D:\V1.2\pro--app\backend
.\venv\Scripts\Activate.ps1
python main_simple.py
# Backend will run on http://localhost:8000

# Terminal 2: Start Frontend
cd D:\V1.2\pro--app
npm start
# Expo will start on http://localhost:19002
# Scan QR code with Expo Go app on your phone
```

### Production Mode

```bash
# Backend with full features
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Frontend for production
npm run build
# or
expo build:android
expo build:ios
```

## 📱 Testing on Devices

### Android

```bash
# With Android emulator running
npm run android

# With physical device
# 1. Enable Developer Mode and USB Debugging on device
# 2. Connect via USB
# 3. Run:
adb devices  # Verify device is connected
npm run android
```

### iOS (Mac only)

```bash
# With iOS simulator
npm run ios

# With physical device
# 1. Connect iPhone via USB
# 2. Trust computer on device
# 3. Run:
npm run ios --device
```

### Web Browser

```bash
npm run web
# Opens in default browser at http://localhost:19006
```

## 🧪 Testing Commands

### Backend Tests

```bash
cd backend
.\venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run specific test file
pytest tests/test_matching.py -v

# Run with coverage
pytest --cov=app tests/

# Test specific endpoint
python test_connection.py
python test_integration.py
```

### Frontend Tests

```bash
# Run Jest tests
npm test

# Run with coverage
npm run test:coverage
```

## 🛠️ Common Development Commands

### Database Migrations

```bash
cd backend

# Initialize Alembic (first time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add vector column"

# Apply migrations
alembic upgrade head
```

### Code Quality

```bash
# Frontend
npm run lint
npm run lint:fix

# Backend
cd backend
.\venv\Scripts\Activate.ps1
black app/  # Format code
flake8 app/  # Lint code
mypy app/   # Type checking
```

### Building for Production

```bash
# Frontend
expo build:android -t apk
expo build:ios -t archive

# Backend Docker
docker build -t ucp-backend .
docker run -p 8000:8000 ucp-backend
```

## 🐛 Troubleshooting Commands

### Clear Cache

```bash
# Expo cache
expo start -c

# NPM cache
npm cache clean --force

# Python cache
find . -type d -name __pycache__ -exec rm -r {} +
```

### Reset Everything

```bash
# Frontend
rm -rf node_modules
rm package-lock.json
npm install

# Backend
cd backend
deactivate  # If venv is active
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Check Service Status

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check API docs
open http://localhost:8000/docs

# Check database connection
python -c "from app.core.database import get_supabase; print(get_supabase())"
```

## 📊 Monitoring Commands

### Logs

```bash
# Backend logs
python main.py 2>&1 | tee backend.log

# Frontend logs
npm start | tee frontend.log

# View real-time logs
tail -f backend.log
```

### Performance

```bash
# Backend performance
uvicorn app.main:app --reload --log-level debug

# Check API response times
ab -n 100 -c 10 http://localhost:8000/api/health
```

## 🚀 Quick Commands Reference

```bash
# Start everything (2 terminals)
# Terminal 1:
cd backend && .\venv\Scripts\Activate.ps1 && python main_simple.py

# Terminal 2:
npm start

# Stop everything
# Ctrl+C in both terminals

# Restart backend
# Ctrl+C then:
python main_simple.py

# Restart frontend
# Press 'r' in Expo terminal
```

## 📝 Environment-Specific Commands

### Windows PowerShell

```bash
# Allow script execution (admin required)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Activate venv
.\venv\Scripts\Activate.ps1
```

### Mac/Linux

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Activate venv
source venv/bin/activate
```

### Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Need Help?

1. Check backend API docs: http://localhost:8000/docs
2. Check Expo DevTools: http://localhost:19002
3. View error logs in terminal
4. Check CLAUDE.md for project-specific guidance