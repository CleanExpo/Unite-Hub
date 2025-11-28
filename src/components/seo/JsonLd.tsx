/**
 * JSON-LD Structured Data Components
 *
 * Provides Schema.org structured data for enhanced search engine visibility.
 * These components should be added to page layouts to enable rich results in Google.
 *
 * @see https://schema.org
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

'use client';

import { ReactNode } from 'react';
import { seoConfig } from '@/lib/seo/seoConfig';

/**
 * Organization Schema
 *
 * Defines the business entity for Google's Knowledge Graph.
 * Include on homepage and layout for E-E-A-T signals.
 *
 * @example
 * ```tsx
 * <OrganizationSchema />
 * ```
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${seoConfig.site.url}/#organization`,
    name: seoConfig.business.legalName,
    url: seoConfig.site.url,
    logo: `${seoConfig.site.url}${seoConfig.site.logo}`,
    description: seoConfig.business.description,
    foundingDate: seoConfig.business.foundingDate,
    sameAs: seoConfig.business.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email: seoConfig.site.contact.email,
      contactType: 'Customer Support',
      availableLanguage: ['English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Worldwide',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * SoftwareApplication Schema
 *
 * Defines the SaaS product for app-related rich results.
 * Include on homepage and pricing pages.
 *
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * <SoftwareApplicationSchema />
 * ```
 */
