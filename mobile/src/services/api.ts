/**
 * API Service for SnapRegister Mobile App
 * Handles all HTTP requests with token management, error handling, and retry logic
 */

import * as SecureStore from 'expo-secure-store';
import {
  API_URL,
  API_CONFIG_DEFAULTS,
  HTTP_STATUS,
  API_ERROR_MESSAGES,
  buildUrl,
  isSuccessResponse,
} from '../config/api';

// Storage keys
const AUTH_TOKEN_KEY = 'authToken';

// Response interface to match axios-like structure
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

// Request configuration interface
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean; // Skip auth token for login/signup
  retry?: boolean; // Enable retry logic
}

// Error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get stored authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('[API] Error getting auth token:', error);
    }
    return null;
  }
};

/**
 * Store authentication token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    if (__DEV__) {
      console.log('[API] Auth token stored successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[API] Error storing auth token:', error);
    }
    throw new Error('Failed to store authentication token');
  }
};

/**
 * Clear authentication token
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    if (__DEV__) {
      console.log('[API] Auth token cleared');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[API] Error clearing auth token:', error);
    }
  }
};

/**
 * Request interceptor - adds headers and authentication
 */
const requestInterceptor = async (
  url: string,
  options: RequestInit,
  config?: RequestConfig
): Promise<[string, RequestInit]> => {
  // Build full URL
  const fullUrl = buildUrl(url);

  // Check if body is FormData - don't set Content-Type for FormData (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  // Merge headers
  const headers: Record<string, string> = {
    ...(isFormData ? {} : API_CONFIG_DEFAULTS.HEADERS), // Don't set Content-Type for FormData
    ...config?.headers,
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // Remove Content-Type if FormData (let browser set it)
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  // Add Authorization header if not skipped
  if (!config?.skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      if (__DEV__) {
        console.log('[API] Request with auth token');
      }
    }
  }

  // Update options with headers
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  };

  if (__DEV__) {
    console.log('[API Request]', {
      method: options.method || 'GET',
      url: fullUrl,
      hasAuth: !!headers.Authorization,
    });
  }

  return [fullUrl, requestOptions];
};

/**
 * Response interceptor - handles errors and token expiration
 */
const responseInterceptor = async <T>(
  response: Response,
  fullUrl: string,
  method: string
): Promise<ApiResponse<T>> => {
  // Parse response body
  let data: T;
  const contentType = response.headers.get('content-type');

  try {
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }
  } catch (error) {
    // If response parsing fails, use empty object
    data = {} as T;
  }

  // Handle successful responses
  if (isSuccessResponse(response.status)) {
    if (__DEV__) {
      console.log('[API Response]', {
        method,
        url: fullUrl,
        status: response.status,
      });
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  }

  // Handle error responses
  if (__DEV__) {
    console.error('[API Error]', {
      method,
      url: fullUrl,
      status: response.status,
      error: (data as any)?.error || response.statusText,
    });
  }

  // Handle 401 Unauthorized - clear token
  if (response.status === HTTP_STATUS.UNAUTHORIZED) {
    await clearAuthToken();
    throw new ApiError(
      API_ERROR_MESSAGES.UNAUTHORIZED,
      response.status,
      data
    );
  }

  // Handle specific error status codes
  let errorMessage: string;
  switch (response.status) {
    case HTTP_STATUS.BAD_REQUEST:
      errorMessage = (data as any)?.error || API_ERROR_MESSAGES.VALIDATION_ERROR;
      break;
    case HTTP_STATUS.NOT_FOUND:
      errorMessage = API_ERROR_MESSAGES.NOT_FOUND;
      break;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      errorMessage = 'Too many requests. Please try again later.';
      break;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      errorMessage = API_ERROR_MESSAGES.SERVER_ERROR;
      break;
    default:
      errorMessage = (data as any)?.error || `HTTP ${response.status}: ${response.statusText}`;
  }

  throw new ApiError(errorMessage, response.status, data);
};

