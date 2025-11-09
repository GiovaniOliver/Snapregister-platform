/**
 * SECURITY: Rate Limiting Middleware
 *
 * Implements sliding window rate limiting to prevent:
 * - Brute force attacks on authentication endpoints
 * - Cost explosion from excessive AI API calls
 * - General API abuse
 *
 * This implementation uses in-memory storage suitable for development
 * and single-server deployments. For production with multiple servers,
 * upgrade to Redis-backed storage for distributed rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration for different endpoint types
 */
interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
  message?: string;    // Custom error message
}

/**
 * Request tracking entry using sliding window
 */
interface RequestEntry {
  timestamp: number;
  count: number;
}

/**
 * Rate limit store - maps identifier (IP or user ID) to request entries
 */
const rateLimitStore = new Map<string, RequestEntry[]>();

/**
 * Cleanup interval to prevent memory leaks
 * Runs every 15 minutes to remove old entries
 */
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * SECURITY: Different rate limits for different endpoint types
 *
 * Auth endpoints: Strict limits to prevent brute force
 * AI endpoints: Per-user limits to prevent cost explosion
 * General API: Reasonable limits to prevent abuse
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - 5 requests per 15 minutes per IP
  // Prevents brute force password attacks
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  // AI endpoints - 10 requests per hour per authenticated user
  // Prevents cost explosion from OpenAI API calls
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'AI request limit exceeded. You can make 10 AI requests per hour.',
  },

  // General API endpoints - 100 requests per 15 minutes per IP
  // Prevents general API abuse
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
};

/**
 * SECURITY: Extract client IP address with proxy support
 *
 * Checks headers in order of trustworthiness:
 * 1. x-forwarded-for (most common proxy header)
 * 2. x-real-ip (nginx proxy header)
 * 3. cf-connecting-ip (Cloudflare header)
 * 4. socket IP as fallback
 *
 * @param request - The incoming request
 * @returns The client IP address
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
    // Take the first one which is the original client
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (this should rarely happen)
  return 'unknown';
}

/**
 * SECURITY: Extract user ID from session for per-user rate limiting
 *
 * For AI endpoints, we want to rate limit per user, not per IP,
 * to prevent users from bypassing limits by changing IPs.
 *
 * @param request - The incoming request
 * @returns The user ID from session token, or null if not authenticated
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return null;
    }

    // Parse JWT token to extract user ID
    // Note: We don't verify signature here since we're just using it for rate limiting
    // The actual auth verification happens in the middleware chain
    const payload = JSON.parse(
      Buffer.from(sessionToken.split('.')[1], 'base64').toString()
    );

    return payload.userId || payload.sub || null;
  } catch (error) {
    // If token parsing fails, fall back to IP-based rate limiting
    return null;
  }
}

/**
 * SECURITY: Sliding window rate limiting algorithm
 *
 * Unlike fixed window (which can allow 2x requests at window boundary),
 * sliding window provides smoother rate limiting by considering
 * requests within a moving time window.
 *
 * Algorithm:
 * 1. Get current timestamp
 * 2. Remove entries older than the time window
 * 3. Count remaining requests in the window
 * 4. If under limit, add new request and allow
 * 5. If over limit, reject with 429 status
 *
 * @param identifier - Unique identifier (IP or user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing entries for this identifier
  let entries = rateLimitStore.get(identifier) || [];

  // SLIDING WINDOW: Remove entries older than the window
  // This is the key difference from fixed window - we continuously
  // slide the window forward, not reset it at fixed intervals
  entries = entries.filter(entry => entry.timestamp > windowStart);

  // Count total requests in the current window
  const totalRequests = entries.reduce((sum, entry) => sum + entry.count, 0);

  // Check if limit exceeded
  if (totalRequests >= config.maxRequests) {
    // Find oldest entry to calculate reset time
    const oldestEntry = entries[0];
    const resetTime = oldestEntry
      ? oldestEntry.timestamp + config.windowMs
      : now + config.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  // Add new request entry
  entries.push({
    timestamp: now,
    count: 1,
  });

  // Update store
  rateLimitStore.set(identifier, entries);

  return {
    allowed: true,
    remaining: config.maxRequests - totalRequests - 1,
    resetTime: now + config.windowMs,
  };
}

/**
 * SECURITY: Cleanup old entries to prevent memory leaks
 *
 * This function runs periodically to remove expired entries
 * from the rate limit store. Without this, memory usage would
 * grow unbounded as entries accumulate.
 *
 * In production with Redis, this would be handled by Redis TTL.
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const maxAge = Math.max(
    RATE_LIMITS.auth.windowMs,
    RATE_LIMITS.ai.windowMs,
    RATE_LIMITS.general.windowMs
  );

  let cleanedCount = 0;

  for (const [identifier, entries] of rateLimitStore.entries()) {
    // Remove entries older than the longest window
    const validEntries = entries.filter(
      entry => now - entry.timestamp < maxAge
    );

    if (validEntries.length === 0) {
      // No valid entries, remove the entire key
      rateLimitStore.delete(identifier);
      cleanedCount++;
    } else if (validEntries.length < entries.length) {
      // Some entries removed, update the store
      rateLimitStore.set(identifier, validEntries);
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Rate Limit] Cleaned up ${cleanedCount} expired entries`);
  }
}

/**
 * SECURITY: Start cleanup interval
 *
 * Initializes the periodic cleanup of old rate limit entries.
 * This prevents memory leaks by removing expired data.
 */
