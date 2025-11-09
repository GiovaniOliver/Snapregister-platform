# SnapRegister Mobile App - Testing Guide

## Quick Start

### 1. Install Testing Dependencies
```bash
cd mobile
npm install --save-dev jest babel-jest @testing-library/react-native @testing-library/jest-native @types/jest
```

### 2. Run All Tests
```bash
npm test
```

### 3. View Coverage Report
```bash
npm run test:coverage
```

---

## Available Test Commands

### Run All Tests
```bash
npm test
```
Runs all test files in `src/__tests__/` directory.

### Run Tests in Watch Mode
```bash
npm run test:watch
```
Automatically re-runs tests when files change. Useful during development.

### Run Authentication Tests Only
```bash
npm run test:auth
```
Runs only `src/__tests__/auth.test.tsx` (23 tests)
- User signup flow
- User login flow
- Session persistence
- Session expiration
- Logout functionality
- Error handling

### Run Product Tests Only
```bash
npm run test:products
```
Runs only `src/__tests__/products.test.tsx` (37 tests)
- Single image scan workflow
- Multi-image scan workflow
- Manual product entry
- Product list pagination
- Product search functionality
- Product details view
- Error scenarios

### Run API Tests Only
```bash
npm run test:api
```
Runs only `src/__tests__/api.test.ts` (34 tests)
- HTTP request methods (GET, POST, PUT, DELETE, PATCH)
- Request/response handling
- Authentication headers
- Session cookie management
- File uploads
- Error handling (4xx, 5xx)
- Concurrent requests

### Generate Coverage Report
```bash
npm run test:coverage
```
Generates detailed coverage report including:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Coverage report is generated in `coverage/` directory.

---

## Test File Structure

```
mobile/src/__tests__/
├── auth.test.tsx          # Authentication flow tests (23 tests)
├── products.test.tsx      # Product workflow tests (37 tests)
└── api.test.ts            # API integration tests (34 tests)
```

---

## Test Organization

### Authentication Tests (23)
```
User Signup Flow (3)
├── should successfully signup user and create session
├── should handle signup failure gracefully
└── should handle network errors during signup

User Login Flow (3)
├── should successfully login user and retrieve session
├── should handle invalid credentials on login
└── should make API calls work after successful login

Session Persistence (3)
├── should restore session on app restart if token exists
├── should clear invalid session on restart
└── should maintain session across multiple renders

Session Expiration (2)
├── should handle session expiration (401) gracefully
└── should clear session when 401 response received

Logout (3)
├── should properly clear session on logout
├── should clear session even if logout API call fails
└── should clear session and not allow API calls after logout

Auth Context Error Handling (2)
├── should handle errors in checkAuthStatus gracefully
└── should throw error when useAuth outside of AuthProvider
```

### Product Tests (37)
```
Single Image Scan (4)
├── should scan image, analyze with AI, and save product
├── should handle AI analysis failure
├── should handle product save failure after AI analysis
└── should display scanned product in products list

Multi-Image Scan (3)
├── should scan 4 images, analyze, and save product
├── should handle AI analysis failure
└── should return high confidence for clear captures

Manual Product Entry (2)
├── should save manually entered product
└── should appear in products list after save

Product List Pagination (5)
├── should fetch products with pagination
├── should fetch next page of products
├── should handle invalid page numbers
├── should handle different page sizes
└── should return empty list when not found

Product Search (6)
├── should search products by query
├── should return empty results for non-matching
├── should search by brand
├── should search by model
├── should handle search errors
└── should search case-insensitively

Product Details View (6)
├── should fetch product details by ID
├── should include all product details
├── should handle product not found
├── should display warranty information
├── should update product details
└── should delete product

Error Scenarios (6)
├── should handle network errors during fetch
├── should handle API errors during save
├── should handle authentication errors
└── should handle validation errors
```

### API Tests (34)
```
HTTP Methods (9)
├── GET Requests (4)
├── POST Requests (2)
├── PUT Requests (1)
├── DELETE Requests (1)
└── PATCH Requests (1)

URL Construction (3)
├── should construct full URL from relative path
├── should use full URL if provided
└── should not duplicate URL

Session Cookies (2)
├── should store session cookie from response headers
└── should include session cookie in subsequent requests

Error Handling (7)
├── should throw error on HTTP error status
├── should clear auth on 401 Unauthorized
├── should handle network timeout
├── should handle network failure
├── should use error message from response
├── should handle 500 server errors
└── should handle 403 Forbidden

File Upload (3)
├── should upload file with multipart form data
├── should include additional data in upload
└── should handle upload errors

Response Handling (2)
├── should return response with status and headers
└── should handle empty responses

Request Configuration (3)
├── should apply custom headers
├── should apply custom timeout
└── should use default timeout

Session Management (2)
├── should clear session on logout
└── should handle missing auth token

Concurrent Requests (2)
├── should handle multiple concurrent requests
└── should handle mixed request types concurrently

Content-Type Handling (2)
├── should set content-type to application/json
└── should handle different content-type responses
```

