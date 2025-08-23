import React from 'react';

export interface LocalBusinessSchema {
  type: 'LocalBusiness';
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  image?: string;
  sameAs?: string[];
}

export interface ServiceSchema {
  type: 'Service';
  name: string;
  description: string;
  provider: string;
  serviceType: string;
  areaServed?: string | string[];
  hasOfferCatalog?: {
    name: string;
    itemListElement: Array<{
      name: string;
      description: string;
    }>;
  };
}

export interface ArticleSchema {
  type: 'Article' | 'BlogPosting' | 'HowTo';
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher?: {
    name: string;
    logo?: string;
  };
  image?: string;
  mainEntityOfPage?: string;
}

export interface FAQSchema {
  type: 'FAQPage';
  mainEntity: Array<{
    question: string;
    answer: string;
  }>;
}

export interface BreadcrumbSchema {
  type: 'BreadcrumbList';
  itemListElement: Array<{
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface ProductSchema {
  type: 'Product';
  name: string;
  description: string;
  image?: string;
  brand?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    availability?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface WebPageSchema {
  type: 'WebPage';
  name: string;
  description: string;
  url: string;
  dateModified?: string;
  publisher?: {
    name: string;
    url: string;
  };
}

type SchemaType = 
  | LocalBusinessSchema 
  | ServiceSchema 
  | ArticleSchema 
  | FAQSchema 
  | BreadcrumbSchema 
  | ProductSchema
  | WebPageSchema;

interface SchemaMarkupProps {
  schema: SchemaType | SchemaType[];
}

export default function SchemaMarkup({ schema }: SchemaMarkupProps) {
  const generateSchema = (schemaData: SchemaType | SchemaType[]) => {
    if (Array.isArray(schemaData)) {
      return schemaData.map(item => generateSingleSchema(item));
    }
    return generateSingleSchema(schemaData);
  };

  const generateSingleSchema = (schemaData: SchemaType) => {
    const baseSchema = {
      "@context": "https://schema.org"
    };

    switch (schemaData.type) {
      case 'LocalBusiness':
        return {
          ...baseSchema,
          "@type": "LocalBusiness",
          "name": schemaData.name,
          "description": schemaData.description,
          "url": schemaData.url,
          ...(schemaData.telephone && { "telephone": schemaData.telephone }),
          ...(schemaData.email && { "email": schemaData.email }),
          ...(schemaData.address && {
            "address": {
              "@type": "PostalAddress",
              "streetAddress": schemaData.address.streetAddress,
              "addressLocality": schemaData.address.addressLocality,
              "addressRegion": schemaData.address.addressRegion,
              "postalCode": schemaData.address.postalCode,
              "addressCountry": schemaData.address.addressCountry
            }
          }),
          ...(schemaData.geo && {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": schemaData.geo.latitude,
              "longitude": schemaData.geo.longitude
            }
          }),
          ...(schemaData.openingHours && { "openingHours": schemaData.openingHours }),
          ...(schemaData.priceRange && { "priceRange": schemaData.priceRange }),
          ...(schemaData.image && { "image": schemaData.image }),
          ...(schemaData.sameAs && { "sameAs": schemaData.sameAs })
        };

      case 'Service':
        return {
          ...baseSchema,
          "@type": "Service",
          "name": schemaData.name,
          "description": schemaData.description,
          "provider": {
            "@type": "Organization",
            "name": schemaData.provider
          },
          "serviceType": schemaData.serviceType,
          ...(schemaData.areaServed && { 
            "areaServed": Array.isArray(schemaData.areaServed) 
              ? schemaData.areaServed 
              : { "@type": "City", "name": schemaData.areaServed }
          }),
          ...(schemaData.hasOfferCatalog && {
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": schemaData.hasOfferCatalog.name,
              "itemListElement": schemaData.hasOfferCatalog.itemListElement.map(item => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": item.name,
                  "description": item.description
                }
              }))
            }
          })
        };

