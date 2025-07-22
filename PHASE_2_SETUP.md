# Phase 2 Setup Guide - FastAPI Backend Integration

## 🎯 Phase 2 Overview

Phase 2 adds a complete FastAPI backend with real authentication, AI-powered matching, and Supabase database integration to the React Native app from Phase 1.

## 🛠️ Prerequisites

### Backend Requirements
- Python 3.8+ 
- Git
- Supabase account (free tier)

### Mobile Requirements
- Node.js 16+ 
- React Native development environment
- Android Studio / Xcode (for device testing)

## 📦 Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
.\venv\Scripts\Activate.ps1


# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm
```

### 2. Supabase Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy your project URL and anon key

2. **Run Database Schema**
   ```bash
   # View schema commands
   python scripts/setup_database.py
   
   # Copy the SQL commands and run them in Supabase SQL Editor
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials:
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_KEY=your-anon-key
   # JWT_SECRET=your-secret-key
   ```

### 3. Generate Test Data

```bash
# Generate 3000 test profiles with realistic intents
python scripts/generate_test_data.py
```

### 4. Start Backend Server

```bash
# Run FastAPI server
uvicorn main:app --reload

# Server will be available at: http://localhost:8000
# API docs available at: http://localhost:8000/docs
```

### 5. Mobile App Updates

```bash
# Navigate to mobile directory (if not already there)
cd ..  # from backend directory

# Install any new dependencies (if added)
npm install

# Start React Native app
npm run start
```

## 🔧 Configuration

### Backend Configuration (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Security Settings
EMBEDDING_NOISE_SCALE=0.01
RATE_LIMIT_PER_MINUTE=100
CORS_ORIGINS=*

# Optional: PostgreSQL direct connection
DATABASE_URL=postgresql://user:pass@host:port/database
```

### Mobile App Configuration

The mobile app automatically detects if the backend is running:
- **API Mode**: Connects to FastAPI backend (http://localhost:8000)
- **Mock Mode**: Falls back to mock data if backend unavailable

To force a specific mode in development:
```typescript
import { authServiceV2 } from '@/services';

// Force API mode
authServiceV2.setAuthMode('api');

// Force mock mode (for development without backend)
authServiceV2.setAuthMode('mock');
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run specific test files
pytest tests/test_matching.py -v
pytest tests/test_auth.py -v

# Test with coverage
pytest --cov=app tests/
```

### Mobile App Testing

```bash
# Run React Native tests (if available)
npm test

# Test API connection from mobile
# The app will show connection status in debug logs
```

## 🚀 Usage

### 1. Test Basic Functionality

1. **Start Backend**: `uvicorn main:app --reload`
2. **Test Health**: Visit `http://localhost:8000/api/health`
3. **Check Debug Info**: Visit `http://localhost:8000/api/debug/info`

### 2. Test Authentication

1. **Register New User**:
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

### 3. Test Intent Matching

1. **Create Intent**:
   ```bash
   curl -X POST http://localhost:8000/api/intents \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"raw_query":"Selling iPhone 13 in Whitefield for 40k"}'
   ```

2. **Get Matches**:
   ```bash
   curl -X GET http://localhost:8000/api/intents/INTENT_ID/matches \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/profile/{user_id}` - Get public user profile

### Intents
- `POST /api/intents` - Create new intent
- `GET /api/intents/my` - Get user's intents
- `GET /api/intents/{intent_id}/matches` - Get matches for intent
- `DELETE /api/intents/{intent_id}` - Deactivate intent

### System
- `GET /api/health` - Health check
- `GET /api/debug/info` - Debug information

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**
   ```bash
   # Check Python version
   python --version  # Should be 3.8+
   
   # Check if all dependencies installed
   pip list
   
   # Reinstall requirements
   pip install -r requirements.txt --force-reinstall
   ```

2. **spaCy model not found**
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Database connection errors**
   - Check Supabase credentials in `.env`
   - Verify database schema is created
   - Check Supabase project is active

4. **Mobile app can't connect to backend**
   - Ensure backend is running on `http://localhost:8000`
   - Check firewall/antivirus settings
   - Try switching to mock mode for development

5. **Test data generation fails**
   - Ensure database schema is created first
   - Check Supabase connection
   - Try smaller batch sizes if memory issues

### Debug Logs

Enable detailed logging:
```bash
# Backend
LOG_LEVEL=DEBUG uvicorn main:app --reload

# Mobile (React Native logs)
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

## 📊 Performance Monitoring

### Backend Performance
- FastAPI auto-generates metrics at `/metrics`
- Monitor database query performance in Supabase dashboard
- Vector similarity search performance with pgvector

### Mobile Performance
- Use React Native Debugger
- Monitor API response times
- Check authentication flow performance

## 🔄 Development Workflow

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start Mobile App** (Terminal 2):
   ```bash
   npm run start
   ```

3. **Run Tests** (Terminal 3):
   ```bash
   cd backend
   pytest tests/ --cov=app
   ```

4. **Generate New Test Data** (when needed):
   ```bash
   cd backend
   python scripts/generate_test_data.py
   ```

## 🎯 Next Steps (Phase 3)

Phase 2 provides a solid foundation. Potential Phase 3 enhancements:

1. **Real-time Chat** - WebSocket integration
2. **Push Notifications** - Match alerts
3. **Advanced Search** - Filters, location radius
4. **Image Upload** - Profile pictures, product images
5. **Payment Integration** - Transaction handling
6. **Admin Dashboard** - User management
7. **Analytics** - Usage metrics, match success rates

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [spaCy Documentation](https://spacy.io/usage)
- [sentence-transformers Documentation](https://www.sbert.net/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

## 🆘 Support

If you encounter issues:

1. Check this setup guide thoroughly
2. Review the debug logs
3. Test with curl commands
4. Verify environment configuration
5. Try the troubleshooting steps above

Happy coding! 🚀