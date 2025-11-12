# Mobile App Setup - Simple Guide

## Architecture Overview

```
┌─────────────────┐         HTTP Requests         ┌──────────────────┐
│                 │  ───────────────────────────>  │                  │
│  Mobile App     │                                │  Next.js Website │
│  (Expo/React)  │  <───────────────────────────  │  (Backend Server)│
│                 │         API Responses          │                  │
└─────────────────┘                                └──────────────────┘
     CLIENT                                              SERVER
  (No backend)                                      (Has API routes)
```

**Key Point**: The mobile app is just a CLIENT. It needs the Next.js website running as the SERVER.

## Step-by-Step Setup

### Step 1: Start the Backend Server (Next.js Website)

Open Terminal #1:
```bash
cd website
npm run dev:mobile
```

This starts the Next.js server on port 3004. You should see:
```
✓ Ready on http://localhost:3004
```

**Keep this terminal running!** This is your backend server.

### Step 2: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" - something like `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" - something like `192.168.1.100`

### Step 3: Configure Mobile App

Create a `.env` file in the `mobile` directory:

**Windows PowerShell:**
```powershell
cd mobile
New-Item -Path .env -ItemType File
```

**Mac/Linux:**
```bash
cd mobile
touch .env
```

Then edit `.env` and add:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3004
```

**Example** (if your IP is 192.168.1.100):
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3004
```

### Step 4: Start Mobile App

Open Terminal #2:
```bash
cd mobile
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- Scan QR code for physical device

## Quick Reference

**Terminal 1** (Backend - MUST be running):
```bash
cd website
npm run dev:mobile
```

**Terminal 2** (Mobile App):
```bash
cd mobile
npm start
```

## Troubleshooting

### "Network error" when trying to login?

1. ✅ Is the website server running? (Check Terminal #1)
2. ✅ Is the IP address correct in `.env`?
3. ✅ Are both devices on the same WiFi network?
4. ✅ Did you restart Expo after changing `.env`? (`npm start -- --clear`)

### How to verify backend is running:

Open browser and go to: `http://localhost:3004/api/auth/session`

If you see a response (even an error), the server is running!

## Important Notes

- **You MUST run the website server** for the mobile app to work
- The mobile app does NOT have its own database or backend
- All data comes from the Next.js website's API
- The `.env` file tells the mobile app WHERE to find the backend server

