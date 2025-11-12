# SnapRegister Mobile API Setup

This document describes the API integration for the SnapRegister mobile app, including configuration, authentication, and usage.

## Overview

The mobile app connects to the SnapRegister backend API to handle:
- User authentication (login/signup/logout)
- Product management (CRUD operations)
- Warranty management
- AI-powered image analysis
- File uploads

## Architecture

### Key Files

1. **`mobile/src/config/api.ts`** - API configuration and endpoints
   - Base URL configuration for dev/staging/prod
   - Endpoint definitions
   - Configuration constants (timeout, retry logic, etc.)

2. **`mobile/src/services/api.ts`** - Core HTTP client
   - Request/response interceptors
   - Token management (SecureStore)
   - Error handling and retry logic
   - File upload support

3. **`mobile/src/services/authService.ts`** - Authentication service
   - Login/signup/logout
   - Session validation
   - Password reset
   - Profile management

4. **`mobile/src/services/productService.ts`** - Product service
   - Product CRUD operations
   - Search and filtering
   - Image uploads

5. **`mobile/src/services/warrantyService.ts`** - Warranty service
   - Warranty management
   - Document uploads
   - Expiration tracking

## Configuration

### Environment Variables

Set the API URL using environment variables:

```bash
# Development (iOS Simulator)
EXPO_PUBLIC_API_URL=http://192.168.1.15:3004

# Development (Android Emulator) - automatically uses 10.0.2.2
EXPO_PUBLIC_API_URL=http://localhost:3004

# Staging
EXPO_PUBLIC_API_URL=https://staging.snapregister.com

# Production
EXPO_PUBLIC_API_URL=https://snapregister.com
```

### Platform-Specific URLs

The app automatically handles platform-specific localhost mapping:
- **iOS Simulator**: Uses your local IP address (e.g., `192.168.1.15:3004`)
- **Android Emulator**: Automatically converts `localhost` to `10.0.2.2`
- **Physical Devices**: Use your computer's network IP address

## Authentication Flow

### 1. Login

```typescript
import { authService } from '@/services/authService';

try {
  const { user, token } = await authService.login(email, password);
  // Token is automatically stored in SecureStore
  // All subsequent requests will include the token
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### 2. Token Management

The API client automatically:
- Retrieves the stored token from SecureStore
- Adds `Authorization: Bearer <token>` header to all requests
- Clears the token on 401 Unauthorized responses
- Handles token expiration

### 3. Logout

```typescript
await authService.logout();
// Token is automatically removed from SecureStore
```

## API Usage Examples

### Products

```typescript
import { productService } from '@/services/productService';

// Get paginated products
const { data, pagination } = await productService.getProducts(page, limit);

// Get single product
const product = await productService.getProductById(productId);

// Create product
const newProduct = await productService.createProduct({
  name: 'iPhone 15',
  brand: 'Apple',
  model: 'iPhone 15 Pro',
  purchaseDate: new Date(),
  purchasePrice: 999,
});

// Update product
const updated = await productService.updateProduct(productId, {
  notes: 'Updated notes',
});

// Delete product
await productService.deleteProduct(productId);
```

### Warranties

```typescript
import { warrantyService } from '@/services/warrantyService';

// Get all warranties
const warranties = await warrantyService.getWarranties();

// Get active warranties
const active = await warrantyService.getActiveWarranties();

// Get expiring warranties (next 30 days)
const expiring = await warrantyService.getExpiringWarranties(30);

// Create warranty
const warranty = await warrantyService.createWarranty({
  productId: 'product-123',
  provider: 'Apple',
  type: 'manufacturer',
  startDate: new Date(),
  endDate: new Date('2025-12-31'),
});
```

## Error Handling

### Built-in Error Handling

The API client provides comprehensive error handling:

```typescript
import { api, ApiError } from '@/services/api';

