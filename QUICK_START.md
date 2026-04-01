# Quick Start Guide: Android APK with Windows Server

## 🚀 30-Second Quick Start

### On Windows Server:

```powershell
# 1. Install dependencies
npm install

# 2. Install as Windows Service (run as Administrator)
npm run service:install

# 3. Verify it's running
npm run service:status

# 4. Get your IP address
ipconfig
# Note the IPv4 address (e.g., 192.168.1.100)
```

### On Development Machine (or same machine):

```powershell
# 1. Configure Android app with server IP
node configure-android.js --ip=192.168.1.100

# 2. Build Android APK
call build-android.bat

# 3. Wait for build to complete (takes 5-10 minutes)
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Install on Android Device:

```powershell
# Connect device via USB (with debugging enabled)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or manually transfer and install the APK file
```

---

## 📋 What Was Set Up

### Windows Service (Runs Always)
- ✅ Node.js server as Windows Service
- ✅ Automatically starts on system boot
- ✅ Runs independently of any GUI
- ✅ Accessible at `http://192.168.1.100:5000` (or your IP)

### Android App Features
- ✅ Connects to Windows server via local network
- ✅ Works offline (cached data)
- ✅ Auto-discovers server on LAN
- ✅ Persistent server configuration
- ✅ Production-ready permissions

### Data Access
- ✅ Database (SQLite)
- ✅ File uploads/downloads
- ✅ REST API endpoints
- ✅ All accessible even without main app running

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Service won't install"** | Run Command Prompt as Administrator |
| **"App can't find server"** | Check server IP with `ipconfig` and update config |
| **"APK build fails"** | Run `npm install` and `npx cap doctor android` |
| **"Permission denied on Windows"** | Right-click terminal, select "Run as Administrator" |
| **"Connection timeout on Android"** | Verify both device and server are on same WiFi |

---

## 📱 Testing the Connection

### From Android App:
1. Launch the app
2. You should see data loading (if server is running)
3. Go to app settings and verify server IP is correct

### From Windows Command Line:
```powershell
# Test server is running
curl http://192.168.1.100:5000/health

# Should respond with: {"status":"ok"...}
```

### From Another Computer:
```bash
# Test server accessibility from another machine
curl http://192.168.1.100:5000/health
```

---

## 📂 Key Files Created

| File | Purpose |
|------|---------|
| `windows-service/service-manager.js` | Windows service control |
| `configure-android.js` | Auto-configure Android app |
| `build-android.bat` | One-click APK builder |
| `client/public/assets/js/network-manager.js` | Android network utilities |
| `BUILD_ANDROID_APK.md` | Detailed build instructions |

---

## 🎯 Architecture

```
┌─────────────────────────────────┐
│     Android App (APK)           │
│  - Connects to local network     │
│  - Accesses cached data offline  │
└──────────────┬──────────────────┘
               │
         HTTP (Port 5000)
               │
┌──────────────▼──────────────────┐
│  Windows Service                │
│  - Always running               │
│  - No GUI needed                │
│  - Node.js Express Server       │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Database & Files               │
│  - SQLite Database              │
│  - Uploaded files               │
│  - Persistent storage           │
└──────────────────────────────────┘
```

---

## 🔐 Security Notes

✅ **Good for:**
- Local network (LAN) usage
- School/office environments
- Private networks

⚠️ **For Public/Internet Access:**
- Use HTTPS (SSL/TLS)
- Set up proper domain name
- Add authentication headers
- Implement API rate limiting
- Use firewall rules

---

## 🚦 Service Management

### Check Service Status
```powershell
npm run service:status
```

### Stop Service
```powershell
npm run service:stop
```

### Start Service
```powershell
npm run service:start
```

### Uninstall Service
```powershell
npm run service:uninstall
```

---

## 📞 Support

For detailed troubleshooting, see: [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md)

For architecture questions, see: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

**Status:** ✅ Ready to Deploy

**Next Action:** Run `npm run service:install` on Windows Server to start!
