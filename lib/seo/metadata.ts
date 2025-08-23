import { Metadata } from 'next';
import { seoConfig } from './config';

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string[];
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export function generateSEOMetadata({
  title,
  description,
  image,
  url,
  keywords = [],
  noindex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  author
}: GenerateMetadataProps = {}): Metadata {
  const metaTitle = title 
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle;
    
  const metaDescription = description || seoConfig.defaultDescription;
  const metaImage = image 
    ? `${seoConfig.siteUrl}${image}`
    : `${seoConfig.siteUrl}${seoConfig.defaultImage}`;
  const metaUrl = url 
    ? `${seoConfig.siteUrl}${url}`
    : seoConfig.siteUrl;
  
  const allKeywords = [...seoConfig.coreKeywords, ...keywords];

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: allKeywords.join(', '),
    
    metadataBase: new URL(seoConfig.siteUrl),
    
    alternates: {
      canonical: metaUrl,
    },
    
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: metaUrl,
      siteName: seoConfig.siteName,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle
        }
      ],
      locale: 'en_AU',
      type: type as any,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] })
    },
    
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      images: [metaImage]
    },
    
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
    },
    
    other: {
      'geo.region': 'AU-QLD',
      'geo.placename': 'Brisbane',
      'geo.position': '-27.470125;153.021072',
      'ICBM': '-27.470125, 153.021072',
      'fb:app_id': process.env.NEXT_PUBLIC_FB_APP_ID || '',
    }
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
  hasOfferCatalog?: {
    name: string;
    itemListElement: Array<{
      name: string;
      description: string;
    }>;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.provider || seoConfig.organization.name,
      url: seoConfig.siteUrl
    },
    areaServed: {
      '@type': 'Place',
      name: service.areaServed || 'Brisbane, Queensland, Australia'
    },
    ...(service.hasOfferCatalog && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: service.hasOfferCatalog.name,
        itemListElement: service.hasOfferCatalog.itemListElement.map((item, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: item.name,
          description: item.description
        }))
      }
    })
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${seoConfig.siteUrl}${item.url}`
    }))
  };
}