import { getSupabaseServer } from '@/lib/supabase';

export interface GovernanceCharter {
  id: string;
  version: string;
  charterDocument: Record<string, unknown>;
  autonomyRules: Record<string, unknown>;
  crossTenantRules: Record<string, unknown>;
  emergencyStopConditions: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt?: string;
}

export interface CharterComplianceCheck {
  id: string;
  tenantId: string;
  charterVersion: string;
  agentName: string;
  isCompliant: boolean;
  violations: string[];
  checkedAt: string;
}

export async function getActiveCharter(): Promise<GovernanceCharter | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('global_governance_charter')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) return null;

  return {
    id: data.id,
    version: data.version,
    charterDocument: data.charter_document,
    autonomyRules: data.autonomy_rules,
    crossTenantRules: data.cross_tenant_rules,
    emergencyStopConditions: data.emergency_stop_conditions,
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: data.created_at,
    activatedAt: data.activated_at
  };
}

export async function getCharterVersions(): Promise<GovernanceCharter[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('global_governance_charter')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    version: row.version,
    charterDocument: row.charter_document,
    autonomyRules: row.autonomy_rules,
    crossTenantRules: row.cross_tenant_rules,
    emergencyStopConditions: row.emergency_stop_conditions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    activatedAt: row.activated_at
  }));
}

export async function checkCompliance(
  tenantId: string,
  agentName: string
): Promise<CharterComplianceCheck | null> {
  const supabase = await getSupabaseServer();
  const charter = await getActiveCharter();

  if (!charter) return null;

  const violations: string[] = [];
  // Compliance checking logic would go here

  const { data, error } = await supabase
    .from('charter_compliance_checks')
    .insert({
      tenant_id: tenantId,
      charter_version: charter.version,
      agent_name: agentName,
      is_compliant: violations.length === 0,
      violations
    })
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    charterVersion: data.charter_version,
    agentName: data.agent_name,
    isCompliant: data.is_compliant,
    violations: data.violations,
    checkedAt: data.checked_at
  };
}

export async function getTenantComplianceStatus(tenantId: string): Promise<CharterComplianceCheck[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('charter_compliance_checks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('checked_at', { ascending: false })
    .limit(50);

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    charterVersion: row.charter_version,
    agentName: row.agent_name,
    isCompliant: row.is_compliant,
    violations: row.violations,
    checkedAt: row.checked_at
  }));
}
