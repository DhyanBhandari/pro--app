# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native app with Expo called "Universal Connection Platform" - a glassmorphism-designed mobile application that connects users through AI-powered intent matching. The project is currently in Phase 2 with Firebase authentication, FastAPI backend, and Supabase database integration.

## Development Commands

### Frontend (React Native/Expo)
```bash
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator  
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run in web browser
npm run lint               # Run ESLint
npm test                   # Run tests
```

### Backend (FastAPI)
```bash
cd backend
# PowerShell commands:
venv\Scripts\python.exe main_simple.py    # Start simple test server (port 8000)
venv\Scripts\python.exe main.py          # Start full server with database

# Alternative:
.\venv\Scripts\Activate.ps1               # Activate virtual environment first
python main_simple.py                     # Then run server
```

### Testing
```bash
# Backend tests
cd backend
pytest                                    # Run all backend tests
pytest tests/test_matching.py -v         # Run specific test file
pytest --cov=app tests/                   # Run with coverage

# Integration testing
python test_connection.py                # Test API connectivity
python test_integration.py               # Test full flow
```

## Architecture Overview

### Authentication Architecture
- **Primary**: Firebase Authentication (Web SDK) for user management
- **Secondary**: AuthServiceV2 with multi-mode support (`firebase` | `api` | `mock`)
- **Database**: Supabase for user profiles and application data
- **Flow**: Firebase Auth → Get ID token → API calls with Bearer token → Supabase sync

### Service Architecture
```
Frontend Services:
├── AuthServiceV2         # Multi-mode authentication (Firebase/API/Mock)
├── MatchingService       # Search and intent creation (requires auth)
├── ApiService           # Backend communication with auto URL detection
├── SupabaseService      # Database operations and Firebase user sync
├── StorageService       # AsyncStorage wrapper
└── ValidationService    # Form validation
```

### Context Architecture
```
React Contexts:
├── MatchingContext      # Search state, intent creation, matches
└── AuthContext         # User authentication state (if implemented)
```

### Backend Architecture (FastAPI)
```
backend/
├── app/
│   ├── api/endpoints/   # REST endpoints (auth, intents, users)
│   ├── core/           # Configuration, database, security
│   ├── models/         # Database models
│   ├── schemas/        # Pydantic schemas
│   └── services/       # Business logic (ML matching, NLP, embeddings)
├── main.py             # Full server with database
├── main_simple.py      # Simple test server without database
└── scripts/            # Database setup, test data generation
```

## Key Implementation Details

### Authentication Flow
1. User registers/logs in via Firebase
2. Firebase returns ID token
3. Token passed to all API calls as `Authorization: Bearer {token}`
4. Backend validates Firebase token
5. User profile synced to Supabase automatically
6. **No test accounts** - all users must register authentically

### Matching/Search Flow
1. User search requires authentication (MatchingContext checks auth state)
2. Uses `matchingService.performSearch(query, location, authToken)`
3. MatchingService calls `apiService.createIntent()` with auth token
4. Intent stored in database linked to authenticated user
5. Matches returned only to authenticated users

### API Service URL Detection
ApiService automatically tests multiple URLs in order:
```javascript
const urls = [
  'http://localhost:8000',    // Simple test server (preferred)
  'http://127.0.0.1:8000',
  'http://localhost:8001',
  'http://127.0.0.1:8001',
  'http://192.168.13.236:8000',
  'http://10.0.2.2:8000'     # Android emulator
];
```

### Firebase Configuration
Uses Firebase Web SDK (not React Native Firebase) for Expo compatibility:
```typescript
// Configuration in src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyD2uVhZHFHManM-TLc0McOODr8v0Wt7o4U",
  authDomain: "supper-8cb60.firebaseapp.com", 
  projectId: "supper-8cb60",
  // ... other config
};
```

## Important Development Notes

### Authentication Requirements
- **All searches require authentication** - no anonymous usage
- AuthServiceV2 defaults to `firebase` mode, falls back to `api` or `mock`
- Mock mode has empty user database - must register to use
- Use `authServiceV2.setAuthMode('mock')` for development without Firebase

### Database Sync
- Firebase handles authentication
- Supabase handles application data (user profiles, intents, matches)
- User profiles auto-sync between Firebase and Supabase on auth state changes

### Backend Development
- Use `main_simple.py` for basic API testing (no database required)
- Use `main.py` for full functionality with Supabase database
- Virtual environment is in `backend/venv/`
- Generated test data in `generated_intents.json` and `generated_profiles.json`

### Common Patterns
- All services use singleton pattern (`getInstance()`)
- Services export both class and instance: `export { ServiceClass, serviceInstance }`
- Async operations use proper error handling with try/catch
- UI components follow glassmorphism design system
- TypeScript strict mode enabled

### Error Handling
- API service has automatic retry and fallback URL logic
- Authentication errors show user-friendly messages
- Network failures fall back to cached/mock data where appropriate
- All async operations wrapped in try/catch with proper error propagation

## File Structure Highlights

```
src/
├── components/         # Reusable UI components (GlassCard, NeonButton, etc.)
├── screens/           # App screens (Home, Login, Matching, etc.) 
├── navigation/        # React Navigation setup
├── services/          # Business logic and API services
├── contexts/          # React contexts for state management
├── config/           # Configuration files (Firebase, etc.)
├── types/            # TypeScript type definitions
└── themes/           # Glassmorphism design system

backend/
├── app/              # FastAPI application
├── scripts/          # Database setup and utilities
├── tests/            # Test files
├── main.py           # Full server
├── main_simple.py    # Test server
└── requirements.txt  # Python dependencies
```

## Development Workflow
1. Start backend server: `cd backend && venv\Scripts\python.exe main_simple.py`
2. Start frontend: `npm start`
3. Test authentication flow with real Firebase registration
4. Use Expo Go app for mobile testing or web browser for quick testing
5. Check backend API docs at `http://localhost:8000/docs` when server is running

## Testing Strategy
- Backend has comprehensive pytest test suite
- Frontend testing through Expo/React Native testing tools
- Manual testing via Expo Go app on physical devices
- API testing via FastAPI auto-generated docs interface