import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Edge-compatible UUID v4 generator (no Node.js crypto needed)
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Role-based route protection middleware
const ROLE_ROUTES: Record<string, string[]> = {
  seeker: ['/seeker', '/wallet', '/notifications', '/settings', '/market', '/prices', '/events', '/vendors', '/guides'],
  guide: ['/guide', '/wallet', '/notifications', '/settings', '/market', '/prices', '/events', '/vendors', '/guides'],
  admin: ['/admin', '/wallet', '/notifications', '/settings'],
};

const PUBLIC_ROUTES = ['/', '/auth', '/guides', '/market', '/prices', '/events', '/vendors', '/stories'];

// Role-specific dashboard for redirecting unauthorized access
const ROLE_DASHBOARD: Record<string, string> = {
  seeker: '/seeker',
  guide: '/guide',
  admin: '/admin',
};

/**
 * Apply security headers to any response object.
 * Ensures ALL responses include security headers consistently.
 */
function withSecurityHeaders(response: NextResponse): NextResponse {
  // X-Content-Type-Options: Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection: Enable XSS filtering
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Restrict browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

// ── Suspicious Activity Detection ──
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const SUSPICIOUS_THRESHOLD = 5; // 5 failed logins within 10 minutes
const SUSPICIOUS_WINDOW = 10 * 60 * 1000;

function trackFailedLogin(ip: string) {
  const existing = failedLoginAttempts.get(ip);
  if (existing && Date.now() - existing.lastAttempt < SUSPICIOUS_WINDOW) {
    existing.count++;
    existing.lastAttempt = Date.now();
  } else {
    failedLoginAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
  }
  return (failedLoginAttempts.get(ip)?.count || 0) >= SUSPICIOUS_THRESHOLD;
}

function clearFailedLogins(ip: string) {
  failedLoginAttempts.delete(ip);
}

// Periodic cleanup of old entries (lazy cleanup on each request instead of setInterval)
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of failedLoginAttempts.entries()) {
    if (now - data.lastAttempt > SUSPICIOUS_WINDOW) {
      failedLoginAttempts.delete(ip);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);

  // ── Request ID for tracing ──
  const requestId = generateRequestId();

  // Lazy cleanup of old failed login entries
  if (failedLoginAttempts.size > 100) cleanupOldEntries();

  // ── CSRF Protection ──
  // Validate Origin header for ALL state-changing methods (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // If origin is present and doesn't match host, reject
    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '');
      if (originHost !== host) {
        // For API routes, return JSON error; for page routes, redirect
        if (pathname.startsWith('/api/')) {
          return withSecurityHeaders(
            NextResponse.json(
              { error: 'Invalid origin. CSRF check failed.', success: false },
              { status: 403 }
            )
          );
        }
        // For non-API routes with wrong origin, return 403
        return withSecurityHeaders(
          new NextResponse('Forbidden: CSRF check failed', { status: 403 })
        );
      }
    }
  }

  // ── API Route Security ──
  if (pathname.startsWith('/api/')) {
    // Rate limiting for API routes
    const clientIp = getClientIp(request);

    // Auth routes get stricter rate limiting
    if (pathname.startsWith('/api/auth')) {
      // Check for suspicious activity (too many failed logins)
      if (trackFailedLogin(clientIp) && request.method === 'POST') {
        return withSecurityHeaders(
          NextResponse.json(
            { error: 'Account temporarily locked due to too many failed attempts. Please try again later.', success: false },
            { status: 429 }
          )
        );
      }

      const rateResult = rateLimit(clientIp, 5, 60 * 1000); // 5 per minute for auth
      if (!rateResult.allowed) {
        return withSecurityHeaders(
          NextResponse.json(
            { error: 'Too many requests. Please try again later.', success: false },
            { status: 429 }
          )
        );
      }
      const response = withSecurityHeaders(NextResponse.next());
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-RateLimit-Limit', String(rateResult.total));
      response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateResult.resetTime));
      return response;
    }
    // Payment routes get stricter rate limiting
    else if (pathname.startsWith('/api/payments')) {
      const rateResult = rateLimit(clientIp, 5, 60 * 1000); // 5 per minute for payments
      if (!rateResult.allowed) {
        return withSecurityHeaders(
          NextResponse.json(
            { error: 'Too many payment requests. Please try again later.', success: false },
            { status: 429 }
          )
        );
      }
      const response = withSecurityHeaders(NextResponse.next());
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-RateLimit-Limit', String(rateResult.total));
      response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
      return response;
    }
    // General API rate limiting
    else {
      const rateResult = rateLimit(clientIp, 100, 60 * 1000); // 100 per minute
      if (!rateResult.allowed) {
        return withSecurityHeaders(
          NextResponse.json(
            { error: 'Too many requests. Please try again later.', success: false },
            { status: 429 }
          )
        );
      }
      const response = withSecurityHeaders(NextResponse.next());
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-RateLimit-Limit', String(rateResult.total));
      response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
      return response;
    }
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Check for auth token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;

  // If no auth token, redirect to login
  if (!authToken && !sessionToken) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Role-specific route protection
  const roleFromCookie = request.cookies.get('user_role')?.value;

  if (roleFromCookie) {
    const allowedRoutes = ROLE_ROUTES[roleFromCookie];
    const dashboard = ROLE_DASHBOARD[roleFromCookie];

    // If seeker tries to access /guide/* or /admin/*, redirect to /seeker
    if (pathname.startsWith('/guide') && roleFromCookie === 'seeker') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/seeker', request.url)));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'seeker') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/seeker', request.url)));
    }

    // If guide tries to access /seeker/* or /admin/*, redirect to /guide
    if (pathname.startsWith('/seeker') && roleFromCookie === 'guide') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/guide', request.url)));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'guide') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/guide', request.url)));
    }

    // If admin tries to access /seeker/* or /guide/*, redirect to /admin
    if (pathname.startsWith('/seeker') && roleFromCookie === 'admin') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (pathname.startsWith('/guide') && roleFromCookie === 'admin') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths including API routes for security headers and rate limiting
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
    '/api/(.*)',
  ],
};
