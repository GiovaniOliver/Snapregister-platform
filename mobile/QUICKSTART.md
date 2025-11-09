# SnapRegister Mobile - Quick Start Guide

Get the SnapRegister mobile app up and running in 5 minutes!

## Prerequisites

Before you begin, ensure you have:
- Node.js (v16+) installed
- npm or yarn package manager
- A code editor (VS Code recommended)
- For iOS: macOS with Xcode
- For Android: Android Studio or Android emulator

## Installation Steps

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Navigation
- Expo Camera
- Axios for API calls
- TypeScript types

### 3. Set Up Environment

Copy the sample environment file:

```bash
cp .env.sample .env
```

The default configuration points to `http://localhost:3000/api` which should work if your Next.js backend is running locally.

### 4. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### 5. Run on Your Device

Choose one of the following options:

#### Option A: Physical Device (Easiest)

1. Install **Expo Go** app from:
   - iOS: App Store
   - Android: Google Play Store

2. Scan the QR code:
   - iOS: Use native Camera app
   - Android: Use Expo Go app

3. The app will load on your device!

#### Option B: iOS Simulator (macOS only)

```bash
npm run ios
```

#### Option C: Android Emulator

```bash
npm run android
```

## Testing the App

### Without Backend

The app will display mock data and UI even without a backend connection. You can:
- Navigate between screens
- Test the UI/UX
- Open the camera (requires permission)

### With Backend

1. Ensure the Next.js backend is running:
   ```bash
   cd ../website
   npm run dev
   ```

2. Update API URL in `.env` if needed:
   - Physical device: Use your computer's local IP
   - Simulator/Emulator: Use `localhost` or `10.0.2.2` (Android)

3. Test full functionality:
   - Scan devices
   - Create products
   - View warranties

## Common Issues & Solutions

### Issue: "Cannot connect to API"

**For Physical Devices:**
```bash
# Find your local IP
# macOS/Linux:
ifconfig | grep "inet "
# Windows:
ipconfig

# Update .env:
API_URL=http://YOUR_LOCAL_IP:3000/api
```

**For Android Emulator:**
```bash
# Use Android emulator's special IP
API_URL=http://10.0.2.2:3000/api
```

### Issue: "Camera permission denied"

1. Delete the app from your device
2. Reinstall via Expo Go
3. Allow permissions when prompted

### Issue: "Metro bundler stuck"

```bash
# Clear cache and restart
npm run clear
```

## Project Structure Overview

```
mobile/
├── src/
│   ├── screens/       # All app screens
│   ├── components/    # Reusable UI components
│   ├── navigation/    # Navigation setup
│   ├── services/      # API integration
│   ├── types/         # TypeScript definitions
│   └── config/        # Configuration files
└── App.tsx           # Main app entry
```

## Key Features to Test

1. **Home Screen**
   - Dashboard with stats
   - Quick action buttons

2. **Scan Screen**
   - Camera capture
   - Image selection from gallery

3. **Products Screen**
   - Product list
   - Search functionality
   - Product details

4. **Profile Screen**
   - User information
   - Settings access

## Next Steps

1. Review the [full README](./README.md) for detailed documentation
2. Check the [API documentation](../website/README.md) for backend integration
3. Explore the codebase in `src/` directory
4. Customize the app for your needs

## Development Tips

### Hot Reloading
Changes to code are automatically reflected in the app. Just save the file!

### Debugging
- Shake device to open developer menu
- Use Chrome DevTools for debugging
- Check Expo logs in terminal

### Making Changes
1. Modify code in `src/` directory
2. Save the file
3. App automatically reloads
4. Test the changes

## Building for Production

When ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android
```

## Support

- Documentation: See [README.md](./README.md)
- Issues: Check the GitHub issues
- Backend: See [website README](../website/README.md)

---

Happy coding! 🚀
