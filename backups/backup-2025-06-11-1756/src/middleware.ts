// ================================================
// Middleware with Admin Route Protection
// ================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserRoleFromSession } from '@/lib/auth/session-middleware';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Handle old locale-based URLs
  const localePattern = /^\/([a-z]{2})(\/.*)$/;
  const match = path.match(localePattern);
  
  if (match) {
    // Redirect from /en/about-us to /about-us
    const newPath = match[2] || '/';
    const url = new URL(newPath, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }
  
  // Check if this is an admin route
  if (path.startsWith('/dashboard/admin') || path.startsWith('/admin')) {
    try {
      const userRole = await getUserRoleFromSession(request);
      
      if (!userRole || !['Master', 'Admin'].includes(userRole)) {
        // Redirect to CRM dashboard with error message
        const url = new URL('/dashboard/crm', request.url);
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      // On error, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Check if this is any dashboard route requiring authentication
  if (path.startsWith('/dashboard')) {
    try {
      const userRole = await getUserRoleFromSession(request);
      
      if (!userRole) {
        // Redirect to login with return URL
        const url = new URL('/login', request.url);
        url.searchParams.set('returnUrl', path);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      // On error, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include dashboard routes for protection
    '/dashboard/:path*',
    '/admin/:path*',
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw.js|.*\\.).*)'
  ]
};
