import { getSupabaseServer } from '@/lib/supabase';

export interface FairnessAuditReport {
  id: string;
  auditType: 'pattern_distribution' | 'benefit_concentration' | 'region_balance' | 'cohort_equity';
  auditScope: 'global' | 'region' | 'cohort';
  findings: Record<string, unknown>;
  biasFlags: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  confidence: number;
  uncertaintyNotes?: string;
  isSuppressed: boolean;
  createdAt: string;
}

export interface PatternBiasFlag {
  id: string;
  patternId?: string;
  biasType: string;
  affectedGroups: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
}

export async function getFairnessReports(auditType?: string): Promise<FairnessAuditReport[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('fairness_audit_reports')
    .select('*')
    .eq('is_suppressed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (auditType) {
    query = query.eq('audit_type', auditType);
  }

  const { data, error } = await query;
  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    auditType: row.audit_type,
    auditScope: row.audit_scope,
    findings: row.findings,
    biasFlags: row.bias_flags,
    riskLevel: row.risk_level,
    recommendations: row.recommendations,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    isSuppressed: row.is_suppressed,
    createdAt: row.created_at
  }));
}

export async function getBiasFlags(): Promise<PatternBiasFlag[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('pattern_bias_flags')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    patternId: row.pattern_id,
    biasType: row.bias_type,
    affectedGroups: row.affected_groups,
    severity: row.severity,
    description: row.description,
    createdAt: row.created_at
  }));
}

export async function createAuditReport(
  auditType: FairnessAuditReport['auditType'],
  auditScope: FairnessAuditReport['auditScope'],
  findings: Record<string, unknown>
): Promise<FairnessAuditReport | null> {
  const supabase = await getSupabaseServer();

  const biasFlags: string[] = [];
  let riskLevel: FairnessAuditReport['riskLevel'] = 'none';

  // Simple bias detection
  if (findings.imbalance && (findings.imbalance as number) > 0.3) {
    biasFlags.push('distribution_imbalance');
    riskLevel = 'medium';
  }

  const { data, error } = await supabase
    .from('fairness_audit_reports')
    .insert({
      audit_type: auditType,
      audit_scope: auditScope,
      findings,
      bias_flags: biasFlags,
      risk_level: riskLevel,
      recommendations: [],
      confidence: 0.75,
      uncertainty_notes: 'Fairness analysis based on available aggregated data',
      is_suppressed: false
    })
    .select()
    .single();

  if (error) {
return null;
}

  return {
    id: data.id,
    auditType: data.audit_type,
    auditScope: data.audit_scope,
    findings: data.findings,
    biasFlags: data.bias_flags,
    riskLevel: data.risk_level,
    recommendations: data.recommendations,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    isSuppressed: data.is_suppressed,
    createdAt: data.created_at
  };
}
