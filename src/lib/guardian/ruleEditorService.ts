import { createClient } from '@/lib/supabase/server';
import type { GuardianAlertRule } from '@/lib/guardian/alertRulesService';

/**
 * Guardian Rule Editor Service (G45)
 *
 * Provides CRUD operations for Guardian alert rules and templates.
 * Powers the /guardian/rules editor UI.
 *
 * Design Principles:
 * - Tenant-scoped operations with RLS enforcement
 * - Type-safe CRUD operations
 * - Template system for quick rule creation
 * - Admin-only write access (reads allowed for all Guardian roles)
 */

export interface GuardianRuleTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  severity_default: 'low' | 'medium' | 'high' | 'critical' | null;
  channel_default: 'email' | 'slack' | 'webhook' | 'in_app' | null;
  definition: unknown;
  created_at: string;
  updated_at: string;
}

/**
 * List all Guardian alert rules for a tenant
 */
export async function listGuardianRules(tenantId: string): Promise<GuardianAlertRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guardian_alert_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Guardian G45] Failed to list rules:', error);
    throw error;
  }

  return data as GuardianAlertRule[];
}

/**
 * Get a single Guardian alert rule by ID
 */
export async function getGuardianRule(
  tenantId: string,
  id: string
): Promise<GuardianAlertRule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guardian_alert_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[Guardian G45] Failed to get rule:', error);
    throw error;
  }

  return data as GuardianAlertRule | null;
}

/**
 * Create or update a Guardian alert rule
 */
export async function upsertGuardianRule(
  tenantId: string,
  rule: Partial<GuardianAlertRule> & { id?: string }
): Promise<GuardianAlertRule> {
  const supabase = await createClient();

  const payload = {
    ...rule,
    tenant_id: tenantId,
    updated_at: new Date().toISOString(),
  } as any;

  // Update existing rule or insert new rule
  const query = payload.id
    ? supabase
        .from('guardian_alert_rules')
        .update(payload)
        .eq('id', payload.id)
        .eq('tenant_id', tenantId)
    : supabase.from('guardian_alert_rules').insert(payload);

  const { data, error } = await query.select('*').single();

  if (error) {
    console.error('[Guardian G45] Failed to upsert rule:', error);
    throw error;
  }

  return data as GuardianAlertRule;
}

/**
 * Delete a Guardian alert rule
 */
export async function deleteGuardianRule(tenantId: string, id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('guardian_alert_rules')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id);

  if (error) {
    console.error('[Guardian G45] Failed to delete rule:', error);
    throw error;
  }
}

/**
 * List all Guardian rule templates for a tenant
 */
export async function listGuardianRuleTemplates(
  tenantId: string
): Promise<GuardianRuleTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_rule_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Guardian G45] Failed to list templates:', error);
    throw error;
  }

  return data as GuardianRuleTemplate[];
}
