import { Metadata } from 'next';
import { generateOrganizationSchema } from '@/lib/seo/schema';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  schema?: any;
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image = '/images/og-image.png',
  url = 'https://unitegroup.com.au',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Unite Group',
}: SEOProps): Metadata {
  const siteName = 'Unite Group';
  const fullTitle = `${title} | ${siteName}`;
  
  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: author }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://unitegroup.com.au'),
    alternates: {
      canonical: url,
      languages: {
        'en-AU': '/en',
        'es': '/es',
        'fr': '/fr',
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_AU',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && type === 'article' && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@unitegroup_au',
      site: '@unitegroup_au',
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
    verification: {
      google: 'google-site-verification-code',
      yandex: 'yandex-verification-code',
      yahoo: 'yahoo-verification-code',
    },
  };
}

export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
