export const seoConfig = {
  siteName: 'Unite Group Agency',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://unitegroup.com.au',
  defaultTitle: 'Unite Group Agency | Brisbane Digital Marketing & Growth Experts',
  titleTemplate: '%s | Unite Group Agency',
  defaultDescription: 'Brisbane\'s leading growth marketing agency specializing in growth hacking, agile marketing, SEO, and custom software development. Transform your business with data-driven strategies.',
  defaultImage: '/images/unite-group-og-image.jpg',
  twitterHandle: '@UniteGroupAU',
  
  organization: {
    name: 'Unite Group Agency',
    url: 'https://unitegroup.com.au',
    logo: '/unite-group-logo-image.png',
    sameAs: [
      'https://www.linkedin.com/company/unite-group-agency',
      'https://www.facebook.com/unitegroup',
      'https://twitter.com/UniteGroupAU'
    ],
    address: {
      streetAddress: 'Union Place',
      addressLocality: 'Ipswich',
      addressRegion: 'QLD',
      postalCode: '4305',
      addressCountry: 'AU'
    },
    contactPoint: {
      telephone: '+61-7-3000-0000',
      contactType: 'customer service',
      availableLanguage: ['English'],
      areaServed: 'AU'
    }
  },
  
  coreKeywords: [
    'growth hacking Brisbane',
    'agile marketing agency',
    'digital marketing Brisbane',
    'SEO services Queensland',
    'custom software development',
    'competitive analysis',
    'market research Brisbane',
    'social media advertising',
    'business growth consulting',
    'marketing automation'
  ],
  
  services: {
    growthHacking: {
      title: 'Growth Hacking Services Brisbane | 10X Business Growth',
      description: 'Accelerate your business with data-driven growth hacking strategies. Rapid experimentation, viral marketing, and proven frameworks for exponential growth.',
      keywords: ['growth hacking', 'viral marketing', 'rapid experimentation', 'growth strategies', 'Brisbane growth agency']
    },
    agileMarketing: {
      title: 'Agile Marketing Agency | Sprint-Based Marketing Brisbane',
      description: 'Transform your marketing with agile methodologies. Sprint-based campaigns, continuous optimization, and measurable results every 2 weeks.',
      keywords: ['agile marketing', 'sprint marketing', 'scrum marketing', 'iterative campaigns', 'marketing optimization']
    },
    socialAdvertising: {
      title: 'Social Media Advertising Brisbane | Facebook & LinkedIn Ads Expert',
      description: 'Maximize ROI with expert social advertising. Advanced targeting, creative optimization, and data-driven campaigns on Facebook, LinkedIn, and Instagram.',
      keywords: ['social media advertising', 'Facebook ads', 'LinkedIn B2B marketing', 'Instagram advertising', 'social media ROI']
    },
    competitiveAnalysis: {
      title: 'Competitive Analysis Services | Market Intelligence Brisbane',
      description: 'Outmaneuver competitors with deep market intelligence. SEO gap analysis, competitor benchmarking, and strategic positioning for market dominance.',
      keywords: ['competitive analysis', 'market intelligence', 'competitor research', 'SEO gap analysis', 'market positioning']
    },
    marketResearch: {
      title: 'Market Research Brisbane | Customer Insights & Data Analysis',
      description: 'Make informed decisions with comprehensive market research. Customer personas, industry analysis, and actionable insights for strategic growth.',
      keywords: ['market research', 'customer insights', 'persona development', 'industry analysis', 'Brisbane research agency']
    }
  }
};

export const structuredDataDefaults = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.organization.name,
  url: seoConfig.organization.url,
  logo: `${seoConfig.siteUrl}${seoConfig.organization.logo}`,
  sameAs: seoConfig.organization.sameAs,
  address: {
    '@type': 'PostalAddress',
    ...seoConfig.organization.address
  },
  contactPoint: {
    '@type': 'ContactPoint',
    ...seoConfig.organization.contactPoint
  }
};