function startCleanupInterval(): void {
  if (!cleanupIntervalId) {
    cleanupIntervalId = setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);

    // In Node.js, allow the process to exit even if this timer is active
    if (cleanupIntervalId.unref) {
      cleanupIntervalId.unref();
    }

    console.log('[Rate Limit] Cleanup interval started');
  }
}

/**
 * SECURITY: Determine rate limit type based on request path
 *
 * Different endpoints have different rate limit requirements:
 * - Auth endpoints: Strictest limits (brute force prevention)
 * - AI endpoints: Per-user limits (cost control)
 * - General API: Moderate limits (abuse prevention)
 *
 * @param pathname - The request pathname
 * @returns The rate limit configuration key
 */
function getRateLimitType(pathname: string): keyof typeof RATE_LIMITS {
  // Authentication endpoints - strict rate limiting
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }

  // AI endpoints - per-user rate limiting for cost control
  if (
    pathname.startsWith('/api/ai/') ||
    pathname.startsWith('/api/analyze-')
  ) {
    return 'ai';
  }

  // All other API endpoints - general rate limiting
  return 'general';
}

/**
 * SECURITY: Main rate limiting middleware function
 *
 * This function should be called early in the middleware chain
 * to reject requests that exceed rate limits before they consume
 * resources or hit expensive operations.
 *
 * Features:
 * - Sliding window algorithm for smooth rate limiting
 * - Different limits for different endpoint types
 * - Per-IP limiting for auth endpoints (prevent brute force)
 * - Per-user limiting for AI endpoints (prevent cost explosion)
 * - Proper HTTP 429 responses with Retry-After header
 * - Automatic cleanup to prevent memory leaks
 *
 * @param request - The incoming request
 * @returns NextResponse with 429 status if rate limited, null if allowed
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // Start cleanup interval on first request
  startCleanupInterval();

  // Determine which rate limit to apply
  const limitType = getRateLimitType(pathname);
  const config = RATE_LIMITS[limitType];

  // Determine identifier (IP or user ID)
  let identifier: string;

  if (limitType === 'ai') {
    // For AI endpoints, use user ID if available (per-user limiting)
    // This prevents users from bypassing limits by changing IPs
    const userId = getUserIdFromRequest(request);
    identifier = userId || `ip:${getClientIp(request)}`;
  } else {
    // For auth and general endpoints, use IP address
    identifier = `ip:${getClientIp(request)}`;
  }

  // Add endpoint type prefix to avoid collision between limit types
  const key = `${limitType}:${identifier}`;

  // Check rate limit
  const { allowed, remaining, resetTime } = checkRateLimit(key, config);

  if (!allowed) {
    // SECURITY: Log rate limit violations for monitoring
    console.warn('[Rate Limit] Limit exceeded:', {
      type: limitType,
      identifier,
      pathname,
      timestamp: new Date().toISOString(),
    });

    // Calculate Retry-After in seconds
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    // Return 429 Too Many Requests with proper headers
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          // SECURITY: Standard rate limit headers
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
        },
      }
    );
  }

  // Request allowed - could add headers to response to inform client
  // For now, just return null to continue processing
  return null;
}

/**
 * SECURITY: Get current rate limit status for a request
 *
 * This is a utility function that can be used by API routes
 * to check rate limit status without enforcing it.
 * Useful for showing users their remaining quota.
 *
 * @param request - The incoming request
 * @param limitType - The type of rate limit to check
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS = 'general'
): { remaining: number; limit: number; resetTime: number } {
  const config = RATE_LIMITS[limitType];

  let identifier: string;
  if (limitType === 'ai') {
    const userId = getUserIdFromRequest(request);
    identifier = userId || `ip:${getClientIp(request)}`;
  } else {
    identifier = `ip:${getClientIp(request)}`;
  }

  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const entries = rateLimitStore.get(key) || [];
  const validEntries = entries.filter(entry => entry.timestamp > windowStart);
  const totalRequests = validEntries.reduce((sum, entry) => sum + entry.count, 0);

  const oldestEntry = validEntries[0];
  const resetTime = oldestEntry
    ? oldestEntry.timestamp + config.windowMs
    : now + config.windowMs;

  return {
    remaining: Math.max(0, config.maxRequests - totalRequests),
    limit: config.maxRequests,
    resetTime,
  };
}

/**
 * SECURITY: Clear rate limit for a specific identifier
 *
 * This is an administrative function that can be used to reset
 * rate limits for a specific user or IP address. Use with caution.
 *
 * @param identifier - The identifier to clear (e.g., "ip:192.168.1.1" or "user:123")
 * @param limitType - The type of rate limit to clear (optional, clears all if not specified)
 */
