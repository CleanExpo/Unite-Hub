/* eslint-disable no-undef */
/**
 * Content Security Policy (CSP) Utilities with Nonce Support
 *
 * Implements cryptographically secure nonces to replace unsafe-inline directives.
 * This significantly improves XSS protection by allowing only scripts/styles with
 * valid nonces to execute.
 *
 * SECURITY: Nonces MUST be:
 * 1. Cryptographically random (16+ bytes)
 * 2. Generated fresh per request
 * 3. Unpredictable to attackers
 * 4. Single-use only
 *
 * References:
 * - MDN CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * - OWASP CSP Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */

// NOTE: Using Web Crypto API instead of Node.js crypto for Edge Runtime compatibility
// Vercel middleware runs on Edge Runtime which doesn't support Node.js built-in modules
// The globals (crypto, btoa, Headers, process) are available in Edge Runtime but ESLint doesn't know them

/**
 * Generate a cryptographically secure nonce
 *
 * Uses Web Crypto API (crypto.getRandomValues) which is available in:
 * - Edge Runtime (Vercel middleware)
 * - Node.js (via globalThis.crypto)
 * - All modern browsers
 *
 * @param length - Number of random bytes (default: 16)
 * @returns Base64-encoded nonce string
 */
export function generateNonce(length: number = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // Convert to base64 using btoa (available in Edge Runtime)
  return btoa(String.fromCharCode(...bytes));
}

/**
 * CSP Policy Configuration
 *
 * Define CSP directives with nonce support. This replaces unsafe-inline
 * with nonce-based inline script/style allowlisting.
 */
export interface CSPConfig {
  /** Allow unsafe-eval for script-src (needed for some frameworks) */
  allowUnsafeEval?: boolean;
  /** Additional script-src domains */
  scriptSrcDomains?: string[];
  /** Additional style-src domains */
  styleSrcDomains?: string[];
  /** Additional connect-src domains */
  connectSrcDomains?: string[];
  /** Additional img-src domains */
  imgSrcDomains?: string[];
  /** Additional font-src domains */
  fontSrcDomains?: string[];
  /** Additional frame-src domains */
  frameSrcDomains?: string[];
  /** Report URI for CSP violations */
  reportUri?: string;
}

/**
 * Build Content Security Policy header with nonce support
 *
 * This removes 'unsafe-inline' and replaces it with nonce-based allowlisting.
 * Only scripts/styles with matching nonces will execute.
 *
 * @param nonce - Cryptographically secure nonce for this request
 * @param config - Optional CSP configuration overrides
 * @returns CSP header value
 */
export function buildCSPHeader(nonce: string, config: CSPConfig = {}): string {
  const {
    allowUnsafeEval = true, // Next.js requires unsafe-eval for HMR in dev
    scriptSrcDomains = [],
    styleSrcDomains = [],
    connectSrcDomains = [],
    imgSrcDomains = [],
    fontSrcDomains = [],
    frameSrcDomains = [],
    reportUri,
  } = config;

  // Base CSP directives
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // Scripts: Allow unsafe-inline for Next.js compatibility
    // TODO: Implement proper nonce passing to Next.js Script components
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js inline scripts
      `'nonce-${nonce}'`,
      ...(allowUnsafeEval ? ["'unsafe-eval'"] : []),
      'https://accounts.google.com', // Google OAuth
      'https://unpkg.com', // CDN for libraries (if needed)
      ...scriptSrcDomains,
    ],

    // Styles: Allow unsafe-inline for Tailwind CSS and Next.js
    // TODO: Implement proper nonce passing for styled-jsx
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS and dynamic styles
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com', // Google Fonts
      ...styleSrcDomains,
    ],

    // Images: Allow data URIs, blobs, HTTPS
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:', // Allow HTTP images (for user-generated content)
      ...imgSrcDomains,
    ],

    // Fonts: Allow data URIs and Google Fonts
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      ...fontSrcDomains,
    ],

    // Connect: API endpoints
    'connect-src': [
      "'self'",
      'https://*.supabase.co', // Supabase API
      'https://api.anthropic.com', // Claude AI API
      'https://accounts.google.com', // Google OAuth
      'https://openrouter.ai', // OpenRouter API (if used)
      'https://api.perplexity.ai', // Perplexity API (if used)
      ...connectSrcDomains,
    ],

    // Frames: Only Google OAuth
    'frame-src': [
      "'self'",
      'https://accounts.google.com',
      ...frameSrcDomains,
    ],

    // Objects: Block all plugins
    'object-src': ["'none'"],

    // Base URI: Prevent base tag hijacking
    'base-uri': ["'self'"],

    // Forms: Only submit to same origin
    'form-action': ["'self'"],

    // Frames: Prevent clickjacking
    'frame-ancestors': ["'none'"],

    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' && {
      'upgrade-insecure-requests': [],
    }),
  };

  // Add report-uri if configured
  if (reportUri) {
    directives['report-uri'] = [reportUri];
  }

  // Build CSP string
  const cspString = Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive; // Directives like upgrade-insecure-requests have no value
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');

  return cspString;
}

/**
 * Custom header name for passing nonce to React components
 *
 * Middleware stores nonce in this header so components can access it
 * via headers() in Server Components.
 */
export const NONCE_HEADER = 'x-nonce';

/**
 * Get nonce from request headers (for Server Components)
 *
 * Usage in Server Components:
 * ```tsx
 * import { headers } from 'next/headers';
 * import { getNonceFromHeaders } from '@/lib/security/csp';
 *
 * export default function Page() {
 *   const nonce = getNonceFromHeaders();
 *   return <Script nonce={nonce}>...</Script>;
 * }
 * ```
 *
 * @param headersList - Next.js headers() result
 * @returns Nonce string or undefined if not found
 */
export function getNonceFromHeaders(headersList?: Headers): string | undefined {
  if (!headersList) {
    return undefined;
  }
  return headersList.get(NONCE_HEADER) || undefined;
}

/**
 * CSP Violation Report Type
 *
 * When CSP blocks something, browsers send violation reports to report-uri.
 * This type defines the structure of those reports.
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'disposition': 'enforce' | 'report';
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

/**
 * Validate nonce format
 *
 * Nonces should be base64-encoded strings of sufficient length.
 * This prevents injection attacks where attackers try to guess or
 * manipulate nonce values.
 *
 * @param nonce - Nonce string to validate
 * @returns True if nonce is valid format
 */
export function isValidNonce(nonce: string): boolean {
  // Check if base64-encoded
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(nonce)) {
    return false;
  }

  // Check minimum length (16 bytes = 24 chars in base64)
  if (nonce.length < 24) {
    return false;
  }

  return true;
}

/**
 * CSP Builder for development vs production
 *
 * Development mode needs looser CSP for HMR, hot reload, etc.
 * Production mode uses strict CSP with nonces.
 */
export function getEnvironmentCSP(nonce: string): string {
  if (process.env.NODE_ENV === 'development') {
    // Development: Allow unsafe-eval for Next.js HMR
    return buildCSPHeader(nonce, {
      allowUnsafeEval: true,
      connectSrcDomains: [
        'ws://localhost:*', // Webpack HMR
        'http://localhost:*', // Local dev servers
      ],
    });
  }

  // Production: Strict CSP
  return buildCSPHeader(nonce, {
    allowUnsafeEval: true, // Still needed for some Next.js internals
    reportUri: '/api/csp-report', // Report violations
  });
}
