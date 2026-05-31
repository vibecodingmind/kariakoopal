// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

export function rateLimit(identifier: string, options: RateLimitOptions = DEFAULT_OPTIONS): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimits.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimits.set(identifier, { count: 1, resetTime: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetIn: options.windowMs };
  }
  
  if (record.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: options.maxRequests - record.count, resetIn: record.resetTime - now };
}

// Strict rate limit for auth routes (5 per minute)
export function authRateLimit(identifier: string) {
  return rateLimit(identifier, { windowMs: 60 * 1000, maxRequests: 5 });
}

// Standard rate limit for API routes (60 per minute)
export function apiRateLimit(identifier: string) {
  return rateLimit(identifier, { windowMs: 60 * 1000, maxRequests: 60 });
}

// AI rate limit (20 per minute, AI calls are expensive)
export function aiRateLimit(identifier: string) {
  return rateLimit(identifier, { windowMs: 60 * 1000, maxRequests: 20 });
}
