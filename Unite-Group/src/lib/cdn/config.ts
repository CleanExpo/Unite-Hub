/**
 * CDN Configuration Module
 * 
 * This module provides configuration and utilities for CDN integration.
 */

/**
 * CDN provider options
 */
export enum CdnProvider {
  VERCEL = 'vercel',
  CLOUDFLARE = 'cloudflare',
  AKAMAI = 'akamai',
  CUSTOM = 'custom',
}

/**
 * CDN configuration
 */
export interface CdnConfig {
  /**
   * Enable CDN
   * @default true in production, false in development
   */
  enabled: boolean;
  
  /**
   * CDN provider
   * @default CdnProvider.VERCEL
   */
  provider: CdnProvider;
  
  /**
   * CDN domain
   * For custom providers, this is the full domain
   * For built-in providers, this is used as a prefix
   * @example 'cdn.example.com' or 'assets'
   */
  domain?: string;
  
  /**
   * CDN base URL
   * This is the full URL including protocol
   * @example 'https://cdn.example.com'
   */
  baseUrl?: string;
  
  /**
   * Asset paths to include in CDN
   * @default ['images', 'fonts', 'assets']
   */
  includePaths?: string[];
  
  /**
   * Asset paths to exclude from CDN
   * @default []
   */
  excludePaths?: string[];
  
  /**
   * Default cache control max-age in seconds
   * @default 86400 (1 day)
   */
  defaultMaxAge?: number;
  
  /**
   * Cache control overrides by path pattern
   * @example { 'images/.*': 604800 } (1 week for images)
   */
  cacheOverrides?: Record<string, number>;
}

/**
 * Default CDN configuration
 */
export const defaultCdnConfig: CdnConfig = {
  enabled: process.env.NODE_ENV === 'production',
  provider: CdnProvider.VERCEL,
  includePaths: ['images', 'fonts', 'assets'],
  excludePaths: [],
  defaultMaxAge: 86400, // 1 day
  cacheOverrides: {
    'images/.*': 604800, // 1 week for images
    'fonts/.*': 2592000, // 30 days for fonts
    'assets/static/.*': 2592000, // 30 days for static assets
  },
};

// Current CDN configuration
let currentConfig: CdnConfig = { ...defaultCdnConfig };

/**
 * Get the current CDN configuration
 * @returns Current CDN configuration
 */
export function getCdnConfig(): CdnConfig {
  return currentConfig;
}

/**
 * Set the CDN configuration
 * @param config CDN configuration
 */
export function setCdnConfig(config: Partial<CdnConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * Get the CDN base URL
 * @returns CDN base URL or empty string if CDN is disabled
 */
export function getCdnBaseUrl(): string {
  if (!currentConfig.enabled) {
    return '';
  }
  
  if (currentConfig.baseUrl) {
    return currentConfig.baseUrl;
  }
  
  switch (currentConfig.provider) {
    case CdnProvider.VERCEL:
      // Vercel automatically serves as a CDN, just use the domain
      return process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : '';
      
    case CdnProvider.CLOUDFLARE:
      // Use Cloudflare CDN domain if provided
      return currentConfig.domain
        ? `https://${currentConfig.domain}.cloudfront.com`
        : '';
      
    case CdnProvider.CUSTOM:
      // Use custom domain if provided
      return currentConfig.domain
        ? `https://${currentConfig.domain}`
        : '';
      
    default:
      return '';
  }
}

/**
 * Check if a path should be served from CDN
 * @param path Asset path
 * @returns Whether the path should be served from CDN
 */
export function shouldUseCdn(path: string): boolean {
  if (!currentConfig.enabled) {
    return false;
  }
  
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Check if path is excluded
  if (currentConfig.excludePaths?.some(excludePath => 
    new RegExp(`^${excludePath}`).test(normalizedPath)
  )) {
    return false;
  }
  
  // Check if path is included
  return currentConfig.includePaths?.some(includePath => 
    new RegExp(`^${includePath}`).test(normalizedPath)
  ) ?? false;
}

/**
 * Get cache control header value for a path
 * @param path Asset path
 * @returns Cache control header value
 */
export function getCacheControl(path: string): string {
  if (!currentConfig.enabled) {
    return 'no-store, no-cache';
  }
  
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Check for cache overrides
  if (currentConfig.cacheOverrides) {
    for (const [pattern, maxAge] of Object.entries(currentConfig.cacheOverrides)) {
      if (new RegExp(pattern).test(normalizedPath)) {
        return `public, max-age=${maxAge}, stale-while-revalidate=60`;
      }
    }
  }
  
  // Use default max age
  return `public, max-age=${currentConfig.defaultMaxAge}, stale-while-revalidate=60`;
}
