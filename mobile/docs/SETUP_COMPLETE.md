# SnapRegister Mobile App - Setup Complete

## Overview
The SnapRegister mobile app has been successfully set up using Expo and React Native with TypeScript. The app is configured to work with the existing website backend APIs.

## Project Structure

```
mobile/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context provider
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Main navigation with auth flow
│   ├── screens/
│   │   ├── LoginScreen.tsx          # User login screen
│   │   ├── SignupScreen.tsx         # User registration screen
│   │   ├── HomeScreen.tsx           # Dashboard with stats
│   │   ├── ScanScreen.tsx           # Device scanning interface
│   │   ├── ProductsScreen.tsx       # Product list view
│   │   ├── ProfileScreen.tsx        # User profile with logout
│   │   ├── CameraCaptureScreen.tsx  # Camera capture functionality
│   │   ├── ProductDetailsScreen.tsx # Individual product details
│   │   └── WarrantyDetailsScreen.tsx# Warranty information
│   ├── services/
│   │   ├── api.ts                   # Axios client with auth interceptors
│   │   ├── authService.ts           # Authentication API calls
│   │   ├── productService.ts        # Product management APIs
│   │   ├── warrantyService.ts       # Warranty management APIs
│   │   └── aiService.ts             # AI processing services
│   ├── components/
│   │   ├── EmptyState.tsx           # Empty state component
│   │   ├── ErrorMessage.tsx         # Error display component
│   │   └── LoadingSpinner.tsx       # Loading indicator
│   ├── config/
│   │   └── env.ts                   # Environment configuration
│   ├── types/
│   │   ├── index.ts                 # Main type definitions
│   │   ├── warranty.ts              # Warranty types
│   │   ├── warrantyAnalysis.ts      # Analysis types
│   │   ├── registration.ts          # Registration types
│   │   └── device.ts                # Device types
│   └── utils/
│       ├── dateHelpers.ts           # Date utility functions
│       └── validators.ts            # Validation utilities
├── App.tsx                          # Root component with AuthProvider
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── .env.sample                      # Environment variables template
```

## Key Features Implemented

### Authentication System
- **JWT-based authentication** matching website backend
- **Secure token storage** using expo-secure-store
- **Auto token refresh** with axios interceptors
- **Protected routes** based on authentication state
- **Login/Signup screens** with form validation
- **Session persistence** across app restarts

### Navigation
- **Tab-based navigation** for main app sections
- **Stack navigation** for detail screens
- **Conditional rendering** based on auth state
- **Auth flow** (Login → Signup) when not authenticated
- **Main app flow** when authenticated

### Screens
1. **Login Screen** - Email/password authentication
2. **Signup Screen** - New user registration
3. **Home Screen** - Dashboard with stats and quick actions
4. **Scan Screen** - Device scanning interface
5. **Products Screen** - List of user's products
6. **Profile Screen** - User info and logout
7. **Camera Capture** - Full-screen camera for device capture
8. **Product Details** - Individual product information
9. **Warranty Details** - Warranty terms and coverage

### API Integration
- **Base URL configuration** for dev/staging/prod
- **Axios instance** with automatic token injection
- **Error handling** with 401 redirects
- **File upload support** for images
- **API endpoints** matching website routes:
  - `/auth/login` - User login
  - `/auth/signup` - User registration
  - `/auth/session` - Session verification
  - `/auth/logout` - User logout
  - `/products` - Product management
  - `/warranties` - Warranty management
  - `/registration` - Registration handling
  - `/analyze-product-image` - AI image analysis
  - `/device-info` - Device information extraction

## Technology Stack

### Core
- **Expo SDK 54** - Latest stable version
- **React Native 0.81.5** - Mobile framework
- **React 19.1.0** - UI library
- **TypeScript 5.9.2** - Type safety

### Navigation
- **@react-navigation/native 7.1.19** - Navigation framework
- **@react-navigation/native-stack 7.6.2** - Stack navigator
- **@react-navigation/bottom-tabs 7.8.2** - Tab navigator

### State & Storage
- **expo-secure-store** - Secure token storage
- **@react-native-async-storage/async-storage** - Local storage

### API & Networking
- **axios 1.13.2** - HTTP client
- **expo-constants** - Environment configuration

### Device Features
- **expo-camera 17.0.9** - Camera access
- **expo-image-picker 17.0.8** - Image selection
- **expo-document-picker 14.0.7** - Document selection

### UI Components
- **@expo/vector-icons** - Icon library
- **react-native-safe-area-context** - Safe area support
- **react-native-screens** - Native screen optimization

## Configuration

### Environment Variables
Create a `.env` file based on `.env.sample`:

