import { getSupabaseServer } from '@/lib/supabase';

export interface CouncilSession {
  id: string;
  tenantId: string;
  topic: string;
  context: Record<string, unknown>;
  participatingAgents: string[];
  status: 'voting' | 'arbitration' | 'resolved' | 'escalated';
  createdAt: string;
  resolvedAt?: string;
}

export interface AgentVote {
  id: string;
  sessionId: string;
  agentName: string;
  recommendation: string;
  confidence: number;
  reasoning?: string;
  riskAssessment?: Record<string, unknown>;
  isDissenting: boolean;
  createdAt: string;
}

export interface CouncilRecommendation {
  id: string;
  sessionId: string;
  consensusScore: number;
  finalRecommendation: string;
  dissentSummary: Array<{ agent: string; reason: string }>;
  riskImpact?: Record<string, unknown>;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function createSession(
  tenantId: string,
  topic: string,
  context: Record<string, unknown>,
  agents: string[]
): Promise<CouncilSession | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('council_sessions')
    .insert({
      tenant_id: tenantId,
      topic,
      context,
      participating_agents: agents
    })
    .select()
    .single();

  if (error) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    topic: data.topic,
    context: data.context,
    participatingAgents: data.participating_agents,
    status: data.status,
    createdAt: data.created_at,
    resolvedAt: data.resolved_at
  };
}

export async function submitVote(
  sessionId: string,
  agentName: string,
  recommendation: string,
  confidence: number,
  reasoning?: string
): Promise<AgentVote | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('council_agent_votes')
    .insert({
      session_id: sessionId,
      agent_name: agentName,
      recommendation,
      confidence,
      reasoning,
      is_dissenting: false
    })
    .select()
    .single();

  if (error) {
return null;
}

  return {
    id: data.id,
    sessionId: data.session_id,
    agentName: data.agent_name,
    recommendation: data.recommendation,
    confidence: data.confidence,
    reasoning: data.reasoning,
    riskAssessment: data.risk_assessment,
    isDissenting: data.is_dissenting,
    createdAt: data.created_at
  };
}

export async function resolveSession(sessionId: string): Promise<CouncilRecommendation | null> {
  const supabase = await getSupabaseServer();

  // Get all votes
  const { data: votes } = await supabase
    .from('council_agent_votes')
    .select('*')
    .eq('session_id', sessionId);

  if (!votes || votes.length === 0) {
return null;
}

  // Calculate consensus
  const recommendations = votes.map(v => v.recommendation);
  const mostCommon = recommendations.sort((a, b) =>
    recommendations.filter(v => v === a).length - recommendations.filter(v => v === b).length
  ).pop();

  const consensusVotes = votes.filter(v => v.recommendation === mostCommon);
  const dissenters = votes.filter(v => v.recommendation !== mostCommon);
  const consensusScore = consensusVotes.length / votes.length;

  // Mark dissenters
  for (const v of dissenters) {
    await supabase
      .from('council_agent_votes')
      .update({ is_dissenting: true })
      .eq('id', v.id);
  }

  const { data, error } = await supabase
    .from('council_recommendations')
    .insert({
      session_id: sessionId,
      consensus_score: consensusScore,
      final_recommendation: mostCommon,
      dissent_summary: dissenters.map(d => ({ agent: d.agent_name, reason: d.reasoning })),
      confidence: consensusScore * 0.9,
      uncertainty_notes: dissenters.length > 0
        ? `${dissenters.length} agent(s) dissented from recommendation`
        : 'Full consensus achieved'
    })
    .select()
    .single();

  if (error) {
return null;
}

  // Update session status
  await supabase
    .from('council_sessions')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', sessionId);

  return {
    id: data.id,
    sessionId: data.session_id,
    consensusScore: data.consensus_score,
    finalRecommendation: data.final_recommendation,
    dissentSummary: data.dissent_summary,
    riskImpact: data.risk_impact,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at
  };
}

export async function getSessions(tenantId: string): Promise<CouncilSession[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('council_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    topic: row.topic,
    context: row.context,
    participatingAgents: row.participating_agents,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  }));
}
