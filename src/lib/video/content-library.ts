/**
 * Video Content Library
 * Central registry of all explainer and tutorial videos
 */

export interface VideoEntry {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  category: 'onboarding' | 'feature' | 'tutorial' | 'testimonial' | 'marketing';
  order?: number;
  feature_id?: string;
  thumbnail?: string;
  transcript?: string;
  tags?: string[];
  published?: boolean;
}

export const VIDEO_LIBRARY: Record<string, VideoEntry[]> = {
  onboarding: [
    {
      id: 'welcome-to-unite-hub',
      title: 'Welcome to Unite-Hub',
      description: 'Get started with your AI-powered marketing agency platform',
      duration: 120,
      category: 'onboarding',
      order: 1,
      tags: ['getting-started', 'introduction'],
      published: true
    },
    {
      id: 'setting-up-your-workspace',
      title: 'Setting Up Your Workspace',
      description: 'Configure your workspace for maximum productivity',
      duration: 180,
      category: 'onboarding',
      order: 2,
      tags: ['setup', 'workspace'],
      published: true
    },
    {
      id: 'connecting-your-first-client',
      title: 'Connecting Your First Client',
      description: 'Learn how to onboard clients and start projects',
      duration: 240,
      category: 'onboarding',
      order: 3,
      tags: ['clients', 'onboarding'],
      published: true
    },
    {
      id: 'navigating-the-dashboard',
      title: 'Navigating the Dashboard',
      description: 'A complete tour of your Unite-Hub dashboard',
      duration: 150,
      category: 'onboarding',
      order: 4,
      tags: ['dashboard', 'navigation'],
      published: true
    },
    {
      id: 'understanding-ai-features',
      title: 'Understanding AI Features',
      description: 'How AI powers your marketing agency',
      duration: 200,
      category: 'onboarding',
      order: 5,
      tags: ['ai', 'features'],
      published: true
    }
  ],

  features: [
    {
      id: 'email-intelligence',
      title: 'Email Intelligence',
      description: 'How AI transforms your email into actionable insights',
      duration: 90,
      category: 'feature',
      feature_id: 'email-intelligence',
      tags: ['email', 'ai', 'automation'],
      published: true
    },
    {
      id: 'mindmap-generation',
      title: 'AI Mindmap Generation',
      description: 'Watch AI turn conversations into strategic mindmaps',
      duration: 120,
      category: 'feature',
      feature_id: 'mindmap-generator',
      tags: ['mindmap', 'ai', 'strategy'],
      published: true
    },
    {
      id: 'client-dashboard',
      title: 'Client Dashboard Overview',
      description: 'Everything your clients see and can do',
      duration: 150,
      category: 'feature',
      feature_id: 'client-dashboard',
      tags: ['client-portal', 'dashboard'],
      published: true
    },
    {
      id: 'lead-scoring',
      title: 'Intelligent Lead Scoring',
      description: 'AI-powered lead scoring to prioritize your prospects',
      duration: 100,
      category: 'feature',
      feature_id: 'lead-scoring',
      tags: ['leads', 'ai', 'sales'],
      published: true
    },
    {
      id: 'drip-campaigns',
      title: 'Drip Campaign Builder',
      description: 'Create automated email sequences that convert',
      duration: 180,
      category: 'feature',
      feature_id: 'drip-campaigns',
      tags: ['campaigns', 'email', 'automation'],
      published: true
    },
    {
      id: 'content-generation',
      title: 'AI Content Generation',
      description: 'Generate personalized marketing content in seconds',
      duration: 140,
      category: 'feature',
      feature_id: 'content-generation',
      tags: ['content', 'ai', 'marketing'],
      published: true
    }
  ],

  tutorials: [
    {
      id: 'creating-proposals',
      title: 'Creating AI-Powered Proposals',
      description: 'Generate professional proposals in minutes',
      duration: 300,
      category: 'tutorial',
      tags: ['proposals', 'ai', 'sales'],
      published: true
    },
    {
      id: 'managing-campaigns',
      title: 'Managing Marketing Campaigns',
      description: 'Run effective campaigns with AI assistance',
      duration: 360,
      category: 'tutorial',
      tags: ['campaigns', 'marketing'],
      published: true
    },
    {
      id: 'client-onboarding-flow',
      title: 'Client Onboarding Flow',
      description: 'Step-by-step guide to onboarding new clients',
      duration: 420,
      category: 'tutorial',
      tags: ['clients', 'onboarding'],
      published: true
    },
    {
      id: 'seo-enhancement-suite',
      title: 'Using the SEO Enhancement Suite',
      description: 'Optimize your content for search engines',
      duration: 480,
      category: 'tutorial',
      tags: ['seo', 'content', 'optimization'],
      published: true
    },
    {
      id: 'analytics-and-reporting',
      title: 'Analytics and Reporting',
      description: 'Understand your performance metrics',
      duration: 300,
      category: 'tutorial',
      tags: ['analytics', 'reporting'],
      published: true
    }
  ],

  marketing: [
    {
      id: 'unite-hub-overview',
      title: 'Unite-Hub: Your AI Marketing Agency',
      description: 'See how Unite-Hub transforms your marketing workflow',
      duration: 60,
      category: 'marketing',
      tags: ['overview', 'marketing'],
      published: true
    },
    {
      id: 'customer-success-story-1',
      title: 'How XYZ Agency Scaled with Unite-Hub',
      description: 'Real results from a real agency',
      duration: 90,
      category: 'testimonial',
      tags: ['testimonial', 'case-study'],
      published: false
    }
  ]
};

/**
 * Get all videos by category
 */
export function getVideosByCategory(category: VideoEntry['category']): VideoEntry[] {
  return VIDEO_LIBRARY[category] || [];
}

/**
 * Get a specific video by ID
 */
export function getVideoById(id: string): VideoEntry | undefined {
  for (const videos of Object.values(VIDEO_LIBRARY)) {
    const video = videos.find(v => v.id === id);
    if (video) return video;
  }
  return undefined;
}

/**
 * Get all published videos
 */
export function getPublishedVideos(): VideoEntry[] {
  const allVideos: VideoEntry[] = [];
  for (const videos of Object.values(VIDEO_LIBRARY)) {
    allVideos.push(...videos.filter(v => v.published));
  }
  return allVideos;
}

/**
 * Get videos by tag
 */
export function getVideosByTag(tag: string): VideoEntry[] {
  const matchingVideos: VideoEntry[] = [];
  for (const videos of Object.values(VIDEO_LIBRARY)) {
    matchingVideos.push(...videos.filter(v => v.tags?.includes(tag)));
  }
  return matchingVideos;
}

/**
 * Get onboarding videos in order
 */
export function getOnboardingVideos(): VideoEntry[] {
  return VIDEO_LIBRARY.onboarding
    .filter(v => v.published)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Get video for a specific feature
 */
export function getFeatureVideo(featureId: string): VideoEntry | undefined {
  return VIDEO_LIBRARY.features.find(v => v.feature_id === featureId && v.published);
}

export default VIDEO_LIBRARY;
