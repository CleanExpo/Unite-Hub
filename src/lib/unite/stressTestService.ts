/**
 * Stress Test Service
 * Phase: D71 - Unite System Stress-Test Engine
 *
 * Controlled load testing with AI-powered result analysis.
 * CRITICAL: Never impacts production tenants - isolated test environments only.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface StressProfile {
  id: string;
  name: string;
  description?: string;
  target_system: string;
  load_pattern: {
    type: 'constant' | 'ramp' | 'spike';
    requests_per_second: number;
  };
  duration_seconds: number;
  concurrent_users: number;
  ramp_up_seconds?: number;
  tenant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StressRun {
  id: string;
  profile_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  metrics?: {
    requests_total: number;
    requests_per_second: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    error_rate: number;
  };
  errors?: {
    total_errors: number;
    error_types: Array<{
      type: string;
      count: number;
      sample: string;
    }>;
  };
  ai_summary?: string;
  ai_insights?: {
    bottlenecks: string[];
    recommendations: string[];
    severity: 'low' | 'medium' | 'high';
  };
  tenant_id?: string;
  created_at: string;
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

export async function createStressProfile(
  input: Omit<StressProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<StressProfile> {
  const { data, error } = await supabaseAdmin
    .from('unite_stress_profiles')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create stress profile: ${error.message}`);
  return data as StressProfile;
}

export async function listStressProfiles(filters?: {
  tenant_id?: string;
  target_system?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<StressProfile[]> {
  let query = supabaseAdmin
    .from('unite_stress_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.target_system) query = query.eq('target_system', filters.target_system);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list stress profiles: ${error.message}`);
  return data as StressProfile[];
}

export async function getStressProfile(profileId: string): Promise<StressProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_stress_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get stress profile: ${error.message}`);
  }

  return data as StressProfile;
}

export async function updateStressProfile(
  profileId: string,
  updates: Partial<Omit<StressProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<StressProfile> {
  const { data, error } = await supabaseAdmin
    .from('unite_stress_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update stress profile: ${error.message}`);
  return data as StressProfile;
}

export async function deleteStressProfile(profileId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_stress_profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw new Error(`Failed to delete stress profile: ${error.message}`);
}

// ============================================================================
// STRESS TEST EXECUTION
// ============================================================================

export async function runStressTest(
  profileId: string,
  tenantId: string | null
): Promise<StressRun> {
  // Get profile
  const profile = await getStressProfile(profileId);
  if (!profile) {
    throw new Error('Stress profile not found');
  }

  // Create run record
  const { data: run, error: createError } = await supabaseAdmin
    .from('unite_stress_runs')
    .insert({
      profile_id: profileId,
      status: 'pending',
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (createError) throw new Error(`Failed to create stress run: ${createError.message}`);

  // Mark as running
  await updateStressRunStatus(run.id, 'running', {
    started_at: new Date().toISOString(),
  });

  // Execute stress test (simulated - never impacts production)
  const results = await executeStressTestSimulation(profile);

  // Update with results
  await supabaseAdmin
    .from('unite_stress_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metrics: results.metrics,
      errors: results.errors,
    })
    .eq('id', run.id);

  // Generate AI analysis
  const aiAnalysis = await analyzeStressTestResults(profile, results);

  // Update with AI insights
  const { data: finalRun, error: updateError } = await supabaseAdmin
    .from('unite_stress_runs')
    .update({
      ai_summary: aiAnalysis.summary,
      ai_insights: aiAnalysis.insights,
    })
    .eq('id', run.id)
    .select()
    .single();

  if (updateError) throw new Error(`Failed to update stress run: ${updateError.message}`);
  return finalRun as StressRun;
}

export async function getStressRun(runId: string): Promise<StressRun | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_stress_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get stress run: ${error.message}`);
  }

  return data as StressRun;
}

export async function listStressRuns(filters?: {
  tenant_id?: string;
  profile_id?: string;
  status?: string;
  limit?: number;
}): Promise<StressRun[]> {
  let query = supabaseAdmin
    .from('unite_stress_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.profile_id) query = query.eq('profile_id', filters.profile_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list stress runs: ${error.message}`);
  return data as StressRun[];
}

export async function cancelStressRun(runId: string): Promise<void> {
  await updateStressRunStatus(runId, 'cancelled', {
    completed_at: new Date().toISOString(),
  });
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

async function updateStressRunStatus(
  runId: string,
  status: StressRun['status'],
  updates?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_stress_runs')
    .update({ status, ...updates })
    .eq('id', runId);

  if (error) throw new Error(`Failed to update stress run status: ${error.message}`);
}

/**
 * CRITICAL: This is a SIMULATION - never impacts production
 * In a real implementation, this would use isolated test environments
 */