      case 'Article':
      case 'BlogPosting':
      case 'HowTo':
        return {
          ...baseSchema,
          "@type": schemaData.type,
          "headline": schemaData.headline,
          "description": schemaData.description,
          "datePublished": schemaData.datePublished,
          ...(schemaData.dateModified && { "dateModified": schemaData.dateModified }),
          "author": {
            "@type": "Person",
            "name": schemaData.author.name,
            ...(schemaData.author.url && { "url": schemaData.author.url })
          },
          ...(schemaData.publisher && {
            "publisher": {
              "@type": "Organization",
              "name": schemaData.publisher.name,
              ...(schemaData.publisher.logo && {
                "logo": {
                  "@type": "ImageObject",
                  "url": schemaData.publisher.logo
                }
              })
            }
          }),
          ...(schemaData.image && { "image": schemaData.image }),
          ...(schemaData.mainEntityOfPage && { "mainEntityOfPage": schemaData.mainEntityOfPage })
        };

      case 'FAQPage':
        return {
          ...baseSchema,
          "@type": "FAQPage",
          "mainEntity": schemaData.mainEntity.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer
            }
          }))
        };

      case 'BreadcrumbList':
        return {
          ...baseSchema,
          "@type": "BreadcrumbList",
          "itemListElement": schemaData.itemListElement.map(item => ({
            "@type": "ListItem",
            "position": item.position,
            "name": item.name,
            ...(item.item && { "item": item.item })
          }))
        };

      case 'Product':
        return {
          ...baseSchema,
          "@type": "Product",
          "name": schemaData.name,
          "description": schemaData.description,
          ...(schemaData.image && { "image": schemaData.image }),
          ...(schemaData.brand && {
            "brand": {
              "@type": "Brand",
              "name": schemaData.brand
            }
          }),
          ...(schemaData.offers && {
            "offers": {
              "@type": "Offer",
              "price": schemaData.offers.price,
              "priceCurrency": schemaData.offers.priceCurrency,
              ...(schemaData.offers.availability && { "availability": schemaData.offers.availability }),
              ...(schemaData.offers.priceValidUntil && { "priceValidUntil": schemaData.offers.priceValidUntil })
            }
          }),
          ...(schemaData.aggregateRating && {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": schemaData.aggregateRating.ratingValue,
              "reviewCount": schemaData.aggregateRating.reviewCount
            }
          })
        };

      case 'WebPage':
        return {
          ...baseSchema,
          "@type": "WebPage",
          "name": schemaData.name,
          "description": schemaData.description,
          "url": schemaData.url,
          ...(schemaData.dateModified && { "dateModified": schemaData.dateModified }),
          ...(schemaData.publisher && {
            "publisher": {
              "@type": "Organization",
              "name": schemaData.publisher.name,
              "url": schemaData.publisher.url
            }
          })
        };

      default:
        return baseSchema;
    }
  };

  const schemaJson = generateSchema(schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaJson)
      }}
    />
  );
}

// Helper function to create organization schema
export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Unite Group Agency",
  "url": "https://unite-group.com.au",
  "logo": "https://unite-group.com.au/logo.png",
  "description": "Digital marketing agency specializing in helping Brisbane trades grow online",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Eagle Street",
    "addressLocality": "Brisbane",
    "addressRegion": "QLD",
    "postalCode": "4000",
    "addressCountry": "AU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -27.4705,
    "longitude": 153.0260
  },
  "telephone": "+61730000000",
  "email": "info@unite-group.com.au",
  "sameAs": [
    "https://www.facebook.com/unitegroupagency",
    "https://www.linkedin.com/company/unite-group-agency",
    "https://twitter.com/unitegroupau"
  ],
  "founder": {
    "@type": "Person",
    "name": "Michael Chen",
    "jobTitle": "CEO & Founder"
  },
  "foundingDate": "2024-01-01",
  "areaServed": {
    "@type": "State",
    "name": "Queensland",
    "containedInPlace": {
      "@type": "Country",
      "name": "Australia"
    }
  }
});