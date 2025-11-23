/**
 * First Client Journey Config
 * Phase 72: 90-day journey map for first clients
 */

export type JourneyPhase =
  | 'onboarding'
  | 'foundation'
  | 'activation'
  | 'optimization'
  | 'evolution';

export type JourneyMilestone =
  | 'account_created'
  | 'profile_completed'
  | 'brand_kit_uploaded'
  | 'first_vif_generated'
  | 'first_production_job'
  | 'first_content_delivered'
  | 'performance_tracking_started'
  | 'first_performance_report'
  | 'reactive_engine_activated'
  | 'first_optimization_cycle'
  | 'success_score_established'
  | 'creative_evolution_begun';

export interface JourneyPhaseConfig {
  phase: JourneyPhase;
  name: string;
  dayRange: [number, number];
  description: string;
  capabilities: string[];
  linkedFeatures: string[];
  milestones: JourneyMilestone[];
}

export interface JourneyState {
  currentPhase: JourneyPhase;
  currentDay: number;
  completedMilestones: JourneyMilestone[];
  nextMilestone: JourneyMilestone | null;
  progressPercent: number;
}

export const JOURNEY_PHASES: JourneyPhaseConfig[] = [
  {
    phase: 'onboarding',
    name: 'Onboarding',
    dayRange: [0, 7],
    description: 'Setting up your account and understanding your brand foundation. We gather the information needed to generate content that matches your business.',
    capabilities: [
      'Account creation and profile setup',
      'Brand kit upload (logo, colors, fonts)',
      'Business information and target audience definition',
      'Initial strategy discussion',
    ],
    linkedFeatures: ['Launch Kit', 'Brand Profile'],
    milestones: ['account_created', 'profile_completed', 'brand_kit_uploaded'],
  },
  {
    phase: 'foundation',
    name: 'Foundation',
    dayRange: [8, 21],
    description: 'Building your visual identity foundation. The system learns your brand and begins generating initial creative concepts.',
    capabilities: [
      'Visual Identity Fabric (VIF) generation',
      'Initial creative concepts and directions',
      'Review and refinement cycle',
      'Production queue setup',
    ],
    linkedFeatures: ['Visual Intelligence Fabric', 'Creative Director'],
    milestones: ['first_vif_generated', 'first_production_job'],
  },
  {
    phase: 'activation',
    name: 'Activation',
    dayRange: [22, 45],
    description: 'Content production begins. Your first creative assets are produced, reviewed, and deployed across channels.',
    capabilities: [
      'Content production and delivery',
      'Channel-specific adaptations',
      'Initial performance tracking setup',
      'Engagement monitoring begins',
    ],
    linkedFeatures: ['Activation Engine', 'Production Dashboard', 'Performance Intelligence'],
    milestones: ['first_content_delivered', 'performance_tracking_started'],
  },
  {
    phase: 'optimization',
    name: 'Optimization',
    dayRange: [46, 75],
    description: 'Data-driven refinement. Performance data informs creative decisions. The system identifies what resonates with your audience.',
    capabilities: [
      'Performance reports and insights',
      'Reactive creative adjustments',
      'A/B testing and method comparison',
      'Success score tracking',
    ],
    linkedFeatures: ['Success Engine', 'Reactive Creative Engine', 'Performance Dashboard'],
    milestones: ['first_performance_report', 'reactive_engine_activated', 'first_optimization_cycle'],
  },
  {
    phase: 'evolution',
    name: 'Evolution',
    dayRange: [76, 90],
    description: 'Continuous improvement. The system evolves your creative strategy based on accumulated learnings and emerging opportunities.',
    capabilities: [
      'Creative evolution recommendations',
      'Long-term strategy refinement',
      'Opportunity identification',
      'Pressure detection and intervention',
    ],
    linkedFeatures: ['Creative Ops Grid', 'AI Director', 'Executive Brain'],
    milestones: ['success_score_established', 'creative_evolution_begun'],
  },
];

/**
 * Determine journey state from client data
 */
