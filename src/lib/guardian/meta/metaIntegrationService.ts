import { getSupabaseServer } from '@/lib/supabase';

/**
 * GuardianMetaIntegrationScope — Allowed meta domains for integration access.
 * Each scope corresponds to a Z-series layer and its observable signals.
 */
export type GuardianMetaIntegrationScope =
  | 'readiness'
  | 'uplift'
  | 'editions'
  | 'executive_reports'
  | 'adoption'
  | 'lifecycle';

/**
 * GuardianMetaWebhookEventType — Allowed webhook event types.
 * Each type corresponds to a significant Z-series event that can be exported.
 */
export type GuardianMetaWebhookEventType =
  | 'readiness_updated'
  | 'uplift_plan_created'
  | 'uplift_plan_updated'
  | 'edition_fit_computed'
  | 'executive_report_created'
  | 'adoption_scores_computed'
  | 'meta_lifecycle_run_completed'
  | 'test';

/**
 * GuardianMetaIntegration — Active integration config for a tenant.
 */
export interface GuardianMetaIntegration {
  id: string;
  tenant_id: string;
  integration_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  config: {
    webhook_url?: string;
    headers?: Record<string, string>;
    field_mappings?: Record<string, string>;
    [key: string]: any;
  };
  scopes: GuardianMetaIntegrationScope[];
  last_synced_at?: string;
  metadata: Record<string, any>;
}

/**
 * loadActiveMetaIntegrationsForTenant — Load active integrations for a tenant and scope.
 * Returns only integrations that:
 * 1. Belong to the tenant (via RLS)
 * 2. Are enabled (is_enabled=true)
 * 3. Include the requested scope in their scopes array
 */
export async function loadActiveMetaIntegrationsForTenant(
  tenantId: string,
  scope: GuardianMetaIntegrationScope
): Promise<GuardianMetaIntegration[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true);

  if (error) {
    console.error(`[metaIntegrationService] Failed to load integrations for tenant ${tenantId}:`, error);
    return [];
  }

  // Filter in-memory by scope to avoid storing scope filtering in RLS
  return (data || []).filter((integration: GuardianMetaIntegration) =>
    integration.scopes.includes(scope)
  );
}

/**
 * Payload Mappers — Convert Z-series domain objects to safe, meta-only JSON.
 * Each mapper ensures:
 * 1. Only scores, counts, statuses, dates, and IDs (no raw logs or raw payloads)
 * 2. No PII (no user names, emails, tenant names, raw event data)
 * 3. Strictly observable metadata from Z01–Z06
 */

export interface ReadinessSnapshot {
  tenant_id: string;
  computed_at: string;
  overall_score: number;
  band?: string;
  capability_scores?: Array<{ key: string; score: number; label: string }>;
}

export function mapReadinessSnapshotToIntegrationPayload(snapshot: ReadinessSnapshot): Record<string, any> {
  return {
    event_type: 'readiness_updated',
    scope: 'readiness',
    timestamp: snapshot.computed_at,
    data: {
      overall_score: snapshot.overall_score,
      band: snapshot.band || 'unknown',
      capability_count: snapshot.capability_scores?.length || 0,
      capabilities_summary: (snapshot.capability_scores || []).map((c) => ({
        key: c.key,
        label: c.label,
        score: c.score,
      })),
    },
  };
}

