# Firebase Setup Guide for Universal Connection Platform

## Current Setup

For development and testing, we're using a **test user bypass** that doesn't require Firebase authentication. This allows you to test the app without setting up Firebase.

### Test User Details
- User ID: `test-user-123`
- Email: `test@example.com`
- Name: `Test User`
- Token: `test-token` (automatically used in development)

## Production Firebase Setup

When you're ready to implement real authentication with Firebase:

### 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google Sign-In (optional)

### 2. Add Android App

1. In Firebase Console, click "Add app" → Android
2. Register app with package name: `com.yourcompany.universalconnectionplatform`
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`

### 3. Add iOS App (if needed)

1. In Firebase Console, click "Add app" → iOS
2. Register app with bundle ID
3. Download `GoogleService-Info.plist`
4. Place it in: `ios/YourAppName/GoogleService-Info.plist`

### 4. Web Configuration

The app already has Firebase Web SDK configured in:
```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyD2uVhZHFHManM-TLc0McOODr8v0Wt7o4U",
  authDomain: "supper-8cb60.firebaseapp.com",
  projectId: "supper-8cb60",
  storageBucket: "supper-8cb60.firebasestorage.app",
  messagingSenderId: "718648291569",
  appId: "1:718648291569:web:6de5e014285dd2c6fad02a"
};
```

**Important**: Replace these with your own Firebase project credentials.

### 5. Enable Firebase in Backend

1. Download Service Account Key:
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `backend/serviceAccountKey.json`

2. Update backend `.env`:
   ```env
   FIREBASE_ADMIN_SDK_PATH=./serviceAccountKey.json
   ALLOW_TEST_USER=false  # Disable test user in production
   DEBUG=false
   ```

### 6. Update Frontend Services

In `src/services/AuthServiceV2.ts`, the app is already configured to use Firebase auth. Just ensure:
- Firebase is initialized with your config
- Auth mode is set to 'firebase' (not 'mock')

## Switching Between Test and Production

### Development Mode (Test User)
```env
# backend/.env
DEBUG=true
ALLOW_TEST_USER=true
```

Frontend will automatically use `test-token` when no real auth token exists.

### Production Mode (Real Firebase)
```env
# backend/.env
DEBUG=false
ALLOW_TEST_USER=false
FIREBASE_ADMIN_SDK_PATH=./serviceAccountKey.json
```

Users must authenticate with Firebase to access the API.

## Testing Authentication

### Test with Test User (Development)
```bash
# Backend should show:
[Security] Using test user for development

# Frontend should show:
[ApiService] Using test-token for development
```

### Test with Firebase (Production)
1. Register a new user via the app
2. Login with credentials
3. Check that Firebase token is being used:
   ```
   [AuthServiceV2] User signed in: user@example.com
   ```

## Troubleshooting

### Test User Not Working
1. Check backend `.env` has `ALLOW_TEST_USER=true`
2. Restart backend: `python main.py`
3. Check logs for: `[Security] Using test user for development`

### Firebase Not Working
1. Verify `google-services.json` is in correct location
2. Check Firebase project configuration matches app
3. Ensure Authentication is enabled in Firebase Console
4. Check network connectivity to Firebase servers

## Security Notes

- **Never use test user in production** - always set `ALLOW_TEST_USER=false`
- Keep `serviceAccountKey.json` secure and never commit to git
- Use environment variables for sensitive configuration
- Enable Firebase Security Rules for database access
- Implement proper user permissions in production