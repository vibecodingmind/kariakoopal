import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Role-based route protection middleware
const ROLE_ROUTES: Record<string, string[]> = {
  seeker: ['/seeker', '/wallet', '/notifications', '/settings'],
  guide: ['/guide', '/wallet', '/notifications', '/settings'],
  admin: ['/admin', '/wallet', '/notifications', '/settings'],
};

const PUBLIC_ROUTES = ['/', '/auth', '/guides', '/market', '/prices', '/events', '/vendors', '/stories', '/seeker/ai-trip-planner'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // Allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;

  // If no auth token, redirect to login
  if (!authToken && !sessionToken) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-specific route protection
  // Note: Since JWT role verification requires secret key access,
  // we do basic route-level checks here. Full role validation happens client-side.
  const roleFromCookie = request.cookies.get('user_role')?.value;

  if (roleFromCookie) {
    // Admin-only routes
    if (pathname.startsWith('/admin') && roleFromCookie !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Guide-only routes
    if (pathname.startsWith('/guide') && roleFromCookie !== 'guide' && roleFromCookie !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Seeker-only routes
    if (pathname.startsWith('/seeker') && roleFromCookie !== 'seeker' && roleFromCookie !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
