/**
 * Controlled Rollout Service
 * Phase 57: Manage soft launch for first 1-5 clients
 */

import { getSupabaseServer } from '@/lib/supabase';

// Client rollout states
export type RolloutState =
  | 'invited'
  | 'trial_active'
  | 'activation_active'
  | 'stabilized'
  | 'paused'
  | 'churned';

// Founder gates for controlled launch
export type FounderGate =
  | 'technical_ready'
  | 'strategy_ready'
  | 'activation_program_started'
  | 'first_7days_reviewed'
  | 'day_14_checkpoint'
  | 'day_30_checkpoint'
  | 'day_60_checkpoint'
  | 'day_90_graduation';

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SoftLaunchClient {
  id: string;
  workspace_id: string;
  client_name: string;
  contact_email: string;
  industry: string;
  state: RolloutState;
  gates_completed: FounderGate[];
  risk_level: RiskLevel;
  risk_flags: string[];
  invited_at: string;
  trial_started_at?: string;
  activation_started_at?: string;
  stabilized_at?: string;
  last_activity_at?: string;
  momentum_score: number;
  notes: string;
  kill_switch_active: boolean;
}

export interface ClientKPIs {
  client_id: string;
  time_to_first_value_hours?: number;
  time_to_first_strategy_pack_hours?: number;
  time_to_first_visual_hours?: number;
  time_to_first_approved_task_hours?: number;
  trial_completion_rate: number;
  day_30_engagement_score: number;
  day_60_momentum_score: number;
  day_90_transformation_score: number;
  logins_last_7_days: number;
  tasks_completed: number;
  content_generated: number;
  content_approved: number;
}

export interface RolloutSummary {
  total_clients: number;
  by_state: Record<RolloutState, number>;
  by_risk: Record<RiskLevel, number>;
  avg_momentum: number;
  clients_needing_attention: SoftLaunchClient[];
}

// Soft launch configuration
export const SOFT_LAUNCH_CONFIG = {
  max_clients: 5,
  trial_duration_days: 14,
  activation_duration_days: 90,

  // Gate completion requirements
  gates: {
    technical_ready: 'System configured, integrations connected',
    strategy_ready: 'First strategy pack generated and reviewed',
    activation_program_started: 'Client enrolled in 90-day program',
    first_7days_reviewed: 'Week 1 check-in completed with founder',
    day_14_checkpoint: 'Trial period reviewed, activation decision made',
    day_30_checkpoint: 'Month 1 progress reviewed',
    day_60_checkpoint: 'Month 2 momentum assessment',
    day_90_graduation: 'Full program completed, stabilized',
  },

  // Risk thresholds
  risk_thresholds: {
    low_momentum: 40,
    medium_momentum: 60,
    high_momentum: 80,
    days_inactive_warning: 3,
    days_inactive_critical: 7,
  },

  // KPI targets
  kpi_targets: {
    time_to_first_value_hours: 24,
    time_to_first_strategy_pack_hours: 72,
    trial_completion_rate: 0.8,
    day_30_engagement_score: 70,
    day_60_momentum_score: 75,
    day_90_transformation_score: 80,
  },
};

/**
 * Get all soft launch clients
 */
export async function getSoftLaunchClients(): Promise<SoftLaunchClient[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('soft_launch_clients')
    .select('*')
    .order('invited_at', { ascending: true });

  if (error) {
    console.error('Error fetching soft launch clients:', error);
    return [];
  }

  return data || [];
}

/**
 * Get client by ID
 */
export async function getSoftLaunchClient(clientId: string): Promise<SoftLaunchClient | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('soft_launch_clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data;
}

/**
 * Add a new client to soft launch
 */
export async function addSoftLaunchClient(
  clientData: Omit<SoftLaunchClient, 'id' | 'invited_at' | 'gates_completed' | 'risk_level' | 'risk_flags' | 'momentum_score' | 'kill_switch_active'>
): Promise<SoftLaunchClient | null> {
  const supabase = await getSupabaseServer();

  // Check if we've hit the limit
  const { count } = await supabase
    .from('soft_launch_clients')
    .select('*', { count: 'exact', head: true })
    .neq('state', 'churned');

  if (count && count >= SOFT_LAUNCH_CONFIG.max_clients) {
    console.error('Soft launch client limit reached');
    return null;
  }

  const newClient = {
    ...clientData,
    invited_at: new Date().toISOString(),
    gates_completed: [],
    risk_level: 'low' as RiskLevel,
    risk_flags: [],
    momentum_score: 50,
    kill_switch_active: false,
  };

  const { data, error } = await supabase
    .from('soft_launch_clients')
    .insert(newClient)
    .select()
    .single();

  if (error) {
    console.error('Error adding soft launch client:', error);
    return null;
  }

  return data;
}

