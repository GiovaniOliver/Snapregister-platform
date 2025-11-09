import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authService } from '../services/authService';
import { clearSession } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Verify token and fetch user data from website backend
        const userData = await authService.getSession();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid token
      await SecureStore.deleteItemAsync('authToken');
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Login through the website's API
      const { user: userData, token } = await authService.login(email, password);
      await SecureStore.setItemAsync('authToken', token);
      setUser(userData);

      if (__DEV__) {
        console.log('[Auth] Login successful:', userData.email);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Auth] Login failed:', error);
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Signup through the website's API
      const { user: userData, token } = await authService.signup(email, password, firstName, lastName);
      await SecureStore.setItemAsync('authToken', token);
      setUser(userData);

      if (__DEV__) {
        console.log('[Auth] Signup successful:', userData.email);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Auth] Signup failed:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint on website backend
      await authService.logout();
      await SecureStore.deleteItemAsync('authToken');
      clearSession(); // Clear cookie session
      setUser(null);

      if (__DEV__) {
        console.log('[Auth] Logout successful');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      await SecureStore.deleteItemAsync('authToken');
      clearSession();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      // Refresh user data from website backend
      const userData = await authService.getSession();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
