/**
 * Role-Based Redirect Helper
 *
 * Routes users to their appropriate dashboard based on role.
 * Ensures founders and staff bypass public SaaS tier pages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole, getDefaultDashboardForRole } from './userTypes';

/**
 * Public paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/login',
  '/register',
  '/auth/callback',
  '/auth/implicit-callback',
  '/terms',
  '/privacy',
  '/support',
  '/api/public',
  '/api/auth',
];

/**
 * Paths that should show marketing content to guests
 */
export const MARKETING_PATHS = ['/', '/pricing', '/landing'];

/**
 * Check if a path is public
 */
export const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
};

/**
 * Check if a path is a marketing path
 */
export const isMarketingPath = (pathname: string): boolean => {
  return MARKETING_PATHS.includes(pathname);
};

/**
 * Redirect user based on their role
 *
 * Rules:
 * - FOUNDER: Always goes to /founder (bypasses pricing/marketing)
 * - STAFF: Always goes to /staff/dashboard (bypasses pricing/marketing)
 * - CLIENT: Can access /client/* but not /founder/* or /staff/*
 * - ADMIN: Full access to all areas
 * - Guest (null): Can see marketing/pricing pages
 */
export function redirectForRole(
  req: NextRequest,
  role: UserRole | null | undefined
): NextResponse | null {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Guest users can see marketing pages
  if (!role) {
    return null; // Continue without redirect
  }

  // FOUNDER: Redirect to /founder from marketing/public pages
  if (role === 'FOUNDER') {
    if (isMarketingPath(pathname) || pathname === '/dashboard') {
      url.pathname = '/founder';
      return NextResponse.redirect(url);
    }
    // Already on founder pages, continue
    if (pathname.startsWith('/founder')) {
      return null;
    }
    // Allow access to API routes and static assets
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return null;
    }
    return null;
  }

  // STAFF: Redirect to /staff/dashboard from marketing/public pages
  if (role === 'STAFF') {
    if (isMarketingPath(pathname) || pathname === '/dashboard') {
      url.pathname = '/staff/dashboard';
      return NextResponse.redirect(url);
    }
    // Already on staff pages, continue
    if (pathname.startsWith('/staff')) {
      return null;
    }
    // Block access to founder-only areas
    if (pathname.startsWith('/founder')) {
      url.pathname = '/staff/dashboard';
      return NextResponse.redirect(url);
    }
    // Allow access to API routes and static assets
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return null;
    }
    return null;
  }

  // CLIENT: Redirect away from founder/staff areas
  if (role === 'CLIENT') {
    if (pathname.startsWith('/founder') || pathname.startsWith('/staff')) {
      url.pathname = '/client';
      return NextResponse.redirect(url);
    }
    // Redirect from marketing to client dashboard if already logged in
    if (isMarketingPath(pathname)) {
      url.pathname = '/client';
      return NextResponse.redirect(url);
    }
    return null;
  }

  // ADMIN: Full access, no restrictions
  if (role === 'ADMIN') {
    return null;
  }

  return null;
}

/**
 * Get redirect URL for unauthenticated users
 */
export function getLoginRedirectUrl(req: NextRequest): string {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', req.nextUrl.pathname);
  return url.toString();
}
