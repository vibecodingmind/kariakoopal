import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ── Chimbo Direct - Proxy (Network Boundary) ──
// Next.js 16.1: middleware.ts → proxy.ts
// This file handles routing, redirects, rewrites, and header modifications.
// Heavy application logic (DB queries, JWT validation) should live in Route Handlers or Server Components.

// UUID v4 generator (Node.js runtime compatible)
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Role-based route protection
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
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  return response;
}

// ── Suspicious Activity Detection ──
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const SUSPICIOUS_THRESHOLD = 5;
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

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of failedLoginAttempts.entries()) {
    if (now - data.lastAttempt > SUSPICIOUS_WINDOW) {
      failedLoginAttempts.delete(ip);
    }
  }
}

// ── Proxy (formerly middleware) ──
// Next.js 16.1: renamed from `middleware` to `proxy`
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);
  const requestId = generateRequestId();

  // Lazy cleanup of old failed login entries
  if (failedLoginAttempts.size > 100) cleanupOldEntries();

  // ── CSRF Protection ──
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '');
      if (originHost !== host) {
        if (pathname.startsWith('/api/')) {
          return withSecurityHeaders(
            NextResponse.json(
              { error: 'Invalid origin. CSRF check failed.', success: false },
              { status: 403 }
            )
          );
        }
        return withSecurityHeaders(
          new NextResponse('Forbidden: CSRF check failed', { status: 403 })
        );
      }
    }
  }

  // ── API Route Security ──
  if (pathname.startsWith('/api/')) {
    // Auth routes — stricter rate limiting
    if (pathname.startsWith('/api/auth')) {
      if (trackFailedLogin(clientIp) && request.method === 'POST') {
        return withSecurityHeaders(
          NextResponse.json(
            { error: 'Account temporarily locked due to too many failed attempts. Please try again later.', success: false },
            { status: 429 }
          )
        );
      }

      const rateResult = rateLimit(clientIp, 5, 60 * 1000);
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
    // Payment routes — stricter rate limiting
    else if (pathname.startsWith('/api/payments')) {
      const rateResult = rateLimit(clientIp, 5, 60 * 1000);
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
      const rateResult = rateLimit(clientIp, 100, 60 * 1000);
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
    // If authenticated user visits root, redirect to their dashboard
    const roleFromCookie = request.cookies.get('user_role')?.value;
    if (pathname === '/' && roleFromCookie) {
      const dashboardPath = roleFromCookie === 'admin' ? '/admin' : roleFromCookie === 'guide' ? '/guide' : '/seeker';
      return withSecurityHeaders(NextResponse.redirect(new URL(dashboardPath, request.url)));
    }
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

  // Check for auth token cookie (thin proxy pattern — existence check only)
  const authToken = request.cookies.get('auth_token')?.value;
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  const roleFromCookie = request.cookies.get('user_role')?.value;

  // If user has a role cookie, consider them authenticated (zustand persisted state sync)
  const isAuthenticated = !!(authToken || sessionToken || roleFromCookie);

  if (!isAuthenticated) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Role-specific route protection (redirect only — no DB calls)
  if (roleFromCookie) {
    if (pathname.startsWith('/guide') && roleFromCookie === 'seeker') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/seeker', request.url)));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'seeker') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/seeker', request.url)));
    }
    if (pathname.startsWith('/seeker') && roleFromCookie === 'guide') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/guide', request.url)));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'guide') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/guide', request.url)));
    }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
    '/api/(.*)',
  ],
};
