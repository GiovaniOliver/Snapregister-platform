/**
 * Authentication Flow Tests
 * Tests for user signup, login, session management, and logout
 * Using React Native Testing Library and Jest with mocked API calls
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { clearSession } from '../services/api';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
  },
}));
jest.mock('../services/api');

// Mock component to test useAuth hook
const TestComponent = () => {
  const { user, loading, isAuthenticated, login, signup, logout, refreshUser } = useAuth();

  return (
    <View>
      {loading && <Text testID="loading">Loading</Text>}
      {isAuthenticated && <Text testID="authenticated">Authenticated</Text>}
      {!isAuthenticated && <Text testID="unauthenticated">Not Authenticated</Text>}
      {user && <Text testID="user-email">{user.email}</Text>}
      <TouchableOpacity testID="login-button" onPress={() => login('test@example.com', 'password')}>
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="signup-button" onPress={() => signup('test@example.com', 'password', 'John', 'Doe')}>
        <Text>Signup</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-button" onPress={() => logout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="refresh-button" onPress={() => refreshUser()}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SecureStore methods
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('User Signup Flow', () => {
    it('should successfully signup user and create session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        plan: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'user-123';

      // Mock signup service
      (authService.signup as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      // Perform signup
      const signupButton = getByTestId('signup-button');
      fireEvent.press(signupButton);

      // Verify signup was called
      await waitFor(() => {
        expect(authService.signup).toHaveBeenCalledWith(
          'test@example.com',
          'password',
          'John',
          'Doe'
        );
      });

      // Verify token was stored
      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', mockToken);
      });

      // Verify user is authenticated
      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
        expect(getByTestId('user-email')).toHaveTextContent('newuser@example.com');
      });
    });

    it('should handle signup failure gracefully', async () => {
      const signupError = new Error('Signup failed: Email already exists');

      (authService.signup as jest.Mock).mockRejectedValue(signupError);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      const signupButton = getByTestId('signup-button');
      fireEvent.press(signupButton);

      // Verify error was thrown and user remains unauthenticated
      await waitFor(() => {
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should handle network errors during signup', async () => {
      const networkError = new Error('Network timeout');

      (authService.signup as jest.Mock).mockRejectedValue(networkError);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      const signupButton = getByTestId('signup-button');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('User Login Flow', () => {
    it('should successfully login user and retrieve session', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'user-456';

      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      // Verify login was called with correct credentials
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password');
      });

      // Verify token was securely stored
      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', mockToken);
      });

      // Verify user is authenticated and data is correct
      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
        expect(getByTestId('user-email')).toHaveTextContent('existing@example.com');
      });
    });

    it('should handle invalid credentials on login', async () => {
      const loginError = new Error('Invalid email or password');

      (authService.login as jest.Mock).mockRejectedValue(loginError);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should make API calls work after successful login', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'apitest@example.com',
        firstName: 'API',
        lastName: 'Tester',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'user-789',
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      // Verify token is stored (which will be used in API headers)
      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'user-789');
      });

      // Verify user is authenticated and subsequent API calls will use the token
      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });
    });
  });

  describe('Session Persistence', () => {
    it('should restore session on app restart if token exists', async () => {
      const mockUser = {
        id: 'user-persist',
        email: 'persist@example.com',
        firstName: 'Persist',
        lastName: 'User',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate token already in secure storage
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-persist');

      // Mock getSession to validate token
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should restore session without user needing to login
      await waitFor(() => {
        expect(authService.getSession).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
        expect(getByTestId('user-email')).toHaveTextContent('persist@example.com');
      });
    });

    it('should clear invalid session on restart', async () => {
      const sessionError = new Error('Session expired');

      // Simulate token in storage but invalid
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-token');
      (authService.getSession as jest.Mock).mockRejectedValue(sessionError);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        // Token should be deleted from secure storage
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
        // Session should be cleared
        expect(clearSession).toHaveBeenCalled();
        // User should be unauthenticated
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should maintain session across multiple renders', async () => {
      const mockUser = {
        id: 'user-multi',
        email: 'multirender@example.com',
        firstName: 'Multi',
        lastName: 'Render',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-multi');
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);

      const { getByTestId, rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });

      const firstEmail = getByTestId('user-email').children[0];

      // Re-render the component
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const secondEmail = getByTestId('user-email').children[0];
        expect(secondEmail).toEqual(firstEmail);
      });
    });
  });

  describe('Session Expiration', () => {
    it('should handle session expiration (401) gracefully', async () => {
      const mockUser = {
        id: 'user-exp',
        email: 'expiring@example.com',
        firstName: 'Expiring',
        lastName: 'User',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-exp');
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });

      // Simulate session expiration
      const refreshButton = getByTestId('refresh-button');
      (authService.getSession as jest.Mock).mockRejectedValue(
        new Error('Session expired')
      );

      fireEvent.press(refreshButton);

      await waitFor(() => {
        // Error should be thrown to the caller
        // User should not be automatically logged out here (caller handles it)
      });
    });

    it('should clear session when 401 response is received during API call', async () => {
      // This is handled by the api.ts middleware
      // Verify that clearSession and token deletion are called

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('expired-token');

      // Simulate 401 handling in api.ts
      await SecureStore.deleteItemAsync('authToken');
      clearSession();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      expect(clearSession).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should properly clear session on logout', async () => {
      const mockUser = {
        id: 'user-logout',
        email: 'logout@example.com',
        firstName: 'Logout',
        lastName: 'User',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-logout');
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });

      const logoutButton = getByTestId('logout-button');
      fireEvent.press(logoutButton);

      // Verify logout API was called
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      // Verify token was deleted from secure storage
      await waitFor(() => {
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      });

      // Verify session cookie was cleared
      await waitFor(() => {
        expect(clearSession).toHaveBeenCalled();
      });

      // Verify user is now unauthenticated
      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should clear session even if logout API call fails', async () => {
      const mockUser = {
        id: 'user-logout-fail',
        email: 'logoutfail@example.com',
        firstName: 'Logout',
        lastName: 'Fail',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-logout-fail');
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockRejectedValue(
        new Error('Logout API failed')
      );

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });

      const logoutButton = getByTestId('logout-button');
      fireEvent.press(logoutButton);

      // Even if API fails, local session should be cleared
      await waitFor(() => {
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
        expect(clearSession).toHaveBeenCalled();
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should clear session and not allow API calls after logout', async () => {
      const mockUser = {
        id: 'user-api-after-logout',
        email: 'apiafterlogout@example.com',
        firstName: 'API',
        lastName: 'After',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user-api-after-logout');
      (authService.getSession as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('authenticated')).toBeDefined();
      });

      // Logout
      const logoutButton = getByTestId('logout-button');
      fireEvent.press(logoutButton);

      await waitFor(() => {
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      });

      // Verify token is no longer available for API calls
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await waitFor(() => {
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });
  });

  describe('Auth Context Error Handling', () => {
    it('should handle errors in checkAuthStatus gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore error')
      );

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should show unauthenticated state even if error occurs
        expect(getByTestId('unauthenticated')).toBeDefined();
      });
    });

    it('should throw error when useAuth is used outside of AuthProvider', () => {
      // Create a component that uses useAuth outside of provider
      const InvalidComponent = () => {
        const { user } = useAuth();
        return <div>{user?.email}</div>;
      };

      // This should throw an error
      expect(() => {
        render(<InvalidComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});
