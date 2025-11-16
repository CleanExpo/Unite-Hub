/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated HTML content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering
 * Use this before rendering any user-generated HTML with dangerouslySetInnerHTML
 */
export function sanitizeHtml(
  html: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }
): string {
  // Default safe configuration for email content
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: options?.allowedTags || [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'a', 'ul', 'ol', 'li', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img'
    ],
    ALLOWED_ATTR: options?.allowedAttributes || [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'width', 'height', 'style', 'class'
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  };

  // Additional security: Force all links to open in new tab with noopener
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }

    // Remove javascript: and data: URLs
    if (node.hasAttribute('href')) {
      const href = node.getAttribute('href') || '';
      if (href.startsWith('javascript:') || href.startsWith('data:')) {
        node.removeAttribute('href');
      }
    }

    if (node.hasAttribute('src')) {
      const src = node.getAttribute('src') || '';
      if (src.startsWith('javascript:') || src.startsWith('data:')) {
        node.removeAttribute('src');
      }
    }
  });

  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize HTML with stricter rules (for untrusted content)
 * Removes all tags except basic formatting
 */
export function sanitizeHtmlStrict(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize HTML for email previews
 * More permissive to preserve email formatting
 */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'hr', 'font'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'width', 'height', 'style', 'class', 'id',
      'align', 'valign', 'bgcolor', 'color', 'size'
    ],
    ALLOW_DATA_ATTR: false,
  });
}
