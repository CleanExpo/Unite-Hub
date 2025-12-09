import { getSupabaseServer } from '@/lib/supabase';

export interface BoundaryPolicy {
  id: string;
  tenantId: string;
  intelType: string;
  classification: 'local_only' | 'anonymised_ok' | 'aggregate_only';
  anonymisationRules: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface BoundaryCrossingLog {
  id: string;
  sourceTenantId: string;
  targetScope: 'global' | 'cohort' | 'specific';
  intelType: string;
  classification: string;
  wasAnonymised: boolean;
  confidence: number;
  uncertaintyNotes?: string;
  validationPassed: boolean;
  validationErrors: string[];
  createdAt: string;
}

export async function getPolicies(tenantId: string): Promise<BoundaryPolicy[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('intelligence_boundary_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    intelType: row.intel_type,
    classification: row.classification,
    anonymisationRules: row.anonymisation_rules,
    isActive: row.is_active,
    createdAt: row.created_at
  }));
}

export async function validateCrossing(
  sourceTenantId: string,
  intelType: string,
  targetScope: BoundaryCrossingLog['targetScope']
): Promise<{ passed: boolean; errors: string[] }> {
  const policies = await getPolicies(sourceTenantId);
  const policy = policies.find(p => p.intelType === intelType);

  const errors: string[] = [];

  if (!policy) {
    errors.push('No boundary policy defined for this intel type');
    return { passed: false, errors };
  }

  if (policy.classification === 'local_only') {
    errors.push('Intel classified as local_only cannot cross tenant boundaries');
    return { passed: false, errors };
  }

  if (targetScope === 'specific' && policy.classification !== 'anonymised_ok') {
    errors.push('Specific tenant targeting requires anonymised_ok classification');
  }

  return { passed: errors.length === 0, errors };
}

export async function logCrossing(
  sourceTenantId: string,
  intelType: string,
  targetScope: BoundaryCrossingLog['targetScope'],
  wasAnonymised: boolean,
  validation: { passed: boolean; errors: string[] }
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('boundary_crossing_logs').insert({
    source_tenant_id: sourceTenantId,
    target_scope: targetScope,
    intel_type: intelType,
    classification: 'aggregate_only',
    was_anonymised: wasAnonymised,
    confidence: validation.passed ? 0.85 : 0.5,
    uncertainty_notes: 'Validation based on current boundary policies',
    validation_passed: validation.passed,
    validation_errors: validation.errors
  });
}

export async function getCrossingLogs(tenantId: string): Promise<BoundaryCrossingLog[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('boundary_crossing_logs')
    .select('*')
    .eq('source_tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    sourceTenantId: row.source_tenant_id,
    targetScope: row.target_scope,
    intelType: row.intel_type,
    classification: row.classification,
    wasAnonymised: row.was_anonymised,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    validationPassed: row.validation_passed,
    validationErrors: row.validation_errors,
    createdAt: row.created_at
  }));
}
