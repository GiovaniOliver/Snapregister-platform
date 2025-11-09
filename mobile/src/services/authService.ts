/**
 * Authentication Service for SnapRegister Mobile App
 * Handles user authentication, session management, and token storage
 */

import { api, setAuthToken, clearAuthToken } from './api';
import { API_ENDPOINTS } from '../config/api';
import { User, ApiResponse } from '../types';

// Response interfaces matching the website's API structure
interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    plan: string;
  };
  token: string; // JWT session token for mobile apps
}

interface SignupResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    plan: string;
  };
  token: string; // JWT session token for mobile apps
}

interface SessionResponse {
  user: User | null;
}

interface ProfileUpdateResponse {
  success: boolean;
  data: User;
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   * Stores JWT token in SecureStore after successful login
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns User data and session token
   */
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      // Make login request without auth token (skipAuth: true)
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        { skipAuth: true } // Don't send auth token for login
      );

      // Validate response
      if (!response.data.success || !response.data.user || !response.data.token) {
        throw new Error('Invalid login response from server');
      }

      // Store token in SecureStore
      await setAuthToken(response.data.token);

      if (__DEV__) {
        console.log('[Auth] Login successful:', response.data.user.email);
      }

      // Return user data
      return {
        user: {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`,
        } as User,
        token: response.data.token,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Login error:', error.message);
      }
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  },

  /**
   * Signup new user
   * Stores JWT token in SecureStore after successful registration
   *
   * @param email - User's email address
   * @param password - User's password
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns User data and session token
   */
  signup: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ user: User; token: string }> => {
    try {
      // Validate inputs
      if (!email || !password || !firstName || !lastName) {
        throw new Error('All fields are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Make signup request without auth token
      const response = await api.post<SignupResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        {
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
        { skipAuth: true } // Don't send auth token for signup
      );

      // Validate response
      if (!response.data.success || !response.data.user || !response.data.token) {
        throw new Error('Invalid signup response from server');
      }

      // Store token in SecureStore
      await setAuthToken(response.data.token);

      if (__DEV__) {
        console.log('[Auth] Signup successful:', response.data.user.email);
      }

      // Return user data
      return {
        user: {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`,
        } as User,
        token: response.data.token,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Signup error:', error.message);
      }
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  },

  /**
   * Logout current user
   * Clears JWT token from SecureStore
   */
  logout: async (): Promise<void> => {
    try {
      // Attempt to logout on server
      // Even if this fails, we'll clear local session
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      if (__DEV__) {
        console.warn('[Auth] Logout request failed:', error);
      }
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local token
      await clearAuthToken();
      if (__DEV__) {
        console.log('[Auth] Logout complete - token cleared');
      }
    }
  },

  /**
   * Get current session/user data
   * Validates the session with the backend using stored token
   *
   * @returns Current user data or null if session invalid
   */
  getSession: async (): Promise<User | null> => {
    try {
      const response = await api.get<SessionResponse>(API_ENDPOINTS.AUTH.SESSION);

      if (!response.data.user) {
        if (__DEV__) {
          console.log('[Auth] No active session');
        }
        return null;
      }

      if (__DEV__) {
        console.log('[Auth] Session valid:', response.data.user.email);
      }

      return response.data.user;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Session validation error:', error.message);
      }
      // Clear invalid token
      await clearAuthToken();
      return null;
    }
  },

  /**
   * Verify email with token
   *
   * @param token - Email verification token
   */
  verifyEmail: async (token: string): Promise<void> => {
    try {
      await api.post(
        API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        { token },
        { skipAuth: true }
      );

      if (__DEV__) {
        console.log('[Auth] Email verified successfully');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Email verification error:', error.message);
      }
      throw new Error(error.message || 'Email verification failed');
    }
  },

  /**
   * Request password reset
   *
   * @param email - User's email address
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await api.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email: email.trim().toLowerCase() },
        { skipAuth: true }
      );

      if (__DEV__) {
        console.log('[Auth] Password reset requested for:', email);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Password reset request error:', error.message);
      }
      throw new Error(error.message || 'Failed to request password reset');
    }
  },

  /**
   * Reset password with token
   *
   * @param token - Password reset token
   * @param newPassword - New password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      await api.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { token, password: newPassword },
        { skipAuth: true }
      );

      if (__DEV__) {
        console.log('[Auth] Password reset successful');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Password reset error:', error.message);
      }
      throw new Error(error.message || 'Failed to reset password');
    }
  },

  /**
   * Update user profile
   *
   * @param userData - Partial user data to update
   * @returns Updated user data
   */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<ProfileUpdateResponse>(
        API_ENDPOINTS.USER.PROFILE,
        userData
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to update profile');
      }

      if (__DEV__) {
        console.log('[Auth] Profile updated successfully');
      }

      return response.data.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Profile update error:', error.message);
      }
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Change password
   *
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      if (__DEV__) {
        console.log('[Auth] Password changed successfully');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Password change error:', error.message);
      }
      throw new Error(error.message || 'Failed to change password');
    }
  },

  /**
   * Delete account
   *
   * @param password - User's password for confirmation
   */
  deleteAccount: async (password: string): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, { password });

      // Clear local session
      await clearAuthToken();

      if (__DEV__) {
        console.log('[Auth] Account deleted successfully');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Auth] Account deletion error:', error.message);
      }
      throw new Error(error.message || 'Failed to delete account');
    }
  },
};

export default authService;
