# Mobile Login Timeout - Fix Instructions

## Problem
Mobile app shows timeout error when trying to login:
```
ERROR  [Auth] Login error: [ApiError: Request timeout. Please try again.]
```

## Root Cause
The mobile app is trying to connect to `http://192.168.1.15:3004/api/auth/login` but:
1. The backend server is not running on port 3004
2. Or Prisma client is not generated

## Solution

### Step 1: Generate Prisma Client (One-time setup)

In the `website` folder, run:

```bash
cd website
npx prisma generate
```

**If you get a 403 Forbidden error** (firewall/network issue):
```bash
# Try with checksum ignore
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

**If that still fails:**
- Temporarily disable firewall/VPN
- Or download Prisma binaries on a different network
- Or ask a team member who has it working to share the `node_modules/.prisma` folder

### Step 2: Start Backend Server on Port 3004

In the `website` folder, run:

```bash
cd website
npm run dev:mobile
```

You should see:
```
✓ Ready in X.Xs
- Local:        http://localhost:3004
```

**Keep this terminal running** - this is your backend server.

### Step 3: Configure Mobile App

1. **Find your computer's IP address:**
   - **Windows**: Open Command Prompt → `ipconfig` → Look for IPv4 Address (e.g., 192.168.1.15)
   - **Mac/Linux**: Open Terminal → `ifconfig` or `ip addr` → Look for inet address

2. **Update mobile/.env file:**

   Open `mobile/.env` and set your IP:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP_HERE:3004
   ```

   Example for iOS:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:3004
   ```

   Example for Android Emulator:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3004
   ```

3. **Restart Expo:**
   - In the Metro bundler terminal, press `r` to reload
   - Or stop (`Ctrl+C`) and restart: `npm start`

### Step 4: Test the Connection

1. **Verify backend is accessible:**
   ```bash
   curl http://YOUR_IP:3004/api/auth/session
   ```

   You should get an HTML response (not a timeout or connection refused).

2. **Open the mobile app** on your device/simulator

3. **Check the console logs** - You should see:
   ```
   LOG  [API Config] Base URL: http://192.168.1.15:3004
   LOG  [API Config] API URL: http://192.168.1.15:3004/api
   ```

4. **Try logging in** - The timeout should be gone!

## Quick Checklist

- [ ] Prisma client generated (`npx prisma generate` in website folder)
- [ ] Backend running on port 3004 (`npm run dev:mobile` in website folder)
- [ ] Found your computer's IP address
- [ ] Updated `mobile/.env` with correct IP
- [ ] Restarted Expo dev server
- [ ] Phone/simulator on same WiFi as computer
- [ ] Backend responds to curl test
- [ ] Mobile app shows correct API URL in console logs

## Troubleshooting

### "Connection refused" or "Network request failed"

**Check:**
1. Backend server is running (you should see logs in the terminal)
2. Port 3004 is correct (check the terminal output)
3. Firewall isn't blocking port 3004
4. Your phone and computer are on the same WiFi network

**Test:**
```bash
# On your computer
curl http://localhost:3004/api/auth/session

# If that works but mobile still fails, check your IP is correct
curl http://YOUR_IP:3004/api/auth/session
```

### Still getting timeout after 30 seconds

**Check:**
1. The IP in `.env` matches your computer's actual IP
2. You restarted the Expo server after changing `.env`
3. No VPN is interfering with local network
4. Backend terminal shows incoming requests (you should see logs when mobile tries to connect)

### Android Emulator specific

**Use the special Android alias:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3004
```

**NOT** `localhost` or your actual IP.

### iOS Simulator specific

**Use your actual local IP:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:3004
```

**NOT** `localhost`.

### Backend shows Prisma errors

If you see:
```
Error: @prisma/client did not initialize yet
```

**Solution:**
1. Stop the backend server (`Ctrl+C`)
2. Run `npx prisma generate`
3. Restart: `npm run dev:mobile`

## Summary

The mobile app timeout happens because it can't reach the backend. The fix:

1. **Generate Prisma** (one-time): `npx prisma generate` in website
2. **Start backend**: `npm run dev:mobile` in website
3. **Configure IP**: Update `mobile/.env` with your computer's IP
4. **Restart Expo**: Press `r` or `npm start`

The mobile app should now successfully connect and login without timeout errors!
