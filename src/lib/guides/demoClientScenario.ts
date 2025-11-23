/**
 * Demo Client Scenario
 * Phase 72: Sample data for demonstration purposes
 * All data clearly marked as demo/example - never mixed with real tenant data
 */

export interface DemoPerformanceReport {
  period: string;
  channelMetrics: {
    channel: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  topPerformingContent: {
    title: string;
    type: string;
    engagementRate: number;
  }[];
  insights: string[];
}

export interface DemoCreativeBundle {
  bundleId: string;
  name: string;
  method: string;
  status: 'delivered' | 'in_production' | 'scheduled';
  assets: {
    type: string;
    channel: string;
    status: string;
  }[];
}

export interface DemoSuccessScore {
  overall: number;
  components: {
    name: string;
    score: number;
    description: string;
  }[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface DemoClientScenario {
  clientName: string;
  industry: string;
  dayInJourney: number;
  phase: string;
  performanceReport: DemoPerformanceReport;
  creativeBundles: DemoCreativeBundle[];
  successScore: DemoSuccessScore;
  nextActions: string[];
}

/**
 * Demo scenario showing a healthy client at Day 60
 * This represents what populated data looks like - not a guarantee of results
 */
export const DEMO_CLIENT_SCENARIO: DemoClientScenario = {
  clientName: 'Example Construction Co.',
  industry: 'Construction / Balustrades',
  dayInJourney: 60,
  phase: 'optimization',

  performanceReport: {
    period: 'Last 30 days',
    channelMetrics: [
      {
        channel: 'Instagram',
        impressions: 12500,
        engagements: 875,
        engagementRate: 0.07,
        trend: 'improving',
      },
      {
        channel: 'LinkedIn',
        impressions: 8200,
        engagements: 492,
        engagementRate: 0.06,
        trend: 'stable',
      },
      {
        channel: 'Facebook',
        impressions: 15800,
        engagements: 632,
        engagementRate: 0.04,
        trend: 'improving',
      },
      {
        channel: 'Website',
        impressions: 3200,
        engagements: 256,
        engagementRate: 0.08,
        trend: 'stable',
      },
    ],
    topPerformingContent: [
      {
        title: 'Project Showcase - Modern Office Balustrade',
        type: 'Carousel',
        engagementRate: 0.12,
      },
      {
        title: 'Behind the Scenes - Fabrication Process',
        type: 'Video',
        engagementRate: 0.09,
      },
      {
        title: 'Before/After - Residential Renovation',
        type: 'Split Image',
        engagementRate: 0.08,
      },
    ],
    insights: [
      'Project showcase content consistently outperforms other formats',
      'Video content showing fabrication process generates high engagement',
      'LinkedIn performs best for B2B lead generation messaging',
      'Morning posts (8-10am) show higher engagement rates',
    ],
  },

  creativeBundles: [
    {
      bundleId: 'demo_bundle_1',
      name: 'Commercial Project Feature',
      method: 'project_showcase',
      status: 'delivered',
      assets: [
        { type: 'Carousel', channel: 'Instagram', status: 'Published' },
        { type: 'Single Image', channel: 'LinkedIn', status: 'Published' },
        { type: 'Album', channel: 'Facebook', status: 'Published' },
      ],
    },
    {
      bundleId: 'demo_bundle_2',
      name: 'Process Documentation',
      method: 'behind_the_scenes',
      status: 'delivered',
      assets: [
        { type: 'Video', channel: 'Instagram', status: 'Published' },
        { type: 'Article', channel: 'LinkedIn', status: 'Published' },
      ],
    },
    {
      bundleId: 'demo_bundle_3',
      name: 'Residential Transformation',
      method: 'before_after',
      status: 'in_production',
      assets: [
        { type: 'Split Image', channel: 'Instagram', status: 'In Review' },
        { type: 'Carousel', channel: 'Facebook', status: 'Scheduled' },
      ],
    },
  ],

  successScore: {
    overall: 72,
    components: [
      {
        name: 'Engagement Health',
        score: 78,
        description: 'Engagement rates are above industry average for construction sector',
      },
      {
        name: 'Content Consistency',
        score: 85,
        description: 'Regular posting schedule maintained across all channels',
      },
      {
        name: 'Brand Alignment',
        score: 70,
        description: 'Content adheres to brand guidelines with minor variations',
      },
      {
        name: 'Audience Growth',
        score: 65,
        description: 'Steady follower growth on primary channels',
      },
      {
        name: 'Creative Diversity',
        score: 62,
        description: 'Using 4 of 8 available creative methods - room for expansion',
      },
    ],
    trend: 'improving',
  },

  nextActions: [
    'Review upcoming residential transformation bundle',
    'Consider testing video format on LinkedIn based on Instagram success',
    'Explore testimonial method to add social proof',
    'Schedule strategy review at Day 75',
  ],
};

/**
 * Demo narrative explanations for the guided tour
 */
export const DEMO_NARRATIVES = {
  performanceReport: {
    title: 'Performance Report Example',
    explanation: 'This is how a performance report looks when populated with real data. The metrics shown are examples - your actual numbers will depend on your audience, industry, and content strategy.',
  },
  creativeBundles: {
    title: 'Creative Bundles Example',
    explanation: 'Creative bundles group related content across channels. This example shows how assets are tracked from production through delivery. Your bundles will be customized to your brand and goals.',
  },
  successScore: {
    title: 'Success Score Example',
    explanation: 'The success score provides a holistic view of content performance. Components are weighted based on your business priorities. Scores are calculated from actual engagement data, not estimates.',
  },
  journeyTimeline: {
    title: '90-Day Journey Example',
    explanation: 'This timeline shows a typical progression through the platform. Your actual timeline may vary based on your readiness, content volume, and review cycles. Days shown are guidelines, not guarantees.',
  },
};

/**
 * Demo mode feature flag check
 */
export function isDemoModeEnabled(featureFlags: Record<string, boolean>): boolean {
  return featureFlags['demo_mode'] === true;
}

/**
 * Get demo client data with clear markers
 */
export function getDemoClientData(): DemoClientScenario & { isDemo: true; demoDisclaimer: string } {
  return {
    ...DEMO_CLIENT_SCENARIO,
    isDemo: true,
    demoDisclaimer: 'This is example data for demonstration purposes only. It does not represent actual results or guarantees.',
  };
}

/**
 * Get empty state message for real clients without data
 */
export function getNoDataMessage(dataType: string): string {
  const messages: Record<string, string> = {
    performance: 'Not enough data yet. Performance reports will be available after your first content is deployed and has accumulated engagement data.',
    creativeBundles: 'No creative bundles yet. Bundles will appear here once your Visual Identity Fabric is generated and production begins.',
    successScore: 'Success score not yet established. This will be calculated once sufficient performance data is available (typically after 30-45 days).',
    journey: 'Your journey has just begun. Progress will be tracked as you complete onboarding and activation milestones.',
  };
  return messages[dataType] || 'Not enough data yet.';
}

export default {
  DEMO_CLIENT_SCENARIO,
  DEMO_NARRATIVES,
  isDemoModeEnabled,
  getDemoClientData,
  getNoDataMessage,
};
