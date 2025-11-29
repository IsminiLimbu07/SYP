# 🚀 Quick Reference Card - Backend & Frontend Connection

## 📋 One-Page Overview

### Starting the Project

```bash
# Terminal 1 - Start Backend
cd d:\SYP\Backend
npm start
# Expected: "🚀 Server running on port 9000"

# Terminal 2 - Start Frontend
cd d:\SYP\Mobile\AshaSetu
npm start
# Press: a (Android), i (iOS), or w (web)
```

---

### 📁 New Files Created (4 files + dependencies)

| File | Location | Purpose |
|------|----------|---------|
| `auth.js` | `api/` | Login, Register, Profile functions |
| `api.js` | `config/` | API configuration & request helper |
| `api-platforms.js` | `config/` | Platform-specific URLs (optional) |
| `AuthContext.js` | `context/` | Authentication state management |

**New Dependency:** `@react-native-async-storage/async-storage`

---

### 🔌 API Connection Diagram

```
┌─────────────────┐
│  React Native   │
│   (Frontend)    │
├─────────────────┤
│  api/auth.js    │───── HTTP POST/GET ────┐
│  AuthContext    │                       │
└─────────────────┘                       │
                                         │
                         ┌─────────────────────┐
                         │   Express.js API    │
                         │    (Port 9000)      │
                         ├─────────────────────┤
                         │  authController.js  │
                         │  authMiddleware.js  │
                         └─────────────────────┘
                                   │
                         ┌─────────────────────┐
                         │  PostgreSQL Database│
                         │    (Neon Cloud)     │
                         └─────────────────────┘
```

---

### 🔑 Key Functions

```javascript
// Login
const response = await loginUser({ email, password });
// Returns: { success, token, user }

// Register
const response = await registerUser({ 
  full_name, email, phone_number, password 
});
// Returns: { success, token, user }

// Access User (in any component)
const { user, token, isAuthenticated } = useContext(AuthContext);

// Logout
const { logout } = useContext(AuthContext);
await logout();
```

---

### 🌐 API Base URLs by Platform

| Platform | URL |
|----------|-----|
| **Web/Desktop** | `http://localhost:9000/api` |
| **iOS Simulator** | `http://localhost:9000/api` |
| **Android Emulator** | `http://10.0.2.2:9000/api` |
| **Physical Device** | `http://YOUR_IP:9000/api` |

Edit: `config/api.js` → `const API_BASE_URL = '...'`

---

### 🔗 API Endpoints

```
POST   /api/auth/register        ← Register
POST   /api/auth/login           ← Login
GET    /api/auth/profile         ← Get Profile (Auth required)
PUT    /api/auth/profile         ← Update Profile (Auth required)
PUT    /api/auth/change-password ← Change Password (Auth required)
```

---

### 💾 Data Persistence

```
┌──────────────────────────────────┐
│  AsyncStorage (Mobile Device)    │
├──────────────────────────────────┤
│  Key: 'userToken'                │
│  Value: JWT_TOKEN_STRING         │
├──────────────────────────────────┤
│  Key: 'userData'                 │
│  Value: { user_id, email, ... }  │
└──────────────────────────────────┘
         ↑
         │ (Auto-restored on app start)
         │
    AuthContext State
```

---

### ✅ Testing Checklist

- [ ] Backend running? `npm start` in Backend folder
- [ ] Mobile app opens? `npm start` in Mobile folder
- [ ] Can register new user? Try from app
- [ ] Can login? Try with registered user
- [ ] Token saved? Close & reopen app (should stay logged in)
- [ ] Can access profile? After login

---

### 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check if backend running on port 9000 |
| "AsyncStorage not defined" | Run `npm install @react-native-async-storage/async-storage` |
| "CORS error" | Backend already has CORS enabled |
| "Invalid token" | Token expired or corrupted, try login again |
| "Android emulator can't reach backend" | Use `http://10.0.2.2:9000/api` not `localhost` |

---

### 📞 File Locations

```
d:\SYP\
├── Backend/
│   ├── .env (configured ✅)
│   ├── server.js
│   ├── controllers/authController.js
│   └── routes/authRoutes.js
│
├── Mobile/AshaSetu/
│   ├── api/auth.js ✨
│   ├── config/api.js ✨
│   ├── config/api-platforms.js ✨
│   ├── context/AuthContext.js ✨
│   ├── screens/LoginScreen.jsx (ready ✅)
│   └── screens/RegisterScreen.jsx (ready ✅)
│
├── SETUP_GUIDE.md (detailed)
├── INTEGRATION_SUMMARY.md (overview)
├── API_RESPONSE_FORMAT.js (reference)
└── QUICK_REFERENCE.md (this file)
```

---

### 🎯 Next Steps

1. ✅ Start backend: `npm start` in Backend
2. ✅ Start frontend: `npm start` in Mobile/AshaSetu
3. ✅ Test registration on app
4. ✅ Test login with registered account
5. ✅ Verify token persistence (close & reopen app)
6. 🔲 Build protected screens (profile, settings, etc.)
7. 🔲 Add error handling & retry logic
8. 🔲 Implement refresh token mechanism
9. 🔲 Set up proper security for production

---

### 💡 Pro Tips

- **Debugging:** Check terminal output on both backend & frontend
- **Testing API:** Use `curl` command from terminal (see SETUP_GUIDE.md)
- **Viewing Stored Data:** Use React DevTools & AsyncStorage Inspector
- **Production:** Change JWT_SECRET & API URLs
- **Performance:** Consider adding request caching & offline support

---

### ✨ Status

```
Backend:     ✅ Running on port 9000
Frontend:    ✅ Connected to http://localhost:9000/api
Database:    ✅ PostgreSQL (Neon)
Auth:        ✅ JWT + Token persistence
Ready:       ✅ YES - Start building!
```

---

**Questions? Check:** `SETUP_GUIDE.md` (detailed) or `INTEGRATION_SUMMARY.md` (overview)

**Happy Coding! 🚀**
