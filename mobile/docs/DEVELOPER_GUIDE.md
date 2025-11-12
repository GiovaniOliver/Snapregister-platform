# SnapRegister Mobile - Developer Quick Reference

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Clear cache and restart
npm run clear

# Build for production
npm run build:ios
npm run build:android
```

## Project Architecture

### Authentication Flow
```
App.tsx
  └─ AuthProvider (manages auth state)
      └─ AppNavigator (routes based on auth)
          ├─ AuthStack (not authenticated)
          │   ├─ LoginScreen
          │   └─ SignupScreen
          └─ MainStack (authenticated)
              ├─ TabNavigator
              │   ├─ HomeScreen
              │   ├─ ScanScreen
              │   ├─ ProductsScreen
              │   └─ ProfileScreen
              ├─ CameraCaptureScreen (modal)
              ├─ ProductDetailsScreen
              └─ WarrantyDetailsScreen
```

### Data Flow
```
Screen/Component
  └─ calls service method
      └─ api.ts (adds auth token)
          └─ backend API
              └─ returns data
                  └─ updates component state
```

## Common Development Tasks

### Adding a New Screen

1. **Create screen file** in `src/screens/`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>New Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewScreen;
```

2. **Add to navigation types** in `src/types/index.ts`:
```typescript
export type RootStackParamList = {
  // ... existing screens
  NewScreen: { id: string }; // with params
  // or
  NewScreen: undefined; // without params
};
```

3. **Add to navigator** in `src/navigation/AppNavigator.tsx`:
```typescript
import NewScreen from '../screens/NewScreen';

// Inside Stack.Navigator
<Stack.Screen
  name="NewScreen"
  component={NewScreen}
  options={{ title: 'New Screen' }}
/>
```

4. **Navigate to screen**:
```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('NewScreen', { id: '123' });
```

### Adding a New API Service

1. **Create service file** in `src/services/`:
```typescript
import { api } from './api';
import { API_ENDPOINTS } from '../config/env';

export const newService = {
  getItems: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  createItem: async (data: any) => {
    const response = await api.post('/items', data);
    return response.data;
  },
};
```

2. **Use in component**:
```typescript
import { newService } from '../services/newService';

const [loading, setLoading] = useState(false);

const loadData = async () => {
  try {
    setLoading(true);
    const data = await newService.getItems();
    // handle data
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### Using Authentication

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('email@example.com', 'password');
      // Automatically navigates to main app
    } catch (error) {
      // Handle error
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Automatically navigates to login
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome {user?.email}</Text>
      ) : (
        <Text>Not logged in</Text>
      )}
    </View>
  );
};
```

### Making API Calls

```typescript
import { api } from '../services/api';

// GET request
const getData = async () => {
  const response = await api.get('/endpoint');
  return response.data;
};

// POST request
const postData = async (data: any) => {
  const response = await api.post('/endpoint', data);
  return response.data;
};

// PUT request
const updateData = async (id: string, data: any) => {
  const response = await api.put(`/endpoint/${id}`, data);
  return response.data;
};

// DELETE request
const deleteData = async (id: string) => {
  await api.delete(`/endpoint/${id}`);
};

// File upload
import { uploadFile } from '../services/api';

const uploadImage = async (imageUri: string) => {
  const response = await uploadFile(
    '/upload',
    imageUri,
    'image.jpg',
    { productId: '123' }
  );
  return response.data;
};
```

### Handling Forms

```typescript
import { useState } from 'react';
import { TextInput, Button, Alert } from 'react-native';

const FormComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      // Submit logic
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        editable={!loading}
      />
      <Button
        title="Submit"
        onPress={handleSubmit}
        disabled={loading}
      />
    </>
  );
};
```

### Navigation Patterns

```typescript
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Type-safe screen props
type Props = NativeStackScreenProps<RootStackParamList, 'ScreenName'>;

const Screen: React.FC<Props> = ({ navigation, route }) => {
  // Get params
  const { id } = route.params;

  // Navigate
  navigation.navigate('OtherScreen', { data: 'value' });

  // Go back
  navigation.goBack();

  // Replace screen
  navigation.replace('NewScreen');

  // Reset stack
  navigation.reset({
    index: 0,
    routes: [{ name: 'Home' }],
  });
};

// Using hooks
const AnyComponent = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Navigate
  navigation.navigate('Screen' as never);
};
```

### Styling Patterns

