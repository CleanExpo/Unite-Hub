/**
 * Alignment Engine
 * Phase 73: Unify all first-90-days systems into a single alignment view
 */

export type AlignmentDimension =
  | 'momentum'
  | 'clarity'
  | 'workload'
  | 'quality'
  | 'engagement';

export interface DimensionScore {
  dimension: AlignmentDimension;
  score: number; // 0-100
  weight: number; // 0-1, must sum to 1
  status: 'strong' | 'healthy' | 'needs_attention' | 'critical';
  contributing_factors: string[];
  data_availability: 'full' | 'partial' | 'insufficient';
}

export interface AlignmentBlocker {
  blocker_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_dimensions: AlignmentDimension[];
  suggested_action: string;
  days_blocked?: number;
}

export interface AlignmentOpportunity {
  opportunity_id: string;
  potential: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_dimensions: AlignmentDimension[];
  next_step: string;
  effort: 'low' | 'medium' | 'high';
}

export interface AlignmentWin {
  win_id: string;
  title: string;
  description: string;
  dimension: AlignmentDimension;
  occurred_at: string;
}

export interface AlignmentReport {
  workspace_id: string;
  client_name: string;
  timestamp: string;
  overall_score: number;
  overall_status: 'aligned' | 'mostly_aligned' | 'needs_attention' | 'misaligned';
  dimensions: DimensionScore[];
  blockers: AlignmentBlocker[];
  opportunities: AlignmentOpportunity[];
  recent_wins: AlignmentWin[];
  journey_day: number;
  journey_phase: string;
  data_completeness: number; // 0-100, how much real data we have
}

// Dimension weights - transparent and documented
const DIMENSION_WEIGHTS: Record<AlignmentDimension, number> = {
  momentum: 0.25,    // Progress velocity
  clarity: 0.20,     // Clear next steps and communication
  workload: 0.15,    // Production capacity balance
  quality: 0.20,     // Content and deliverable quality
  engagement: 0.20,  // Audience and client engagement
};

/**
 * Calculate alignment score for a single dimension
 */
