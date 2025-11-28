/**
 * Structured Data Component
 *
 * Provides Schema.org JSON-LD markup for Unite-Hub CRM platform
 * Improves SEO, enables rich results in Google Search, and establishes E-E-A-T
 */

export function UniteHubStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        /* 1. ORGANIZATION: Defines the business entity (E-E-A-T) */
        "@type": "Organization",
        "@id": "https://unite-hub.com/#organization",
        "name": "Unite-Hub",
        "url": "https://unite-hub.com/",
        "logo": "https://unite-hub.com/logos/unite-hub-logo.png",
        "description": "AI-first customer relationship and marketing automation platform. Manage contacts, automate campaigns, and grow your business with intelligent AI agents.",
        "sameAs": [
          "https://www.linkedin.com/company/unite-hub",
          "https://twitter.com/unitehub",
          "https://github.com/unite-hub"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "support@unite-hub.com",
          "contactType": "Customer Support"
        },
        "founders": [
          {
            "@type": "Person",
            "name": "Unite-Hub Team"
          }
        ]
      },
      {
        /* 2. WEBSITE: Defines the web property */
        "@type": "WebSite",
        "@id": "https://unite-hub.com/#website",
        "url": "https://unite-hub.com/",
        "name": "Unite-Hub - AI-Powered CRM & Marketing Automation",
        "inLanguage": "en",
        "publisher": {
          "@id": "https://unite-hub.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://unite-hub.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        /* 3. SOFTWARE APPLICATION: Defines the SaaS product */
        "@type": "SoftwareApplication",
        "@id": "https://unite-hub.com/#softwareapplication",
        "name": "Unite-Hub",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "CRM Software",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "AUD",
          "lowPrice": "495",
          "highPrice": "1295",
          "offerCount": "3",
          "priceSpecification": [
            {
              "@type": "UnitPriceSpecification",
              "price": "495.00",
              "priceCurrency": "AUD",
              "name": "Starter Plan",
              "billingDuration": "P1M",
              "referenceQuantity": {
                "@type": "QuantitativeValue",
                "value": "1",
                "unitText": "MONTH"
              }
            },
            {
              "@type": "UnitPriceSpecification",
              "price": "895.00",
              "priceCurrency": "AUD",
              "name": "Pro Plan",
              "billingDuration": "P1M",
              "referenceQuantity": {
                "@type": "QuantitativeValue",
                "value": "1",
                "unitText": "MONTH"
              }
            },
            {
              "@type": "UnitPriceSpecification",
              "price": "1295.00",
              "priceCurrency": "AUD",
              "name": "Elite Plan",
              "billingDuration": "P1M",
              "referenceQuantity": {
                "@type": "QuantitativeValue",
                "value": "1",
                "unitText": "MONTH"
              }
            }
          ]
        },
        "featureList": [
          "AI-powered contact intelligence",
          "Automated email processing",
          "Drip campaign automation",
          "Lead scoring (0-100)",
          "Gmail integration",
          "Multi-persona generation",
          "Content personalization",
          "Advanced mind mapping",
          "Multi-platform campaigns",
          "DALL-E image generation"
        ],
        "screenshot": "https://unite-hub.com/images/dashboard-screenshot.png",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        /* 4. SERVICE: Defines the core offering */
        "@type": "Service",
        "@id": "https://unite-hub.com/#service",
        "serviceType": "AI-Powered CRM & Marketing Automation",
        "name": "Unite-Hub CRM Platform",
        "description": "Complete AI-first customer relationship management and marketing automation platform with intelligent agents for email processing, content generation, and lead scoring.",
        "provider": {
          "@id": "https://unite-hub.com/#organization"
        },
        "areaServed": {
          "@type": "Place",
          "name": "Worldwide"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Unite-Hub Platform Features",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "AI Contact Intelligence",
                "description": "Automatic lead scoring, sentiment analysis, and intent extraction using Claude AI"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Email Campaign Automation",
                "description": "Drip campaigns with conditional branching, A/B testing, and performance analytics"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Content Personalization",
                "description": "AI-generated personalized marketing content using Extended Thinking"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Gmail Integration",
                "description": "OAuth 2.0 email sync with open/click tracking"
              }
            }
          ]
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Pricing Page Structured Data
 *
 * Specific schema for the pricing page with detailed Service/Offer markup
 */
export function PricingStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Unite-Hub CRM Platform",
    "description": "AI-powered customer relationship and marketing automation platform",
    "brand": {
      "@type": "Brand",
      "name": "Unite-Hub"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "description": "Perfect for small businesses getting started with AI marketing",
        "price": "495.00",
        "priceCurrency": "AUD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "495.00",
          "priceCurrency": "AUD",
          "billingDuration": "P1M",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "1",
            "unitText": "MONTH"
          }
        },
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "validFrom": new Date().toISOString(),
        "url": "https://synthex.social/pricing",
        "seller": {
          "@type": "Organization",
          "name": "Synthex"
        },
        "category": "AI Marketing Software - Starter Tier",
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "AI Content Generation",
            "value": "Basic"
          },
          {
            "@type": "PropertyValue",
            "name": "Email Processing",
            "value": "Basic"
          },
          {
            "@type": "PropertyValue",
            "name": "Support",
            "value": "Email"
          }
        ]
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "description": "For growing businesses with advanced AI automation needs",
        "price": "895.00",
        "priceCurrency": "AUD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "895.00",
          "priceCurrency": "AUD",
          "billingDuration": "P1M",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "1",
            "unitText": "MONTH"
          }
        },
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "validFrom": new Date().toISOString(),
        "url": "https://synthex.social/pricing",
        "seller": {
          "@type": "Organization",
          "name": "Synthex"
        },
        "category": "AI Marketing Software - Pro Tier",
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "AI Content Generation",
            "value": "Advanced"
          },
          {
            "@type": "PropertyValue",
            "name": "Social Playbooks",
            "value": "Unlimited"
          },
          {
            "@type": "PropertyValue",
            "name": "Support",
            "value": "Priority"
          }
        ]
      },
      {
        "@type": "Offer",
        "name": "Elite Plan",
        "description": "Full AI marketing automation suite with all premium features",
        "price": "1295.00",
        "priceCurrency": "AUD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "1295.00",
          "priceCurrency": "AUD",
          "billingDuration": "P1M",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "1",
            "unitText": "MONTH"
          }
        },
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "validFrom": new Date().toISOString(),
        "url": "https://synthex.social/pricing",
        "seller": {
          "@type": "Organization",
          "name": "Synthex"
        },
        "category": "AI Marketing Software - Elite Tier",
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "AI Content Generation",
            "value": "Unlimited"
          },
          {
            "@type": "PropertyValue",
            "name": "API Access",
            "value": "Yes"
          },
          {
            "@type": "PropertyValue",
            "name": "White Label",
            "value": "Yes"
          },
          {
            "@type": "PropertyValue",
            "name": "Support",
            "value": "Dedicated"
          }
        ]
      }
    ],
    "aggregateOffer": {
      "@type": "AggregateOffer",
      "priceCurrency": "AUD",
      "lowPrice": "495",
      "highPrice": "1295",
      "offerCount": "3"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
