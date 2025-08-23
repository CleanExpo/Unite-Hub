/**
 * Content Architecture for SEO Sub-Pillar Pages
 * This defines the hierarchical structure for maximum SEO impact
 */

export interface SubPillarPage {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  parent: string;
  priority: number;
  contentDepth: 'guide' | 'tool' | 'resource' | 'case-study';
}

export const contentArchitecture = {
  // Main Pillar: Growth Hacking
  growthHacking: {
    main: '/growth-hacking',
    title: 'Growth Hacking',
    subPillars: [
      {
        slug: '/growth-hacking/guide',
        title: 'Complete Growth Hacking Guide 2025',
        description: 'Master growth hacking with our comprehensive guide covering strategies, tools, and frameworks for exponential business growth.',
        keywords: ['growth hacking guide', 'growth strategies 2025', 'startup growth playbook'],
        contentDepth: 'guide',
        priority: 0.9,
        sections: [
          'What is Growth Hacking',
          'Growth Hacking vs Traditional Marketing',
          'AARRR Framework',
          'Growth Experiments',
          'Viral Coefficients',
          'Product-Market Fit'
        ]
      },
      {
        slug: '/growth-hacking/tools',
        title: 'Best Growth Hacking Tools 2025',
        description: 'Discover the top 50+ growth hacking tools for analytics, automation, testing, and optimization.',
        keywords: ['growth hacking tools', 'marketing automation tools', 'A/B testing tools'],
        contentDepth: 'resource',
        priority: 0.85,
        categories: [
          'Analytics & Tracking',
          'A/B Testing',
          'Email Marketing',
          'Social Media',
          'SEO Tools',
          'Automation'
        ]
      },
      {
        slug: '/growth-hacking/workshop',
        title: 'Growth Hacking Workshop Brisbane',
        description: 'Join our intensive growth hacking workshop. Learn proven strategies from experts who\'ve scaled 100+ companies.',
        keywords: ['growth hacking workshop', 'Brisbane marketing workshop', 'growth training'],
        contentDepth: 'resource',
        priority: 0.8,
        features: [
          '2-Day Intensive Program',
          'Hands-on Experiments',
          'Real Case Studies',
          'Certification',
          'Ongoing Support'
        ]
      },
      {
        slug: '/growth-hacking/case-studies',
        title: 'Growth Hacking Case Studies | Real Results',
        description: 'Explore detailed case studies of successful growth hacking campaigns with metrics, strategies, and lessons learned.',
        keywords: ['growth hacking case studies', 'growth success stories', 'marketing case studies'],
        contentDepth: 'case-study',
        priority: 0.85,
        studies: [
          'SaaS: 0 to $1M ARR in 6 months',
          'E-commerce: 500% growth via viral loops',
          'B2B: LinkedIn strategy for 10x leads',
          'Mobile App: 1M downloads organically'
        ]
      },
      {
        slug: '/growth-hacking/calculator',
        title: 'Growth Metrics Calculator | Free Tool',
        description: 'Calculate CAC, LTV, viral coefficient, and growth rate with our free interactive calculator.',
        keywords: ['growth metrics calculator', 'CAC calculator', 'LTV calculator'],
        contentDepth: 'tool',
        priority: 0.8,
        interactive: true
      }
    ]
  },

  // Main Pillar: Agile Marketing
  agileMarketing: {
    main: '/agile-marketing',
    title: 'Agile Marketing',
    subPillars: [
      {
        slug: '/agile-marketing/frameworks',
        title: 'Agile Marketing Frameworks | Scrum & Kanban',
        description: 'Implement agile methodologies in marketing. Learn Scrum, Kanban, and hybrid frameworks for marketing teams.',
        keywords: ['agile marketing framework', 'scrum for marketing', 'kanban marketing'],
        contentDepth: 'guide',
        priority: 0.85,
        frameworks: [
          'Scrum for Marketing',
          'Kanban Boards',
          'Sprint Planning',
          'Daily Standups',
          'Retrospectives'
        ]
      },
      {
        slug: '/agile-marketing/team-training',
        title: 'Agile Marketing Team Training Brisbane',
        description: 'Transform your marketing team with agile training. Certified courses for teams of all sizes.',
        keywords: ['agile marketing training', 'marketing team training Brisbane', 'agile certification'],
        contentDepth: 'resource',
        priority: 0.8
      },
      {
        slug: '/agile-marketing/transformation',
        title: 'Agile Marketing Transformation Guide',
        description: 'Step-by-step guide to transform traditional marketing teams into high-performing agile units.',
        keywords: ['agile transformation', 'marketing transformation', 'agile adoption'],
        contentDepth: 'guide',
        priority: 0.85
      }
    ]
  },

  // Main Pillar: Social Advertising
  socialAdvertising: {
    main: '/social-advertising',
    title: 'Social Advertising',
    subPillars: [
      {
        slug: '/social-advertising/facebook-ads',
        title: 'Facebook Ads Management Brisbane | Expert Services',
        description: 'Maximize ROI with expert Facebook advertising. Advanced targeting, creative optimization, and proven strategies.',
        keywords: ['Facebook ads Brisbane', 'Facebook advertising', 'Meta ads management'],
        contentDepth: 'guide',
        priority: 0.9,
        topics: [
          'Audience Targeting',
          'Creative Best Practices',
          'Campaign Optimization',
          'Retargeting Strategies',
          'Budget Management'
        ]
      },
      {
        slug: '/social-advertising/linkedin-b2b',
        title: 'LinkedIn B2B Marketing | Lead Generation Experts',
        description: 'Generate quality B2B leads with LinkedIn advertising. Account-based marketing and thought leadership strategies.',
        keywords: ['LinkedIn B2B marketing', 'LinkedIn ads', 'B2B lead generation'],
        contentDepth: 'guide',
        priority: 0.85
      },
      {
        slug: '/social-advertising/roi-calculator',
        title: 'Social Media ROI Calculator | Free Tool',
        description: 'Calculate your social media advertising ROI instantly. Compare platforms and optimize your budget allocation.',
        keywords: ['social media ROI calculator', 'advertising ROI', 'ROAS calculator'],
        contentDepth: 'tool',
        priority: 0.8,
        interactive: true
      }
    ]
  },

  // Main Pillar: Competitive Analysis
  competitiveAnalysis: {
    main: '/competitive-analysis',
    title: 'Competitive Analysis',
    subPillars: [
      {
        slug: '/competitive-analysis/benchmarking',
        title: 'Competitive Benchmarking Services | Market Intelligence',
        description: 'Comprehensive competitive benchmarking to identify gaps and opportunities in your market.',
        keywords: ['competitive benchmarking', 'market benchmarking', 'competitor analysis Brisbane'],
        contentDepth: 'guide',
        priority: 0.85
      },
      {
        slug: '/competitive-analysis/seo-audit',
        title: 'Competitor SEO Audit | Outrank Your Competition',
        description: 'Deep-dive SEO analysis of your competitors. Uncover their strategies and find opportunities to outrank them.',
        keywords: ['competitor SEO audit', 'SEO gap analysis', 'competitive SEO Brisbane'],
        contentDepth: 'resource',
        priority: 0.9
      },
      {
        slug: '/competitive-analysis/tracker',
        title: 'Competitor Tracking Tool | Monitor in Real-Time',
        description: 'Track competitor activities, pricing, content, and campaigns in real-time with our monitoring tool.',
        keywords: ['competitor tracking', 'competitive monitoring', 'market intelligence tool'],
        contentDepth: 'tool',
        priority: 0.8
      }
    ]
  },

  // Main Pillar: Market Research
  marketResearch: {
    main: '/market-research',
    title: 'Market Research',
    subPillars: [
      {
        slug: '/market-research/persona-development',
        title: 'Buyer Persona Development | Customer Profiling',
        description: 'Create detailed buyer personas based on real data. Understand your customers\' needs, behaviors, and motivations.',
        keywords: ['buyer persona development', 'customer personas', 'user profiling Brisbane'],
        contentDepth: 'guide',
        priority: 0.85
      },
      {
        slug: '/market-research/industry-reports',
        title: 'Industry Reports & Market Analysis | Brisbane',
        description: 'Access comprehensive industry reports and market analysis for Australian businesses.',
        keywords: ['industry reports Brisbane', 'market analysis', 'business intelligence'],
        contentDepth: 'resource',
        priority: 0.8
      },
      {
        slug: '/market-research/survey-tools',
        title: 'Market Research Survey Tools | Customer Insights',
        description: 'Professional survey tools and templates for gathering customer insights and market data.',
        keywords: ['market research surveys', 'customer survey tools', 'research methodology'],
        contentDepth: 'tool',
        priority: 0.75
      }
    ]
  }
};