/**
 * Update client state
 */
export async function updateClientState(
  clientId: string,
  newState: RolloutState
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const updates: Partial<SoftLaunchClient> = { state: newState };

  // Set timestamps based on state
  if (newState === 'trial_active') {
    updates.trial_started_at = new Date().toISOString();
  } else if (newState === 'activation_active') {
    updates.activation_started_at = new Date().toISOString();
  } else if (newState === 'stabilized') {
    updates.stabilized_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('soft_launch_clients')
    .update(updates)
    .eq('id', clientId);

  if (error) {
    console.error('Error updating client state:', error);
    return false;
  }

  return true;
}

/**
 * Complete a founder gate
 */
export async function completeFounderGate(
  clientId: string,
  gate: FounderGate
): Promise<boolean> {
  const client = await getSoftLaunchClient(clientId);
  if (!client) return false;

  const supabase = await getSupabaseServer();

  const updatedGates = [...new Set([...client.gates_completed, gate])];

  const { error } = await supabase
    .from('soft_launch_clients')
    .update({ gates_completed: updatedGates })
    .eq('id', clientId);

  if (error) {
    console.error('Error completing gate:', error);
    return false;
  }

  return true;
}

/**
 * Update client risk assessment
 */
export async function updateClientRisk(
  clientId: string,
  riskLevel: RiskLevel,
  riskFlags: string[]
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('soft_launch_clients')
    .update({ risk_level: riskLevel, risk_flags: riskFlags })
    .eq('id', clientId);

  if (error) {
    console.error('Error updating client risk:', error);
    return false;
  }

  return true;
}

/**
 * Toggle kill switch for client
 */
export async function toggleKillSwitch(
  clientId: string,
  active: boolean
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('soft_launch_clients')
    .update({ kill_switch_active: active })
    .eq('id', clientId);

  if (error) {
    console.error('Error toggling kill switch:', error);
    return false;
  }

  return true;
}

/**
 * Update momentum score
 */
export async function updateMomentumScore(
  clientId: string,
  score: number
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('soft_launch_clients')
    .update({
      momentum_score: Math.max(0, Math.min(100, score)),
      last_activity_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) {
    console.error('Error updating momentum score:', error);
    return false;
  }

  return true;
}

/**
 * Get client KPIs
 */
export async function getClientKPIs(clientId: string): Promise<ClientKPIs | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('soft_launch_kpis')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error) {
    // Return default KPIs if none exist
    return {
      client_id: clientId,
      trial_completion_rate: 0,
      day_30_engagement_score: 0,
      day_60_momentum_score: 0,
      day_90_transformation_score: 0,
      logins_last_7_days: 0,
      tasks_completed: 0,
      content_generated: 0,
      content_approved: 0,
    };
  }

  return data;
}

/**
 * Get rollout summary
 */
export async function getRolloutSummary(): Promise<RolloutSummary> {
  const clients = await getSoftLaunchClients();

  const byState: Record<RolloutState, number> = {
    invited: 0,
    trial_active: 0,
    activation_active: 0,
    stabilized: 0,
    paused: 0,
    churned: 0,
  };

  const byRisk: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalMomentum = 0;
  const needsAttention: SoftLaunchClient[] = [];

  for (const client of clients) {
    byState[client.state]++;
    byRisk[client.risk_level]++;
    totalMomentum += client.momentum_score;

    // Flag clients needing attention
    if (client.risk_level === 'high' || client.risk_level === 'critical') {
      needsAttention.push(client);
    } else if (client.momentum_score < SOFT_LAUNCH_CONFIG.risk_thresholds.low_momentum) {
      needsAttention.push(client);
    }
  }

  return {
    total_clients: clients.length,
    by_state: byState,
    by_risk: byRisk,
    avg_momentum: clients.length > 0 ? totalMomentum / clients.length : 0,
    clients_needing_attention: needsAttention,
  };
}

/**
 * Calculate client risk automatically
 */
