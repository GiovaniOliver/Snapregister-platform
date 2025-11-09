/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Mock global objects
global.__DEV__ = true;

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  Button: 'Button',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
  TextInput: 'TextInput',
  Image: 'Image',
  SafeAreaView: 'SafeAreaView',
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      environment: 'dev',
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  useCameraPermissions: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock FormData for file uploads
global.FormData = jest.fn(() => ({
  append: jest.fn(),
}));

// Mock fetch globally
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Suppress console warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message) => {
    // Allow certain error messages to pass through
    if (
      message.includes('Non-serializable values') ||
      message.includes('Not implemented')
    ) {
      return;
    }
    originalConsoleError(message);
  });

  console.warn = jest.fn((message) => {
    // Suppress React Native specific warnings
    if (
      message.includes('Non-serializable') ||
      message.includes('Task promise')
    ) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
