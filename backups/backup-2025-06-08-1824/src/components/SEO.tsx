"use client";

import { usePathname } from "next/navigation";
import SchemaMarkup, { SchemaMarkupProps } from "./SchemaMarkup";

// Create a type for our SEO props that explicitly includes all SchemaMarkupProps
type SEOProps = {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile" | "book";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  noIndex?: boolean;
  canonicalUrl?: string;
  type?: SchemaMarkupProps["type"];
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  services?: SchemaMarkupProps["services"];
  faqs?: SchemaMarkupProps["faqs"];
  address?: SchemaMarkupProps["address"];
  contactPoint?: SchemaMarkupProps["contactPoint"];
};

/**
 * SEO component for optimizing meta tags and structured data
 * Provides comprehensive SEO optimization for search engines and social sharing
 * 
 * Note: This component only adds structured data via SchemaMarkup
 * Meta tags should be defined in the app/layout.tsx or individual page files
 * using the Metadata API in Next.js 14+
 */
export default function SEO({
  // Meta tag props - these will be used for the schema markup
  title = "UNITE Group - Business Consulting Services",
  description = "Professional business consulting services, IT solutions, and strategic planning with our proven $550 consultation model.",
  
  // Schema markup props passed to SchemaMarkup component
  type = "WebPage",
  image = "https://unite-group.vercel.app/images/og-image.jpg",
  datePublished,
  dateModified,
  author,
  services,
  faqs,
  address,
  contactPoint,
}: SEOProps) {
  return (
    <SchemaMarkup
      title={title}
      description={description}
      type={type}
      image={image}
      datePublished={datePublished}
      dateModified={dateModified}
      author={author}
      services={services}
      faqs={faqs}
      address={address}
      contactPoint={contactPoint}
    />
  );
}
