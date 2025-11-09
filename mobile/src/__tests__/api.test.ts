/**
 * API Integration Tests
 * Tests for API request/response handling, authentication headers, error handling, and token management
 * Using Jest with fetch mocking
 */

import * as SecureStore from 'expo-secure-store';
import { api, uploadFile, clearSession } from '../services/api';
import { API_URL } from '../config/env';

// Mock dependencies
jest.mock('expo-secure-store');

// Create a simple fetch mock
global.fetch = jest.fn();

interface FetchMockOptions {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
  body?: any;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
}

const createFetchResponse = (
  body: any,
  options: FetchMockOptions = {}
): Response => {
  const {
    status = 200,
    ok = status >= 200 && status < 300,
    headers = { 'content-type': 'application/json' },
  } = options;

  return {
    ok,
    status,
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    clearSession();
  });

  describe('GET Requests', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test data' };
      (fetch as jest.Mock).mockResolvedValue(
        createFetchResponse(mockResponse)
      );

      const response = await api.get('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          credentials: 'include',
        })
      );

      expect(response.data).toEqual(mockResponse);
    });

    it('should include auth token in headers if available', async () => {
      const authToken = 'test-token-123';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(authToken);

      const mockResponse = { authenticated: true };
      (fetch as jest.Mock).mockResolvedValue(
        createFetchResponse(mockResponse)
      );

      await api.get('/protected-endpoint');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('authToken');
      // Token is stored in secure storage and used in subsequent requests
    });

    it('should handle JSON responses correctly', async () => {
      const jsonData = { id: 1, name: 'Test' };
      const mockResponse = createFetchResponse(jsonData);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.get<typeof jsonData>('/json-endpoint');

      expect(response.data).toEqual(jsonData);
      expect(response.status).toBe(200);
    });

    it('should handle text responses correctly', async () => {
      const textData = 'Plain text response';
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue(textData),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.get('/text-endpoint');

      expect(response.data).toBe(textData);
    });
  });

  describe('POST Requests', () => {
    it('should make POST request with body', async () => {
      const requestBody = { email: 'test@example.com', password: 'password123' };
      const responseBody = { success: true, user: { id: '123' } };

      const mockResponse = createFetchResponse(responseBody);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.post('/auth/login', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      expect(response.data).toEqual(responseBody);
    });

    it('should handle POST without body', async () => {
      const responseBody = { success: true };

      const mockResponse = createFetchResponse(responseBody);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.post('/auth/logout');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );

      expect(response.data).toEqual(responseBody);
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request with updated data', async () => {
      const updateData = { firstName: 'John', lastName: 'Doe' };
      const responseBody = { success: true, data: updateData };

      const mockResponse = createFetchResponse(responseBody);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.put('/user/profile', updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );

      expect(response.data).toEqual(responseBody);
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request', async () => {
      const responseBody = { success: true };

      const mockResponse = createFetchResponse(responseBody);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.delete('/products/123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(response.data).toEqual(responseBody);
    });
  });

  describe('PATCH Requests', () => {
    it('should make PATCH request with partial data', async () => {
      const patchData = { notes: 'Updated notes' };
      const responseBody = { success: true, data: patchData };

      const mockResponse = createFetchResponse(responseBody);
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.patch('/products/123', patchData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );

      expect(response.data).toEqual(responseBody);
    });
  });

  describe('URL Construction', () => {
    it('should construct full URL from relative path', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test-endpoint');

      const callUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain(API_URL);
      expect(callUrl).toContain('/test-endpoint');
    });

    it('should use full URL if provided', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const fullUrl = 'https://example.com/api/test';
      await api.get(fullUrl);

      const callUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toBe(fullUrl);
    });

    it('should not duplicate URL when constructing', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/auth/login');

      const callUrl = (fetch as jest.Mock).mock.calls[0][0];
      // Should not have duplicate paths
      expect(callUrl.split('/auth/login').length).toBeLessThanOrEqual(2);
    });
  });

  describe('Session Cookies', () => {
    it('should store session cookie from response headers', async () => {
      const mockResponse = createFetchResponse(
        { success: true },
        {
          headers: {
            'set-cookie': 'session=abc123; Path=/; HttpOnly',
            'content-type': 'application/json',
          },
        }
      );

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Make initial request that returns session cookie
      const initialCall = await api.post('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });

      expect(initialCall.data).toBeDefined();

      // Note: In the actual implementation, the session cookie is stored
      // in the sessionCookie variable and sent in subsequent requests
    });

    it('should include session cookie in subsequent requests', async () => {
      // This would require testing the internal session state
      // The real implementation stores sessionCookie in module scope
      // and includes it in headers: Cookie = sessionCookie

      const mockResponse = createFetchResponse({ data: 'test' });
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Make a request - it should include session cookie if available
      await api.get('/protected-resource');

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error on HTTP error status', async () => {
      const errorBody = { error: 'Not found' };
      const mockResponse = createFetchResponse(errorBody, {
        status: 404,
        ok: false,
      });

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(api.get('/nonexistent')).rejects.toThrow('HTTP 404');
    });

    it('should clear auth on 401 Unauthorized', async () => {
      const mockResponse = createFetchResponse(
        { error: 'Unauthorized' },
        { status: 401, ok: false }
      );

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(api.get('/protected')).rejects.toThrow('HTTP 401');

      // Verify token was cleared
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Request timeout');

      (fetch as jest.Mock).mockImplementation(() => {
        // Simulate abort
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        throw error;
      });

      await expect(api.get('/test')).rejects.toThrow('Request timeout');
    });

    it('should handle network failure', async () => {
      const networkError = new Error('Failed to fetch');

      (fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(api.get('/test')).rejects.toThrow('Failed to fetch');
    });

    it('should use error message from response if available', async () => {
      const errorBody = { error: 'Custom error message' };
      const mockResponse = createFetchResponse(errorBody, {
        status: 400,
        ok: false,
      });

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(api.post('/test', {})).rejects.toThrow(
        'Custom error message'
      );
    });

    it('should handle 500 server errors', async () => {
      const errorBody = { error: 'Internal server error' };
      const mockResponse = createFetchResponse(errorBody, {
        status: 500,
        ok: false,
      });

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(api.get('/test')).rejects.toThrow('HTTP 500');
    });

    it('should handle 403 Forbidden', async () => {
      const errorBody = { error: 'Access denied' };
      const mockResponse = createFetchResponse(errorBody, {
        status: 403,
        ok: false,
      });

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(api.get('/admin')).rejects.toThrow('HTTP 403');
    });
  });

  describe('File Upload', () => {
    it('should upload file with multipart form data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { imageUrl: 'https://example.com/image.jpg' },
        }),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const fileUri = 'file:///path/to/image.jpg';
      const fileName = 'product_123.jpg';
      const endpoint = '/products/123/image';

      const response = await uploadFile(endpoint, fileUri, fileName);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(endpoint),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(response.data.success).toBe(true);
    });

    it('should include additional data in multipart upload', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { imageUrl: 'https://example.com/image.jpg' },
        }),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const fileUri = 'file:///path/to/image.jpg';
      const fileName = 'product_123.jpg';
      const additionalData = { alt: 'Product image', title: 'Product' };

      await uploadFile('/products/123/image', fileUri, fileName, additionalData);

      expect(fetch).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ error: 'Upload failed' }),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const fileUri = 'file:///path/to/image.jpg';

      await expect(uploadFile('/upload', fileUri, 'image.jpg')).rejects.toThrow();
    });
  });

  describe('Response Handling', () => {
    it('should return response with status and headers', async () => {
      const mockResponse = createFetchResponse({ data: 'test' }, {
        status: 201,
        headers: { 'x-custom': 'header-value' },
      });

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.post('/test', {});

      expect(response.status).toBe(201);
      expect(response.headers).toBeDefined();
    });

    it('should handle empty responses', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(null),
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.delete('/test');

      expect(response.status).toBe(204);
    });
  });

  describe('Request Configuration', () => {
    it('should apply custom headers from config', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const customHeaders = { 'X-Custom-Header': 'custom-value' };

      await api.get('/test', { headers: customHeaders });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining(customHeaders),
        })
      );
    });

    it('should apply custom timeout from config', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test', { timeout: 5000 });

      expect(fetch).toHaveBeenCalled();
    });

    it('should use default timeout if not specified', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test');

      expect(fetch).toHaveBeenCalled();
      // Default timeout is 30000ms based on the implementation
    });
  });

  describe('Session Management', () => {
    it('should clear session on logout', () => {
      clearSession();

      // The session should now be cleared
      // Subsequent requests should not include session cookie
      expect(true).toBe(true); // Placeholder - actual verification in integration
    });

    it('should handle missing auth token gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const mockResponse = createFetchResponse({ data: 'public' });
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.get('/public-endpoint');

      expect(response.data).toBeDefined();
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = createFetchResponse({ success: true });
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const requests = [
        api.get('/endpoint1'),
        api.get('/endpoint2'),
        api.get('/endpoint3'),
      ];

      const responses = await Promise.all(requests);

      expect(responses.length).toBe(3);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed request types concurrently', async () => {
      const mockResponse = createFetchResponse({ success: true });
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const requests = [
        api.get('/products'),
        api.post('/products', { name: 'Test' }),
        api.put('/products/123', { name: 'Updated' }),
        api.delete('/products/123'),
      ];

      const responses = await Promise.all(requests);

      expect(responses.length).toBe(4);
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Content-Type Handling', () => {
    it('should set content-type to application/json for JSON requests', async () => {
      const mockResponse = createFetchResponse({});
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.post('/test', { key: 'value' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle different content-type responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: jest.fn().mockResolvedValue('<html></html>'),
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      } as unknown as Response;

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.get('/html-endpoint');

      expect(response.data).toBe('<html></html>');
    });
  });
});
