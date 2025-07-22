# Backend Setup Instructions

## Quick Start

1. **Run the Backend Server:**
   ```bash
   cd backend
   start_server.bat
   ```
   This will start the server at `http://localhost:8000`

2. **Alternative Manual Start:**
   ```bash
   cd backend
   venv\Scripts\activate
   python main_simple.py
   ```

## Authentication Requirements

- **No Test Account**: The default test account has been removed
- **Registration Required**: Users must register with Firebase to access the app
- **Auth Required for Matches**: Only authenticated users can search and see matches
- **Intent Storage**: User intents are stored in the database after successful authentication

## API Endpoints

- `GET /` - Health check
- `POST /api/intents` - Create intent (requires auth token)
- `GET /api/intents/{intent_id}/matches` - Get matches (requires auth token)
- `POST /api/auth/login` - Login endpoint
- `POST /api/auth/register` - Registration endpoint

## Authentication Flow

1. User registers/logs in via Firebase
2. Firebase token is used for API authentication
3. User data syncs to Supabase database
4. Authenticated users can search and create intents
5. Matches are only shown to authenticated users

## Troubleshooting

- Make sure the virtual environment is activated
- Check that port 8000 is not in use
- Firebase configuration should be properly set up in the frontend
- Check API logs for any authentication issues