export interface UpliftPlan {
  tenant_id: string;
  id: string;
  created_at: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

export interface UpliftTasksSummary {
  total: number;
  completed: number;
  in_progress: number;
  blocked: number;
}

export function mapUpliftPlanToIntegrationPayload(plan: UpliftPlan, tasksSummary: UpliftTasksSummary): Record<string, any> {
  return {
    event_type: plan.status === 'draft' ? 'uplift_plan_created' : 'uplift_plan_updated',
    scope: 'uplift',
    timestamp: plan.created_at,
    data: {
      plan_id: plan.id,
      plan_title: plan.title,
      plan_status: plan.status,
      tasks: {
        total: tasksSummary.total,
        completed: tasksSummary.completed,
        in_progress: tasksSummary.in_progress,
        blocked: tasksSummary.blocked,
        completion_percentage: tasksSummary.total > 0
          ? Math.round((tasksSummary.completed / tasksSummary.total) * 100)
          : 0,
      },
    },
  };
}

export interface EditionFitSnapshot {
  tenant_id: string;
  computed_at: string;
  edition_key: string;
  edition_label: string;
  fit_score: number;
  fit_status: 'low' | 'medium' | 'high' | 'perfect';
}

export function mapEditionFitToIntegrationPayload(fitSnapshot: EditionFitSnapshot): Record<string, any> {
  return {
    event_type: 'edition_fit_computed',
    scope: 'editions',
    timestamp: fitSnapshot.computed_at,
    data: {
      edition_key: fitSnapshot.edition_key,
      edition_label: fitSnapshot.edition_label,
      fit_score: fitSnapshot.fit_score,
      fit_status: fitSnapshot.fit_status,
    },
  };
}

export interface ExecutiveReportSummary {
  tenant_id: string;
  id: string;
  created_at: string;
  title: string;
  overall_health_score?: number;
  period_start?: string;
  period_end?: string;
}

export function mapExecutiveReportToIntegrationPayload(reportSummary: ExecutiveReportSummary): Record<string, any> {
  return {
    event_type: 'executive_report_created',
    scope: 'executive_reports',
    timestamp: reportSummary.created_at,
    data: {
      report_id: reportSummary.id,
      report_title: reportSummary.title,
      overall_health_score: reportSummary.overall_health_score,
      period_start: reportSummary.period_start,
      period_end: reportSummary.period_end,
    },
  };
}

export interface AdoptionSnapshot {
  tenant_id: string;
  computed_at: string;
  dimensions: Array<{
    dimension: string;
    status: 'inactive' | 'light' | 'regular' | 'power';
    score: number;
  }>;
}

export function mapAdoptionScoresToIntegrationPayload(adoptionSnapshot: AdoptionSnapshot): Record<string, any> {
  return {
    event_type: 'adoption_scores_computed',
    scope: 'adoption',
    timestamp: adoptionSnapshot.computed_at,
    data: {
      dimensions: adoptionSnapshot.dimensions.map((d) => ({
        dimension: d.dimension,
        status: d.status,
        score: d.score,
      })),
      overall_adoption_status: adoptionSnapshot.dimensions.every((d) => d.status === 'power')
        ? 'power'
        : adoptionSnapshot.dimensions.some((d) => d.status === 'inactive')
          ? 'inactive'
          : adoptionSnapshot.dimensions.some((d) => d.status === 'light')
            ? 'light'
            : 'regular',
    },
  };
}

export interface LifecycleRunSummary {
  tenant_id: string;
  run_at: string;
  total_compacted: number;
  total_deleted: number;
  operations_successful: number;
  operations_failed: number;
}

export function mapLifecycleRunToIntegrationPayload(lifecycleSummary: LifecycleRunSummary): Record<string, any> {
  return {
    event_type: 'meta_lifecycle_run_completed',
    scope: 'lifecycle',
    timestamp: lifecycleSummary.run_at,
    data: {
      total_compacted: lifecycleSummary.total_compacted,
      total_deleted: lifecycleSummary.total_deleted,
      operations_successful: lifecycleSummary.operations_successful,
      operations_failed: lifecycleSummary.operations_failed,
    },
  };
}

/**
 * enqueueMetaWebhookEvents — Queue webhook events for all active integrations in a scope.
 * For each active integration:
 * 1. Maps the domain payload to a safe, meta-only payload via the appropriate mapper
 * 2. Inserts a row into guardian_meta_webhook_events with status='pending'
 * 3. Returns count of queued events
 *
 * This is called by Z01–Z06 services when significant events occur.
 */
export async function enqueueMetaWebhookEvents(
  tenantId: string,
  eventType: GuardianMetaWebhookEventType,
  scope: GuardianMetaIntegrationScope,
  domainPayload: Record<string, any>
): Promise<number> {
  const supabase = getSupabaseServer();

  // Load active integrations for this scope
  const integrations = await loadActiveMetaIntegrationsForTenant(tenantId, scope);

  if (integrations.length === 0) {
    // No active integrations for this scope
    return 0;
  }

  // Map domain payload to meta-safe payload based on event type
  let safePayload: Record<string, any>;
  switch (eventType) {
    case 'readiness_updated':
      safePayload = mapReadinessSnapshotToIntegrationPayload(domainPayload as ReadinessSnapshot);
      break;
    case 'uplift_plan_created':
    case 'uplift_plan_updated':
      safePayload = mapUpliftPlanToIntegrationPayload(
        domainPayload as UpliftPlan,
        domainPayload.tasksSummary as UpliftTasksSummary
      );
      break;
    case 'edition_fit_computed':
      safePayload = mapEditionFitToIntegrationPayload(domainPayload as EditionFitSnapshot);
      break;
    case 'executive_report_created':
      safePayload = mapExecutiveReportToIntegrationPayload(domainPayload as ExecutiveReportSummary);
      break;
    case 'adoption_scores_computed':
      safePayload = mapAdoptionScoresToIntegrationPayload(domainPayload as AdoptionSnapshot);
      break;
    case 'meta_lifecycle_run_completed':
      safePayload = mapLifecycleRunToIntegrationPayload(domainPayload as LifecycleRunSummary);
      break;
    case 'test':
      safePayload = {
        event_type: 'test',
        scope: scope,
        timestamp: new Date().toISOString(),
        message: 'Guardian meta webhook test event',
      };
      break;
    default:
      console.warn(`[metaIntegrationService] Unknown event type: ${eventType}`);
      return 0;
  }

  // Insert webhook events for each active integration
  const events = integrations.map((integration) => ({
    tenant_id: tenantId,
    integration_id: integration.id,
    event_type: eventType,
    payload: safePayload,
    status: 'pending',
    attempt_count: 0,
  }));

  const { error } = await supabase.from('guardian_meta_webhook_events').insert(events);

  if (error) {
    console.error(
      `[metaIntegrationService] Failed to enqueue webhook events for tenant ${tenantId}:`,
      error
    );
    return 0;
  }

  return events.length;
}

/**
 * updateIntegrationLastSync — Update last_synced_at timestamp after successful sync.
 */
export async function updateIntegrationLastSync(integrationId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_meta_integrations')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', integrationId);

  if (error) {
    console.error(`[metaIntegrationService] Failed to update last_synced_at for integration ${integrationId}:`, error);
  }
}
