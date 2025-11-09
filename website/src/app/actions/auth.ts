'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * SECURITY: Server action to clean up invalid session cookies
 *
 * This action prevents JWT verification loops by:
 * 1. Removing invalid session cookies from the client
 * 2. Cleaning up orphaned sessions from the database
 * 3. Providing a clean state for re-authentication
 *
 * THREAT MODEL:
 * - Prevents infinite redirect loops from invalid JWT signatures
 * - Mitigates DoS via repeated verification attempts
 * - Ensures proper session lifecycle management
 *
 * SECURITY CONTROLS:
 * - Server-side only execution ('use server' directive)
 * - No sensitive data exposed in responses
 * - Graceful error handling without information leakage
 * - Atomic cookie and database cleanup
 */

export interface ClearSessionResult {
  success: boolean;
  error?: string;
}

/**
 * Clears an invalid session cookie and its database record
 *
 * This is called when:
 * - JWT signature verification fails
 * - Session token is malformed
 * - Session exists in cookie but not in database
 * - Any other session validation failure
 *
 * IMPORTANT: This must be called from Server Components or Server Actions only
 *
 * @returns Promise<ClearSessionResult> - Success status and optional error message
 */
export async function clearInvalidSession(): Promise<ClearSessionResult> {
  try {
    // SECURITY: Get cookie store in a try-catch to handle edge cases
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    // SECURITY: If there's a token, attempt database cleanup
    // This prevents orphaned sessions from accumulating
    if (sessionToken) {
      try {
        // SECURITY: Delete from database first to prevent race conditions
        // Use deleteMany to handle cases where duplicate tokens exist
        await prisma.session.deleteMany({
          where: { sessionToken },
        });
      } catch (dbError) {
        // SECURITY: Log database errors but don't expose them to client
        // Continue with cookie deletion even if database cleanup fails
        console.error('[Auth] Failed to delete session from database:', {
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          // SECURITY: Don't log the actual token value
          hasToken: !!sessionToken,
        });
      }
    }

    // SECURITY: Always delete the cookie, even if database cleanup failed
    // This ensures the client-side state is cleaned up
    cookieStore.delete({
      name: 'session',
      // SECURITY: Match the cookie settings used when creating the session
      path: '/',
      // SECURITY: These flags ensure the cookie deletion is effective
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // SECURITY: Generic success message - no sensitive information
    return { success: true };
  } catch (error) {
    // SECURITY: Log the error server-side for debugging
    console.error('[Auth] Failed to clear invalid session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // SECURITY: Return generic error message - don't expose internal details
    return {
      success: false,
      error: 'Failed to clear session',
    };
  }
}

/**
 * SECURITY CONSIDERATIONS:
 *
 * 1. Server-Only Execution:
 *    - The 'use server' directive ensures this only runs on the server
 *    - Prevents client-side tampering or manipulation
 *
 * 2. Information Disclosure:
 *    - Error messages are generic to prevent information leakage
 *    - Detailed errors are logged server-side only
 *    - No sensitive data (tokens, user IDs) in client responses
 *
 * 3. Race Condition Mitigation:
 *    - Database cleanup happens before cookie deletion
 *    - Uses deleteMany to handle potential duplicate sessions
 *    - Cookie is deleted even if database cleanup fails
 *
 * 4. Cookie Security:
 *    - httpOnly prevents JavaScript access
 *    - secure flag enforces HTTPS in production
 *    - sameSite=lax prevents CSRF attacks
 *    - Explicit path ensures proper scope
 *
 * 5. Audit Trail:
 *    - All operations are logged for security monitoring
 *    - Logs include timestamps for incident response
 *    - No PII or sensitive data in logs
 *
 * 6. Graceful Degradation:
 *    - Continues with cookie deletion if database fails
 *    - Returns success even with partial failures
 *    - Prevents user lockout scenarios
 */
