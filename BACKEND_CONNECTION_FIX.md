# Backend Connection Troubleshooting Guide

## The Error
```
WARN  [ApiService] No working URL found, keeping default: http://localhost:8000/api
ERROR  [ApiService] Error creating intent: [TypeError: Network request failed]
```

## Solution Steps

### 1. Ensure Backend is Running

Open a new terminal and run:
```bash
cd D:\V1.2\pro--app\backend
.\venv\Scripts\Activate.ps1

# Install missing dependencies if needed
pip install -r requirements.txt
pip install google-generativeai

# Start the backend
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 2. Test Backend is Accessible

In another terminal:
```bash
cd D:\V1.2\pro--app\backend
python test_server.py
```

Or open a browser and go to:
- http://localhost:8000 (should show welcome message)
- http://localhost:8000/docs (should show API documentation)

### 3. Check Your Setup

#### If using Expo Go on Physical Device:
Your phone needs to connect to your computer's IP address, not localhost.

1. Find your computer's IP:
   ```bash
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.40)
   ```

2. The ApiService has been updated to include common IPs including yours (192.168.1.40)

3. Make sure your phone and computer are on the same WiFi network

4. Windows Firewall might block the connection. To allow it:
   - Open Windows Defender Firewall
   - Click "Allow an app or feature"
   - Find Python and ensure it's allowed on Private networks

#### If using Android Emulator:
- The emulator uses `10.0.2.2` to reach your host machine
- This is already configured in ApiService

#### If using iOS Simulator (Mac):
- Use `localhost` or `127.0.0.1`
- Already configured in ApiService

### 4. Restart the Frontend

After backend is running:
```bash
cd D:\V1.2\pro--app
npm start
```

Press `r` in the Expo terminal to reload the app.

### 5. Common Issues and Fixes

#### Backend not starting:
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt
pip install google-generativeai firebase-admin spacy
```

#### Port 8000 already in use:
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process using the PID from above
taskkill /PID <PID> /F

# Or use a different port
python main.py --port 8001
```

#### Firewall blocking connection:
1. Temporarily disable Windows Firewall to test
2. If it works, add Python to firewall exceptions
3. Re-enable firewall

#### CORS errors:
The backend is configured to allow all origins (`*`). If you still get CORS errors, check browser console for details.

### 6. Debug Information

The ApiService will log which URLs it's trying. Check the Expo console for messages like:
```
[ApiService] Testing http://localhost:8000...
[ApiService] Testing http://192.168.1.40:8000...
```

### 7. Alternative: Use ngrok for Testing

If local connection doesn't work, use ngrok to expose your backend:
```bash
# Install ngrok
# Download from https://ngrok.com/

# Run backend
python main.py

# In another terminal
ngrok http 8000

# Use the ngrok URL in your frontend
# Update ApiService.ts to include the ngrok URL
```

## Quick Checklist

- [ ] Backend is running (`python main.py`)
- [ ] Can access http://localhost:8000/docs in browser
- [ ] Phone/emulator is on same network as computer
- [ ] Windows Firewall allows Python
- [ ] Frontend has been restarted after backend started
- [ ] Check Expo console for connection attempts

## Still Having Issues?

1. Check backend logs for errors
2. Check Expo console for detailed error messages
3. Try the test script: `python test_server.py`
4. Verify .env file has all required keys
5. Try with a simple curl command:
   ```bash
   curl http://localhost:8000/api/health
   ```