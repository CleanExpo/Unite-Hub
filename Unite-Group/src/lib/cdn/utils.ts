/**
 * CDN Utilities Module
 * 
 * This module provides utility functions for working with CDN resources.
 */

import { getCdnBaseUrl, shouldUseCdn, getCacheControl } from './config';

/**
 * Generate a CDN URL for an asset
 * @param path Asset path (with or without leading slash)
 * @returns Full URL including CDN domain if CDN is enabled, or original path if not
 */
export function getCdnUrl(path: string): string {
  // Handle empty or undefined paths
  if (!path) {
    return '';
  }
  
  // Get CDN base URL
  const baseUrl = getCdnBaseUrl();
  
  // If CDN is disabled or the path shouldn't use CDN, return the original path
  if (!baseUrl || !shouldUseCdn(path)) {
    return path;
  }
  
  // Normalize path (ensure it starts with a slash)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Combine base URL with path
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Generate a CDN URL for an image
 * @param path Image path (with or without leading slash)
 * @param width Optional width for image optimization
 * @param height Optional height for image optimization
 * @param quality Optional quality for image optimization (1-100)
 * @returns Full URL including CDN domain and optimization parameters
 */
export function getCdnImageUrl(
  path: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  // Get base CDN URL for the image
  const baseUrl = getCdnUrl(path);
  
  // If no optimization parameters or CDN is disabled, return the base URL
  if ((!width && !height) || !baseUrl) {
    return baseUrl;
  }
  
  // Add query parameters for image optimization
  const params = new URLSearchParams();
  
  if (width) {
    params.append('w', width.toString());
  }
  
  if (height) {
    params.append('h', height.toString());
  }
  
  if (quality && quality !== 80) {
    params.append('q', quality.toString());
  }
  
  // Add parameters to URL
  const paramString = params.toString();
  
  return paramString
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${paramString}`
    : baseUrl;
}

/**
 * Generate Image optimization srcSet for responsive images
 * @param path Image path
 * @param widths Array of widths to include in the srcSet
 * @param height Optional fixed height (aspect ratio will be maintained if not provided)
 * @param quality Image quality (1-100)
 * @returns srcSet string for use in <img> or <source> elements
 */
export function getCdnImageSrcSet(
  path: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920, 2048],
  height?: number,
  quality: number = 80
): string {
  return widths
    .map(width => {
      const url = getCdnImageUrl(path, width, height, quality);
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate cache control headers for a CDN asset
 * @param path Asset path
 * @returns Object with HTTP headers for cache control
 */
export function getCdnCacheHeaders(path: string): Record<string, string> {
  return {
    'Cache-Control': getCacheControl(path),
  };
}

/**
 * Check if URL is a CDN URL
 * @param url URL to check
 * @returns Whether the URL is a CDN URL
 */
export function isCdnUrl(url: string): boolean {
  const baseUrl = getCdnBaseUrl();
  return !!baseUrl && url.startsWith(baseUrl);
}

/**
 * Convert relative URL to absolute URL
 * @param path Relative URL
 * @param baseUrl Base URL (defaults to window.location.origin)
 * @returns Absolute URL
 */
export function getAbsoluteUrl(path: string, baseUrl?: string): string {
  if (!path) {
    return '';
  }
  
  // If path is already absolute, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get base URL from parameter or window.location.origin
  const base = baseUrl || (
    typeof window !== 'undefined' 
      ? window.location.origin 
      : ''
  );
  
  // If no base URL available, return original path
  if (!base) {
    return path;
  }
  
  // Normalize path (ensure it starts with a slash)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Combine base URL with path
  return `${base}${normalizedPath}`;
}