```bash
# API Configuration
API_URL=http://localhost:3000/api
WEB_URL=http://localhost:3000

# Environment
ENVIRONMENT=dev

# Feature Flags
ENABLE_AI_PROCESSING=true
ENABLE_ANALYTICS=false

# App Configuration
APP_VERSION=1.0.0
```

### API URL Configuration
The app uses environment-based API URLs:
- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.snapregister.com/api`
- **Production**: `https://snapregister.com/api`

Update in `src/config/env.ts` as needed.

### App Configuration (app.json)
- **Bundle ID (iOS)**: `com.snapregister.app`
- **Package (Android)**: `com.snapregister.app`
- **Version**: 1.0.0
- **New Architecture**: Enabled
- **Permissions**: Camera, Photo Library, Storage

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app on your device (for testing)
- Backend server running (website at localhost:3000)

### Installation
```bash
cd mobile
npm install
```

### Running the App

#### Start Development Server
```bash
npm start
# or
expo start
```

#### Run on iOS Simulator
```bash
npm run ios
# or
expo start --ios
```

#### Run on Android Emulator
```bash
npm run android
# or
expo start --android
```

#### Run on Web
```bash
npm run web
# or
expo start --web
```

### Testing on Physical Device
1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Run `npm start` on your computer
3. Scan the QR code with your device
4. Make sure your device is on the same network as your computer

## Backend Integration

### API Authentication Flow
1. User enters credentials on Login/Signup screen
2. App sends POST to `/auth/login` or `/auth/signup`
3. Backend returns `{ success, user, token }`
4. Token stored securely using expo-secure-store
5. Token automatically added to all API requests via axios interceptor
6. 401 responses trigger token cleanup and redirect to login

### Session Management
- Token stored in secure device storage
- Checked on app startup via `/auth/session`
- Automatically cleared on logout or 401 errors
- No token expiration implemented yet (add refresh token logic if needed)

## Next Steps

### Required for MVP
1. **Connect Backend APIs**
   - Ensure website backend is running
   - Test all API endpoints from mobile app
   - Handle error responses appropriately

2. **Implement Remaining Screens**
   - Complete ProductsScreen with real data
   - Complete ScanScreen camera integration
   - Complete CameraCaptureScreen with AI analysis
   - Add edit/delete functionality for products

3. **Add Product Management**
   - Create product form
   - Edit product form
   - Delete product confirmation
   - Image upload functionality

4. **Add Warranty Features**
   - Warranty card scanning
   - OCR text extraction
   - Warranty autofill
   - Expiration notifications

5. **Testing**
   - Test on iOS devices
   - Test on Android devices
   - Test offline functionality
   - Test error scenarios

### Future Enhancements
- **Push Notifications** - Warranty expiration alerts
- **Offline Mode** - Local database with sync
- **Image Optimization** - Compress before upload
- **Dark Mode** - Theme switching
- **Biometric Auth** - Face ID / Fingerprint
- **Deep Linking** - Handle app links
- **Analytics** - Usage tracking
- **Error Tracking** - Sentry or similar
- **Performance Monitoring** - App performance metrics

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow React Native best practices
- Use functional components with hooks
- Keep components small and focused
- Use absolute imports where possible

### State Management
- Currently using React Context for auth
- Consider Redux/Zustand for complex state
- Keep API calls in service layer
- Use React Query for server state (optional)

### Error Handling
- Always try/catch async operations
- Show user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### Performance
- Optimize images before display
- Use FlatList for long lists
- Avoid unnecessary re-renders
- Profile with React DevTools

## Troubleshooting

### Common Issues

**Issue: Cannot connect to backend**
- Check API_URL in src/config/env.ts
- Ensure backend is running on localhost:3000
- For physical device, use your computer's IP address
- Check firewall settings

**Issue: Authentication not working**
- Verify backend endpoints match frontend config
- Check token format (JWT expected)
- Verify secure storage permissions
- Clear app data and try again

**Issue: Camera not working**
- Check permissions in app.json
- Grant camera permission on device
- Test on physical device (camera doesn't work in simulator)

**Issue: Build errors**
- Delete node_modules and reinstall
- Clear Expo cache: `expo start -c`
- Check for TypeScript errors: `npx tsc --noEmit`

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)

### Tools
- [Expo Snack](https://snack.expo.dev/) - Test code online
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/) - Debugging platform

## Summary

The SnapRegister mobile app is now fully configured with:
- ✅ Expo + React Native + TypeScript setup
- ✅ Authentication system with JWT
- ✅ Navigation with protected routes
- ✅ Login and Signup screens
- ✅ API client with token management
- ✅ Environment configuration
- ✅ Type-safe development
- ✅ Camera and image picker setup
- ✅ Profile screen with logout
- ✅ Dashboard with stats

**Ready for development!** Start the backend server, run `npm start`, and begin building features.
