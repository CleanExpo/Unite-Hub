/**
 * Role Guided Tour Config
 * Phase 72: Step-by-step tours for Founder and Client roles
 */

export type TourRole = 'founder' | 'client';

export interface TourStep {
  stepId: string;
  title: string;
  description: string;
  targetPage: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightArea?: string;
  actionLabel?: string;
  tips?: string[];
}

export interface GuidedTour {
  tourId: string;
  role: TourRole;
  name: string;
  description: string;
  estimatedMinutes: number;
  steps: TourStep[];
}

/**
 * Client guided tour - explains the platform from a client perspective
 */
export const CLIENT_GUIDED_TOUR: GuidedTour = {
  tourId: 'client_onboarding_tour',
  role: 'client',
  name: 'Client Platform Tour',
  description: 'A step-by-step introduction to the platform capabilities and how to navigate your dashboard.',
  estimatedMinutes: 8,
  steps: [
    {
      stepId: 'client_welcome',
      title: 'Welcome to Your Dashboard',
      description: 'This is your central hub for managing content, tracking performance, and communicating with your creative team. Let\'s walk through the key areas.',
      targetPage: '/client/dashboard/overview',
      position: 'center',
    },
    {
      stepId: 'client_journey',
      title: 'Your 90-Day Journey',
      description: 'The journey page shows where you are in the onboarding and activation process. It tracks real milestones like profile completion, first content delivery, and performance reports.',
      targetPage: '/client/dashboard/journey',
      targetElement: 'journey-timeline',
      position: 'top',
      tips: [
        'Progress is based on actual completed actions, not time',
        'Each phase unlocks new capabilities',
      ],
    },
    {
      stepId: 'client_visual_intelligence',
      title: 'Visual Intelligence',
      description: 'The Visual Intelligence Fabric (VIF) is the foundation of your creative output. It learns your brand and generates content concepts. You can explore and provide feedback here.',
      targetPage: '/client/dashboard/visual-intelligence',
      position: 'top',
      tips: [
        'VIF methods evolve based on your feedback and performance data',
        'You can always request specific styles or directions',
      ],
    },
    {
      stepId: 'client_production',
      title: 'Production Dashboard',
      description: 'Track the status of content being produced. Each bundle shows assets being created for different channels, with status updates from concept to delivery.',
      targetPage: '/client/dashboard/production',
      position: 'top',
      tips: [
        'Review and approve content before it goes live',
        'Request revisions directly in the platform',
      ],
    },
    {
      stepId: 'client_performance',
      title: 'Performance Dashboard',
      description: 'Once content is deployed, performance data flows back here. You\'ll see engagement metrics, trends, and insights about what resonates with your audience.',
      targetPage: '/client/dashboard/performance',
      position: 'top',
      tips: [
        'Reports are generated from real engagement data',
        'Insights inform future creative decisions',
        'Data typically takes 2-3 weeks to become meaningful',
      ],
    },
    {
      stepId: 'client_communication',
      title: 'Communication & Feedback',
      description: 'Provide feedback, ask questions, and communicate with your team. Clear communication helps us produce content that matches your vision.',
      targetPage: '/client/dashboard/overview',
      targetElement: 'feedback-section',
      position: 'bottom',
    },
    {
      stepId: 'client_complete',
      title: 'You\'re Ready',
      description: 'You now have an overview of the platform. As you progress through your 90-day journey, new capabilities will unlock. If you have questions, reach out to your team.',
      targetPage: '/client/dashboard/overview',
      position: 'center',
      actionLabel: 'Start Exploring',
    },
  ],
};

/**
 * Founder guided tour - explains operational oversight capabilities
 */
