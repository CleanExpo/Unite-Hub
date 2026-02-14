/**
 * Structured Data Component
 *
 * Provides Schema.org JSON-LD markup for Unite-Hub Business Hub
 * Improves SEO for the business showcase landing page
 *
 * Note: JSON-LD structured data is static/trusted content per Schema.org spec,
 * not user-generated, so dangerouslySetInnerHTML is safe here.
 */

export function UniteHubStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        /* 1. ORGANIZATION: Defines the business entity */
        "@type": "Organization",
        "@id": "https://unite-hub.com/#organization",
        "name": "Unite-Hub",
        "url": "https://unite-hub.com/",
        "logo": "https://unite-hub.com/logos/unite-hub-logo.png",
        "description": "AI-powered Business Hub for managing multiple businesses. CRM, email intelligence, campaign automation, and AI agents — all in one place.",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "support@unite-hub.com",
          "contactType": "Customer Support"
        }
      },
      {
        /* 2. WEBSITE: Defines the web property */
        "@type": "WebSite",
        "@id": "https://unite-hub.com/#website",
        "url": "https://unite-hub.com/",
        "name": "Unite-Hub - AI-Powered Business Hub",
        "inLanguage": "en",
        "publisher": {
          "@id": "https://unite-hub.com/#organization"
        }
      },
      {
        /* 3. SERVICE: Defines the core offerings */
        "@type": "Service",
        "@id": "https://unite-hub.com/#service",
        "serviceType": "AI-Powered Business Management",
        "name": "Unite-Hub Business Hub",
        "description": "Complete AI-first business management platform with CRM, email intelligence, campaign automation, deal pipeline, and AI agent workforce.",
        "provider": {
          "@id": "https://unite-hub.com/#organization"
        },
        "areaServed": {
          "@type": "Place",
          "name": "Australia"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Unite-Hub Platform Capabilities",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "CRM & Contact Management",
                "description": "Track contacts, conversations, and opportunities with AI-powered lead scoring"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Email Intelligence",
                "description": "Gmail integration with AI-powered email processing and automated follow-ups"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Campaign Automation",
                "description": "Drip campaigns, email sequences, and A/B testing with AI optimization"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "AI Agent System",
                "description": "Autonomous agents for email processing, content generation, and business intelligence"
              }
            }
          ]
        }
      }
    ]
  };

  // JSON-LD is static trusted schema data, safe for inline script
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