async function executeStressTestSimulation(profile: StressProfile): Promise<{
  metrics: StressRun['metrics'];
  errors: StressRun['errors'];
}> {
  // Simulate test execution based on profile
  const { duration_seconds, concurrent_users, load_pattern } = profile;
  const totalRequests = duration_seconds * load_pattern.requests_per_second;

  // Simulate realistic metrics with some variance
  const baseLatency = 50 + Math.random() * 100;
  const errorRate = Math.random() * 0.05; // 0-5% error rate

  const metrics = {
    requests_total: totalRequests,
    requests_per_second: load_pattern.requests_per_second,
    avg_latency_ms: Math.round(baseLatency),
    p95_latency_ms: Math.round(baseLatency * 1.5),
    p99_latency_ms: Math.round(baseLatency * 2),
    error_rate: Number(errorRate.toFixed(4)),
  };

  const totalErrors = Math.round(totalRequests * errorRate);
  const errors = {
    total_errors: totalErrors,
    error_types: [
      {
        type: 'timeout',
        count: Math.round(totalErrors * 0.4),
        sample: 'Request timeout after 30s',
      },
      {
        type: 'connection_refused',
        count: Math.round(totalErrors * 0.3),
        sample: 'Connection refused by server',
      },
      {
        type: 'rate_limit',
        count: Math.round(totalErrors * 0.3),
        sample: 'Rate limit exceeded',
      },
    ].filter((e) => e.count > 0),
  };

  // Simulate execution time (very brief)
  await new Promise((resolve) => setTimeout(resolve, 100));

  return { metrics, errors };
}

async function analyzeStressTestResults(
  profile: StressProfile,
  results: {
    metrics: StressRun['metrics'];
    errors: StressRun['errors'];
  }
): Promise<{
  summary: string;
  insights: StressRun['ai_insights'];
}> {
  try {
    if (!results.metrics) {
      return {
        summary: 'No metrics available for analysis',
        insights: {
          bottlenecks: [],
          recommendations: [],
          severity: 'low',
        },
      };
    }

    const anthropic = getAnthropicClient();

    const prompt = `Analyze this stress test result:

Profile:
- Target System: ${profile.target_system}
- Load Pattern: ${profile.load_pattern.type} (${profile.load_pattern.requests_per_second} req/s)
- Duration: ${profile.duration_seconds}s
- Concurrent Users: ${profile.concurrent_users}

Metrics:
- Total Requests: ${results.metrics.requests_total}
- RPS: ${results.metrics.requests_per_second}
- Avg Latency: ${results.metrics.avg_latency_ms}ms
- P95 Latency: ${results.metrics.p95_latency_ms}ms
- P99 Latency: ${results.metrics.p99_latency_ms}ms
- Error Rate: ${(results.metrics.error_rate * 100).toFixed(2)}%

Errors:
- Total: ${results.errors?.total_errors || 0}
- Types: ${results.errors?.error_types.map((e) => `${e.type} (${e.count})`).join(', ')}

Provide analysis in JSON format:
{
  "summary": "Plain language summary of test results",
  "insights": {
    "bottlenecks": ["Identified bottleneck 1", "Identified bottleneck 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "severity": "low|medium|high"
  }
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);
    return result;
  } catch (error) {
    console.error('[Stress Test] AI analysis failed:', error);
    return {
      summary: 'AI analysis unavailable',
      insights: {
        bottlenecks: [],
        recommendations: [],
        severity: 'low',
      },
    };
  }
}