export const FOUNDER_GUIDED_TOUR: GuidedTour = {
  tourId: 'founder_operations_tour',
  role: 'founder',
  name: 'Founder Operations Tour',
  description: 'An overview of operational dashboards, client management, and system oversight capabilities.',
  estimatedMinutes: 12,
  steps: [
    {
      stepId: 'founder_welcome',
      title: 'Founder Command Center',
      description: 'This is your operational overview. You can monitor all clients, system health, and strategic insights from here.',
      targetPage: '/founder/dashboard/overview',
      position: 'center',
    },
    {
      stepId: 'founder_soft_launch',
      title: 'Soft Launch Management',
      description: 'During soft launch (1-5 clients), use this dashboard to monitor activation progress, identify bottlenecks, and ensure quality delivery before scaling.',
      targetPage: '/founder/dashboard/soft-launch',
      position: 'top',
      tips: [
        'Focus on learning and process refinement during soft launch',
        'Document issues for process improvement',
      ],
    },
    {
      stepId: 'founder_first_client_journey',
      title: 'First Client Journeys',
      description: 'Track where each soft-launch client is in their 90-day journey. This view helps identify if any client is stuck or needs intervention.',
      targetPage: '/founder/dashboard/first-client-journey',
      position: 'top',
      tips: [
        'Clients may progress at different speeds',
        'Identify patterns in what helps clients succeed',
      ],
    },
    {
      stepId: 'founder_creative_reactor',
      title: 'Creative Reactor',
      description: 'The reactive creative engine shows how the system is learning from performance data. Monitor which methods are being promoted or demoted based on results.',
      targetPage: '/founder/dashboard/creative-reactor',
      position: 'top',
      tips: [
        'Review performance signals regularly',
        'Understand why certain methods are favored',
      ],
    },
    {
      stepId: 'founder_creative_ops',
      title: 'Creative Operations Grid',
      description: 'A unified view of creative operations across all clients. See pressure points, opportunities, and cycle alignment. This is where strategic decisions are informed.',
      targetPage: '/founder/dashboard/creative-ops',
      position: 'top',
      tips: [
        'Zone indicators (stability/pressure/opportunity/expansion) guide action',
        'Daily brief provides prioritized actions',
      ],
    },
    {
      stepId: 'founder_ai_director',
      title: 'AI Director Oversight',
      description: 'Monitor AI director recommendations and decisions. The system explains its reasoning, but you maintain approval authority for significant changes.',
      targetPage: '/founder/dashboard/ai-director',
      position: 'top',
      tips: [
        'AI provides recommendations, not autonomous actions',
        'Review reasoning to build trust in suggestions',
      ],
    },
    {
      stepId: 'founder_demo_mode',
      title: 'Demo Mode',
      description: 'Enable demo mode to show capabilities to prospects without exposing real client data. Demo data is clearly marked and uses structural examples, not fake results.',
      targetPage: '/founder/dashboard/overview',
      targetElement: 'demo-mode-toggle',
      position: 'bottom',
      tips: [
        'Demo mode shows what populated data looks like',
        'Never promise specific outcomes in demos',
      ],
    },
    {
      stepId: 'founder_complete',
      title: 'Operations Ready',
      description: 'You now understand the operational dashboards. Use these tools to maintain oversight, identify issues early, and ensure quality delivery to all clients.',
      targetPage: '/founder/dashboard/overview',
      position: 'center',
      actionLabel: 'Start Managing',
    },
  ],
};

/**
 * Get tour by role
 */
export function getTourByRole(role: TourRole): GuidedTour {
  return role === 'founder' ? FOUNDER_GUIDED_TOUR : CLIENT_GUIDED_TOUR;
}

/**
 * Get tour step by ID
 */
export function getTourStep(tour: GuidedTour, stepId: string): TourStep | undefined {
  return tour.steps.find(s => s.stepId === stepId);
}

/**
 * Calculate tour progress
 */
export function calculateTourProgress(
  tour: GuidedTour,
  completedSteps: string[]
): { current: number; total: number; percent: number } {
  const total = tour.steps.length;
  const current = completedSteps.length;
  const percent = Math.round((current / total) * 100);
  return { current, total, percent };
}

/**
 * Check if tour can be disabled via feature flag
 */
export function isTourEnabled(featureFlags: Record<string, boolean>): boolean {
  return featureFlags['guided_tours_enabled'] !== false; // Default enabled
}

export default {
  CLIENT_GUIDED_TOUR,
  FOUNDER_GUIDED_TOUR,
  getTourByRole,
  getTourStep,
  calculateTourProgress,
  isTourEnabled,
};
