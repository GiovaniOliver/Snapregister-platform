# Mobile App API Connection Guide

## Problem: Network Error When Connecting to Backend

If you're seeing "Network error. Please check your internet connection" when trying to login or make API calls, it's likely because the mobile app can't reach your backend server running on `localhost`.

## Why This Happens

- **Android Emulator**: `localhost` refers to the emulator itself, not your computer
- **iOS Simulator**: `localhost` sometimes doesn't work reliably
- **Physical Devices**: `localhost` definitely won't work - they need your computer's IP address

## Solutions

### Option 1: Use Your Machine's IP Address (Recommended)

1. **Find your computer's IP address:**
   - **Windows**: Open Command Prompt and run `ipconfig`, look for IPv4 Address
   - **Mac/Linux**: Open Terminal and run `ifconfig` or `ip addr`, look for inet address

2. **Set the environment variable:**
   
   Create a `.env` file in the `mobile` directory:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000
   ```
   
   Example:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```

3. **Restart your Expo development server:**
   ```bash
   npm start -- --clear
   ```

### Option 2: Android Emulator (Already Handled)

The code automatically converts `localhost` to `10.0.2.2` for Android emulators, so if you're testing on Android emulator, `localhost:3000` should work automatically.

### Option 3: iOS Simulator

For iOS simulator, you can either:
- Use your machine's IP address (Option 1)
- Or try `127.0.0.1` instead of `localhost`:
  ```
  EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
  ```

### Option 4: Use ngrok or Similar Tunnel (For Testing)

If you need to test from a physical device or want a public URL:

1. Install ngrok: `npm install -g ngrok`
2. Start your backend server on port 3000
3. Run: `ngrok http 3000`
4. Use the ngrok URL in your `.env` file:
   ```
   EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
   ```

## Verify Your Backend is Running

Make sure your backend server is actually running:

1. Check if the server is running on port 3000:
   ```bash
   # In your website directory
   npm run dev
   # or
   npm start
   ```

2. Test the API endpoint directly:
   ```bash
   curl http://localhost:3000/api/auth/login
   # or
   curl http://YOUR_IP:3000/api/auth/login
   ```

## Debugging Steps

1. **Check the logs**: Look at the console output - it should show:
   ```
   [API Config] Platform: ios/android
   [API Config] Base URL: http://...
   [API Config] API URL: http://.../api
   ```

2. **Verify the URL**: Make sure the URL shown in logs matches what you expect

3. **Check firewall**: Make sure your firewall isn't blocking port 3000

4. **Check network**: Make sure your device/emulator and computer are on the same network

## Quick Fix for Development

If you just want to get it working quickly:

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Set environment variable before starting Expo:
   ```bash
   # Windows PowerShell
   $env:EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"
   npm start
   
   # Mac/Linux
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000 npm start
   ```

Replace `192.168.1.100` with your actual IP address.

## Example .env File

Create `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
ENVIRONMENT=dev
```

Note: Make sure `.env` is in your `.gitignore` file!

