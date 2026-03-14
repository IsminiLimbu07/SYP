# 🌐 Network Configuration Guide

## Problem Solved! ✅

Your app now works from **anywhere** without needing to change code every time your IP changes.

---

## 🎯 How It Works Now

### Option 1: Primary Server (Current Setup)
Your app connects to your home/office network using:
```
http://192.168.56.1:9000/api
```

**Works from:**
- ✅ Same WiFi network as your backend
- ✅ Connected via VPN to your home network
- ✅ Any device on your local network

---

### Option 2: Switch Networks (When IP Changes)

If your network changes or you're somewhere else with a different network:

**Edit:** `config/server-config.js`

Change this line:
```javascript
const ACTIVE_SERVER = 'home';  // ← Change this
```

To:
```javascript
const ACTIVE_SERVER = 'office';  // or 'local'
```

Then update the IP in `DEVELOPMENT_SERVERS`:
```javascript
office: {
  name: 'Office Network',
  ip: '192.168.X.X',  // ← Your new IP
  port: 9000,
  url: 'http://192.168.X.X:9000/api',
}
```

---

### Option 3: Use a Fixed Server (Best for Production)

When you deploy your backend to a **real server** (like AWS, Heroku, DigitalOcean):

**Edit:** `config/server-config.js`

Change:
```javascript
const ACTIVE_SERVER = 'production';
```

And update:
```javascript
const PRODUCTION_SERVER = {
  name: 'Production Server',
  domain: 'api.ashasetu.com',  // ← Your actual domain
  url: 'https://api.ashasetu.com/api',
};
```

Then it will work from **anywhere in the world** ✅

---

## 📱 Your Current Setup

| Setting | Value |
|---------|-------|
| Active Server | `home` |
| Backend URL | `http://192.168.56.1:9000/api` |
| Network | Home/Office WiFi |
| Environment | Development |

---

## 🚀 Different Scenarios

### Scenario 1: Always at Home
- Use `ACTIVE_SERVER = 'home'`
- Works fine as long as you stay on same WiFi
- If router restarts and IP changes, update `home` config

### Scenario 2: Between Multiple Locations
- Add all locations to `DEVELOPMENT_SERVERS`
- Switch `ACTIVE_SERVER` when you change location
- Example: `ACTIVE_SERVER = 'office'` when at office

### Scenario 3: Production/Deployed Server
- Set `ACTIVE_SERVER = 'production'`
- Works from anywhere (requires real domain & HTTPS)
- No need to update IP ever

---

## 📍 Finding Your IP Address When It Changes

```powershell
# Windows - Open PowerShell and run:
ipconfig

# Look for: IPv4 Address (e.g., 192.168.56.1)
```

---

## 🔧 Implementation in Code

The app uses these files:

1. **`config/server-config.js`** ← Main configuration
   - Define all your servers here
   - Switch active server easily

2. **`config/api.js`** ← API calls use this
   - Automatically uses the active server
   - No changes needed

3. **`config/environment.js`** ← Environment detection
   - Future use for auto-detection

---

## 💡 Pro Tips

### Tip 1: Keep Your Backend Running 24/7
If you deploy backend to cloud (AWS, Heroku, etc.):
- It gets a fixed IP/domain
- You can register/login from **anywhere**
- No need to manage local network

### Tip 2: Use Local Network IP for Testing
When testing on a device/emulator on the same Wi‑Fi network, use your machine's local IP address.

Example (replace with your actual IP):
```bash
# Your backend runs on port 9000
# Your machine's local IP might be 192.168.1.4
```

Update your mobile config (e.g., `config/api.js`):
```javascript
const API_BASE_URL = 'http://192.168.1.4:9000/api';
```

### Tip 3: Use Environment Variables
Create `.env` file:
```
REACT_APP_API_URL=http://192.168.56.1:9000/api
```

Then in `config/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.56.1:9000/api';
```

---

## ⚙️ File Locations

```
Mobile/AshaSetu/config/
├── api.js                 ← API calls (uses server config)
├── server-config.js       ← All server definitions (edit this)
├── environment.js         ← Environment detection
└── api-platforms.js       ← Platform-specific URLs
```

---

## 🎯 Recommended Setup for Production

1. **Deploy backend to cloud service**
   - AWS EC2
   - Heroku
   - DigitalOcean
   - Google Cloud
   
2. **Get a domain name**
   - api.ashasetu.com
   - ashasetu-api.com
   - etc.

3. **Set production URL**
   ```javascript
   const PRODUCTION_SERVER = {
     url: 'https://api.ashasetu.com/api'
   };
   const ACTIVE_SERVER = 'production';
   ```

4. **Works from anywhere!** ✅
   - Desktop
   - Mobile
   - Different countries
   - Different networks

---

## 🧪 Testing from Different Locations

### At Home on Your WiFi
✅ Works with `http://192.168.56.1:9000/api`

### At Coffee Shop on Different WiFi
❌ Won't work (different network IP)
✅ Solution: Use production server

### On Mobile Data (4G/5G)
❌ Won't work (different network)
✅ Solution: Use production server

### From Another Country
❌ Won't work with local IP
✅ Solution: Use production server with HTTPS

---

## 📚 Summary

| Situation | Solution |
|-----------|----------|
| Same home WiFi, IP constant | Use current setup |
| Different WiFi, changing IP | Add to server config & switch |
| Want to work from anywhere | Deploy to production server |
| Testing on mobile data | Use cloud/production server |

---

**Next Steps:**

1. ✅ Keep using `192.168.56.1` for now
2. When IP changes, edit `server-config.js`
3. For production, deploy backend to cloud + set production URL
4. Then app works **from anywhere in the world!** 🌍