```typescript
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  // Platform-specific styles
  text: {
    ...Platform.select({
      ios: { fontFamily: 'Arial' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  // Responsive spacing
  spacing: {
    marginVertical: Platform.OS === 'ios' ? 20 : 16,
  },
});

// Common color palette
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  gray: '#8E8E93',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
};
```

### Error Handling

```typescript
try {
  const result = await apiCall();
  // Success handling
} catch (error: any) {
  // Type-safe error handling
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const message = error.response.data?.error || 'Server error';

    if (status === 401) {
      // Unauthorized - handled by interceptor
    } else if (status === 404) {
      Alert.alert('Not Found', message);
    } else {
      Alert.alert('Error', message);
    }
  } else if (error.request) {
    // No response received
    Alert.alert('Network Error', 'Please check your connection');
  } else {
    // Other errors
    Alert.alert('Error', error.message);
  }

  console.error('Full error:', error);
}
```

### Loading States

```typescript
import { ActivityIndicator } from 'react-native';

const [loading, setLoading] = useState(false);

if (loading) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

// Or inline loading
<TouchableOpacity disabled={loading}>
  {loading ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text>Submit</Text>
  )}
</TouchableOpacity>
```

### Image Handling

```typescript
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const pickImage = async () => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo access');
    return;
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    // Use imageUri
  }
};

// Display image
<Image
  source={{ uri: imageUri }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
/>
```

### Camera Usage

```typescript
import { Camera } from 'expo-camera';

const [hasPermission, setHasPermission] = useState<boolean | null>(null);

useEffect(() => {
  (async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);

const takePicture = async () => {
  if (cameraRef.current) {
    const photo = await cameraRef.current.takePictureAsync();
    // Use photo.uri
  }
};

<Camera
  style={{ flex: 1 }}
  type={Camera.Constants.Type.back}
  ref={cameraRef}
/>
```

## Common Patterns

### List Rendering
```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemComponent item={item} />}
  ListEmptyComponent={<EmptyState />}
  refreshing={refreshing}
  onRefresh={handleRefresh}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

### Conditional Rendering
```typescript
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}
{items.length === 0 ? <EmptyState /> : <ItemList items={items} />}
```

### Modal/Alert Patterns
```typescript
import { Alert, Modal } from 'react-native';

// Alert
Alert.alert(
  'Title',
  'Message',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: () => console.log('OK') }
  ],
  { cancelable: true }
);

// Modal
<Modal
  visible={visible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setVisible(false)}
>
  <View style={styles.modalContainer}>
    {/* Modal content */}
  </View>
</Modal>
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

### Writing Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Environment Configuration

### Changing API URL
Edit `src/config/env.ts`:
```typescript
const ENV = {
  dev: {
    apiUrl: 'http://YOUR_IP:3000/api', // For physical device
    webUrl: 'http://YOUR_IP:3000',
  },
  // ...
};
```

### Adding Environment Variable
1. Add to `app.json`:
```json
{
  "extra": {
    "environment": "dev",
    "apiKey": "your-key"
  }
}
```

2. Access in code:
```typescript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.apiKey;
```

## Debugging Tips

### Console Logging
```typescript
// Basic logging
console.log('Data:', data);
console.error('Error:', error);
console.warn('Warning:', warning);

// Pretty print objects
console.log(JSON.stringify(data, null, 2));
```

### React Native Debugger
1. Install React Native Debugger
2. Run `npm start`
3. Press `d` in terminal to open debugger
4. Or shake device and select "Debug"

### Network Inspection
1. Open React Native Debugger
2. Go to Network tab
3. See all API requests/responses

### Performance Monitoring
```typescript
import { useEffect } from 'react';

useEffect(() => {
  console.time('ComponentMount');
  return () => {
    console.timeEnd('ComponentMount');
  };
}, []);
```

## Common Issues & Solutions

### Issue: Metro bundler won't start
```bash
# Clear cache
npm run clear
# or
expo start -c
```

### Issue: TypeScript errors
```bash
# Check for errors
npx tsc --noEmit

# Generate types if needed
npx tsc --declaration --emitDeclarationOnly
```

### Issue: Can't connect to backend
- Use your computer's IP instead of localhost for physical devices
- Check firewall settings
- Ensure backend is accessible from network

### Issue: Authentication not persisting
- Check SecureStore permissions
- Verify token is being saved
- Check token format matches backend

## Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Axios Docs](https://axios-http.com/)
