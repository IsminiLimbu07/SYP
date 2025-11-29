# Backend & Frontend Connection Setup Guide

## ✅ Setup Complete!

Your AshaSetu backend and frontend have been successfully connected. Here's what was configured:

---

## 📁 Files Created

### Mobile App (Frontend)

1. **`api/auth.js`** - Authentication API functions
   - `loginUser()` - Login endpoint
   - `registerUser()` - Registration endpoint
   - `getProfile()` - Fetch user profile
   - `updateProfile()` - Update profile
   - `changePassword()` - Change password

2. **`config/api.js`** - API configuration
   - Base URL configuration
   - Request helper function
   - Endpoint definitions

3. **`context/AuthContext.js`** - Authentication context
   - User state management
   - Token persistence using AsyncStorage
   - Login/logout/updateUser functions

4. **`.env.example`** - Environment configuration template

### New Dependencies

- `@react-native-async-storage/async-storage` - For storing tokens & user data

---

## 🚀 Running the Project

### 1. Start the Backend Server

```bash
cd d:\SYP\Backend
npm start
```

Expected output:
```
✅ Database initialized successfully.
🚀 Server running on port 9000
📍 API Base URL: http://localhost:9000
📝 Health check: http://localhost:9000/
```

### 2. Start the Mobile App

```bash
cd d:\SYP\Mobile\AshaSetu
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

---

## 🔌 API Configuration

The frontend is configured to connect to `http://localhost:9000/api`

### Available Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/auth/register` | POST | ❌ | User registration |
| `/api/auth/login` | POST | ❌ | User login |
| `/api/auth/profile` | GET | ✅ | Get user profile |
| `/api/auth/profile` | PUT | ✅ | Update user profile |
| `/api/auth/change-password` | PUT | ✅ | Change password |

---

## 📱 Mobile Development Emulators

### For Android Emulator
If testing on Android emulator, update the API base URL in `config/api.js`:
```javascript
const API_BASE_URL = 'http://10.0.2.2:9000/api'; // Android emulator bridge
```

### For iOS Simulator
```javascript
const API_BASE_URL = 'http://localhost:9000/api'; // iOS simulator (localhost works)
```

### For Physical Device
Replace with your machine's IP address:
```javascript
const API_BASE_URL = 'http://192.168.x.x:9000/api'; // Your machine IP
```

---

## 🔐 Authentication Flow

1. **User registers** → Backend creates user & returns JWT token
2. **Token stored** → AsyncStorage saves token locally
3. **Token persists** → On app restart, user remains logged in
4. **Protected requests** → Token sent in Authorization header
5. **Token expires** → After 7 days, user must login again

---

## 📝 Environment Variables

### Backend (.env)
Already configured in `d:\SYP\Backend\.env`:
- `PORT=9000`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=ashasetu_secret_key_2025_change_in_production`

### Mobile (.env - Optional)
You can create `.env` in mobile app root if needed:
```
REACT_APP_API_BASE_URL=http://localhost:9000/api
```

---

## ✨ Features Configured

### Authentication Context
- ✅ User login/logout
- ✅ Token persistence
- ✅ User data storage
- ✅ Loading states
- ✅ Authentication checks

### API Integration
- ✅ Centralized API configuration
- ✅ Error handling
- ✅ Token-based authentication
- ✅ Request/response formatting
- ✅ Bearer token in headers

### Login Screen Integration
- ✅ Connected to backend login endpoint
- ✅ Token and user data saved
- ✅ Error handling with alerts
- ✅ Loading states

### Register Screen Integration
- ✅ Connected to backend registration endpoint
- ✅ Automatic login after registration
- ✅ Success notifications

---

## 🧪 Testing the Connection

### 1. Test Backend Health Check
```bash
curl http://localhost:9000/
```

Expected response:
```json
{
  "message": "AshaSetu API Server is running 🚀",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth"
  }
}
```

### 2. Test Registration (from terminal)
```bash
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone_number": "9800123456",
    "password": "password123"
  }'
```

### 3. Test Login (from terminal)
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 9000 is already in use
- Verify `.env` file exists with DATABASE_URL
- Ensure bcryptjs is installed: `npm install bcryptjs`

### Frontend can't connect to backend
- Check if backend is running on http://localhost:9000
- Verify API_BASE_URL in `config/api.js`
- For emulator, use `http://10.0.2.2:9000` (Android) or `http://localhost:9000` (iOS)
- For physical device, use your machine's IP address

### AsyncStorage errors
- Ensure `@react-native-async-storage/async-storage` is installed
- Verify it's properly linked in your React Native project

### CORS issues
- Backend CORS is already configured with `cors()` middleware
- All origins are allowed by default

---

## 📚 Next Steps

1. ✅ Backend and frontend are connected
2. Test registration and login flows
3. Implement protected screens (profile, edit profile, etc.)
4. Add more API endpoints as needed
5. Set up proper error handling and retry logic
6. Implement refresh token mechanism for better security

---

## 📞 Support Files

- Backend: `d:\SYP\Backend\`
- Mobile App: `d:\SYP\Mobile\AshaSetu\`
- Configuration: See `.env` files in respective directories

---

**Connection Status: ✅ ACTIVE**

Backend is running on `http://localhost:9000`
Mobile app is ready to connect!