export function clearRateLimit(
  identifier: string,
  limitType?: keyof typeof RATE_LIMITS
): void {
  if (limitType) {
    const key = `${limitType}:${identifier}`;
    rateLimitStore.delete(key);
    console.log(`[Rate Limit] Cleared ${limitType} rate limit for ${identifier}`);
  } else {
    // Clear all rate limit types for this identifier
    for (const type of Object.keys(RATE_LIMITS)) {
      const key = `${type}:${identifier}`;
      rateLimitStore.delete(key);
    }
    console.log(`[Rate Limit] Cleared all rate limits for ${identifier}`);
  }
}

/**
 * SECURITY: Get statistics about current rate limiting
 *
 * Returns information about the rate limit store for monitoring
 * and debugging purposes.
 */
export function getRateLimitStats(): {
  totalIdentifiers: number;
  totalEntries: number;
  memoryUsage: string;
} {
  let totalEntries = 0;

  for (const entries of rateLimitStore.values()) {
    totalEntries += entries.length;
  }

  // Estimate memory usage (rough calculation)
  const bytesPerEntry = 16; // timestamp (8) + count (8)
  const estimatedBytes = totalEntries * bytesPerEntry;
  const memoryUsage = estimatedBytes > 1024 * 1024
    ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(estimatedBytes / 1024).toFixed(2)} KB`;

  return {
    totalIdentifiers: rateLimitStore.size,
    totalEntries,
    memoryUsage,
  };
}
