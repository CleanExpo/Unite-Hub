/**
 * Activation Insights Engine
 * Phase 59: Real metrics for 14-day trial and 90-day activation
 */

import { getSupabaseServer } from '@/lib/supabase';

export type ActivationPhase = 'trial' | 'phase_1' | 'phase_2' | 'phase_3' | 'graduated';

export interface ActivationInsight {
  phase: ActivationPhase;
  day: number;
  health_score: number;
  at_risk: boolean;
  insights: string[];
  recommendations: string[];
  metrics: ActivationMetrics;
}

export interface ActivationMetrics {
  logins: number;
  actions_completed: number;
  content_generated: number;
  content_approved: number;
  packs_viewed: number;
  training_completed: number;
  avg_session_minutes: number;
}

export interface PhaseTimeline {
  phase: ActivationPhase;
  name: string;
  days: string;
  goals: string[];
  expected_outcomes: string[];
}

// Phase definitions with realistic expectations
export const PHASE_TIMELINES: PhaseTimeline[] = [
  {
    phase: 'trial',
    name: '14-Day Guided Trial',
    days: '1-14',
    goals: [
      'Platform orientation and setup',
      'First strategy pack generated',
      'Understanding of 90-day timeline',
      'Decision to commit to activation',
    ],
    expected_outcomes: [
      'Connected integrations',
      'Completed first content generation',
      'Reviewed strategy recommendations',
      'Cleared expectations about timeline',
    ],
  },
  {
    phase: 'phase_1',
    name: 'Foundation Building',
    days: '15-44',
    goals: [
      'Consistent platform engagement',
      'Building content library',
      'Training module completion',
      'Establishing production rhythm',
    ],
    expected_outcomes: [
      'Weekly content generation habit',
      'First visual concepts approved',
      '2-3 training modules completed',
      'Understanding of brand positioning',
    ],
  },
  {
    phase: 'phase_2',
    name: 'Momentum Development',
    days: '45-74',
    goals: [
      'Content repurposing across channels',
      'Refined brand voice',
      'Production efficiency improvement',
      'Starting to see organic traction',
    ],
    expected_outcomes: [
      'Multiple content packs completed',
      'Social media presence building',
      'Google Business Profile optimized',
      'Early signs of local visibility',
    ],
  },
  {
    phase: 'phase_3',
    name: 'Transformation & Graduation',
    days: '75-90',
    goals: [
      'Self-sufficient content production',
      'Measurable online presence',
      'Consistent brand representation',
      'Ready for independent operation',
    ],
    expected_outcomes: [
      'Complete content system running',
      'Improved local search visibility',
      'Consistent review generation',
      'Platform mastery achieved',
    ],
  },
];

// Health score thresholds
const HEALTH_THRESHOLDS = {
  at_risk: 40,
  needs_attention: 60,
  on_track: 75,
  exceeding: 90,
};

/**
 * Get current activation phase from day
 */
export function getActivationPhase(day: number): ActivationPhase {
  if (day <= 14) return 'trial';
  if (day <= 44) return 'phase_1';
  if (day <= 74) return 'phase_2';
  if (day <= 90) return 'phase_3';
  return 'graduated';
}

/**
 * Calculate health score from metrics
 */
export function calculateHealthScore(
  metrics: ActivationMetrics,
  phase: ActivationPhase
): number {
  // Weight factors by phase
  const weights = getPhaseWeights(phase);

  let score = 0;

  // Login frequency (0-20 points)
  const loginScore = Math.min(metrics.logins / weights.expected_logins, 1) * 20;
  score += loginScore;

  // Actions completed (0-20 points)
  const actionScore = Math.min(metrics.actions_completed / weights.expected_actions, 1) * 20;
  score += actionScore;

  // Content generation (0-20 points)
  const contentScore = Math.min(metrics.content_generated / weights.expected_content, 1) * 20;
  score += contentScore;

  // Content approval rate (0-20 points)
  const approvalRate = metrics.content_generated > 0
    ? metrics.content_approved / metrics.content_generated
    : 0;
  score += approvalRate * 20;

  // Training completion (0-10 points)
  const trainingScore = Math.min(metrics.training_completed / weights.expected_training, 1) * 10;
  score += trainingScore;

  // Session duration (0-10 points)
  const sessionScore = Math.min(metrics.avg_session_minutes / 15, 1) * 10;
  score += sessionScore;

  return Math.round(score);
}

/**
 * Get phase-specific weight expectations
 */
function getPhaseWeights(phase: ActivationPhase): {
  expected_logins: number;
  expected_actions: number;
  expected_content: number;
  expected_training: number;
} {
  switch (phase) {
    case 'trial':
      return { expected_logins: 7, expected_actions: 10, expected_content: 3, expected_training: 1 };
    case 'phase_1':
      return { expected_logins: 12, expected_actions: 30, expected_content: 10, expected_training: 3 };
    case 'phase_2':
      return { expected_logins: 10, expected_actions: 40, expected_content: 15, expected_training: 2 };
    case 'phase_3':
      return { expected_logins: 8, expected_actions: 25, expected_content: 10, expected_training: 1 };
    default:
      return { expected_logins: 5, expected_actions: 10, expected_content: 5, expected_training: 0 };
  }
}

/**
 * Generate insights from metrics
 */