/**
 * Sleep helper for retry delay
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Core fetch function with timeout, interceptors, and retry logic
 */
async function fetchWithConfig<T>(
  url: string,
  options: RequestInit = {},
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  const timeout = config?.timeout || API_CONFIG_DEFAULTS.TIMEOUT;
  const enableRetry = config?.retry ?? true;
  const maxAttempts = enableRetry ? API_CONFIG_DEFAULTS.RETRY.MAX_ATTEMPTS : 1;

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Apply request interceptor
      const [fullUrl, requestOptions] = await requestInterceptor(url, options, config);

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Make request
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Apply response interceptor
        return await responseInterceptor<T>(
          response,
          fullUrl,
          options.method || 'GET'
        );

      } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError(API_ERROR_MESSAGES.TIMEOUT_ERROR, 0);
        }

        // Handle network errors (connection refused, no internet, etc.)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new ApiError(API_ERROR_MESSAGES.NETWORK_ERROR, 0);
        }

        throw error;
      }

    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors or client errors (4xx)
      if (error instanceof ApiError) {
        // Don't retry on auth errors, client errors, or network errors (status 0)
        if (
          error.status === HTTP_STATUS.UNAUTHORIZED ||
          error.status === HTTP_STATUS.FORBIDDEN ||
          error.status === 0 || // Network/timeout errors
          (error.status >= 400 && error.status < 500)
        ) {
          throw error;
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay =
        API_CONFIG_DEFAULTS.RETRY.DELAY *
        Math.pow(API_CONFIG_DEFAULTS.RETRY.BACKOFF_MULTIPLIER, attempt - 1);

      if (__DEV__) {
        console.log(`[API] Retrying request (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms`);
      }

      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof ApiError) {
    throw lastError;
  }

  // Handle network errors
  throw new ApiError(
    API_ERROR_MESSAGES.NETWORK_ERROR,
    0,
    { originalError: lastError?.message }
  );
}

/**
 * Generic API methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    fetchWithConfig<T>(url, { method: 'GET' }, config),

  /**
   * POST request
   */
  post: <T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> => {
    // Check if data is FormData - don't stringify it
    const isFormData = data instanceof FormData;
    return fetchWithConfig<T>(
      url,
      {
        method: 'POST',
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      },
      config
    );
  },

  /**
   * PUT request
   */
  put: <T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> =>
    fetchWithConfig<T>(
      url,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    ),

  /**
   * PATCH request
   */
  patch: <T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> =>
    fetchWithConfig<T>(
      url,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    ),

  /**
   * DELETE request
   */
  delete: <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    fetchWithConfig<T>(url, { method: 'DELETE' }, config),
};

/**
 * Upload file with multipart/form-data
 */
export const uploadFile = async (
  endpoint: string,
  fileUri: string,
  fileName: string,
  fieldName: string = 'file',
  additionalData?: Record<string, any>
): Promise<ApiResponse> => {
  const formData = new FormData();

  // Add file to form data
  formData.append(fieldName, {
    uri: fileUri,
    name: fileName,
    type: 'image/jpeg', // Default to JPEG, adjust based on actual file type
  } as any);

  // Add additional fields
  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });
  }

  const token = await getAuthToken();

  const fullUrl = buildUrl(endpoint);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log('[API] Uploading file:', {
      url: fullUrl,
      fileName,
      fieldName,
    });
  }

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!isSuccessResponse(response.status)) {
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        await clearAuthToken();
      }
      throw new ApiError(
        (data as any)?.error || `Upload failed: ${response.statusText}`,
        response.status,
        data
      );
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'File upload failed',
      0,
      { originalError: (error as Error).message }
    );
  }
};

/**
 * Clear session and auth tokens
 */
export const clearSession = async (): Promise<void> => {
  await clearAuthToken();
};

export default api;