function calculateDimensionScore(
  dimension: AlignmentDimension,
  data: AlignmentDataInput
): DimensionScore {
  let score = 0;
  let dataPoints = 0;
  let availablePoints = 0;
  const factors: string[] = [];

  switch (dimension) {
    case 'momentum': {
      // Based on: milestone completion rate, production velocity, days active
      if (data.milestonesCompleted !== undefined && data.totalMilestones !== undefined) {
        const milestoneRate = (data.milestonesCompleted / data.totalMilestones) * 100;
        score += milestoneRate * 0.4;
        dataPoints++;
        factors.push(`${data.milestonesCompleted}/${data.totalMilestones} milestones`);
      }
      availablePoints++;

      if (data.productionJobsCompleted !== undefined) {
        const velocityScore = Math.min(data.productionJobsCompleted * 10, 100);
        score += velocityScore * 0.3;
        dataPoints++;
        factors.push(`${data.productionJobsCompleted} jobs completed`);
      }
      availablePoints++;

      if (data.journeyDay !== undefined && data.journeyDay > 0) {
        // Normalize day progress (higher score if on track)
        const expectedProgress = (data.journeyDay / 90) * 100;
        const actualProgress = data.milestonesCompleted !== undefined && data.totalMilestones !== undefined
          ? (data.milestonesCompleted / data.totalMilestones) * 100
          : 50;
        const progressDiff = actualProgress - expectedProgress;
        const dayScore = Math.max(0, Math.min(100, 50 + progressDiff));
        score += dayScore * 0.3;
        dataPoints++;
        factors.push(`Day ${data.journeyDay}/90`);
      }
      availablePoints++;
      break;
    }

    case 'clarity': {
      // Based on: profile completeness, brand kit, communication frequency
      if (data.profileCompleted !== undefined) {
        score += data.profileCompleted ? 40 : 0;
        dataPoints++;
        factors.push(data.profileCompleted ? 'Profile complete' : 'Profile incomplete');
      }
      availablePoints++;

      if (data.brandKitUploaded !== undefined) {
        score += data.brandKitUploaded ? 30 : 0;
        dataPoints++;
        factors.push(data.brandKitUploaded ? 'Brand kit uploaded' : 'Brand kit missing');
      }
      availablePoints++;

      if (data.lastCommunicationDays !== undefined) {
        const commScore = data.lastCommunicationDays <= 3 ? 30 :
                          data.lastCommunicationDays <= 7 ? 20 : 10;
        score += commScore;
        dataPoints++;
        factors.push(`Last contact ${data.lastCommunicationDays}d ago`);
      }
      availablePoints++;
      break;
    }

    case 'workload': {
      // Based on: production queue balance, pending approvals
      if (data.pendingProduction !== undefined && data.completedProduction !== undefined) {
        const total = data.pendingProduction + data.completedProduction;
        if (total > 0) {
          const completionRate = (data.completedProduction / total) * 100;
          score += completionRate * 0.6;
          dataPoints++;
          factors.push(`${data.completedProduction}/${total} production complete`);
        }
      }
      availablePoints++;

      if (data.pendingApprovals !== undefined) {
        const approvalScore = data.pendingApprovals === 0 ? 40 :
                              data.pendingApprovals <= 2 ? 30 :
                              data.pendingApprovals <= 5 ? 20 : 10;
        score += approvalScore;
        dataPoints++;
        factors.push(`${data.pendingApprovals} pending approvals`);
      }
      availablePoints++;
      break;
    }

    case 'quality': {
      // Based on: success score, brand alignment, revision rate
      if (data.successScore !== undefined) {
        score += data.successScore * 0.5;
        dataPoints++;
        factors.push(`Success score: ${data.successScore}`);
      }
      availablePoints++;

      if (data.brandAlignmentScore !== undefined) {
        score += data.brandAlignmentScore * 0.3;
        dataPoints++;
        factors.push(`Brand alignment: ${data.brandAlignmentScore}`);
      }
      availablePoints++;

      if (data.revisionRate !== undefined) {
        // Lower revision rate = higher quality score
        const revScore = Math.max(0, 100 - (data.revisionRate * 100)) * 0.2;
        score += revScore;
        dataPoints++;
        factors.push(`Revision rate: ${(data.revisionRate * 100).toFixed(0)}%`);
      }
      availablePoints++;
      break;
    }

    case 'engagement': {
      // Based on: performance metrics, client activity, feedback
      if (data.engagementRate !== undefined) {
        const engScore = Math.min(data.engagementRate * 1000, 100) * 0.5;
        score += engScore;
        dataPoints++;
        factors.push(`Engagement rate: ${(data.engagementRate * 100).toFixed(1)}%`);
      }
      availablePoints++;

      if (data.clientLoginDays !== undefined) {
        const activityScore = data.clientLoginDays <= 1 ? 30 :
                              data.clientLoginDays <= 3 ? 25 :
                              data.clientLoginDays <= 7 ? 15 : 5;
        score += activityScore;
        dataPoints++;
        factors.push(`Last login ${data.clientLoginDays}d ago`);
      }
      availablePoints++;

      if (data.feedbackCount !== undefined) {
        const feedbackScore = Math.min(data.feedbackCount * 5, 20);
        score += feedbackScore;
        dataPoints++;
        factors.push(`${data.feedbackCount} feedback items`);
      }
      availablePoints++;
      break;
    }
  }

  // Normalize score based on available data
  const normalizedScore = dataPoints > 0 ? score / (dataPoints / availablePoints) : 0;
  const finalScore = Math.min(100, Math.max(0, normalizedScore));

  // Determine data availability
  const availability = dataPoints === availablePoints ? 'full' :
                       dataPoints >= availablePoints / 2 ? 'partial' : 'insufficient';

  // Determine status
  const status = finalScore >= 70 ? 'strong' :
                 finalScore >= 50 ? 'healthy' :
                 finalScore >= 30 ? 'needs_attention' : 'critical';

  return {
    dimension,
    score: Math.round(finalScore),
    weight: DIMENSION_WEIGHTS[dimension],
    status,
    contributing_factors: factors,
    data_availability: availability,
  };
}

export interface AlignmentDataInput {
  workspaceId: string;
  clientName: string;
  journeyDay: number;
  journeyPhase: string;

  // Momentum
  milestonesCompleted?: number;
  totalMilestones?: number;
  productionJobsCompleted?: number;

  // Clarity
  profileCompleted?: boolean;
  brandKitUploaded?: boolean;
  lastCommunicationDays?: number;

  // Workload
  pendingProduction?: number;
  completedProduction?: number;
  pendingApprovals?: number;

  // Quality
  successScore?: number;
  brandAlignmentScore?: number;
  revisionRate?: number;

  // Engagement
  engagementRate?: number;
  clientLoginDays?: number;
  feedbackCount?: number;
}

/**
 * Generate full alignment report
 */
