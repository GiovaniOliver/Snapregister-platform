/**
 * EXAMPLE: How to use rate limiting utilities in your API routes
 *
 * This file demonstrates how to use the rate limiting utilities
 * for advanced use cases beyond the automatic middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStatus, clearRateLimit } from './rateLimit';

/**
 * Example 1: Check rate limit status and return it to the user
 *
 * This can be used to show users their remaining API quota
 * in the UI or API response headers.
 */
export async function GET_example_check_quota(request: NextRequest) {
  // Get AI rate limit status for current user
  const aiStatus = getRateLimitStatus(request, 'ai');

  return NextResponse.json({
    aiQuota: {
      remaining: aiStatus.remaining,
      limit: aiStatus.limit,
      resetsAt: new Date(aiStatus.resetTime).toISOString(),
    },
  });
}

/**
 * Example 2: Add rate limit headers to API responses
 *
 * This allows clients to know their rate limit status
 * without hitting the rate limit endpoint.
 */
export async function POST_example_with_headers(request: NextRequest) {
  // Your API logic here
  const result = { data: 'some data' };

  // Get rate limit status
  const status = getRateLimitStatus(request, 'general');

  // Return response with rate limit headers
  return NextResponse.json(result, {
    headers: {
      'X-RateLimit-Limit': String(status.limit),
      'X-RateLimit-Remaining': String(status.remaining),
      'X-RateLimit-Reset': String(Math.floor(status.resetTime / 1000)),
    },
  });
}

/**
 * Example 3: Admin endpoint to clear rate limits
 *
 * WARNING: This should only be accessible to administrators
 * and should include proper authentication and authorization.
 */
export async function POST_example_admin_clear_rate_limit(request: NextRequest) {
  // TODO: Add admin authentication check here
  // if (!isAdmin) { return unauthorized }

  const { identifier, limitType } = await request.json();

  if (!identifier) {
    return NextResponse.json(
      { error: 'Identifier is required' },
      { status: 400 }
    );
  }

  // Clear rate limit for specific identifier
  clearRateLimit(identifier, limitType);

  return NextResponse.json({
    success: true,
    message: `Rate limit cleared for ${identifier}`,
  });
}

/**
 * Example 4: Custom rate limit check before expensive operation
 *
 * This allows you to check rate limits manually before
 * performing expensive operations.
 */
export async function POST_example_expensive_operation(request: NextRequest) {
  // Check AI rate limit status
  const aiStatus = getRateLimitStatus(request, 'ai');

  if (aiStatus.remaining < 1) {
    // No quota remaining, return error
    const retryAfter = Math.ceil((aiStatus.resetTime - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: 'AI quota exceeded',
        retryAfter,
        resetsAt: new Date(aiStatus.resetTime).toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(aiStatus.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(aiStatus.resetTime / 1000)),
        },
      }
    );
  }

  // Quota available, proceed with expensive operation
  // ... your OpenAI API call or other expensive operation

  return NextResponse.json({ success: true });
}

/**
 * Example 5: Different rate limits for different user tiers
 *
 * This shows how you might implement tiered rate limiting
 * based on user subscription level.
 */
export async function POST_example_tiered_limits(request: NextRequest) {
  // Get user's subscription tier (from session or database)
  // const user = await getSession();
  // const tier = user.plan; // 'free', 'pro', 'enterprise'

  const tier = 'free'; // Example

  // Define tier-specific limits
  const tierLimits = {
    free: 10,
    pro: 50,
    enterprise: 1000,
  };

  const limit = tierLimits[tier as keyof typeof tierLimits] || 10;

  // Check current usage
  const status = getRateLimitStatus(request, 'ai');

  if (status.remaining < 1) {
    return NextResponse.json(
      {
        error: `${tier} tier limit exceeded`,
        limit,
        upgradeUrl: tier === 'free' ? '/upgrade' : null,
      },
      { status: 429 }
    );
  }

  // Proceed with request
  return NextResponse.json({
    success: true,
    quota: {
      used: limit - status.remaining,
      limit,
      remaining: status.remaining,
    },
  });
}