export function SoftwareApplicationSchema(options?: {
  ratingValue?: string;
  ratingCount?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${seoConfig.site.url}/#softwareapplication`,
    name: seoConfig.site.name,
    description: seoConfig.site.description,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Marketing Automation Software',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: '495',
      highPrice: '1295',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '495.00',
          priceCurrency: 'AUD',
          priceValidUntil: '2025-12-31',
          availability: 'https://schema.org/InStock',
          url: `${seoConfig.site.url}/#pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '895.00',
          priceCurrency: 'AUD',
          priceValidUntil: '2025-12-31',
          availability: 'https://schema.org/InStock',
          url: `${seoConfig.site.url}/#pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Elite Plan',
          price: '1295.00',
          priceCurrency: 'AUD',
          priceValidUntil: '2025-12-31',
          availability: 'https://schema.org/InStock',
          url: `${seoConfig.site.url}/#pricing`,
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: options?.ratingValue || '4.8',
      ratingCount: options?.ratingCount || '128',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQPage Schema
 *
 * Enables FAQ rich results in Google Search.
 * Include on pages with Q&A content.
 *
 * @param faqItems - Array of question/answer pairs
 *
 * @example
 * ```tsx
 * <FAQSchema
 *   faqItems={[
 *     { question: 'What is Synthex?', answer: 'Synthex is...' },
 *     { question: 'How much does it cost?', answer: 'Plans start at...' },
 *   ]}
 * />
 * ```
 */
export function FAQSchema(props: { faqItems: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: props.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Breadcrumb Schema
 *
 * Enables breadcrumb navigation in search results.
 * Include on all pages except homepage.
 *
 * @param items - Array of breadcrumb items
 *
 * @example
 * ```tsx
 * <BreadcrumbSchema
 *   items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Pricing', url: '/pricing' },
 *   ]}
 * />
 * ```
 */
export function BreadcrumbSchema(props: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${seoConfig.site.url}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite Schema with SearchAction
 *
 * Enables sitelinks search box in Google.
 * Include on homepage layout.
 *
 * @example
 * ```tsx
 * <WebSiteSchema />
 * ```
 */
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${seoConfig.site.url}/#website`,
    url: seoConfig.site.url,
    name: seoConfig.site.name,
    description: seoConfig.site.description,
    publisher: {
      '@id': `${seoConfig.site.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${seoConfig.site.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Service Schema
 *
 * Defines service offerings for local SEO and service-based businesses.
 * Include on service/industry-specific pages.
 *
 * @param service - Service configuration
 *
 * @example
 * ```tsx
 * <ServiceSchema
 *   service={{
 *     name: 'AI Marketing for Trades',
 *     description: 'AI-powered marketing for contractors',
 *     serviceType: 'Marketing Services',
 *     areaServed: 'Worldwide',
 *   }}
 * />
 * ```
 */
export function ServiceSchema(props: {
  service: {
    name: string;
    description: string;
    serviceType: string;
    areaServed?: string;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${seoConfig.site.url}/#service`,
    name: props.service.name,
    description: props.service.description,
    serviceType: props.service.serviceType,
    provider: {
      '@id': `${seoConfig.site.url}/#organization`,
    },
    areaServed: {
      '@type': 'Place',
      name: props.service.areaServed || 'Worldwide',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Article Schema
 *
 * Defines blog posts and articles for article rich results.
 * Include on blog post pages.
 *
 * @param article - Article configuration
 *
 * @example
 * ```tsx
 * <ArticleSchema
 *   article={{
 *     headline: 'How AI Marketing Works',
 *     description: 'Learn the fundamentals of AI marketing',
 *     image: '/blog/ai-marketing.png',
 *     datePublished: '2025-01-15',
 *     dateModified: '2025-01-20',
 *     author: 'Synthex Team',
 *   }}
 * />
 * ```
 */
export function ArticleSchema(props: {
  article: {
    headline: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.article.headline,
    description: props.article.description,
    image: `${seoConfig.site.url}${props.article.image}`,
    datePublished: props.article.datePublished,
    dateModified: props.article.dateModified || props.article.datePublished,
    author: {
      '@type': 'Person',
      name: props.article.author,
    },
    publisher: {
      '@id': `${seoConfig.site.url}/#organization`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * HowTo Schema
 *
 * Defines step-by-step guides for how-to rich results.
 * Include on tutorial and guide pages.
 *
 * @param howto - HowTo configuration
 *
 * @example
 * ```tsx
 * <HowToSchema
 *   howto={{
 *     name: 'How to Set Up AI Marketing',
 *     description: 'Learn to automate your marketing in 4 steps',
 *     image: '/how-to-guide.png',
 *     totalTime: 'PT5M',
 *     steps: [
 *       { name: 'Connect Your Business', text: 'Link your website...' },
 *       { name: 'AI Diagnoses', text: 'Synthex analyzes...' },
 *     ],
 *   }}
 * />
 * ```
 */
export function HowToSchema(props: {
  howto: {
    name: string;
    description: string;
    image: string;
    totalTime: string;
    steps: Array<{ name: string; text: string; image?: string }>;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: props.howto.name,
    description: props.howto.description,
    image: `${seoConfig.site.url}${props.howto.image}`,
    totalTime: props.howto.totalTime,
    step: props.howto.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.name,
      text: step.text,
      image: step.image ? `${seoConfig.site.url}${step.image}` : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product Schema
 *
 * Defines products for product rich results (used for pricing tiers).
 * Include on pricing and product pages.
 *
 * @param product - Product configuration
 *
 * @example
 * ```tsx
 * <ProductSchema
 *   product={{
 *     name: 'Synthex Professional Plan',
 *     description: 'Full AI marketing automation',
 *     image: '/product-professional.png',
 *     price: '297',
 *     priceCurrency: 'USD',
 *     availability: 'https://schema.org/InStock',
 *   }}
 * />
 * ```
 */
export function ProductSchema(props: {
  product: {
    name: string;
    description: string;
    image: string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.product.name,
    description: props.product.description,
    image: `${seoConfig.site.url}${props.product.image}`,
    brand: {
      '@type': 'Brand',
      name: seoConfig.site.name,
    },
    offers: {
      '@type': 'Offer',
      price: props.product.price,
      priceCurrency: props.product.priceCurrency,
      availability: props.product.availability,
      url: `${seoConfig.site.url}/#pricing`,
      priceValidUntil: '2025-12-31',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * LocalBusiness Schema
 *
 * Defines local business information for local SEO.
 * Include if serving specific geographic areas.
 *
 * @param business - Local business configuration
 *
 * @example
 * ```tsx
 * <LocalBusinessSchema
 *   business={{
 *     name: 'Synthex',
 *     address: '123 Main St, City, State 12345',
 *     telephone: '+1-555-123-4567',
 *     priceRange: 'A$495 - A$1,295',
 *     openingHours: 'Mo-Fr 09:00-17:00',
 *   }}
 * />
 * ```
 */
export function LocalBusinessSchema(props: {
  business: {
    name: string;
    address: string;
    telephone?: string;
    priceRange?: string;
    openingHours?: string;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: props.business.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: props.business.address,
    },
    telephone: props.business.telephone,
    priceRange: props.business.priceRange,
    openingHoursSpecification: props.business.openingHours
      ? {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '17:00',
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