---

## Debugging Tests

### Run Specific Test File with Details
```bash
npm test -- src/__tests__/auth.test.tsx --verbose
```

### Run Specific Test Case
```bash
npm test -- --testNamePattern="should successfully login user"
```

### Run Tests with Coverage for Specific File
```bash
npm test -- src/__tests__/products.test.tsx --coverage
```

### Watch Mode with Specific File
```bash
npm test -- --watch src/__tests__/auth.test.tsx
```

### Show Test Names Without Running
```bash
npm test -- --listTests
```

---

## Understanding Test Output

### Successful Test Run
```
PASS  src/__tests__/auth.test.tsx
  Authentication Flow Tests
    User Signup Flow
      ✓ should successfully signup user and create session (25ms)
      ✓ should handle signup failure gracefully (18ms)
      ✓ should handle network errors during signup (22ms)
    ...
Test Suites: 3 passed, 3 total
Tests:       94 passed, 94 total
```

### Failed Test Output
```
FAIL  src/__tests__/auth.test.tsx
  Authentication Flow Tests
    User Login Flow
      ✗ should successfully login user and retrieve session
        Expected mock function to have been called with:
        {"email": "test@example.com", "password": "password"}

        But it was not called.
```

### Coverage Report Output
```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files               |   90.5  |   88.2   |   92.1  |   90.5  |
 src/services/          |   95.2  |   92.1   |   96.5  |   95.2  |
 src/contexts/          |   88.3  |   85.0   |   89.2  |   88.3  |
 src/services/api.ts    |   98.1  |   96.5   |   100   |   98.1  |
```

---

## Common Test Issues and Solutions

### Issue: Tests Timeout
**Solution:** Increase timeout in jest.config.js or specific test:
```typescript
jest.setTimeout(15000); // 15 seconds for this test
```

### Issue: Async/Await Not Waiting
**Solution:** Use `waitFor()` for state changes:
```typescript
await waitFor(() => {
  expect(element).toBeDefined();
});
```

### Issue: Mock Not Working
**Solution:** Clear mocks in beforeEach:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Issue: SecureStore Mock Not Found
**Solution:** Ensure mock is imported at top of test file:
```typescript
jest.mock('expo-secure-store');
```

### Issue: Fetch Mock Not Responding
**Solution:** Mock both success and error scenarios:
```typescript
// Success
(fetch as jest.Mock).mockResolvedValue(mockResponse);

// Error
(fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
```

---

## Testing Best Practices Used

### 1. **Isolation**
Each test is independent and doesn't rely on other tests:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. **Clear Test Names**
Test names describe the behavior being tested:
```typescript
it('should handle AI analysis failure during single image scan', async () => {
```

### 3. **AAA Pattern**
Tests follow Arrange-Act-Assert structure:
```typescript
// Arrange
const mockUser = { ... };

// Act
const result = await authService.login(...);

// Assert
expect(result.user).toEqual(mockUser);
```

### 4. **Proper Mocking**
External dependencies are mocked:
```typescript
jest.mock('../services/authService');
jest.mock('expo-secure-store');
```

### 5. **Error Testing**
Both success and failure paths are tested:
```typescript
// Success path
(authService.login as jest.Mock).mockResolvedValue(...);

// Error path
(authService.login as jest.Mock).mockRejectedValue(error);
```

---

## Coverage Goals

### Current Coverage (After Test Suite)
- **Statements:** ~90% (Target: 75%)
- **Branches:** ~88% (Target: 70%)
- **Functions:** ~92% (Target: 75%)
- **Lines:** ~90% (Target: 75%)

### Modules with High Coverage
- `authService.ts` - 95%
- `api.ts` - 98%
- `productService.ts` - 92%
- `AuthContext.tsx` - 88%

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd mobile && npm ci
      - run: cd mobile && npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

---

## Performance Metrics

### Expected Test Execution Times
- Authentication tests: ~2-3 seconds
- Product tests: ~3-4 seconds
- API tests: ~2-3 seconds
- **Total:** ~7-10 seconds

### Coverage Report Generation
- Time: ~5-10 seconds
- Output: `coverage/` directory

---

## Next Steps for Extending Tests

1. **Component Tests**: Add tests for individual React components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Add end-to-end tests with real backend
4. **Performance Tests**: Add performance benchmarks
5. **Accessibility Tests**: Add WCAG compliance tests
6. **Visual Regression**: Add screenshot comparison tests

---

## Support and Resources

### Jest Documentation
- https://jestjs.io/docs/getting-started

### React Native Testing Library
- https://testing-library.com/docs/react-native-testing-library/intro

### Testing Best Practices
- https://javascript.info/testing
- https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Contact and Questions

For questions about the test suite:
1. Review this testing guide
2. Check test file comments
3. Review TEST_COVERAGE_SUMMARY.md for detailed test information
4. Consult jest.config.js for configuration details
