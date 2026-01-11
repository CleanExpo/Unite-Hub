import { createClient } from '@/lib/supabase/server';

export type GuardianAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type GuardianAlertSource = 'telemetry' | 'warehouse' | 'replay' | 'scenarios' | 'guardian';
export type GuardianAlertChannel = 'in_app' | 'email' | 'webhook' | 'pager';

export interface GuardianAlertRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  severity: GuardianAlertSeverity;
  source: GuardianAlertSource;
  channel: GuardianAlertChannel;
  is_active: boolean;
  condition: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuardianAlertEvent {
  id: string;
  tenant_id: string;
  rule_id: string;
  severity: GuardianAlertSeverity;
  source: GuardianAlertSource;
  message: string;
  payload: unknown;
  created_at: string;
}

export async function listGuardianAlertRules(tenantId: string): Promise<GuardianAlertRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_alert_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Guardian G35] Failed to list alert rules:', error);
    throw error;
  }

  return data as GuardianAlertRule[];
}

export async function listGuardianAlertEvents(
  tenantId: string,
  opts: { limit?: number } = {}
): Promise<GuardianAlertEvent[]> {
  const supabase = await createClient();

  const limit = opts.limit ? Math.min(Math.max(opts.limit, 10), 500) : 100;

  const { data, error } = await supabase
    .from('guardian_alert_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Guardian G35] Failed to list alert events:', error);
    throw error;
  }

  return data as GuardianAlertEvent[];
}

export async function createGuardianAlertRule(args: {
  tenantId: string;
  name: string;
  description?: string;
  severity: GuardianAlertSeverity;
  source: GuardianAlertSource;
  channel: GuardianAlertChannel;
  condition?: unknown;
  createdBy?: string;
}): Promise<GuardianAlertRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_alert_rules')
    .insert({
      tenant_id: args.tenantId,
      name: args.name,
      description: args.description ?? null,
      severity: args.severity,
      source: args.source,
      channel: args.channel,
      is_active: true,
      condition: args.condition ?? {},
      created_by: args.createdBy ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Guardian G35] Failed to create alert rule:', error);
    throw error;
  }

  return data as GuardianAlertRule;
}
