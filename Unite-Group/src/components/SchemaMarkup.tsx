"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export interface SchemaMarkupProps {
  title?: string;
  description?: string;
  type?: "WebPage" | "Organization" | "Service" | "LocalBusiness" | "FAQPage" | "Article" | "BreadcrumbList" | "Person";
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  services?: Array<{
    name: string;
    description: string;
    price?: string;
    url: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    email: string;
    contactType: string;
  };
}

/**
 * SchemaMarkup component for structured data implementation
 * Provides search engines and LLMs with structured data about the page content
 */
export default function SchemaMarkup({
  title = "UNITE Group - Business Consulting Services",
  description = "Professional business consulting services, IT solutions, and strategic planning with our proven $550 consultation model.",
  type = "WebPage",
  image = "https://unite-group.vercel.app/images/og-image.jpg",
  datePublished,
  dateModified,
  author,
  services,
  faqs,
  address = {
    streetAddress: "123 Business Avenue",
    addressLocality: "Sydney",
    addressRegion: "NSW",
    postalCode: "2000",
    addressCountry: "Australia",
  },
  contactPoint = {
    telephone: "+61-2-1234-5678",
    email: "contact@unitegroup.com.au",
    contactType: "Customer Service",
  },
}: SchemaMarkupProps) {
  const pathname = usePathname();
  const url = `https://unite-group.vercel.app${pathname}`;
  const currentDate = new Date().toISOString();

  // Base schema for the organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://unite-group.vercel.app/#organization",
    name: "UNITE Group",
    url: "https://unite-group.vercel.app",
    logo: "https://unite-group.vercel.app/images/logo.png",
    description: "Professional business consulting services and strategic solutions.",
    address,
    contactPoint,
    sameAs: [
      "https://www.linkedin.com/company/unite-group",
      "https://twitter.com/unitegroup",
      "https://www.facebook.com/unitegroup",
    ],
  };

  // Schema for WebPage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: {
      "@id": "https://unite-group.vercel.app/#website",
    },
    inLanguage: "en-AU",
    datePublished: datePublished || currentDate,
    dateModified: dateModified || currentDate,
  };

  // Schema for LocalBusiness
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://unite-group.vercel.app/#localbusiness",
    name: "UNITE Group",
    image: "https://unite-group.vercel.app/images/office.jpg",
    priceRange: "$$$",
    address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-33.8688",
      longitude: "151.2093",
    },
    url: "https://unite-group.vercel.app",
    telephone: contactPoint.telephone,
    email: contactPoint.email,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
  };

  // Schema for Services
  const servicesSchema = services
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": "https://unite-group.vercel.app/features#servicelist",
        name: "UNITE Group Services",
        itemListElement: services.map((service, index) => ({
          "@type": "Service",
          "@id": `https://unite-group.vercel.app${service.url}#service`,
          position: index + 1,
          name: service.name,
          description: service.description,
          provider: {
            "@id": "https://unite-group.vercel.app/#organization",
          },
          url: `https://unite-group.vercel.app${service.url}`,
          ...(service.price && { offers: {
            "@type": "Offer",
            price: service.price.replace(/[^0-9.]/g, ''),
            priceCurrency: "AUD",
          }}),
        })),
      }
    : null;

  // Schema for FAQs
  const faqSchema = faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faqpage`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  // Schema for Article
  const articleSchema =
    type === "Article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${url}#article`,
          headline: title,
          description,
          image,
          author: {
            "@type": "Person",
            name: author || "UNITE Group",
          },
          publisher: {
            "@id": "https://unite-group.vercel.app/#organization",
          },
          datePublished: datePublished || currentDate,
          dateModified: dateModified || currentDate,
          mainEntityOfPage: {
            "@id": `${url}#webpage`,
          },
        }
      : null;

  // Determine which schemas to include based on page type
  let schemas = [];

  // Always include Organization
  schemas.push(organizationSchema);

  // Include WebPage for all pages
  schemas.push(webPageSchema);

  // Include specific schema based on page type
  if (type === "LocalBusiness") {
    schemas.push(localBusinessSchema);
  }

  if (services && services.length > 0) {
    schemas.push(servicesSchema);
  }

  if (faqs && faqs.length > 0) {
    schemas.push(faqSchema);
  }

  if (type === "Article") {
    schemas.push(articleSchema);
  }

  return (
    <Script
      id="schema-markup"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      strategy="afterInteractive"
    />
  );
}
