# SnapRegister Mobile App Documentation Index

Welcome to the SnapRegister mobile app documentation. This index provides organized access to all mobile development documentation.

## Quick Start & Setup

- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide for mobile development
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Comprehensive developer guide
- [SETUP_SIMPLE.md](./SETUP_SIMPLE.md) - Simplified setup instructions
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Complete setup verification
- [INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md) - Installation completion guide
- [PROJECT_SETUP_SUMMARY.md](./PROJECT_SETUP_SUMMARY.md) - Project setup summary

## API Integration

- [API_SETUP.md](./API_SETUP.md) - API configuration and setup
- [MOBILE_API_SETUP.md](./MOBILE_API_SETUP.md) - Mobile-specific API setup
- [API_CONNECTION_GUIDE.md](./API_CONNECTION_GUIDE.md) - API connection guide
- [API_CONFIG_CHECK.md](./API_CONFIG_CHECK.md) - API configuration verification

## Development Guides

- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - Development checklist and best practices
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Feature implementation summary
- [IMAGE_UPLOAD_GUIDE.md](./IMAGE_UPLOAD_GUIDE.md) - Image capture and upload guide

## Testing

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
- [README_TESTS.md](./README_TESTS.md) - Test suite overview
- [TEST_COVERAGE_SUMMARY.md](./TEST_COVERAGE_SUMMARY.md) - Test coverage report
- [TESTS_CREATED.md](./TESTS_CREATED.md) - Created tests documentation

## Technical References

- [TYPESCRIPT_FIXES_SUMMARY.md](./TYPESCRIPT_FIXES_SUMMARY.md) - TypeScript fixes and improvements

## Additional Documentation Locations

### Component Documentation
- `/src/types/README.md` - TypeScript type definitions

## Mobile App Stack

**Framework:** React Native with Expo SDK 54
**Language:** TypeScript
**Navigation:** React Navigation v7
**State Management:** React Context API
**API Client:** Axios
**Storage:** Expo Secure Store, AsyncStorage

## Key Features

- AI-powered photo scanning with OCR
- Product warranty tracking
- Barcode/QR code scanning
- Camera integration
- Offline-first architecture
- Secure authentication
- Push notifications (prepared)

## Development Workflow

1. **Setup**: Follow [QUICKSTART.md](./QUICKSTART.md)
2. **API Configuration**: See [API_SETUP.md](./API_SETUP.md)
3. **Development**: Use [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
4. **Testing**: Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md)
5. **Deployment**: Check release documentation

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Reusable components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API services
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript types
│   ├── config/            # App configuration
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
├── docs/                  # Documentation (this folder)
└── __tests__/             # Test files
```

## Common Tasks

### Running the App
```bash
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
```

### Testing
```bash
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Development
```bash
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

## Troubleshooting

Common issues and solutions:

1. **API Connection Issues**: See [API_CONFIG_CHECK.md](./API_CONFIG_CHECK.md)
2. **Image Upload Problems**: See [IMAGE_UPLOAD_GUIDE.md](./IMAGE_UPLOAD_GUIDE.md)
3. **TypeScript Errors**: See [TYPESCRIPT_FIXES_SUMMARY.md](./TYPESCRIPT_FIXES_SUMMARY.md)

## Contributing

When adding mobile documentation:
1. Place it in `/mobile/docs/`
2. Update this index file
3. Follow UPPERCASE.md naming for major docs
4. Include code examples where relevant
5. Test all instructions before documenting

## Related Documentation

- Website Documentation: `/website/docs/INDEX.md`
- API Documentation: `/website/docs/ARCHITECTURE.md`
- Warranty System: `/website/docs/WARRANTY_SYSTEM.md`

## Last Updated

This index was last updated: 2025-11-12

---

**Need Help?** Start with [QUICKSTART.md](./QUICKSTART.md) or [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