export function generateAlignmentReport(data: AlignmentDataInput): AlignmentReport {
  const timestamp = new Date().toISOString();

  // Calculate dimension scores
  const dimensions: DimensionScore[] = [
    calculateDimensionScore('momentum', data),
    calculateDimensionScore('clarity', data),
    calculateDimensionScore('workload', data),
    calculateDimensionScore('quality', data),
    calculateDimensionScore('engagement', data),
  ];

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight), 0)
  );

  // Determine overall status
  const overallStatus = overallScore >= 70 ? 'aligned' :
                        overallScore >= 50 ? 'mostly_aligned' :
                        overallScore >= 30 ? 'needs_attention' : 'misaligned';

  // Calculate data completeness
  const fullData = dimensions.filter(d => d.data_availability === 'full').length;
  const partialData = dimensions.filter(d => d.data_availability === 'partial').length;
  const dataCompleteness = Math.round(((fullData * 100) + (partialData * 50)) / dimensions.length);

  // Detect blockers
  const blockers = detectBlockers(data, dimensions);

  // Detect opportunities
  const opportunities = detectOpportunities(data, dimensions);

  // Detect recent wins
  const recentWins = detectWins(data, dimensions);

  return {
    workspace_id: data.workspaceId,
    client_name: data.clientName,
    timestamp,
    overall_score: overallScore,
    overall_status: overallStatus,
    dimensions,
    blockers,
    opportunities,
    recent_wins: recentWins,
    journey_day: data.journeyDay,
    journey_phase: data.journeyPhase,
    data_completeness: dataCompleteness,
  };
}

/**
 * Detect blockers from data
 */
