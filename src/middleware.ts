import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  const roleFromCookie = request.cookies.get('user_role')?.value;

  if (roleFromCookie) {
    const allowedRoutes = ROLE_ROUTES[roleFromCookie];
    const dashboard = ROLE_DASHBOARD[roleFromCookie];

    // If seeker tries to access /guide/* or /admin/*, redirect to /seeker
    if (pathname.startsWith('/guide') && roleFromCookie === 'seeker') {
      return NextResponse.redirect(new URL('/seeker', request.url));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'seeker') {
      return NextResponse.redirect(new URL('/seeker', request.url));
    }

    // If guide tries to access /seeker/* or /admin/*, redirect to /guide
    if (pathname.startsWith('/seeker') && roleFromCookie === 'guide') {
      return NextResponse.redirect(new URL('/guide', request.url));
    }
    if (pathname.startsWith('/admin') && roleFromCookie === 'guide') {
      return NextResponse.redirect(new URL('/guide', request.url));
    }

    // If admin tries to access /seeker/* or /guide/*, redirect to /admin
    if (pathname.startsWith('/seeker') && roleFromCookie === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (pathname.startsWith('/guide') && roleFromCookie === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
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