// Internal Linking Map for SEO Juice Flow
export const internalLinkingStrategy = {
  '/growth-hacking': [
    '/growth-hacking/guide',
    '/growth-hacking/tools',
    '/agile-marketing',
    '/social-advertising'
  ],
  '/growth-hacking/guide': [
    '/growth-hacking',
    '/growth-hacking/tools',
    '/growth-hacking/case-studies',
    '/growth-hacking/workshop'
  ],
  '/agile-marketing': [
    '/agile-marketing/frameworks',
    '/agile-marketing/team-training',
    '/growth-hacking'
  ],
  '/social-advertising': [
    '/social-advertising/facebook-ads',
    '/social-advertising/linkedin-b2b',
    '/social-advertising/roi-calculator',
    '/growth-hacking'
  ]
};

// Content Depth Requirements
export const contentRequirements = {
  guide: {
    minWords: 3000,
    sections: 8,
    images: 5,
    videos: 2,
    infographics: 1
  },
  tool: {
    minWords: 1500,
    interactive: true,
    documentation: true,
    examples: 3
  },
  resource: {
    minWords: 2000,
    downloadable: true,
    templates: true,
    checklists: true
  },
  'case-study': {
    minWords: 2500,
    metrics: true,
    beforeAfter: true,
    testimonials: true
  }
};