'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 *
 * Catches React errors during rendering, in lifecycle methods, and in constructors
 * of the whole tree below them. Prevents infinite re-render loops by tracking error count.
 *
 * Features:
 * - Catches and displays React errors gracefully
 * - Prevents infinite error loops with error count tracking
 * - Provides user-friendly error messages
 * - Offers recovery options (clear cookies, retry)
 * - Logs errors for debugging
 *
 * Loop Prevention Strategy:
 * - Tracks consecutive error count
 * - If > 3 errors in rapid succession, shows "Clear Cookies" option
 * - Resets error count after successful render
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error details and increment error count
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Reset error count after 5 seconds to allow for transient errors
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    this.errorTimeout = setTimeout(() => {
      this.setState({ errorCount: 0 });
    }, 5000);
  }

  componentWillUnmount() {
    // Clean up timeout
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleClearCookiesAndRetry = () => {
    console.info('[ErrorBoundary] Clearing cookies and session data');

    // Clear all cookies
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to clear storage:', e);
    }

    // Redirect to login page
    window.location.href = '/login?error=session_cleared';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if we're in an infinite error loop
      const isInfiniteLoop = this.state.errorCount > 3;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">
                    {isInfiniteLoop ? 'Repeated Error Detected' : 'Something Went Wrong'}
                  </CardTitle>
                  <CardDescription>
                    {isInfiniteLoop
                      ? 'The application encountered multiple errors. This may be due to session or authentication issues.'
                      : 'An unexpected error occurred while rendering this page.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Error Details:</p>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-900">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Error count warning */}
              {isInfiniteLoop && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-900">
                    <strong>Loop Prevention Active:</strong> This error has occurred {this.state.errorCount} times.
                    Clearing your session data may resolve the issue.
                  </p>
                </div>
              )}

              {/* Recovery actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isInfiniteLoop ? (
                  <>
                    <Button
                      onClick={this.handleReset}
                      className="flex-1"
                      variant="default"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button
                      onClick={this.handleClearCookiesAndRetry}
                      className="flex-1"
                      variant="outline"
                    >
                      Clear Cookies & Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={this.handleClearCookiesAndRetry}
                      className="flex-1"
                      variant="default"
                    >
                      Clear Session & Return to Login
                    </Button>
                    <Button
                      onClick={this.handleReset}
                      className="flex-1"
                      variant="outline"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Anyway
                    </Button>
                  </>
                )}
              </div>

              {/* Help text */}
              <div className="text-sm text-gray-600 border-t pt-4">
                <p>
                  If this issue persists, please try:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Clearing your browser cache and cookies</li>
                  <li>Logging out and logging back in</li>
                  <li>Using a different browser or incognito mode</li>
                  <li>Contacting support if the problem continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
