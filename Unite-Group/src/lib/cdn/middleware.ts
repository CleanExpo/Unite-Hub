/**
 * CDN Middleware Integration
 * 
 * This module provides utilities for integrating CDN functionality with Next.js middleware.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCacheControl, shouldUseCdn } from './config'

/**
 * Options for applying CDN headers
 */
export interface CdnHeadersOptions {
  /**
   * Whether to apply CDN headers
   * @default true
   */
  enabled?: boolean
  
  /**
   * Paths to include (regexp strings)
   * @default ['.*\\.(jpg|jpeg|png|gif|webp|svg|ico|css|js)$']
   */
  includePaths?: string[]
  
  /**
   * Paths to exclude (regexp strings)
   * @default ['^/api/.*$']
   */
  excludePaths?: string[]
  
  /**
   * Whether to disable caching for authenticated requests
   * @default true
   */
  disableForAuthenticated?: boolean
}

/**
 * Default options for applying CDN headers
 */
const defaultHeadersOptions: CdnHeadersOptions = {
  enabled: true,
  includePaths: ['.*\\.(jpg|jpeg|png|gif|webp|svg|ico|css|js)$'],
  excludePaths: ['^/api/.*$'],
  disableForAuthenticated: true,
}

/**
 * Apply CDN headers to response
 * @param req Next.js request
 * @param res Next.js response
 * @param options Options for applying CDN headers
 * @returns Modified Next.js response
 */
export function applyCdnHeaders(
  req: NextRequest,
  res: NextResponse,
  options: CdnHeadersOptions = {}
): NextResponse {
  // Merge options with defaults
  const mergedOptions = {
    ...defaultHeadersOptions,
    ...options,
  }
  
  // Return original response if CDN headers are disabled
  if (!mergedOptions.enabled) {
    return res
  }
  
  const path = req.nextUrl.pathname
  
  // Check if path is excluded
  if (mergedOptions.excludePaths?.some(pattern => 
    new RegExp(pattern).test(path)
  )) {
    return res
  }
  
  // Check if path is included
  const isIncluded = mergedOptions.includePaths?.some(pattern => 
    new RegExp(pattern).test(path)
  ) ?? false
  
  if (!isIncluded) {
    return res
  }
  
  // Check if request is authenticated
  const isAuthenticated = req.cookies.has('session') || 
    req.headers.get('authorization') != null
  
  if (mergedOptions.disableForAuthenticated && isAuthenticated) {
    // Set no-cache headers for authenticated requests
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  }
  
  // Apply CDN headers based on path
  const cacheControl = getCacheControl(path)
  res.headers.set('Cache-Control', cacheControl)
  
  // Add additional CDN-related headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Enable CORS for CDN assets
  res.headers.set('Access-Control-Allow-Origin', '*')
  
  return res
}

/**
 * CDN middleware factory
 * Creates a middleware function that applies CDN headers
 * 
 * @param options Options for applying CDN headers
 * @returns Middleware function
 */
export function createCdnMiddleware(options: CdnHeadersOptions = {}) {
  return (req: NextRequest): NextResponse => {
    // Skip for non-GET requests
    if (req.method !== 'GET') {
      return NextResponse.next()
    }
    
    // Create a basic response to apply headers to
    const res = NextResponse.next()
    
    // Apply CDN headers
    return applyCdnHeaders(req, res, options)
  }
}

/**
 * Determine if a request should be redirected to CDN
 * 
 * @param req Next.js request
 * @returns Whether the request should be redirected to CDN
 */
export function shouldRedirectToCdn(req: NextRequest): boolean {
  // Check if CDN redirection is enabled
  if (process.env.ENABLE_CDN_REDIRECT !== 'true') {
    return false
  }
  
  // Don't redirect non-GET requests
  if (req.method !== 'GET') {
    return false
  }
  
  const path = req.nextUrl.pathname
  
  // Check if path should use CDN
  return shouldUseCdn(path)
}

/**
 * Get CDN redirect URL
 * 
 * @param req Next.js request
 * @returns CDN redirect URL or null if redirection is not possible
 */
export function getCdnRedirectUrl(req: NextRequest): URL | null {
  // Check if request should be redirected to CDN
  if (!shouldRedirectToCdn(req)) {
    return null
  }
  
  // Get CDN base URL from environment
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL
  
  if (!cdnBaseUrl) {
    return null
  }
  
  try {
    // Create new URL with CDN base
    const redirectUrl = new URL(req.nextUrl.pathname, cdnBaseUrl)
    
    // Preserve query parameters
    redirectUrl.search = req.nextUrl.search
    
    return redirectUrl
  } catch (error) {
    console.error('Error creating CDN redirect URL:', error)
    return null
  }
}