function detectBlockers(
  data: AlignmentDataInput,
  dimensions: DimensionScore[]
): AlignmentBlocker[] {
  const blockers: AlignmentBlocker[] = [];

  // Brand kit not uploaded
  if (data.brandKitUploaded === false && data.journeyDay > 7) {
    blockers.push({
      blocker_id: `blocker_brandkit_${Date.now()}`,
      severity: 'high',
      title: 'Brand Kit Not Uploaded',
      description: 'Visual Identity Fabric cannot be generated without brand assets. This blocks all content production.',
      affected_dimensions: ['clarity', 'momentum', 'quality'],
      suggested_action: 'Upload logo, colors, and fonts to proceed with VIF generation',
      days_blocked: data.journeyDay - 7,
    });
  }

  // Profile incomplete
  if (data.profileCompleted === false && data.journeyDay > 3) {
    blockers.push({
      blocker_id: `blocker_profile_${Date.now()}`,
      severity: 'medium',
      title: 'Profile Incomplete',
      description: 'Missing business information limits content personalization accuracy.',
      affected_dimensions: ['clarity', 'quality'],
      suggested_action: 'Complete business profile with target audience and messaging preferences',
    });
  }

  // High pending approvals
  if (data.pendingApprovals !== undefined && data.pendingApprovals > 5) {
    blockers.push({
      blocker_id: `blocker_approvals_${Date.now()}`,
      severity: 'medium',
      title: 'Approval Queue Backup',
      description: `${data.pendingApprovals} items awaiting review. Production is blocked until approvals are processed.`,
      affected_dimensions: ['workload', 'momentum'],
      suggested_action: 'Review and approve or reject pending items',
    });
  }

  // Low engagement rate
  if (data.engagementRate !== undefined && data.engagementRate < 0.01 && data.journeyDay > 45) {
    blockers.push({
      blocker_id: `blocker_engagement_${Date.now()}`,
      severity: 'high',
      title: 'Low Engagement Rate',
      description: 'Content is not resonating with audience. Performance metrics indicate need for creative adjustment.',
      affected_dimensions: ['engagement', 'quality'],
      suggested_action: 'Review performance data and adjust creative strategy',
    });
  }

  // No communication
  if (data.lastCommunicationDays !== undefined && data.lastCommunicationDays > 14) {
    blockers.push({
      blocker_id: `blocker_comm_${Date.now()}`,
      severity: 'low',
      title: 'Communication Gap',
      description: `No contact in ${data.lastCommunicationDays} days. Client may have questions or concerns.`,
      affected_dimensions: ['clarity'],
      suggested_action: 'Reach out to check in and confirm alignment',
    });
  }

  return blockers.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Detect opportunities from data
 */
function detectOpportunities(
  data: AlignmentDataInput,
  dimensions: DimensionScore[]
): AlignmentOpportunity[] {
  const opportunities: AlignmentOpportunity[] = [];

  // High engagement - can expand
  if (data.engagementRate !== undefined && data.engagementRate > 0.05) {
    opportunities.push({
      opportunity_id: `opp_expand_${Date.now()}`,
      potential: 'high',
      title: 'Strong Engagement - Expand Reach',
      description: 'Content is performing well. Consider increasing posting frequency or testing new channels.',
      affected_dimensions: ['engagement', 'momentum'],
      next_step: 'Review top-performing content and create similar variations',
      effort: 'medium',
    });
  }

  // Good momentum - accelerate
  const momentumDim = dimensions.find(d => d.dimension === 'momentum');
  if (momentumDim && momentumDim.score >= 70 && data.journeyDay < 60) {
    opportunities.push({
      opportunity_id: `opp_accelerate_${Date.now()}`,
      potential: 'high',
      title: 'On Track - Opportunity to Accelerate',
      description: 'Journey progress is ahead of schedule. Can introduce advanced features earlier.',
      affected_dimensions: ['momentum'],
      next_step: 'Consider enabling Reactive Engine or A/B testing',
      effort: 'low',
    });
  }

  // Quality high - showcase
  if (data.successScore !== undefined && data.successScore >= 75) {
    opportunities.push({
      opportunity_id: `opp_showcase_${Date.now()}`,
      potential: 'medium',
      title: 'High Success Score - Showcase Work',
      description: 'Quality metrics are strong. This work could be featured as a case study.',
      affected_dimensions: ['quality'],
      next_step: 'Request permission to create case study or portfolio piece',
      effort: 'low',
    });
  }

  // Low revision rate - increase volume
  if (data.revisionRate !== undefined && data.revisionRate < 0.1) {
    opportunities.push({
      opportunity_id: `opp_volume_${Date.now()}`,
      potential: 'medium',
      title: 'Low Revision Rate - Increase Output',
      description: 'Content is consistently approved. Production capacity could support higher volume.',
      affected_dimensions: ['workload', 'momentum'],
      next_step: 'Discuss increasing content volume with client',
      effort: 'medium',
    });
  }

  return opportunities;
}

/**
 * Detect recent wins from data
 */
function detectWins(
  data: AlignmentDataInput,
  dimensions: DimensionScore[]
): AlignmentWin[] {
  const wins: AlignmentWin[] = [];

  // Profile completed
  if (data.profileCompleted) {
    wins.push({
      win_id: `win_profile_${Date.now()}`,
      title: 'Profile Completed',
      description: 'Business profile setup is complete',
      dimension: 'clarity',
      occurred_at: new Date().toISOString(),
    });
  }

  // Brand kit uploaded
  if (data.brandKitUploaded) {
    wins.push({
      win_id: `win_brandkit_${Date.now()}`,
      title: 'Brand Kit Uploaded',
      description: 'Brand assets are ready for VIF generation',
      dimension: 'clarity',
      occurred_at: new Date().toISOString(),
    });
  }

  // Production milestones
  if (data.productionJobsCompleted !== undefined && data.productionJobsCompleted >= 5) {
    wins.push({
      win_id: `win_production_${Date.now()}`,
      title: `${data.productionJobsCompleted} Jobs Completed`,
      description: 'Production milestone reached',
      dimension: 'momentum',
      occurred_at: new Date().toISOString(),
    });
  }

  // Good success score
  if (data.successScore !== undefined && data.successScore >= 60) {
    wins.push({
      win_id: `win_success_${Date.now()}`,
      title: 'Healthy Success Score',
      description: `Current success score: ${data.successScore}`,
      dimension: 'quality',
      occurred_at: new Date().toISOString(),
    });
  }

  return wins.slice(0, 5); // Limit to 5 most recent
}

/**
 * Get dimension display name
 */
export function getDimensionDisplayName(dimension: AlignmentDimension): string {
  const names: Record<AlignmentDimension, string> = {
    momentum: 'Momentum',
    clarity: 'Clarity',
    workload: 'Workload',
    quality: 'Quality',
    engagement: 'Engagement',
  };
  return names[dimension];
}

/**
 * Get dimension description
 */
export function getDimensionDescription(dimension: AlignmentDimension): string {
  const descriptions: Record<AlignmentDimension, string> = {
    momentum: 'Progress velocity through the 90-day journey',
    clarity: 'Clear communication and complete information',
    workload: 'Production capacity and approval flow',
    quality: 'Content quality and brand alignment',
    engagement: 'Audience response and client activity',
  };
  return descriptions[dimension];
}

export default {
  generateAlignmentReport,
  getDimensionDisplayName,
  getDimensionDescription,
  DIMENSION_WEIGHTS,
};
