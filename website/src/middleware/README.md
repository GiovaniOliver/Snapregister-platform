# Rate Limiting Implementation

This directory contains the rate limiting middleware that protects your application from:
- Brute force attacks on authentication endpoints
- Cost explosion from excessive AI API calls
- General API abuse

## Overview

The rate limiting implementation uses a **sliding window algorithm** for smooth, predictable rate limiting. Unlike fixed window rate limiting (which can allow 2x requests at window boundaries), the sliding window continuously tracks requests within a moving time window.

## Features

- **Sliding Window Algorithm**: Smooth rate limiting without boundary issues
- **Multiple Rate Limit Tiers**: Different limits for different endpoint types
- **Per-IP and Per-User Limiting**: IP-based for auth, user-based for AI endpoints
- **Automatic Memory Cleanup**: Prevents memory leaks with periodic cleanup
- **Standard HTTP Headers**: Returns proper 429 responses with `Retry-After` header
- **Monitoring Support**: Logging and statistics for security monitoring

## Rate Limit Configuration

### Authentication Endpoints (`/api/auth/*`)
- **Limit**: 5 requests per 15 minutes per IP address
- **Purpose**: Prevents brute force password attacks
- **Identifier**: IP address
- **Endpoints**: `/api/auth/login`, `/api/auth/signup`, etc.

### AI Endpoints (`/api/ai/*`, `/api/analyze-*`)
- **Limit**: 10 requests per hour per authenticated user
- **Purpose**: Prevents cost explosion from expensive OpenAI API calls
- **Identifier**: User ID (falls back to IP if not authenticated)
- **Endpoints**: `/api/ai/analyze-product`, `/api/analyze-product-image`, etc.

### General API Endpoints
- **Limit**: 100 requests per 15 minutes per IP address
- **Purpose**: Prevents general API abuse
- **Identifier**: IP address
- **Endpoints**: All other `/api/*` endpoints

## Architecture

### Files

```
middleware/
├── rateLimit.ts           # Main rate limiting implementation
├── rateLimit.example.ts   # Usage examples for advanced scenarios
└── README.md              # This file
```

### Integration

The rate limiting middleware is integrated into the main Next.js middleware:

```typescript
// middleware.ts
import { rateLimitMiddleware } from './middleware/rateLimit';

export async function middleware(request: NextRequest) {
  // Rate limiting is applied FIRST, before auth checks
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }

  // Continue with auth and other middleware logic...
}
```

## How It Works

### Sliding Window Algorithm

```
Current Time: Now
Window: Last 15 minutes (900,000ms)

Timeline:
├────────────────┼────────────────┼────────────────┼─────> Time
14:00          14:15          14:30          14:45

At 14:30:
- Request at 14:10 → Expired (outside window)
- Request at 14:20 → Counted (inside window)
- Request at 14:28 → Counted (inside window)
- New request    → Check if total < limit
```

### Request Flow

1. **Request arrives** at Next.js middleware
2. **Rate limit type determined** based on pathname:
   - `/api/auth/*` → Auth limits
   - `/api/ai/*` or `/api/analyze-*` → AI limits
   - Other `/api/*` → General limits
3. **Identifier extracted**:
   - Auth/General: IP address from headers
   - AI: User ID from session token (or IP as fallback)
4. **Rate limit checked**:
   - Get existing requests from store
   - Filter out expired requests (sliding window)
   - Count requests in current window
   - If under limit: Allow and add new entry
   - If over limit: Reject with 429 status
5. **Response returned**:
   - Allowed: Continue to next middleware
   - Blocked: Return 429 with `Retry-After` header

### Memory Management

To prevent memory leaks, the system automatically cleans up old entries:

- **Cleanup Interval**: Every 15 minutes
- **Cleanup Logic**: Removes entries older than the longest window (1 hour for AI)
- **Automatic**: Runs in background, no manual intervention needed

## HTTP Response Format

### Rate Limited (429 Too Many Requests)

```json
{
  "error": "Too many authentication attempts. Please try again in 15 minutes.",
  "retryAfter": 847
}
```

**Headers:**
```
Status: 429 Too Many Requests
Retry-After: 847
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699564800
```

### Allowed Request

The request continues to the next middleware/route handler. No special response.

## Advanced Usage

### Check Rate Limit Status

Use the `getRateLimitStatus()` function to check quota without enforcing:

```typescript
import { getRateLimitStatus } from '@/middleware/rateLimit';

export async function GET(request: NextRequest) {
  const status = getRateLimitStatus(request, 'ai');

  return NextResponse.json({
    remaining: status.remaining,
    limit: status.limit,
    resetsAt: new Date(status.resetTime).toISOString()
  });
}
```

### Clear Rate Limit (Admin Only)

```typescript
import { clearRateLimit } from '@/middleware/rateLimit';

// Clear all rate limits for a user
clearRateLimit('user:123');

// Clear only AI rate limit for a user
clearRateLimit('user:123', 'ai');

// Clear rate limits for an IP
clearRateLimit('ip:192.168.1.1');
```

### Get Statistics

```typescript
import { getRateLimitStats } from '@/middleware/rateLimit';

const stats = getRateLimitStats();
console.log(stats);
// {
//   totalIdentifiers: 150,
//   totalEntries: 450,
//   memoryUsage: "7.03 KB"
// }
```

## Security Considerations

### IP Address Extraction

The middleware extracts the client IP from headers in this order:
1. `x-forwarded-for` (most common proxy header)
2. `x-real-ip` (nginx proxy)
3. `cf-connecting-ip` (Cloudflare)
4. Fallback to 'unknown'

**Important**: Ensure your reverse proxy/load balancer is properly configured to set these headers trustworthily. In production with Cloudflare or similar, consider validating the source of these headers.