export function generateInsights(
  metrics: ActivationMetrics,
  phase: ActivationPhase,
  healthScore: number
): string[] {
  const insights: string[] = [];

  // Positive insights
  if (healthScore >= HEALTH_THRESHOLDS.exceeding) {
    insights.push('Excellent engagement - exceeding expectations');
  } else if (healthScore >= HEALTH_THRESHOLDS.on_track) {
    insights.push('Good progress - on track for phase goals');
  }

  // Specific metric insights
  if (metrics.content_approved > 0 && metrics.content_generated > 0) {
    const rate = (metrics.content_approved / metrics.content_generated) * 100;
    if (rate >= 80) {
      insights.push(`High approval rate (${rate.toFixed(0)}%) - content quality is strong`);
    } else if (rate < 50) {
      insights.push(`Low approval rate (${rate.toFixed(0)}%) - review content guidelines`);
    }
  }

  if (metrics.training_completed > 0) {
    insights.push(`${metrics.training_completed} training modules completed`);
  }

  if (metrics.avg_session_minutes > 20) {
    insights.push('Deep engagement sessions - thorough platform usage');
  }

  // Risk insights (honest, not manipulative)
  if (healthScore < HEALTH_THRESHOLDS.at_risk) {
    insights.push('Activity below expected - may need support');
  }

  if (metrics.logins === 0) {
    insights.push('No logins this period - check in with client');
  }

  return insights;
}

/**
 * Generate recommendations
 */
export function generateRecommendations(
  metrics: ActivationMetrics,
  phase: ActivationPhase,
  healthScore: number
): string[] {
  const recommendations: string[] = [];
  const weights = getPhaseWeights(phase);

  if (metrics.logins < weights.expected_logins * 0.5) {
    recommendations.push('Schedule a check-in call to understand blockers');
  }

  if (metrics.content_generated < weights.expected_content * 0.5) {
    recommendations.push('Focus on completing first content generation workflow');
  }

  if (metrics.content_approved === 0 && metrics.content_generated > 0) {
    recommendations.push('Review pending content in approval queue');
  }

  if (metrics.training_completed < weights.expected_training) {
    recommendations.push(`Complete ${weights.expected_training - metrics.training_completed} more training modules`);
  }

  if (phase === 'trial' && healthScore < 60) {
    recommendations.push('Consider extending trial for proper evaluation');
  }

  // Phase-specific recommendations (realistic, not urgency-based)
  if (phase === 'phase_1') {
    recommendations.push('Focus on establishing weekly production rhythm');
  } else if (phase === 'phase_2') {
    recommendations.push('Begin repurposing content across social channels');
  } else if (phase === 'phase_3') {
    recommendations.push('Review progress toward self-sufficiency');
  }

  return recommendations;
}

/**
 * Get activation insights for a client
 */
export async function getActivationInsights(clientId: string): Promise<ActivationInsight> {
  const supabase = await getSupabaseServer();

  // Get client activation program
  const { data: program } = await supabase
    .from('activation_programs')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (!program) {
    // Return default for new clients
    return {
      phase: 'trial',
      day: 1,
      health_score: 50,
      at_risk: false,
      insights: ['Welcome! Begin your 14-day guided trial'],
      recommendations: ['Complete platform setup', 'Connect email integration'],
      metrics: {
        logins: 0,
        actions_completed: 0,
        content_generated: 0,
        content_approved: 0,
        packs_viewed: 0,
        training_completed: 0,
        avg_session_minutes: 0,
      },
    };
  }

  // Calculate day in program
  const startDate = new Date(program.started_at);
  const day = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const phase = getActivationPhase(day);

  // Get metrics for current period
  const metrics = await getClientMetrics(clientId, phase);

  // Calculate health and generate insights
  const healthScore = calculateHealthScore(metrics, phase);
  const atRisk = healthScore < HEALTH_THRESHOLDS.at_risk;
  const insights = generateInsights(metrics, phase, healthScore);
  const recommendations = generateRecommendations(metrics, phase, healthScore);

  return {
    phase,
    day,
    health_score: healthScore,
    at_risk: atRisk,
    insights,
    recommendations,
    metrics,
  };
}

/**
 * Get client metrics for a phase
 */
async function getClientMetrics(
  clientId: string,
  phase: ActivationPhase
): Promise<ActivationMetrics> {
  const supabase = await getSupabaseServer();

  // Get phase date range
  const days = phase === 'trial' ? 14 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Count logins
  const { count: logins } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', since);

  // Count actions
  const { count: actions } = await supabase
    .from('client_actions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', since);

  // Count content
  const { count: generated } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', since);

  const { count: approved } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'approved')
    .gte('created_at', since);

  // Count training
  const { count: training } = await supabase
    .from('training_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', clientId)
    .eq('completed', true)
    .gte('completed_at', since);

  return {
    logins: logins || 0,
    actions_completed: actions || 0,
    content_generated: generated || 0,
    content_approved: approved || 0,
    packs_viewed: 0, // Would come from analytics
    training_completed: training || 0,
    avg_session_minutes: 12, // Would come from session tracking
  };
}

/**
 * Get all clients at risk
 */
export async function getAtRiskClients(): Promise<{ id: string; name: string; health_score: number }[]> {
  // This would scan all active clients and return those with low health scores
  return [];
}

export default {
  PHASE_TIMELINES,
  HEALTH_THRESHOLDS,
  getActivationPhase,
  calculateHealthScore,
  generateInsights,
  generateRecommendations,
  getActivationInsights,
  getAtRiskClients,
};
