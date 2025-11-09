'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SessionErrorHandler from '@/components/SessionErrorHandler';
import DashboardLayout from '@/components/DashboardLayout';

interface DashboardLayoutWrapperProps {
  children: ReactNode;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    plan: string;
  };
}

/**
 * Dashboard Layout Wrapper
 *
 * Wraps the dashboard layout with error handling and session management.
 * This component provides:
 * - Error boundary to catch React errors
 * - Session error handler to manage authentication issues
 * - Loop prevention for infinite redirects
 * - User-friendly error messages
 *
 * Architecture:
 * 1. SessionErrorHandler (outermost) - Handles session/auth errors first
 * 2. ErrorBoundary - Catches React rendering errors
 * 3. DashboardLayout - Actual dashboard UI
 *
 * Loop Prevention Strategy:
 * - SessionErrorHandler uses one-time redirect flag
 * - ErrorBoundary tracks consecutive error count
 * - Both clear cookies before redirect to prevent stale state
 * - Timeout between redirect attempts (500ms)
 * - Maximum 3 redirect attempts before showing manual intervention UI
 */
export default function DashboardLayoutWrapper({
  children,
  user,
}: DashboardLayoutWrapperProps) {
  return (
    <>
      {/* Session Error Handler - Monitors for session/auth errors in URL params */}
      <SessionErrorHandler
        showUI={true}
        onSessionError={() => {
          console.info('[DashboardLayoutWrapper] Session error detected, cleaning up');
        }}
      />

      {/* Error Boundary - Catches React errors during rendering */}
      <ErrorBoundary
        onReset={() => {
          console.info('[DashboardLayoutWrapper] Error boundary reset triggered');
        }}
      >
        <DashboardLayout user={user}>
          {children}
        </DashboardLayout>
      </ErrorBoundary>
    </>
  );
}
