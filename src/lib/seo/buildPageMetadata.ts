/**
 * Page Metadata Builder
 *
 * Helper functions to generate Next.js metadata objects from SEO configuration.
 * Provides consistent metadata structure across all pages with sensible defaults.
 *
 * @see seoConfig.ts for the configuration source
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */

import { Metadata } from 'next';
import { seoConfig, PageKey } from './seoConfig';

/**
 * Build complete metadata object for a specific page
 *
 * @param pageKey - Key from seoConfig.pages (e.g., 'home', 'pricing', 'dashboard')
 * @param overrides - Optional overrides for specific metadata fields
 * @returns Complete Next.js Metadata object
 *
 * @example
 * ```typescript
 * // In app/page.tsx
 * export const metadata = buildMetadata('home');
 *
 * // With overrides
 * export const metadata = buildMetadata('blog', {
 *   title: 'Custom Blog Title',
 *   keywords: ['custom', 'keywords'],
 * });
 * ```
 */
export function buildMetadata(
  pageKey: PageKey,
  overrides?: Partial<Metadata>
): Metadata {
  const pageConfig = seoConfig.pages[pageKey];
  const siteConfig = seoConfig.site;

  if (!pageConfig) {
    console.warn(`[SEO] No configuration found for page key: ${pageKey}. Using defaults.`);
  }

  const title = pageConfig?.title || siteConfig.name;
  const description = pageConfig?.description || siteConfig.description;
  const keywords = pageConfig?.keywords || seoConfig.keywords.primary;
  const ogImage = pageConfig?.og?.image || siteConfig.image;
  const ogType = pageConfig?.og?.type || 'website';

  return {
    title,
    description,
    keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),

    // Open Graph
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - ${title}`,
        },
      ],
      locale: siteConfig.locale,
      type: ogType as any,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitter,
      site: siteConfig.twitter,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Apply any overrides
    ...overrides,
  };
}

/**
 * Build metadata for blog posts or dynamic content
 *
 * @param title - Post title
 * @param description - Post description
 * @param options - Additional metadata options
 * @returns Complete Next.js Metadata object
 *
 * @example
 * ```typescript
 * // In app/blog/[slug]/page.tsx
 * export async function generateMetadata({ params }) {
 *   const post = await getPost(params.slug);
 *   return buildDynamicMetadata(post.title, post.excerpt, {
 *     publishedTime: post.publishedAt,
 *     authors: [post.author],
 *     image: post.coverImage,
 *   });
 * }
 * ```
 */
export function buildDynamicMetadata(
  title: string,
  description: string,
  options?: {
    keywords?: string[];
    image?: string;
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  }
): Metadata {
  const siteConfig = seoConfig.site;
  const image = options?.image || siteConfig.image;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: options?.keywords || seoConfig.keywords.primary,
    authors: options?.authors?.map((name) => ({ name })) || [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),

    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: 'article',
      publishedTime: options?.publishedTime,
      modifiedTime: options?.modifiedTime,
      section: options?.section,
      tags: options?.tags,
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: siteConfig.twitter,
      site: siteConfig.twitter,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Build canonical URL for a page
 *
 * @param path - Page path (e.g., '/pricing', '/blog/post-slug')
 * @returns Complete canonical URL
 *
 * @example
 * ```typescript
 * // In page metadata
 * export const metadata = {
 *   ...buildMetadata('pricing'),
 *   alternates: {
 *     canonical: buildCanonicalUrl('/pricing'),
 *   },
 * };
 * ```
 */
export function buildCanonicalUrl(path: string): string {
  const siteUrl = seoConfig.site.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

/**
 * Build alternate language links for international SEO
 *
 * @param path - Page path
 * @param languages - Supported language codes
 * @returns Alternate links object
 *
 * @example
 * ```typescript
 * export const metadata = {
 *   ...buildMetadata('home'),
 *   alternates: {
 *     ...buildAlternateLinks('/', ['en', 'es', 'fr']),
 *   },
 * };
 * ```
 */
export function buildAlternateLinks(
  path: string,
  languages: string[]
): Record<string, string> {
  const siteUrl = seoConfig.site.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const alternates: Record<string, string> = {};

  languages.forEach((lang) => {
    alternates[lang] = `${siteUrl}/${lang}${cleanPath}`;
  });

  return alternates;
}

/**
 * Build JSON-LD structured data for a page
 *
 * @param type - Schema.org type (e.g., 'WebPage', 'Article', 'Product')
 * @param data - Schema-specific data
 * @returns JSON-LD script tag content
 *
 * @example
 * ```typescript
 * const orgSchema = buildStructuredData('Organization', {
 *   name: 'Unite-Hub',
 *   description: 'AI-Powered Business Hub',
 * });
 * ```
 */
export function buildStructuredData(type: string, data: Record<string, any>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(schema);
}

/**
 * Validate metadata object for common SEO issues
 *
 * @param metadata - Metadata object to validate
 * @returns Array of validation warnings
 *
 * @example
 * ```typescript
 * const metadata = buildMetadata('home');
 * const warnings = validateMetadata(metadata);
 * if (warnings.length > 0) {
 *   console.warn('SEO issues detected:', warnings);
 * }
 * ```
 */
export function validateMetadata(metadata: Metadata): string[] {
  const warnings: string[] = [];

  // Title validation
  if (metadata.title) {
    const titleLength = typeof metadata.title === 'string' ? metadata.title.length : 0;
    if (titleLength < 30) {
      warnings.push(`Title too short (${titleLength} chars). Recommended: 50-60 characters.`);
    }
    if (titleLength > 60) {
      warnings.push(`Title too long (${titleLength} chars). May be truncated in search results.`);
    }
  } else {
    warnings.push('Missing title tag.');
  }

  // Description validation
  if (metadata.description) {
    const descLength = metadata.description.length;
    if (descLength < 120) {
      warnings.push(`Description too short (${descLength} chars). Recommended: 150-160 characters.`);
    }
    if (descLength > 160) {
      warnings.push(`Description too long (${descLength} chars). May be truncated in search results.`);
    }
  } else {
    warnings.push('Missing meta description.');
  }

  // Keywords validation
  if (!metadata.keywords || (Array.isArray(metadata.keywords) && metadata.keywords.length === 0)) {
    warnings.push('No keywords specified.');
  }

  // Open Graph validation
  if (!metadata.openGraph) {
    warnings.push('Missing Open Graph metadata.');
  } else {
    if (!metadata.openGraph.images || metadata.openGraph.images.length === 0) {
      warnings.push('Missing Open Graph image.');
    }
  }

  // Twitter Card validation
  if (!metadata.twitter) {
    warnings.push('Missing Twitter Card metadata.');
  }

  return warnings;
}
