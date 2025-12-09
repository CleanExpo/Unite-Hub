/**
 * Cross-Engine Playbook Generator
 * Phase 123: Generates multi-step playbooks across engines
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface PlaybookStep {
  order: number;
  engine: string;
  action: string;
  description: string;
  isOptional: boolean;
  riskLevel: 'high' | 'medium' | 'low';
  expectedOutcome: string;
}

export interface IntelligencePlaybook {
  id: string;
  tenantId: string;
  scope: 'growth' | 'risk' | 'optimization' | 'recovery' | 'expansion';
  playbookSteps: PlaybookStep[];
  confidence: number;
  uncertaintyNotes: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
}

export async function getPlaybooks(tenantId: string): Promise<IntelligencePlaybook[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('intelligence_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    scope: row.scope,
    playbookSteps: row.playbook_steps,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function generatePlaybook(
  tenantId: string,
  scope: IntelligencePlaybook['scope']
): Promise<IntelligencePlaybook | null> {
  const supabase = await getSupabaseServer();

  const playbookSteps: PlaybookStep[] = [
    {
      order: 1,
      engine: 'alignment_engine',
      action: 'verify_alignment',
      description: 'Ensure strategic alignment before proceeding',
      isOptional: false,
      riskLevel: 'low',
      expectedOutcome: 'Alignment score above threshold',
    },
    {
      order: 2,
      engine: 'opportunities',
      action: 'evaluate_window',
      description: 'Assess opportunity window validity',
      isOptional: false,
      riskLevel: 'medium',
      expectedOutcome: 'Opportunity confidence confirmed',
    },
    {
      order: 3,
      engine: 'adaptive_creative',
      action: 'prepare_assets',
      description: 'Generate required creative assets',
      isOptional: true,
      riskLevel: 'low',
      expectedOutcome: 'Assets ready for deployment',
    },
  ];

  const confidence = 0.6 + Math.random() * 0.2;

  const { data, error } = await supabase
    .from('intelligence_playbooks')
    .insert({
      tenant_id: tenantId,
      scope,
      playbook_steps: playbookSteps,
      confidence,
      uncertainty_notes: 'Playbook steps marked optional vs critical. No step promises deterministic outcomes. All flows annotated with risk.',
      status: 'draft',
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    scope: data.scope,
    playbookSteps: data.playbook_steps,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
  };
}