### JWT Parsing for User ID

For AI endpoints, the middleware parses the JWT to extract the user ID for per-user rate limiting. This parsing does NOT verify the JWT signature (that happens later in the auth chain). It's purely for rate limiting purposes.

### Rate Limit Bypass Prevention

- **IP-based for Auth**: Prevents attackers from bypassing login rate limits
- **User-based for AI**: Prevents users from bypassing AI limits by changing IPs
- **Prefix Keys**: Each limit type has separate counters (no collision)

## Monitoring and Logging

### Rate Limit Violations

When a rate limit is exceeded, the middleware logs:

```javascript
[Rate Limit] Limit exceeded: {
  type: 'auth',
  identifier: 'ip:192.168.1.1',
  pathname: '/api/auth/login',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

Monitor these logs to detect:
- Potential brute force attacks (many auth violations from same IP)
- Cost abuse attempts (many AI violations from same user)
- API abuse patterns (many general violations)

### Cleanup Activity

```javascript
[Rate Limit] Cleanup interval started
[Rate Limit] Cleaned up 25 expired entries
```

## Production Deployment

### Current Implementation (In-Memory)

The current implementation uses in-memory storage, suitable for:
- Development environments
- Single-server deployments
- Small to medium traffic applications

**Limitations:**
- Rate limits reset when the server restarts
- Cannot share rate limit data across multiple servers
- Memory usage grows with number of unique users/IPs

### Upgrading to Redis (Recommended for Production)

For production deployments with multiple servers, upgrade to Redis:

```typescript
// Future Redis implementation
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use Redis sorted sets for sliding window
  await redis.zremrangebyscore(key, 0, windowStart); // Remove old entries
  const count = await redis.zcard(key); // Count requests

  if (count >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await redis.zadd(key, now, `${now}-${Math.random()}`); // Add new entry
  await redis.expire(key, Math.ceil(config.windowMs / 1000)); // Set TTL

  return { allowed: true, remaining: config.maxRequests - count - 1 };
}
```

**Benefits of Redis:**
- Distributed rate limiting across multiple servers
- Persistent rate limits across server restarts
- Better memory management with automatic expiration
- Scalable to millions of users

## Testing

### Manual Testing

Test auth rate limiting:
```bash
# Make 6 requests to login endpoint (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

Expected: First 5 succeed (or return 401), 6th returns 429.

Test AI rate limiting:
```bash
# Make 11 AI requests (limit is 10 per hour)
# Requires valid session cookie
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/ai/analyze-product \
    -H "Cookie: session=YOUR_SESSION_TOKEN" \
    -F "productImage=@test.jpg" \
    -w "\nStatus: %{http_code}\n\n"
done
```

Expected: First 10 succeed, 11th returns 429.

### Automated Testing

```typescript
// Example Jest test
describe('Rate Limiting', () => {
  it('should block after 5 auth attempts', async () => {
    const responses = [];

    for (let i = 0; i < 6; i++) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'test' })
      });
      responses.push(res.status);
    }

    expect(responses[4]).toBeLessThan(429); // 5th request allowed
    expect(responses[5]).toBe(429);         // 6th request blocked
  });
});
```

## Troubleshooting

### Issue: Rate limit not working

**Symptoms**: Requests are not being rate limited

**Possible causes:**
1. Middleware not included in middleware.ts
2. Middleware config excludes API routes
3. Request path doesn't match rate limit patterns

**Solution:**
- Verify `import { rateLimitMiddleware } from './middleware/rateLimit';` exists
- Check middleware config includes API routes (not excluded)
- Add logging to see if middleware is being called

### Issue: Rate limits too strict

**Symptoms**: Legitimate users getting blocked

**Solution:**
- Adjust limits in `RATE_LIMITS` configuration
- Consider implementing tiered limits based on user plan
- Add user-friendly error messages explaining the limit

### Issue: Memory usage growing

**Symptoms**: Server memory increasing over time

**Possible causes:**
- Cleanup interval not running
- Very high traffic creating many entries

**Solution:**
- Check cleanup interval logs
- Monitor with `getRateLimitStats()`
- Consider upgrading to Redis for better memory management

### Issue: Users bypassing rate limits

**Symptoms**: Users making more requests than allowed

**Possible causes:**
1. Using multiple IP addresses (VPN/proxy)
2. Multiple users sharing same IP
3. Rate limit store cleared on server restart

**Solution:**
- For AI endpoints: Ensure user-based limiting is working
- Implement additional validation (captcha for suspicious activity)
- Upgrade to Redis for persistent rate limits
- Consider implementing progressive penalties

## Future Enhancements

Potential improvements for the rate limiting system:

1. **Redis Backend**: Distributed rate limiting for multi-server deployments
2. **Tiered Limits**: Different limits based on user subscription level
3. **Dynamic Limits**: Adjust limits based on server load
4. **Rate Limit Headers**: Add headers to all responses showing current quota
5. **Whitelist/Blacklist**: Skip rate limiting for trusted IPs, block malicious ones
6. **Progressive Penalties**: Increase lockout duration for repeated violations
7. **CAPTCHA Integration**: Require CAPTCHA after multiple failed attempts
8. **Dashboard**: Admin UI to view rate limit statistics and manage limits
9. **Metrics Export**: Export rate limit metrics to Prometheus/Grafana
10. **Custom Rules**: Allow defining custom rate limits via configuration file

## Support

For issues or questions about the rate limiting implementation:
1. Check this README for common scenarios
2. Review the example file (`rateLimit.example.ts`)
3. Check application logs for rate limit violations
4. Monitor statistics with `getRateLimitStats()`

## License

This rate limiting implementation is part of the Snapregister application.