try {
  const response = await api.get('/products');
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Data:', error.data);

    switch (error.status) {
      case 401:
        // Unauthorized - redirect to login
        break;
      case 404:
        // Not found
        break;
      case 500:
        // Server error
        break;
      default:
        // Other errors
    }
  }
}
```

### Error Types

- **Network Errors**: Connection issues, timeouts
- **HTTP Errors**: 4xx, 5xx status codes
- **Validation Errors**: Invalid input data
- **Authentication Errors**: Token expired, unauthorized

## Retry Logic

The API client automatically retries failed requests with exponential backoff:

- **Max Attempts**: 3
- **Initial Delay**: 1 second
- **Backoff Multiplier**: 2x
- **Excluded**: 4xx client errors (except 429)

To disable retry for a specific request:

```typescript
await api.get('/products', { retry: false });
```

## Request Timeout

Default timeout: 30 seconds

Custom timeout:

```typescript
await api.get('/products', { timeout: 60000 }); // 60 seconds
```

## File Uploads

### Upload Product Image

```typescript
import { uploadFile } from '@/services/api';

const response = await uploadFile(
  '/products/123/image',
  imageUri,
  'product.jpg',
  'image'
);
```

### Upload Warranty Document

```typescript
const response = await warrantyService.uploadWarrantyDocument(
  warrantyId,
  documentUri
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Validate session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List products (paginated)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Warranties
- `GET /api/warranties` - List warranties
- `POST /api/warranty` - Create warranty
- `GET /api/warranty/:id` - Get warranty
- `PUT /api/warranty/:id` - Update warranty
- `DELETE /api/warranty/:id` - Delete warranty
- `POST /api/warranty/analyze` - Analyze warranty image

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

## Security

### Token Storage
- Tokens are stored securely using Expo SecureStore
- Tokens are encrypted on both iOS and Android
- Tokens are automatically included in request headers

### HTTPS
- All production/staging requests use HTTPS
- Development can use HTTP for local testing

### Request Validation
- All requests include proper headers
- Input data is validated before sending
- Sensitive data is never logged in production

## Debugging

### Development Logging

The app logs API requests in development mode:

```
[API Request] GET http://localhost:3004/api/products
[API Response] 200 OK
[Auth] Login successful: user@example.com
[Products] Fetched products: 10
```

### Disable Logging

Logging is automatically disabled in production (`__DEV__ === false`)

## Testing

### Test Authentication

```typescript
import { authService } from '@/services/authService';

// Login
const result = await authService.login('test@example.com', 'password');
console.log('User:', result.user);

// Validate session
const user = await authService.getSession();
console.log('Session valid:', !!user);

// Logout
await authService.logout();
```

### Test API Connection

```typescript
import { api } from '@/services/api';

try {
  const response = await api.get('/products');
  console.log('API connected successfully');
} catch (error) {
  console.error('API connection failed:', error.message);
}
```

## Troubleshooting

### "Network request failed"
- Check if backend server is running
- Verify API URL is correct for your platform
- For Android emulator, ensure you're using `10.0.2.2` instead of `localhost`
- For iOS simulator, use your computer's local IP address

### "Unauthorized" errors
- Check if token is stored correctly
- Verify backend is accepting Bearer tokens
- Try logging out and logging back in

### Timeout errors
- Increase timeout for slow connections
- Check network connectivity
- Verify backend server is responsive

### 404 errors
- Verify endpoint paths match backend routes
- Check API base URL configuration

## Migration Notes

If you're migrating from the old API setup:

1. Replace imports from `config/env` with `config/api`:
   ```typescript
   // Old
   import { API_ENDPOINTS } from '../config/env';

   // New
   import { API_ENDPOINTS } from '../config/api';
   ```

2. Update endpoint usage:
   ```typescript
   // Old
   API_ENDPOINTS.LOGIN

   // New
   API_ENDPOINTS.AUTH.LOGIN
   ```

3. Token management is now automatic - no need to manually set headers

## Summary

The SnapRegister mobile API integration provides:
- Secure JWT-based authentication with automatic token management
- Comprehensive error handling and retry logic
- Type-safe API calls with TypeScript
- Platform-specific URL configuration
- File upload support
- Request/response interceptors
- Development logging for debugging

All services are ready to use and properly connected to the backend API endpoints.
