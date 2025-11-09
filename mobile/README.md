# SnapRegister Mobile App

A React Native mobile application for warranty registration using AI-powered device information extraction through camera capture.

## Overview

SnapRegister Mobile is an Expo-based React Native app that allows users to:
- Capture device information using their phone's camera
- Automatically extract product details using AI
- Manage warranty registrations
- Track product warranties and expiration dates
- Store purchase receipts and warranty documents

## Tech Stack

- **Framework**: React Native (Expo SDK)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Camera**: Expo Camera
- **Image Processing**: Expo Image Picker
- **API Communication**: Axios
- **Backend**: Shared with website (Next.js + Prisma)
- **Platform**: iOS & Android

## Important: API Configuration

**The mobile app does NOT have its own database.** It connects to the website's backend API for all data operations.

Before running the mobile app:

1. **Start the website backend first**:
   ```bash
   cd website
   npm run dev
   ```
   Note the port number (usually 3004-3007).

2. **Configure the mobile app**:
   ```bash
   cd mobile
   cp .env.sample .env
   ```

3. **Update `.env` based on your platform**:

   **iOS Simulator**:
   ```env
   API_URL=http://localhost:3004/api
   WEB_URL=http://localhost:3004
   ```

   **Android Emulator**:
   ```env
   API_URL=http://10.0.2.2:3004/api
   WEB_URL=http://10.0.2.2:3004
   ```

   **Physical Device** (find your IP with `ipconfig` or `ifconfig`):
   ```env
   API_URL=http://192.168.1.100:3004/api
   WEB_URL=http://192.168.1.100:3004
   ```

4. **Test the connection**:
   ```bash
   node test-api-connection.js
   ```

For detailed setup instructions, see [MOBILE_API_SETUP.md](./MOBILE_API_SETUP.md).

## Project Structure

```
mobile/
├── src/
│   ├── screens/              # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── CameraCaptureScreen.tsx
│   │   ├── ProductDetailsScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── WarrantyDetailsScreen.tsx
│   ├── components/           # Reusable components
│   ├── navigation/           # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/             # API services
│   │   ├── api.ts           # Axios client with cookie handling
│   │   ├── authService.ts   # Authentication API
│   │   ├── productService.ts
│   │   ├── warrantyService.ts
│   │   └── aiService.ts
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx  # Authentication state
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── config/               # App configuration
│   │   └── env.ts           # Environment & API endpoints
│   └── utils/                # Utility functions
│       ├── dateHelpers.ts
│       └── validators.ts
├── assets/                   # Images, fonts, etc.
├── .env.sample              # Environment template
├── test-api-connection.js   # API connection tester
├── MOBILE_API_SETUP.md      # Detailed API setup guide
├── App.tsx                   # Main app component
├── app.json                  # Expo configuration
├── package.json
└── tsconfig.json
```

## Features

### 1. Authentication
- User signup and login
- Cookie-based session management
- Secure token storage
- Auto-login on app restart

### 2. Home Dashboard
- View total products and active warranties
- See expiring warranties at a glance
- Quick access to recent products
- Quick action buttons for scanning

### 3. Camera Scanning
- Native camera integration
- Real-time device label capture
- AI-powered information extraction
- Automatic product data population

### 4. Product Management
- List all registered products
- Search and filter products
- View detailed product information
- Edit and delete products
- Track purchase history

### 5. Warranty Tracking
- View warranty details
- Track expiration dates
- Visual status indicators (active/expiring/expired)
- Access warranty documents
- Contact warranty providers

### 6. User Profile
- View account information
- Manage settings
- Access help and support
- App information

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)
- **Website backend running** (required!)

### Setup Steps

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.sample .env
   ```

   Edit `.env` and update the API endpoint to match your backend. See the "API Configuration" section above.

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on platform**
   ```bash
   # iOS (macOS only)
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

## Development

### Running the App

**Using Expo Go (Recommended for Development)**
1. Install Expo Go on your iOS or Android device
2. Ensure your phone and computer are on the same WiFi
3. Run `npm start`
4. Scan the QR code with your device camera (iOS) or Expo Go app (Android)

**Using Simulators/Emulators**
```bash
# iOS Simulator (requires Xcode on macOS)
npm run ios

# Android Emulator (requires Android Studio)
npm run android
```

### API Integration

The app connects to the Next.js backend located in `../website`.

**Authentication Flow**:
1. Mobile app sends credentials to `/api/auth/signup` or `/api/auth/login`
2. Website backend creates session and returns user data
3. Mobile app stores session cookie for subsequent requests
4. All API calls include the session cookie for authentication

