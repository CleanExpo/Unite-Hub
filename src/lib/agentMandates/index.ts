import { getSupabaseServer } from '@/lib/supabase';

export interface AgentMandate {
  id: string;
  tenantId: string;
  agentName: string;
  roleDescription: string;
  actionScope: string[];
  forbiddenActions: string[];
  riskCap: 'minimal' | 'low' | 'medium' | 'high';
  autonomyLevel: number;
  requiresHumanApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getMandates(tenantId: string): Promise<AgentMandate[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agent_mandates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('agent_name');

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    agentName: row.agent_name,
    roleDescription: row.role_description,
    actionScope: row.action_scope,
    forbiddenActions: row.forbidden_actions,
    riskCap: row.risk_cap,
    autonomyLevel: row.autonomy_level,
    requiresHumanApproval: row.requires_human_approval,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function updateMandate(
  mandateId: string,
  updates: Partial<AgentMandate>,
  changedBy: string,
  reason: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Get current mandate for logging
  const { data: current } = await supabase
    .from('agent_mandates')
    .select('*')
    .eq('id', mandateId)
    .single();

  if (!current) return false;

  // Update mandate
  const { error } = await supabase
    .from('agent_mandates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', mandateId);

  if (error) return false;

  // Log the change
  await supabase.from('mandate_change_logs').insert({
    mandate_id: mandateId,
    changed_by: changedBy,
    change_type: 'update',
    previous_value: current,
    new_value: updates,
    reason,
    was_previewed: false
  });

  return true;
}

export async function validateAction(
  tenantId: string,
  agentName: string,
  action: string
): Promise<{ allowed: boolean; reason?: string }> {
  const mandates = await getMandates(tenantId);
  const mandate = mandates.find(m => m.agentName === agentName);

  if (!mandate) {
    return { allowed: false, reason: 'No mandate found for agent' };
  }

  if (mandate.forbiddenActions.includes(action)) {
    return { allowed: false, reason: 'Action is in forbidden list' };
  }

  if (mandate.actionScope.length > 0 && !mandate.actionScope.includes(action)) {
    return { allowed: false, reason: 'Action outside permitted scope' };
  }

  return { allowed: true };
}
