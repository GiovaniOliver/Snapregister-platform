'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Session Error Handler Component
 *
 * Client-side component that monitors for session errors and handles them gracefully.
 * Prevents infinite redirect loops by:
 * - Using a one-time flag to ensure single redirect
 * - Clearing cookies client-side before redirect
 * - Showing loading state during redirect
 * - Detecting and preventing rapid successive redirects
 *
 * Usage:
 * Place this component at the top of your dashboard layout or any protected route.
 */

interface SessionErrorHandlerProps {
  /**
   * Whether to show the error handler UI
   * Set to false if you want to handle errors elsewhere
   */
  showUI?: boolean;

  /**
   * Custom error message to display
   */
  errorMessage?: string;

  /**
   * Callback when session error is detected
   */
  onSessionError?: () => void;
}

export default function SessionErrorHandler({
  showUI = true,
  errorMessage,
  onSessionError,
}: SessionErrorHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  // Use refs to prevent multiple redirects
  const hasRedirected = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRedirectTime = useRef<number>(0);

  // Check for session error in URL params
  const sessionError = searchParams.get('error');
  const hasSessionError = sessionError === 'invalid_session' ||
                          sessionError === 'session_expired' ||
                          sessionError === 'session_cleared';

  useEffect(() => {
    // Only proceed if there's a session error and we haven't redirected yet
    if (!hasSessionError || hasRedirected.current) {
      return;
    }

    // Detect rapid successive redirects (potential loop)
    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;

    if (timeSinceLastRedirect < 2000 && redirectAttempts > 2) {
      console.error('[SessionErrorHandler] Detected potential redirect loop, aborting');
      hasRedirected.current = true; // Prevent further attempts

      // Show error instead of redirecting
      setIsRedirecting(false);
      return;
    }

    console.info('[SessionErrorHandler] Session error detected:', sessionError);

    // Mark as redirecting
    setIsRedirecting(true);
    hasRedirected.current = true;
    lastRedirectTime.current = now;
    setRedirectAttempts((prev) => prev + 1);

    // Call optional callback
    if (onSessionError) {
      onSessionError();
    }

    // Clear cookies client-side to prevent loops
    const clearCookies = () => {
      console.info('[SessionErrorHandler] Clearing client-side cookies');

      // Get all cookies
      const cookies = document.cookie.split(';');

      // Clear each cookie
      cookies.forEach((cookie) => {
        const [name] = cookie.split('=');
        const cookieName = name.trim();

        // Clear with different path and domain variations to ensure removal
        const clearOptions = [
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`,
        ];

        clearOptions.forEach((clearOption) => {
          document.cookie = clearOption;
        });
      });

      // Also clear localStorage session data if any
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('session') || key.includes('auth') || key.includes('token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.warn('[SessionErrorHandler] Could not access localStorage:', e);
      }
    };

    // Clear cookies immediately
    clearCookies();

    // Wait a moment to ensure cookies are cleared, then redirect
    redirectTimeoutRef.current = setTimeout(() => {
      console.info('[SessionErrorHandler] Redirecting to login page');

      // Use window.location for hard redirect to ensure clean state
      window.location.href = '/login?error=session_expired&redirected=true';
    }, 500);

    // Cleanup function
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [hasSessionError, sessionError, onSessionError, redirectAttempts]);

  // Don't render anything if no error or not showing UI
  if (!hasSessionError || !showUI) {
    return null;
  }

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Session Expired
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error message if redirect was aborted (potential loop detected)
  if (redirectAttempts > 2) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-900">Session Error</CardTitle>
                <CardDescription>
                  Unable to redirect automatically
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              {errorMessage || 'Your session has expired or is invalid. Please log in again.'}
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-900">
                <strong>Note:</strong> If you continue to see this message, please clear your browser
                cookies and cache, then try again.
              </p>
            </div>
            <a
              href="/login"
              className="block w-full text-center bg-brand-teal hover:bg-brand-teal/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Login Page
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback (should not reach here normally)
  return null;
}
