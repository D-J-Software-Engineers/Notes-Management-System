# Android APK Build Guide for Local Network Server Access

This guide explains how to build and deploy an Android APK that accesses the Notes Management System server running on a Windows machine via local network.

## Prerequisites

- **Node.js** (v16+) installed
- **Android SDK** (API 28 or higher)
- **JDK 11** or higher
- **Gradle** (included with Android SDK)
- Android device or emulator with the same LAN network access
- Windows machine with the server service running

## Part 1: Windows Server Setup

### 1.1 Install Node Dependencies

```bash
npm install
```

This installs `node-windows` for service management.

### 1.2 Install Windows Service

**Run Command Prompt as Administrator**, then:

```bash
npm run service:install
```

Or use the batch file:

```bash
windows-service/install-service.bat
```

What this does:

- Creates a Windows Service named `NotesManagementServer`
- Service runs on port 5000
- Automatically starts on system boot
- Runs independently of any UI application

### 1.3 Verify Service is Running

```bash
npm run service:status
```

Expected output:

```
✓ Service "NotesManagementServer" is installed
```

### 1.4 Find Your Windows Server IP Address

Open Command Prompt and run:

```bash
ipconfig
```

Look for your local network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Example output:**

```
Wireless LAN adapter WiFi:
   IPv4 Address. . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . : 255.255.255.0
```

**Save this IP address** - you'll need it for the Android app.

### 1.5 Test Server Connectivity

From another device on the same network, test:

```bash
# Replace 192.168.1.100 with your actual server IP
curl http://192.168.1.100:5000/health

# On Windows, you can test with:
Start-Process "http://192.168.1.100:5000"
```

Expected response: `{"status":"ok"}`

## Part 2: Android App Configuration

### 2.1 Update Server IP Address

Edit the Android app configuration files:

**Option A: Via Environment File**

Create or update `.env` in the project root:

```
VITE_SERVER_IP=192.168.1.100
VITE_SERVER_PORT=5000
VITE_SERVER_URL=http://192.168.1.100:5000
```

**Option B: Direct Update in Code**

Edit `client/public/assets/js/server-config.js`:

```javascript
export const SERVER_CONFIG = {
  BASE_URL: "http://192.168.1.100:5000", // Replace with your IP
  // ... rest of config
};
```

### 2.2 Update Capacitor Configuration

Edit `capacitor.config.json`:

```json
{
  "appId": "com.nsomadiglibs.app",
  "appName": "Nsoma-DigLibs",
  "webDir": "client/public",
  "server": {
    "androidScheme": "https",
    "hostname": "192.168.1.100"
  },
  "plugins": {
    "CapacitorHTTP": {
      "enabled": true
    }
  }
}
```

## Part 3: Build Android APK

### 3.1 Install Android SDK and Tools

```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Or install locally
npm install @capacitor/cli@latest
```

### 3.2 Build the Web Application

```bash
cd client
npm install
npm run build
cd ..
```

### 3.3 Add Android Platform

```bash
npx cap add android
```

### 3.4 Synchronize Capacitor

```bash
npx cap sync android
```

### 3.5 Generate Release APK

#### Option A: Using Capacitor (Recommended)

```bash
# Generate signed release APK
npx cap run android --release
```

#### Option B: Using Gradle

```bash
cd android
# Debug build (for testing)
./gradlew build -x lint

# Release build (for production)
./gradlew assembleRelease -x lint
cd ..
```

**Output location:**

```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 3.6 Sign the APK

If you have an unsigned APK, sign it:

```bash
# Generate a keystore (one-time)
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.jks \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  my-key-alias
```

## Part 4: Install on Android Device

### 4.1 Debug Installation

```bash
# Install debug APK on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.2 Release Installation

```bash
# Install release APK on connected device
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 4.3 Or Use Android Studio

1. Open Android Studio
2. Click **Build** → **Build Bundles / APKs** → **Build APK(s)**
3. Follow the prompts
4. Connect your device
5. Click **Run** → **Run 'app'**

## Part 5: Testing

### 5.1 Verify App Connects to Server

1. Launch the app on your Android device
2. Go to **Settings** (if available in your app)
3. Enter the Windows server IP: `192.168.1.100`
4. Click **Connect**
5. You should see the app populate with data

### 5.2 Test Offline Capability

The app should cache data locally so it works even if the server is temporarily unavailable.

### 5.3 Monitor Server Logs

Watch the Windows server logs:

```bash
# Check service logs (Windows Event Viewer)
# Or start the server manually to see console output:
npm run dev
```

## Troubleshooting

### Issue: App Cannot Connect to Server

**Solution:**

1. Verify server is running: `npm run service:status`
2. Test from Windows machine: `curl http://localhost:5000/health`
3. Test from Android device on same WiFi: `http://[WINDOWS_IP]:5000/health`
4. Check firewall is allowing port 5000
5. Verify you're using the correct IP address (not localhost)

### Issue: APK Build Fails

**Solution:**

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild from scratch
npx cap sync android --no-prompt
npx cap build android
```

### Issue: Cannot Find Android SDK

**Solution:**

```bash
# Set ANDROID_SDK_ROOT
# On Windows PowerShell:
$env:ANDROID_SDK_ROOT = "C:\Users\YourUsername\AppData\Local\Android\Sdk"

# Verify installation
npx cap doctor android
```

### Issue: Service Won't Install (Permission Denied)

**Solution:**

- Run Command Prompt **as Administrator**
- Use the batch file: `windows-service/install-service.bat`

## Service Management Commands

| Command                     | Action                        |
| --------------------------- | ----------------------------- |
| `npm run service:install`   | Install and start the service |
| `npm run service:start`     | Start the service             |
| `npm run service:stop`      | Stop the service              |
| `npm run service:uninstall` | Remove the service            |
| `npm run service:status`    | Check if service is installed |

## Network Configuration Summary

```
┌─────────────────────┐
│   Android Device    │
│  (Same WiFi)        │
└──────────┬──────────┘
           │
        HTTP Request (Port 5000)
           │
           ▼
┌──────────────────────────┐
│  Windows Server Machine  │
│  IP: 192.168.1.100       │
│  Port: 5000              │
│  Running as Windows Service
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│   Node.js Express App    │
│   Database (SQLite)      │
│   File Storage           │
└──────────────────────────┘
```

## Security Considerations

⚠️ **Important:**

1. **Firewall**: Allow port 5000 through Windows Firewall
2. **Network**: Only use on trusted local networks
3. **Authentication**: Your app already uses JWT tokens - ensure they're still validated
4. **CORS**: Server accepts local network origins (192.168.x.x, 10.x.x.x)
5. **Production**: For internet deployment, use:
   - HTTPS/TLS encryption
   - Proper domain names
   - API key authentication
   - Rate limiting

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/)
- [Android Build Guide](https://developer.android.com/build)
- [Node Windows Service Guide](https://github.com/coreybutler/node-windows)
- [Express.js Server Guide](https://expressjs.com/)

## Quick Start Command

After Windows service is set up, to build a new APK:

```bash
npm run android:build
```

This will:

1. Build the web app
2. Sync Capacitor
3. Build Android debug APK

---

**Last Updated:** March 2026
**Tested On:** Android API 28+ | Windows 10+
