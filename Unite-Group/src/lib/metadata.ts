import type { Metadata, ResolvingMetadata } from 'next';

/**
 * Default metadata configuration for the UNITE Group website
 */
export const defaultMetadata: Metadata = {
  title: {
    template: '%s | UNITE Group',
    default: 'UNITE Group - Business Consulting Services',
  },
  description: 'Professional business consulting services, IT solutions, and strategic planning with our proven $550 consultation model.',
  keywords: 'business consulting, IT solutions, strategic planning, digital transformation, business strategy, technology consulting, $550 consultation',
  authors: [{ name: 'UNITE Group' }],
  creator: 'UNITE Group',
  publisher: 'UNITE Group',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  metadataBase: new URL('https://unite-group.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://unite-group.vercel.app',
    siteName: 'UNITE Group',
    title: 'UNITE Group - Business Consulting Services',
    description: 'Professional business consulting services, IT solutions, and strategic planning with our proven $550 consultation model.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'UNITE Group',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNITE Group - Business Consulting Services',
    description: 'Professional business consulting services, IT solutions, and strategic planning with our proven $550 consultation model.',
    creator: '@unitegroup',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
    ],
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    // Bing and other verifications can be added via the 'other' property
    other: {
      'msvalidate.01': 'bing-verification-code',
    },
  },
  category: 'business',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
};

/**
 * Generate metadata for service pages
 */
export function generateServiceMetadata(
  serviceName: string, 
  serviceDescription: string,
  { params }: { params: { slug: string } }
): Metadata {
  const title = `${serviceName} | UNITE Group`;
  const slug = params.slug;
  
  return {
    title,
    description: serviceDescription,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title,
      description: serviceDescription,
      url: `https://unite-group.vercel.app/services/${slug}`,
      type: 'website',
      images: [
        {
          url: `/images/services/${slug}.jpg`,
          width: 1200,
          height: 630,
          alt: serviceName,
        },
      ],
    },
    twitter: {
      title,
      description: serviceDescription,
      images: [`/images/services/${slug}.jpg`],
    },
  };
}

/**
 * Generate metadata for blog articles
 */
export function generateBlogMetadata(
  article: {
    title: string;
    description: string;
    slug: string;
    publishedDate: string;
    updatedDate?: string;
    author: string;
    category: string;
    tags: string[];
    image: string;
  }
): Metadata {
  const { title, description, slug, publishedDate, updatedDate, author, category, tags, image } = article;
  const fullTitle = `${title} | UNITE Group Blog`;
  
  return {
    title: fullTitle,
    description,
    keywords: tags.join(', '),
    authors: [{ name: author }],
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: 'article',
      url: `https://unite-group.vercel.app/blog/${slug}`,
      publishedTime: publishedDate,
      modifiedTime: updatedDate || publishedDate,
      authors: [author],
      tags,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title: fullTitle,
      description,
      images: [image],
    },
    category,
  };
}

/**
 * Generate metadata for case studies
 */
export function generateCaseStudyMetadata(
  caseStudy: {
    title: string;
    description: string;
    slug: string;
    client: string;
    industry: string;
    services: string[];
    image: string;
  }
): Metadata {
  const { title, description, slug, client, industry, services, image } = caseStudy;
  const fullTitle = `${title} | UNITE Group Case Study`;
  
  return {
    title: fullTitle,
    description,
    keywords: [...services, industry, client, 'case study'].join(', '),
    alternates: {
      canonical: `/case-studies/${slug}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: 'article',
      url: `https://unite-group.vercel.app/case-studies/${slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title: fullTitle,
      description,
      images: [image],
    },
    category: industry,
  };
}