**API Endpoints Used**:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session
- `GET /api/products` - Fetch user products
- `POST /api/products` - Create new product
- `GET /api/warranties` - Fetch warranties
- `POST /api/ai/analyze-image` - AI image analysis

**API Client Features**:
- Automatic cookie management
- Request/response interceptors
- Error handling and retry logic
- Session expiration detection
- Development logging

### TypeScript Types

All data models are defined in `src/types/index.ts`:
- `Product` - Product information
- `Warranty` - Warranty details
- `Registration` - Registration records
- `User` - User profile
- `AIExtractedData` - AI extraction results

## Camera Permissions

The app requires camera and photo library permissions:

**iOS** (automatically configured in app.json):
- Camera access for device scanning
- Photo library access for selecting images
- Photo library write access for saving captures

**Android** (automatically configured in app.json):
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- READ_MEDIA_IMAGES

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas login
   eas build:configure
   ```

3. **Build for platforms**
   ```bash
   # iOS
   eas build --platform ios

   # Android
   eas build --platform android

   # Both
   eas build --platform all
   ```

### Traditional Build Process

**iOS**
```bash
expo prebuild
cd ios
pod install
# Open in Xcode and build
```

**Android**
```bash
expo prebuild
cd android
./gradlew assembleRelease
```

## Testing

### API Connection Test

Test if the mobile app can reach the website backend:
```bash
node test-api-connection.js
```

### Manual Testing Checklist

- [ ] User signup and login
- [ ] Session persistence
- [ ] Camera capture works on both iOS and Android
- [ ] Image selection from gallery
- [ ] AI extraction processes images correctly
- [ ] Products are created with extracted data
- [ ] Warranties display correct status
- [ ] Navigation between screens
- [ ] API communication with backend
- [ ] Logout clears session
- [ ] Permission requests

## Troubleshooting

### API Connection Errors

**Connection refused or timeout**:
1. Ensure website backend is running: `cd website && npm run dev`
2. Check the port number in console output
3. Update `mobile/.env` with correct port
4. For Android emulator, use `10.0.2.2` instead of `localhost`
5. For physical device, use your local IP address
6. Restart mobile app: Press `r` in Metro bundler

**401 Unauthorized errors**:
1. Check if session cookie is being stored (look for `[API] Session cookie stored` in console)
2. Clear app data and try logging in again
3. Verify website authentication endpoints work (test in browser)

**CORS errors (physical device)**:
- Ensure your phone and computer are on the same WiFi network
- Check firewall settings aren't blocking connections
- Update CORS configuration in website if needed

### Camera Not Working

- Ensure permissions are granted in device settings
- Check app.json has correct permission configurations
- Restart the Expo development server

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Metro Bundler Issues

```bash
# Reset Metro bundler
npx expo start -c
# or
watchman watch-del-all
```

## Performance Optimization

### Current Optimizations
- Image compression before upload
- Lazy loading of screens
- Pagination for product lists
- Request caching via cookie sessions
- Optimized image assets
- Efficient API client with interceptors

### Future Optimizations
- [ ] Implement React Query for data caching
- [ ] Add offline support with local storage
- [ ] Optimize bundle size
- [ ] Add performance monitoring
- [ ] Implement lazy loading for images

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test on both iOS and Android
4. Test API integration with website backend
5. Submit a pull request

## Roadmap

### Phase 1 (Current)
- [x] Basic navigation structure
- [x] Camera integration
- [x] Product listing
- [x] Warranty tracking
- [x] User authentication
- [x] API integration with website backend
- [ ] AI integration with backend

### Phase 2 (Upcoming)
- [ ] Push notifications for expiring warranties
- [ ] Offline mode with sync
- [ ] Document scanning
- [ ] Barcode/QR code scanning
- [ ] Receipt upload

### Phase 3 (Future)
- [ ] Product recommendations
- [ ] Warranty claim assistance
- [ ] Receipt OCR
- [ ] Cloud backup
- [ ] Multi-language support

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [API Setup Guide](./MOBILE_API_SETUP.md)

## Support

For issues and questions:
- Check the [API setup guide](./MOBILE_API_SETUP.md)
- Review existing issues
- Contact: support@snapregister.com

## License

Copyright 2024 SnapRegister. All rights reserved.

---

**Version**: 1.0.0
**Last Updated**: 2024-11-07
**Platform Support**: iOS 13+, Android 5.0+
