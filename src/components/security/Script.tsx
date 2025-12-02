/**
 * CSP-Safe Script Component
 *
 * Wrapper for inline scripts that require nonce-based CSP allowlisting.
 * This replaces unsafe-inline with nonce verification.
 *
 * USAGE:
 * ```tsx
 * import { headers } from 'next/headers';
 * import { getNonceFromHeaders } from '@/lib/security/csp';
 * import { Script } from '@/components/security/Script';
 *
 * export default function Page() {
 *   const nonce = getNonceFromHeaders(headers());
 *
 *   return (
 *     <Script nonce={nonce} type="application/ld+json">
 *       {JSON.stringify(structuredData)}
 *     </Script>
 *   );
 * }
 * ```
 */

import React from 'react';

export interface ScriptProps {
  /** CSP nonce from middleware */
  nonce?: string;
  /** Script type (application/ld+json, text/javascript, etc.) */
  type?: string;
  /** Inline script content */
  children: string;
  /** Additional script attributes */
  [key: string]: any;
}

/**
 * CSP-Safe Script Component
 *
 * Renders inline scripts with nonce attribute for CSP compliance.
 * Falls back to dangerouslySetInnerHTML if nonce is not available
 * (e.g., in client components where headers are not accessible).
 *
 * SECURITY NOTES:
 * - Always use Server Components to access nonce from headers
 * - Never hardcode or reuse nonces
 * - Validate script content before rendering
 */
export function Script({ nonce, type = 'text/javascript', children, ...props }: ScriptProps) {
  // Remove children from props to avoid React warnings
  const { children: _, ...scriptProps } = props;

  return (
    <script
      {...scriptProps}
      type={type}
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

/**
 * CSP-Safe JSON-LD Script Component
 *
 * Specialized component for Schema.org JSON-LD structured data.
 * Automatically sets type="application/ld+json" and stringifies objects.
 *
 * USAGE:
 * ```tsx
 * import { JsonLdScript } from '@/components/security/Script';
 *
 * export default function Page() {
 *   const nonce = getNonceFromHeaders(headers());
 *   const schema = { "@context": "https://schema.org", ... };
 *
 *   return <JsonLdScript nonce={nonce} data={schema} />;
 * }
 * ```
 */
export interface JsonLdScriptProps {
  /** CSP nonce from middleware */
  nonce?: string;
  /** Structured data object (will be JSON.stringify'd) */
  data: any;
  /** Additional script attributes */
  [key: string]: any;
}

export function JsonLdScript({ nonce, data, ...props }: JsonLdScriptProps) {
  return (
    <Script nonce={nonce} type="application/ld+json" {...props}>
      {JSON.stringify(data)}
    </Script>
  );
}

/**
 * CSP-Safe Inline Style Component
 *
 * For rare cases where inline styles are needed with nonce.
 * Prefer CSS modules or Tailwind classes whenever possible.
 *
 * USAGE:
 * ```tsx
 * import { InlineStyle } from '@/components/security/Script';
 *
 * export default function Page() {
 *   const nonce = getNonceFromHeaders(headers());
 *
 *   return (
 *     <InlineStyle nonce={nonce}>
 *       {`.custom-class { color: red; }`}
 *     </InlineStyle>
 *   );
 * }
 * ```
 */
export interface InlineStyleProps {
  /** CSP nonce from middleware */
  nonce?: string;
  /** CSS content */
  children: string;
  /** Additional style attributes */
  [key: string]: any;
}

export function InlineStyle({ nonce, children, ...props }: InlineStyleProps) {
  const { children: _, ...styleProps } = props;

  return (
    <style
      {...styleProps}
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}
