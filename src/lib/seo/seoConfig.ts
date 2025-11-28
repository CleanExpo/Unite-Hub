/**
 * SEO Configuration Registry
 *
 * Central configuration for all SEO-related metadata across the Synthex platform.
 * This file serves as the single source of truth for:
 * - Site-wide metadata
 * - Page-specific SEO configurations
 * - Keyword mappings
 * - Open Graph settings
 * - Twitter Card configurations
 *
 * @see buildPageMetadata.ts for helper functions to generate Next.js metadata objects
 */

export const seoConfig = {
  /**
   * Site-wide configuration
   */
  site: {
    name: 'Synthex',
    tagline: 'AI-Powered Marketing Without the Agency Bill',
    description: 'AI-powered SEO and local search intelligence for service-based businesses. Get marketing, SEO, branding, and social media handled by AI. No monthly retainer. No confusing tools.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://synthex.social',
    image: '/og-image.png',
    logo: '/logo.png',
    twitter: '@synthexsocial',
    locale: 'en_US',
    contact: {
      email: 'hello@synthex.social',
      support: 'support@synthex.social',
    },
  },

  /**
   * Business information for structured data
   */
  business: {
    legalName: 'Synthex.social',
    foundingDate: '2024',
    founder: 'Synthex Team',
    description: 'AI marketing platform built for real small businesses',
    industry: 'Software as a Service (SaaS)',
    category: 'Marketing Technology',
    areaServed: 'Worldwide',
    // Social media profiles
    sameAs: [
      'https://twitter.com/synthexsocial',
      'https://linkedin.com/company/synthex',
      'https://github.com/synthex',
    ],
  },

  /**
   * Primary keywords for SEO targeting
   */
  keywords: {
    primary: [
      'AI marketing platform',
      'SEO intelligence',
      'local search rankings',
      'small business marketing',
      'AI content generation',
      'marketing automation',
    ],
    secondary: [
      'keyword research',
      'competitor analysis',
      'DataForSEO',
      'Semrush alternative',
      'Google Business Profile management',
      'social media automation',
      'local SEO',
      'AI copywriting',
    ],
    longTail: [
      'AI marketing for small businesses',
      'affordable marketing automation platform',
      'SEO intelligence without agency costs',
      'AI-powered local SEO services',
      'automated social media content generation',
      'real-time keyword ranking tracking',
    ],
  },

  /**
   * Page-specific SEO configurations
   * Each page has: title, description, keywords, and optional custom OG settings
   */
  pages: {
    home: {
      title: 'Synthex - AI Marketing Platform for Small Businesses',
      titleTemplate: 'Synthex | AI-Powered Marketing Without the Agency Bill',
      description: 'Finally, an AI platform built for REAL small businesses. Get your website, SEO, branding, and social media handled by AI. No monthly retainer. No confusing tools.',
      keywords: [
        'AI marketing platform',
        'small business marketing',
        'AI SEO tools',
        'marketing automation',
        'local SEO',
        'social media automation',
      ],
      og: {
        type: 'website',
        image: '/og-home.png',
      },
    },

    pricing: {
      title: 'Pricing Plans - Affordable AI Marketing for Every Business',
      description: 'Choose the perfect plan for your business. From Starter at A$495/mo to Elite at A$1,295/mo. All plans include AI-powered website optimization, SEO, and social media automation. 14-day free trial.',
      keywords: [
        'AI marketing pricing',
        'affordable marketing automation',
        'small business marketing plans',
        'AI SEO pricing',
        'marketing platform cost',
      ],
      og: {
        type: 'website',
        image: '/og-pricing.png',
      },
    },

    howItWorks: {
      title: 'How Synthex Works - 4 Simple Steps to AI Marketing Success',
      description: 'Connect your business, let Synthex diagnose opportunities, generate AI strategy, and launch. Get back 10+ hours per week with automated marketing that works.',
      keywords: [
        'AI marketing process',
        'marketing automation workflow',
        'AI content strategy',
        'automated SEO setup',
      ],
      og: {
        type: 'article',
        image: '/og-how-it-works.png',
      },
    },

    dashboard: {
      title: 'Dashboard - Synthex Marketing Control Center',
      description: 'Manage your AI-powered marketing campaigns, track SEO rankings, monitor social media performance, and view real-time analytics from your Synthex dashboard.',
      keywords: [
        'marketing dashboard',
        'AI campaign management',
        'SEO analytics',
        'social media insights',
      ],
      og: {
        type: 'webapp',
        image: '/og-dashboard.png',
      },
    },

    tradesContractors: {
      title: 'AI Marketing for Trades & Contractors - Plumbers, Electricians, Builders',
      description: 'Get more local jobs without spending $500+ monthly on ads. AI-powered local SEO, Google Maps ranking, before/after galleries, and review management for trades.',
      keywords: [
        'contractor marketing',
        'plumber SEO',
        'electrician marketing',
        'builder local SEO',
        'trade business marketing',
      ],
      og: {
        type: 'website',
        image: '/og-trades.png',
      },
    },

    localServices: {
      title: 'AI Marketing for Local Services & Salons - Hair, Spa, Cleaning',
      description: 'Attract more neighborhood customers with geo-targeted social posts, appointment reminders, and retention campaigns. AI marketing for salons, spas, and cleaning services.',
      keywords: [
        'salon marketing',
        'spa marketing automation',
        'cleaning service SEO',
        'local service marketing',
      ],
      og: {
        type: 'website',
        image: '/og-local-services.png',
      },
    },

    nonProfits: {
      title: 'AI Marketing for Non-Profits & Churches - Tell Your Story',
      description: 'Grow your community without hiring an agency. AI-powered donor recruitment, event promotion, volunteer management, and impact storytelling for non-profits.',
      keywords: [
        'non-profit marketing',
        'church marketing automation',
        'donor recruitment',
        'volunteer management',
      ],
      og: {
        type: 'website',
        image: '/og-nonprofits.png',
      },
    },

    coaches: {
      title: 'AI Marketing for Coaches & Consultants - Grow Your Online Business',
      description: 'Attract qualified clients with consistent professional content. AI-powered lead magnets, email sequences, social proof management, and webinar automation.',
      keywords: [
        'coach marketing',
        'consultant marketing automation',
        'online coaching marketing',
        'lead generation for coaches',
      ],
      og: {
        type: 'website',
        image: '/og-coaches.png',
      },
    },

    ecommerce: {
      title: 'AI Marketing for E-Commerce - Sell More Online',
      description: 'Product photography, descriptions, and targeted social ads—all automated by AI. Product image enhancement, social commerce, and cart recovery.',
      keywords: [
        'ecommerce marketing',
        'product photography AI',
        'shopping cart recovery',
        'social commerce automation',
      ],
      og: {
        type: 'website',
        image: '/og-ecommerce.png',
      },
    },

    agencies: {
      title: 'White-Label AI Marketing for Agencies & Resellers',
      description: 'Deliver premium marketing services without overhead or team. White-label branding, unlimited client sub-accounts, and reseller margins available.',
      keywords: [
        'white-label marketing platform',
        'agency reseller program',
        'marketing platform for agencies',
      ],
      og: {
        type: 'website',
        image: '/og-agencies.png',
      },
    },

    blog: {
      title: 'Marketing Insights & AI Strategies - Synthex Blog',
      description: 'Learn the latest AI marketing strategies, local SEO tips, social media tactics, and small business growth hacks from the Synthex team.',
      keywords: [
        'AI marketing blog',
        'SEO tips',
        'social media strategies',
        'small business marketing tips',
      ],
      og: {
        type: 'blog',
        image: '/og-blog.png',
      },
    },

    contact: {
      title: 'Contact Synthex - Get AI Marketing Help',
      description: 'Have questions about AI marketing for your business? Contact our team for personalized support, demo requests, or partnership inquiries.',
      keywords: [
        'contact Synthex',
        'marketing platform support',
        'demo request',
      ],
      og: {
        type: 'website',
        image: '/og-contact.png',
      },
    },
  },

  /**
   * Feature keywords for content optimization
   */
  features: {
    websiteOptimization: [
      'AI website copy',
      'SEO-optimized content',
      'conversion rate optimization',
      'landing page optimization',
    ],
    localSEO: [
      'local search rankings',
      'Google Business Profile',
      'Google Maps ranking',
      'geo-targeted keywords',
      'local citation management',
    ],
    socialMedia: [
      'social media automation',
      'AI content generation',
      'multi-platform posting',
      'engagement monitoring',
      'social media scheduling',
    ],
    emailMarketing: [
      'drip campaign automation',
      'lead nurture sequences',
      'email A/B testing',
      'automated follow-ups',
    ],
    aiAssistants: [
      'AI copywriter',
      'AI graphic designer',
      'content strategist',
      'data analyst AI',
    ],
    analytics: [
      'performance dashboards',
      'ROI tracking',
      'competitor benchmarking',
      'keyword ranking tracking',
      'conversion analytics',
    ],
  },

  /**
   * Competitor alternatives for SEO positioning
   */
  alternatives: [
    'Semrush alternative',
    'Ahrefs alternative',
    'HubSpot alternative',
    'Mailchimp alternative',
    'Hootsuite alternative',
    'Buffer alternative',
  ],

  /**
   * FAQ schema data for rich results
   */
  commonFAQs: [
    {
      question: 'What is Synthex?',
      answer: 'Synthex is an AI-powered marketing platform built specifically for small businesses. We handle your website optimization, SEO, social media, email marketing, and content creation—all automated by AI without the need for expensive agencies or complex tools.',
    },
    {
      question: 'How much does Synthex cost?',
      answer: 'Synthex offers three plans: Starter at A$495/mo, Pro at A$895/mo (most popular), and Elite at A$1,295/mo for white-label services. All prices are in AUD, GST inclusive. All plans include a 14-day free trial and can be canceled anytime.',
    },
    {
      question: 'Do I need technical skills to use Synthex?',
      answer: 'No technical skills required. Synthex is designed for busy business owners. Simply connect your business accounts (website, social media, email), and our AI handles the rest. Setup takes about 5 minutes.',
    },
    {
      question: 'How is Synthex different from ChatGPT or other AI tools?',
      answer: 'While ChatGPT is a general chatbot, Synthex is a complete marketing platform. We provide strategy, content creation, technical execution, scheduling, analytics, and ongoing optimization—not just text generation.',
    },
    {
      question: 'What industries does Synthex work best for?',
      answer: 'Synthex is built for trades & contractors, local services & salons, non-profits & churches, coaches & consultants, e-commerce stores, and marketing agencies. Any service-based or local business benefits from our AI automation.',
    },
    {
      question: 'Can I cancel my Synthex subscription?',
      answer: 'Yes, you can cancel anytime with no long-term contracts or cancellation fees. Your data remains accessible for 30 days after cancellation.',
    },
    {
      question: 'Does Synthex replace my need for a marketing agency?',
      answer: 'For most small businesses, yes. Synthex provides the same services as a $2,000-$10,000/month agency at a fraction of the cost. However, very large enterprises with complex needs may still benefit from dedicated agency relationships.',
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Most customers see improved social media engagement within 1-2 weeks, SEO improvements within 4-8 weeks, and measurable business growth within 2-3 months. Results vary by industry and competition level.',
    },
  ],

  /**
   * Breadcrumb navigation for structured data
   */
  breadcrumbs: {
    home: [
      { name: 'Home', url: '/' },
    ],
    pricing: [
      { name: 'Home', url: '/' },
      { name: 'Pricing', url: '/#pricing' },
    ],
    dashboard: [
      { name: 'Home', url: '/' },
      { name: 'Dashboard', url: '/synthex/dashboard' },
    ],
    blog: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
    ],
  },
};

export type PageKey = keyof typeof seoConfig.pages;
