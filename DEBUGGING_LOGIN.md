# 🔧 Debugging Login/Register Issues on Expo Go

## 📱 You're Seeing a Debug Screen Now

I've added a **Debug Screen** to help diagnose the connectivity issue. When you open the app now, you should see it.

---

## 🧪 What to Do:

### 1. **Update Your Mobile App**
```bash
cd d:\SYP\Mobile\AshaSetu
npm start
```

Then in Expo Go on your phone:
- Scan the QR code or reload
- You should now see the Debug screen first

### 2. **Tap "Run Connection Test"**
This will:
- ✅ Check if backend is running
- ✅ Check if your phone can reach it
- ✅ Test the registration endpoint
- ✅ Show exact error messages

---

## 🎯 Common Issues & Solutions

### Issue 1: "Cannot reach backend"

**Possible Causes:**
- ❌ Phone not on same WiFi as computer
- ❌ Firewall blocking port 9000
- ❌ Backend not running
- ❌ Wrong IP address

**Solutions:**
1. **Check WiFi Connection**
   - Phone WiFi: Same network as computer
   - Both on `192.168.56.x` network

2. **Check Backend**
   ```bash
   cd d:\SYP\Backend
   npm start
   ```
   Should show: `🚀 Server running on port 9000`

3. **Check Windows Firewall**
   - Open Windows Security
   - Go to "Firewall & network protection"
   - Click "Allow an app through firewall"
   - Find Node.js and allow it
   - Or temporarily disable firewall

4. **Verify IP Address**
   ```powershell
   ipconfig
   ```
   Look for IPv4 Address (should be `192.168.56.x`)
   
   Make sure `config/api.js` uses this IP:
   ```javascript
   primary: 'http://192.168.56.1:9000/api',
   ```

---

### Issue 2: "Endpoint error" or "HTTP error"

**Possible Causes:**
- ❌ Missing required fields (name, email, phone, password)
- ❌ Invalid phone number format
- ❌ Email already exists
- ❌ Backend validation error

**Solutions:**
1. Use valid test data:
   - **Full Name:** Ismini Limbu
   - **Email:** ismini@example.com (must be unique each time)
   - **Phone:** 9800123456 (must start with 98 in Nepal format)
   - **Password:** password123

2. Check backend logs for exact error message

---

### Issue 3: "Network error"

**Possible Causes:**
- ❌ Connection timeout (backend too slow)
- ❌ Network unstable
- ❌ Port not open

**Solutions:**
1. Try again (temporary network blip)
2. Make sure no other app is using port 9000
3. Restart backend: `npm start`
4. Restart phone WiFi

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify Backend is Working
```bash
# In PowerShell
curl http://192.168.56.1:9000/
```

Should return:
```json
{
  "message": "AshaSetu API Server is running 🚀",
  "version": "1.0.0"
}
```

If not, backend is not running or IP is wrong.

---

### Step 2: Check Your Network
```bash
ipconfig
```

Look for:
```
IPv4 Address . . . . . . . . . : 192.168.56.1
```

Make sure phone is on same network (should show `192.168.56.x`)

---

### Step 3: Test from Phone Using Debug Screen
- Open app on phone
- Click "Run Connection Test"
- Read the results carefully
- Screenshot and share if still failing

---

### Step 4: Manual Test (Without App)
If debug screen shows error, try from terminal:

**Test registration:**
```powershell
$body = @{
  full_name = "Test User"
  email = "test@example.com"
  phone_number = "9800123456"
  password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://192.168.56.1:9000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

Should return success or error message.

---

## 🚨 Quick Checklist

- [ ] Backend running (`npm start` in Backend folder)
- [ ] Phone on same WiFi network
- [ ] Phone can see backend IP (`192.168.56.1` or your IP)
- [ ] Windows Firewall allows Node.js
- [ ] Port 9000 not blocked
- [ ] Using correct IP in `config/api.js`
- [ ] Valid test data (especially phone number format)

---

## 🔄 After Fixing

Once the debug screen tests pass:

### Remove Debug Screen
Edit `navigation/AppNavigator.jsx` and remove this part:
```javascript
<Stack.Screen 
  name="Debug" 
  component={DebugScreen}
  options={{ headerShown: false }}
/>
```

Move `Login` screen back to first position:
```javascript
<Stack.Screen 
  name="Login" 
  component={LoginScreen}
  options={{ headerShown: false }}
/>
```

Then restart app.

---

## 📊 Expected Flow

```
1. App Opens
   ↓
2. See Debug Screen
   ↓
3. Click "Run Connection Test"
   ↓
4. All tests pass ✅
   ↓
5. Go back/remove debug screen
   ↓
6. See Login screen
   ↓
7. Try to login → Should work now!
```

---

## 💡 Pro Tips

### Test on Computer First
```bash
# Test from web browser on your computer
http://localhost:9000/
```

### Check Mobile Console
In Expo Go, shake your phone to open menu:
- Look for console logs
- Check for detailed error messages

### Monitor Backend Logs
Keep backend terminal open to see:
- Incoming requests
- Validation errors
- Database issues

---

## 📞 If Still Not Working

Please tell me:
1. What does debug screen show?
2. Are there any error messages?
3. What IP does `ipconfig` show?
4. Is backend terminal showing any errors?
5. Is phone on same WiFi network?

Then I can help you fix it! 👍

---

## 🎯 Next Steps

1. **Restart mobile app:**
   ```bash
   npm start
   ```

2. **You'll see Debug screen**

3. **Run connection test**

4. **Share results with me**

Let me know what the debug screen shows! 📱