export function calculateJourneyState(
  clientData: {
    createdAt: string;
    profileCompleted?: boolean;
    brandKitUploaded?: boolean;
    vifGenerated?: boolean;
    productionJobs?: number;
    contentDelivered?: number;
    performanceReports?: number;
    reactiveEngineActive?: boolean;
    optimizationCycles?: number;
    successScore?: number;
  }
): JourneyState {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(clientData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const completedMilestones: JourneyMilestone[] = ['account_created'];

  // Check milestones based on actual data
  if (clientData.profileCompleted) {
    completedMilestones.push('profile_completed');
  }
  if (clientData.brandKitUploaded) {
    completedMilestones.push('brand_kit_uploaded');
  }
  if (clientData.vifGenerated) {
    completedMilestones.push('first_vif_generated');
  }
  if (clientData.productionJobs && clientData.productionJobs > 0) {
    completedMilestones.push('first_production_job');
  }
  if (clientData.contentDelivered && clientData.contentDelivered > 0) {
    completedMilestones.push('first_content_delivered');
  }
  if (clientData.contentDelivered && clientData.contentDelivered > 0) {
    completedMilestones.push('performance_tracking_started');
  }
  if (clientData.performanceReports && clientData.performanceReports > 0) {
    completedMilestones.push('first_performance_report');
  }
  if (clientData.reactiveEngineActive) {
    completedMilestones.push('reactive_engine_activated');
  }
  if (clientData.optimizationCycles && clientData.optimizationCycles > 0) {
    completedMilestones.push('first_optimization_cycle');
  }
  if (clientData.successScore && clientData.successScore > 0) {
    completedMilestones.push('success_score_established');
  }
  if (clientData.optimizationCycles && clientData.optimizationCycles >= 3) {
    completedMilestones.push('creative_evolution_begun');
  }

  // Determine current phase based on completed milestones and time
  let currentPhase: JourneyPhase = 'onboarding';

  if (completedMilestones.includes('creative_evolution_begun')) {
    currentPhase = 'evolution';
  } else if (completedMilestones.includes('first_performance_report')) {
    currentPhase = 'optimization';
  } else if (completedMilestones.includes('first_content_delivered')) {
    currentPhase = 'activation';
  } else if (completedMilestones.includes('first_vif_generated')) {
    currentPhase = 'foundation';
  }

  // Find next milestone
  const allMilestones: JourneyMilestone[] = JOURNEY_PHASES.flatMap(p => p.milestones);
  const nextMilestone = allMilestones.find(m => !completedMilestones.includes(m)) || null;

  // Calculate progress
  const progressPercent = Math.round((completedMilestones.length / allMilestones.length) * 100);

  return {
    currentPhase,
    currentDay: daysSinceCreation,
    completedMilestones,
    nextMilestone,
    progressPercent,
  };
}

/**
 * Get phase config by phase name
 */
export function getPhaseConfig(phase: JourneyPhase): JourneyPhaseConfig {
  return JOURNEY_PHASES.find(p => p.phase === phase)!;
}

/**
 * Get milestone display name
 */
export function getMilestoneDisplayName(milestone: JourneyMilestone): string {
  const names: Record<JourneyMilestone, string> = {
    account_created: 'Account Created',
    profile_completed: 'Profile Completed',
    brand_kit_uploaded: 'Brand Kit Uploaded',
    first_vif_generated: 'First VIF Generated',
    first_production_job: 'First Production Job',
    first_content_delivered: 'First Content Delivered',
    performance_tracking_started: 'Performance Tracking Started',
    first_performance_report: 'First Performance Report',
    reactive_engine_activated: 'Reactive Engine Activated',
    first_optimization_cycle: 'First Optimization Cycle',
    success_score_established: 'Success Score Established',
    creative_evolution_begun: 'Creative Evolution Begun',
  };
  return names[milestone];
}

/**
 * Get honest description of what comes next
 */
export function getNextStepDescription(nextMilestone: JourneyMilestone | null): string {
  if (!nextMilestone) {
    return 'You have completed the initial 90-day journey. The system continues to evolve your creative strategy based on ongoing performance data.';
  }

  const descriptions: Record<JourneyMilestone, string> = {
    account_created: 'Create your account to begin.',
    profile_completed: 'Complete your business profile so we can understand your brand and target audience.',
    brand_kit_uploaded: 'Upload your brand assets (logo, colors, fonts) to establish visual consistency.',
    first_vif_generated: 'The system will generate your Visual Identity Fabric - a foundation for all creative output.',
    first_production_job: 'Your first production job will be created based on your brand foundation.',
    first_content_delivered: 'Content will be produced and delivered for your review.',
    performance_tracking_started: 'Performance tracking will begin once content is deployed.',
    first_performance_report: 'Your first performance report will show how content is performing across channels.',
    reactive_engine_activated: 'The reactive engine will start adjusting creative based on performance data.',
    first_optimization_cycle: 'Your first optimization cycle will refine content based on what resonates.',
    success_score_established: 'A success score will be calculated based on accumulated performance data.',
    creative_evolution_begun: 'The system will begin long-term creative evolution recommendations.',
  };

  return descriptions[nextMilestone];
}

export default {
  JOURNEY_PHASES,
  calculateJourneyState,
  getPhaseConfig,
  getMilestoneDisplayName,
  getNextStepDescription,
};
