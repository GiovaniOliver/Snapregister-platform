'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SECURITY: Client-side session validation guard
 *
 * This component prevents infinite loops by detecting invalid session states:
 * - Monitors for repeated redirects to the same page
 * - Detects session validation failures
 * - Clears invalid cookies client-side
 * - Prevents rapid-fire navigation loops
 *
 * THREAT MODEL:
 * - Prevents DoS via infinite redirect loops
 * - Mitigates client-side session poisoning
 * - Ensures proper cleanup of invalid state
 *
 * SECURITY CONTROLS:
 * - Client-side only execution
 * - Rate limiting on redirect attempts
 * - Automatic cookie cleanup on loop detection
 * - Fallback to login with error state
 */

interface SessionGuardProps {
  /**
   * The path that should trigger loop detection
   * Usually the current page path
   */
  currentPath: string;
}

export default function SessionGuard({ currentPath }: SessionGuardProps) {
  const router = useRouter();
  const redirectCountRef = useRef(0);
  const lastRedirectTimeRef = useRef(0);

  useEffect(() => {
    // SECURITY: Detect rapid redirect loops
    // If we see multiple redirects to the same page within a short time window,
    // it likely indicates an infinite loop from invalid session state

    const REDIRECT_THRESHOLD = 3; // Max redirects within time window
    const TIME_WINDOW = 5000; // 5 seconds
    const now = Date.now();

    // Check if we're in a redirect loop
    const timeSinceLastRedirect = now - lastRedirectTimeRef.current;

    if (timeSinceLastRedirect < TIME_WINDOW) {
      redirectCountRef.current += 1;
    } else {
      // Reset counter if enough time has passed
      redirectCountRef.current = 1;
    }

    lastRedirectTimeRef.current = now;

    // SECURITY: If we detect a loop, clear all cookies and redirect to login
    if (redirectCountRef.current >= REDIRECT_THRESHOLD) {
      console.error('[SessionGuard] Infinite redirect loop detected, clearing cookies and redirecting to login');

      // Clear all cookies client-side
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // Reset counter to prevent repeated executions
      redirectCountRef.current = 0;

      // Redirect to login with error
      // Use window.location instead of router to force hard navigation
      // This ensures all client state is cleared
      window.location.href = '/login?error=session_loop_detected';
    }
  }, [currentPath, router]);

  // SECURITY: Check for invalid session cookie patterns
  useEffect(() => {
    // This runs on mount to detect obviously invalid sessions
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('session='));

      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1];

        // SECURITY: Basic validation - JWT should have 3 parts separated by dots
        // This catches obviously malformed tokens without needing to verify signature
        if (!sessionValue || sessionValue.split('.').length !== 3) {
          console.warn('[SessionGuard] Malformed session cookie detected');

          // Clear the invalid cookie
          document.cookie = 'session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';

          // Redirect to login
          window.location.href = '/login?error=invalid_session';
        }
      }
    };

    checkCookie();
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * SECURITY CONSIDERATIONS:
 *
 * 1. Loop Detection:
 *    - Tracks redirect frequency using refs (persists across renders)
 *    - Uses time-based threshold to avoid false positives
 *    - Automatically clears cookies when loop detected
 *    - Hard navigation (window.location) ensures clean state
 *
 * 2. Cookie Validation:
 *    - Validates JWT structure without needing secret key
 *    - Catches malformed tokens early (client-side)
 *    - Prevents server round-trips for obviously invalid tokens
 *    - Clears invalid cookies immediately
 *
 * 3. Rate Limiting:
 *    - 5-second time window prevents false positives
 *    - Requires 3+ redirects to trigger (configurable)
 *    - Counter resets after time window expires
 *    - Prevents legitimate navigation from triggering guard
 *
 * 4. Information Disclosure:
 *    - No sensitive data logged or exposed
 *    - Generic error messages for users
 *    - Detailed logs only in console (not exposed to UI)
 *    - Error parameters are generic identifiers
 *
 * 5. Graceful Degradation:
 *    - Falls back to login on any detection
 *    - Clears ALL cookies to ensure clean state
 *    - Provides descriptive error to user
 *    - No data loss or user lockout
 *
 * 6. Client-Side Only:
 *    - Runs in browser context only ('use client')
 *    - No server round-trips for detection
 *    - Complements server-side validation
 *    - Provides defense in depth
 *
 * Usage:
 * Add to protected pages/layouts
 */
