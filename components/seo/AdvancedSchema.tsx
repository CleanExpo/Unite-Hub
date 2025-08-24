import React from 'react';
import Script from 'next/script';

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[];
}

export const OrganizationSchema: React.FC<OrganizationSchemaProps> = ({
  name,
  url,
  logo,
  description,
  email,
  telephone,
  address,
  sameAs
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(email && { email }),
    ...(telephone && { telephone }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address
      }
    }),
    ...(sameAs && { sameAs })
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface LocalBusinessSchemaProps extends OrganizationSchemaProps {
  priceRange?: string;
  openingHours?: string[];
  geo?: {
    latitude: number;
    longitude: number;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export const LocalBusinessSchema: React.FC<LocalBusinessSchemaProps> = ({
  name,
  url,
  logo,
  description,
  email,
  telephone,
  address,
  sameAs,
  priceRange,
  openingHours,
  geo,
  aggregateRating
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    ...(logo && { image: logo }),
    ...(description && { description }),
    ...(email && { email }),
    ...(telephone && { telephone }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address
      }
    }),
    ...(sameAs && { sameAs }),
    ...(priceRange && { priceRange }),
    ...(openingHours && { openingHours }),
    ...(geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: geo.latitude,
        longitude: geo.longitude
      }
    }),
    ...(aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount
      }
    })
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export const FAQSchema: React.FC<FAQSchemaProps> = ({ items }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface ServiceSchemaProps {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  serviceType?: string;
  areaServed?: string | string[];
  offers?: {
    price?: string;
    priceCurrency?: string;
  };
}

export const ServiceSchema: React.FC<ServiceSchemaProps> = ({
  name,
  description,
  provider,
  serviceType,
  areaServed,
  offers
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider.name,
      url: provider.url
    },
    ...(serviceType && { serviceType }),
    ...(areaServed && { areaServed }),
    ...(offers && {
      offers: {
        "@type": "Offer",
        ...offers
      }
    })
  };

  return (
    <Script
      id="service-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface ArticleSchemaProps {
  headline: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}

export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  image,
  publisher
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url })
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(publisher && {
      publisher: {
        "@type": "Organization",
        name: publisher.name,
        ...(publisher.logo && {
          logo: {
            "@type": "ImageObject",
            url: publisher.logo
          }
        })
      }
    })
  };

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

interface WebPageSchemaProps {
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbItem[];
}

export const WebPageSchema: React.FC<WebPageSchemaProps> = ({
  name,
  description,
  url,
  breadcrumb
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    ...(breadcrumb && {
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }
    })
  };

  return (
    <Script
      id="webpage-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

// Default schemas for Unite Group
export const UniteGroupOrganizationSchema = () => (
  <OrganizationSchema
    name="Unite Group"
    url="https://unite-group.in"
    description="Expert consultation, cutting-edge software development, strategic SEO, and professional training for businesses."
    email="contact@unite-group.in"
    telephone="+1234567890"
    address={{
      addressCountry: "IN"
    }}
    sameAs={[
      "https://www.linkedin.com/company/unite-group",
      "https://twitter.com/unitegroup",
      "https://www.facebook.com/unitegroup"
    ]}
  />
);

export const UniteGroupLocalBusinessSchema = () => (
  <LocalBusinessSchema
    name="Unite Group"
    url="https://unite-group.in"
    description="Transform your business with expert consultation, software development, and digital marketing services."
    email="contact@unite-group.in"
    telephone="+1234567890"
    address={{
      addressCountry: "IN"
    }}
    priceRange="$$"
    openingHours={[
      "Mo-Fr 09:00-18:00",
      "Sa 10:00-16:00"
    ]}
    aggregateRating={{
      ratingValue: 4.8,
      reviewCount: 127
    }}
  />
);
