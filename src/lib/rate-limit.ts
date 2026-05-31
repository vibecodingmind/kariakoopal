// ── In-Memory Rate Limiter ──
// Simple per-identifier, per-route rate limiting
// Uses a sliding window approach with cleanup

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries lazily (Edge runtime compatible - no setInterval)
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Usually IP address or user ID
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number; total: number } {
  // Lazy cleanup
  if (rateLimitStore.size > 500) cleanupExpired();

  const key = identifier;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired — start fresh
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime, total: limit };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, total: limit };
  }

  // Increment count
  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
    total: limit,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback
  return 'unknown';
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  api: (ip: string) => rateLimit(`api:${ip}`, 100, 60 * 1000),          // 100 req/min
  auth: (ip: string) => rateLimit(`auth:${ip}`, 10, 60 * 1000),         // 10 req/min
  payment: (ip: string) => rateLimit(`payment:${ip}`, 5, 60 * 1000),    // 5 req/min
  booking: (ip: string) => rateLimit(`booking:${ip}`, 20, 60 * 1000),   // 20 req/min
};