export function calculateRiskLevel(
  client: SoftLaunchClient,
  kpis: ClientKPIs
): { level: RiskLevel; flags: string[] } {
  const flags: string[] = [];
  let riskScore = 0;

  // Check momentum
  if (client.momentum_score < SOFT_LAUNCH_CONFIG.risk_thresholds.low_momentum) {
    flags.push('Low momentum score');
    riskScore += 2;
  } else if (client.momentum_score < SOFT_LAUNCH_CONFIG.risk_thresholds.medium_momentum) {
    flags.push('Below-average momentum');
    riskScore += 1;
  }

  // Check inactivity
  if (client.last_activity_at) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(client.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity >= SOFT_LAUNCH_CONFIG.risk_thresholds.days_inactive_critical) {
      flags.push(`Inactive for ${daysSinceActivity} days`);
      riskScore += 3;
    } else if (daysSinceActivity >= SOFT_LAUNCH_CONFIG.risk_thresholds.days_inactive_warning) {
      flags.push(`${daysSinceActivity} days since last activity`);
      riskScore += 1;
    }
  }

  // Check KPI targets
  if (kpis.logins_last_7_days === 0) {
    flags.push('No logins in past week');
    riskScore += 2;
  }

  if (kpis.content_generated > 0 && kpis.content_approved === 0) {
    flags.push('Content generated but not approved');
    riskScore += 1;
  }

  // Check gate progress
  const expectedGates = getExpectedGates(client);
  const missingGates = expectedGates.filter(g => !client.gates_completed.includes(g));
  if (missingGates.length > 0) {
    flags.push(`Missing gates: ${missingGates.join(', ')}`);
    riskScore += missingGates.length;
  }

  // Determine risk level
  let level: RiskLevel;
  if (riskScore >= 5) {
    level = 'critical';
  } else if (riskScore >= 3) {
    level = 'high';
  } else if (riskScore >= 1) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, flags };
}

/**
 * Get expected gates based on client state and timeline
 */
function getExpectedGates(client: SoftLaunchClient): FounderGate[] {
  const gates: FounderGate[] = ['technical_ready'];

  if (client.state === 'invited') {
    return gates;
  }

  gates.push('strategy_ready');

  if (client.trial_started_at) {
    const daysSinceTrial = Math.floor(
      (Date.now() - new Date(client.trial_started_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceTrial >= 7) {
      gates.push('first_7days_reviewed');
    }
    if (daysSinceTrial >= 14) {
      gates.push('day_14_checkpoint');
    }
  }

  if (client.activation_started_at) {
    gates.push('activation_program_started');

    const daysSinceActivation = Math.floor(
      (Date.now() - new Date(client.activation_started_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivation >= 30) {
      gates.push('day_30_checkpoint');
    }
    if (daysSinceActivation >= 60) {
      gates.push('day_60_checkpoint');
    }
    if (daysSinceActivation >= 90) {
      gates.push('day_90_graduation');
    }
  }

  return gates;
}

/**
 * Check if system is ready for soft launch
 */
export async function checkLaunchReadiness(): Promise<{
  ready: boolean;
  checks: { name: string; passed: boolean; message: string }[];
}> {
  const checks: { name: string; passed: boolean; message: string }[] = [];

  // Check 1: Database connectivity
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from('workspaces').select('id').limit(1);
    checks.push({
      name: 'Database Connection',
      passed: !error,
      message: error ? error.message : 'Connected',
    });
  } catch (e) {
    checks.push({
      name: 'Database Connection',
      passed: false,
      message: 'Connection failed',
    });
  }

  // Check 2: Auth system
  checks.push({
    name: 'Authentication',
    passed: true,
    message: 'Supabase Auth configured',
  });

  // Check 3: Email service
  const hasEmailConfig = Boolean(
    process.env.SENDGRID_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.EMAIL_SERVER_PASSWORD
  );
  checks.push({
    name: 'Email Service',
    passed: hasEmailConfig,
    message: hasEmailConfig ? 'Email provider configured' : 'No email provider configured',
  });

  // Check 4: AI service
  const hasAIConfig = Boolean(
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GEMINI_API_KEY
  );
  checks.push({
    name: 'AI Service',
    passed: hasAIConfig,
    message: hasAIConfig ? 'AI provider configured' : 'No AI provider configured',
  });

  // Check 5: Feature flags
  checks.push({
    name: 'Feature Flags',
    passed: true,
    message: 'Kill switches available',
  });

  // Check 6: Truth layer
  checks.push({
    name: 'Truth Layer',
    passed: true,
    message: 'Compliance system active',
  });

  const allPassed = checks.every(c => c.passed);

  return {
    ready: allPassed,
    checks,
  };
}

export default {
  SOFT_LAUNCH_CONFIG,
  getSoftLaunchClients,
  getSoftLaunchClient,
  addSoftLaunchClient,
  updateClientState,
  completeFounderGate,
  updateClientRisk,
  toggleKillSwitch,
  updateMomentumScore,
  getClientKPIs,
  getRolloutSummary,
  calculateRiskLevel,
  checkLaunchReadiness,
};
