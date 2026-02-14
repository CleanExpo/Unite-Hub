/**
 * SEO Configuration Registry
 *
 * Central configuration for all SEO-related metadata across the Unite-Hub platform.
 * This file serves as the single source of truth for:
 * - Site-wide metadata
 * - Page-specific SEO configurations
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
    name: 'Unite-Hub',
    tagline: 'AI-Powered Business Hub',
    description: 'Unite-Hub is an AI-powered Business Hub for managing multiple businesses from one intelligent dashboard. CRM, email, campaigns, analytics, and AI agents — all in one place.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com',
    image: '/og-image.png',
    logo: '/logo.png',
    twitter: '@unitehub',
    locale: 'en_US',
    contact: {
      email: 'hello@unite-hub.com',
      support: 'support@unite-hub.com',
    },
  },

  /**
   * Business information for structured data
   */
  business: {
    legalName: 'Unite-Hub',
    foundingDate: '2024',
    founder: 'Unite-Hub',
    description: 'AI-powered Business Hub for founders managing multiple businesses',
    industry: 'Business Management',
    category: 'Business Technology',
    areaServed: 'Australia',
    sameAs: [],
  },

  /**
   * Primary keywords for SEO targeting
   */
  keywords: {
    primary: [
      'AI business hub',
      'CRM platform',
      'business management',
      'AI-powered CRM',
      'multi-business management',
      'business automation',
    ],
    secondary: [
      'contact management',
      'deal pipeline',
      'email automation',
      'campaign management',
      'business analytics',
      'AI agents',
    ],
    longTail: [
      'AI-powered business management platform',
      'multi-business CRM dashboard',
      'automated email processing for business',
      'AI agent workflow automation',
    ],
  },

  /**
   * Page-specific SEO configurations
   */
  pages: {
    home: {
      title: 'Unite-Hub | AI-Powered Business Hub',
      titleTemplate: 'Unite-Hub | Your Business. One Hub.',
      description: 'Manage contacts, deals, campaigns, and operations across all your businesses from one intelligent dashboard. Powered by AI that works for you.',
      keywords: [
        'AI business hub',
        'CRM platform',
        'business management',
        'multi-business dashboard',
      ],
      og: {
        type: 'website',
        image: '/og-home.png',
      },
    },

    dashboard: {
      title: 'Dashboard - Unite-Hub Business Hub',
      description: 'Your AI-powered business command center. Manage contacts, deals, campaigns, and analytics from one unified dashboard.',
      keywords: [
        'business dashboard',
        'CRM dashboard',
        'contact management',
        'deal pipeline',
      ],
      og: {
        type: 'webapp',
        image: '/og-dashboard.png',
      },
    },

    blog: {
      title: 'Business Insights - Unite-Hub',
      description: 'Business insights, AI automation strategies, and management tips from the Unite-Hub team.',
      keywords: [
        'business insights',
        'AI automation',
        'business management tips',
      ],
      og: {
        type: 'blog',
        image: '/og-blog.png',
      },
    },

    contact: {
      title: 'Contact Unite-Hub',
      description: 'Get in touch with Unite-Hub for support, inquiries, or partnership opportunities.',
      keywords: [
        'contact Unite-Hub',
        'business hub support',
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
    crm: [
      'contact management',
      'lead tracking',
      'deal pipeline',
      'relationship management',
    ],
    emailIntelligence: [
      'email automation',
      'Gmail integration',
      'email tracking',
      'automated follow-ups',
    ],
    campaigns: [
      'drip campaigns',
      'email sequences',
      'A/B testing',
      'campaign analytics',
    ],
    aiAgents: [
      'AI email processing',
      'content generation',
      'contact intelligence',
      'workflow automation',
    ],
    analytics: [
      'business analytics',
      'real-time dashboards',
      'predictive insights',
      'performance tracking',
    ],
  },

  /**
   * FAQ schema data for rich results
   */
  commonFAQs: [
    {
      question: 'What is Unite-Hub?',
      answer: 'Unite-Hub is an AI-powered Business Hub for founders managing multiple businesses. It combines CRM, email, campaigns, analytics, and AI agents into one system.',
    },
    {
      question: 'Is Unite-Hub available to the public?',
      answer: 'Unite-Hub is a private business tool. Client access is by invitation only through the Client Portal.',
    },
  ],

  /**
   * Breadcrumb navigation for structured data
   */
  breadcrumbs: {
    home: [
      { name: 'Home', url: '/' },
    ],
    dashboard: [
      { name: 'Home', url: '/' },
      { name: 'Dashboard', url: '/dashboard/overview' },
    ],
    blog: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
    ],
  },
};

export type PageKey = keyof typeof seoConfig.pages;
