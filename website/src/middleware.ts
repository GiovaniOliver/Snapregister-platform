import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { prisma } from './lib/prisma';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/register', '/products'];
// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

// SECURITY: JWT secret for signature verification in middleware
// Must match the secret used in lib/auth.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
);

/**
 * SECURITY: Verify JWT signature and expiration in middleware
 *
 * This prevents infinite loops caused by invalid JWT cookies:
 * - Validates JWT signature using jose library
 * - Checks token expiration (exp claim)
 * - Returns null on any validation failure
 *
 * @param token - The JWT token to verify
 * @returns The token payload if valid, null if invalid
 */
async function verifySessionToken(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // SECURITY: Log verification failures for monitoring
    console.warn('[Middleware] JWT verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      // Don't log the actual token value for security
    });
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // SECURITY: Apply rate limiting FIRST, before any other processing
  // This prevents resource exhaustion from excessive requests
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    // Request was rate limited, return 429 response immediately
    return rateLimitResponse;
  }

  const sessionToken = request.cookies.get('session')?.value;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // SECURITY: If there's a session token, verify its signature and database existence
  let isValidSession = false;
  if (sessionToken) {
    const payload = await verifySessionToken(sessionToken);
    
    // If JWT signature is valid, also check if session exists in database
    // This prevents infinite loops from tokens that exist but sessions don't (e.g., after DB migration)
    if (payload !== null) {
      // For protected routes, verify session exists in database
      // This prevents the loop where JWT is valid but session doesn't exist
      if (isProtectedRoute) {
        try {
          const session = await prisma.session.findUnique({
            where: { sessionToken },
            select: { id: true, expiresAt: true },
          });

          if (!session) {
            console.warn('[Middleware] JWT valid but session not found in database, clearing cookie');
            isValidSession = false;
            
            // Clear cookie and redirect
            const url = new URL('/login', request.url);
            url.searchParams.set('error', 'session_not_found');
            const response = NextResponse.redirect(url);
            response.cookies.delete({
              name: 'session',
              path: '/',
            });
            return response;
          }

          // Check if session is expired
          if (session.expiresAt < new Date()) {
            console.warn('[Middleware] Session expired, clearing cookie');
            isValidSession = false;
            
            // Delete expired session from database
            await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
            
            // Clear cookie and redirect
            const url = new URL('/login', request.url);
            url.searchParams.set('error', 'session_expired');
            const response = NextResponse.redirect(url);
            response.cookies.delete({
              name: 'session',
              path: '/',
            });
            return response;
          }

          isValidSession = true;
        } catch (dbError) {
          // If database check fails, treat as invalid to be safe
          console.error('[Middleware] Database check failed:', dbError);
          isValidSession = false;
          
          const url = new URL('/login', request.url);
          url.searchParams.set('error', 'session_check_failed');
          const response = NextResponse.redirect(url);
          response.cookies.delete({
            name: 'session',
            path: '/',
          });
          return response;
        }
      } else {
        // For non-protected routes, just check JWT signature
        isValidSession = true;
      }
    } else {
      // SECURITY: If token exists but is invalid, delete it and redirect to login
      // This prevents infinite loops from malformed/expired tokens
      console.warn('[Middleware] Invalid session token detected, clearing cookie and redirecting');

      // Create response that redirects to login with error
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'invalid_session');
      const response = NextResponse.redirect(url);

      // SECURITY: Delete the invalid session cookie
      // Must match the cookie settings used when creating the session
      response.cookies.delete({
        name: 'session',
        path: '/',
      });

      return response;
    }
  }

  // Redirect to login if accessing protected route without valid session
  if (isProtectedRoute && !isValidSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes with valid session
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * SECURITY: Match all request paths including API routes for rate limiting
     *
     * Exclude only:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicon files)
     * - public files with extensions
     *
     * API routes are now INCLUDED to apply rate limiting
     */
    '/((?!_next/static|_next/image|favicon|icon|.*\\.(?:ico|png|svg|jpg|jpeg|webp|gif)).*)',
  ],
};