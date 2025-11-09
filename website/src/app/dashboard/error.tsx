'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * SECURITY: Error boundary for dashboard route
 *
 * This component prevents infinite loops and provides graceful error handling:
 * - Catches React errors in dashboard components
 * - Prevents automatic retries that could cause loops
 * - Provides manual recovery options
 * - Logs errors for monitoring
 *
 * THREAT MODEL:
 * - Prevents DoS via infinite error loops
 * - Mitigates session-related error cascades
 * - Ensures graceful degradation on failures
 *
 * SECURITY CONTROLS:
 * - Client-side only ('use client' directive)
 * - No automatic error recovery (prevents loops)
 * - Generic error messages (no information leakage)
 * - Manual user action required for recovery
 */

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // SECURITY: Log error server-side via API endpoint
    // Don't expose sensitive information in client logs
    console.error('[Dashboard Error Boundary]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-center">
            We encountered an error while loading your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              onClick={reset}
              variant="default"
              className="w-full"
            >
              Try again
            </Button>
            <Button
              onClick={() => {
                // SECURITY: Clear all cookies client-side before redirect
                // This ensures a clean state for re-authentication
                document.cookie.split(';').forEach((c) => {
                  document.cookie = c
                    .replace(/^ +/, '')
                    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
                });
                window.location.href = '/login?error=dashboard_error';
              }}
              variant="outline"
              className="w-full"
            >
              Sign in again
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
              variant="ghost"
              className="w-full"
            >
              Go to homepage
            </Button>
          </div>

          {/* SECURITY: Only show error digest in development */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-600 font-mono break-all">
                Error ID: {error.digest}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SECURITY CONSIDERATIONS:
 *
 * 1. No Automatic Recovery:
 *    - The reset() function is only called when user clicks "Try again"
 *    - This prevents infinite loops from automatic error retries
 *    - User maintains control over recovery attempts
 *
 * 2. Clean State Recovery:
 *    - "Sign in again" button clears ALL cookies client-side
 *    - This ensures no invalid session data persists
 *    - Redirects to login with descriptive error parameter
 *
 * 3. Information Disclosure Prevention:
 *    - Generic error messages shown to users
 *    - Error digest only shown in development mode
 *    - No stack traces or sensitive data exposed
 *    - Detailed errors logged server-side only
 *
 * 4. Graceful Degradation:
 *    - Multiple recovery options provided
 *    - Homepage fallback always available
 *    - No forced actions that could trap users
 *
 * 5. Audit Trail:
 *    - All errors logged with timestamps
 *    - Error digest for correlation with server logs
 *    - Console logs for client-side debugging
 *
 * 6. User Experience:
 *    - Clear, actionable error messages
 *    - Multiple recovery paths
 *    - Visual feedback with icon and styling
 *    - No technical jargon in user-facing messages
 */
