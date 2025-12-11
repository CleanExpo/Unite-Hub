/**
 * Guardian Z01: Capability Manifest Service
 *
 * Defines and bootstraps the canonical list of Guardian capabilities
 * across G, H, I, X phases. This is the source of truth for what Guardian
 * can do, organized by category and phase.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Capability definition
 */
export interface GuardianCapabilityDefinition {
  key: string;
  label: string;
  description: string;
  category: 'core' | 'ai_intelligence' | 'qa_chaos' | 'network_intelligence' | 'governance';
  phaseCodes: string[];
  weight: number;
  isTenantScoped: boolean;
  isExperimental?: boolean;
}

/**
 * Canonical list of all Guardian capabilities
 */
export const GUARDIAN_CAPABILITIES: GuardianCapabilityDefinition[] = [
  // CORE
  {
    key: 'guardian.core.rules',
    label: 'Rule Engine & Editor',
    description: 'Core rule definition, editing, versioning, and deployment',
    category: 'core',
    phaseCodes: ['G01', 'G02', 'G03', 'G04'],
    weight: 2.0,
    isTenantScoped: true,
  },
  {
    key: 'guardian.core.alerts',
    label: 'Alerts & Notifications',
    description: 'Alert generation, routing, and notification channels',
    category: 'core',
    phaseCodes: ['G10', 'G11', 'G12'],
    weight: 1.8,
    isTenantScoped: true,
  },
  {
    key: 'guardian.core.incidents',
    label: 'Incident Management',
    description: 'Incident creation, lifecycle, escalation, and correlation',
    category: 'core',
    phaseCodes: ['G20', 'G21', 'G22', 'G23'],
    weight: 1.8,
    isTenantScoped: true,
  },
  {
    key: 'guardian.core.risk',
    label: 'Risk Scoring & Assessment',
    description: 'Risk engine, scoring, summaries, and risk-driven actions',
    category: 'core',
    phaseCodes: ['G47', 'G50'],
    weight: 1.5,
    isTenantScoped: true,
  },

  // AI INTELLIGENCE
  {
    key: 'guardian.ai.h_series_foundation',
    label: 'H-Series: AI Rule & Anomaly Assistance',
    description: 'AI-powered rule suggestions, anomaly analysis, and pattern detection',
    category: 'ai_intelligence',
    phaseCodes: ['H01', 'H02', 'H03', 'H04'],
    weight: 1.2,
    isTenantScoped: true,
    isExperimental: true,
  },

  // QA & CHAOS
  {
    key: 'guardian.qa.i_series.simulation',
    label: 'I-Series: QA Simulation & Regression',
    description: 'Alert simulation, regression testing, and QA coverage tracking',
    category: 'qa_chaos',
    phaseCodes: ['I01', 'I02', 'I03', 'I04'],
    weight: 1.5,
    isTenantScoped: true,
  },
  {
    key: 'guardian.qa.i_series.playbook_rehearsal',
    label: 'I-Series: Playbook Rehearsal & Automation',
    description: 'Automated incident response, playbook execution, and validation',
    category: 'qa_chaos',
    phaseCodes: ['I05', 'I06', 'I07', 'I08'],
    weight: 1.3,
    isTenantScoped: true,
    isExperimental: true,
  },

  // NETWORK INTELLIGENCE
  {
    key: 'guardian.network.x01_telemetry',
    label: 'X01: Network Telemetry',
    description: 'Tenant metrics ingestion, anonymization, and cohort aggregation',
    category: 'network_intelligence',
    phaseCodes: ['X01'],
    weight: 1.0,
    isTenantScoped: true,
  },
  {
    key: 'guardian.network.x02_anomalies',
    label: 'X02: Network Anomaly Detection',
    description: 'Anomaly detection against peer cohorts and benchmarks',
    category: 'network_intelligence',
    phaseCodes: ['X02'],
    weight: 1.2,
    isTenantScoped: true,
  },
  {
    key: 'guardian.network.x03_early_warnings',
    label: 'X03: Network Early-Warning Signals',
    description: 'Pattern-based early warning signals from cohort behavior',
    category: 'network_intelligence',
    phaseCodes: ['X03'],
    weight: 1.1,
    isTenantScoped: true,
  },
  {
    key: 'guardian.network.x04_console_governance',
    label: 'X04: Network Intelligence Console',
    description: 'Unified console for network telemetry, anomalies, and governance',
    category: 'network_intelligence',
    phaseCodes: ['X04'],
    weight: 1.0,
    isTenantScoped: true,
  },
  {
    key: 'guardian.network.x05_lifecycle',
    label: 'X05: Network Data Lifecycle & Compliance',
    description: 'Data retention policies, lifecycle cleanup, and audit trails',
    category: 'network_intelligence',
    phaseCodes: ['X05'],
    weight: 0.8,
    isTenantScoped: true,
  },
  {
    key: 'guardian.network.x06_recommendations',
    label: 'X06: Network-Driven Recommendations',
    description: 'Advisory recommendations from network intelligence insights',
    category: 'network_intelligence',
    phaseCodes: ['X06'],
    weight: 0.9,
    isTenantScoped: true,
  },

  // GOVERNANCE & META
  {
    key: 'guardian.governance.audit_logging',
    label: 'Audit Logging & Compliance',
    description: 'Immutable audit trails and compliance event tracking',
    category: 'governance',
    phaseCodes: ['G52', 'X05'],
    weight: 1.5,
    isTenantScoped: true,
  },
  {
    key: 'guardian.meta.readiness_dashboard',
    label: 'Readiness & Capability Dashboard',
    description: 'Guardian capability status and tenant readiness scoring',
    category: 'governance',
    phaseCodes: ['Z01'],
    weight: 0.5,
    isTenantScoped: true,
  },
];

/**
 * Upsert all capability manifest entries into the database
 */
export async function upsertCapabilityManifestEntries(): Promise<void> {
  const supabase = getSupabaseServer();

  for (const capability of GUARDIAN_CAPABILITIES) {
    const { error } = await supabase
      .from('guardian_capability_manifest')
      .upsert(
        {
          key: capability.key,
          label: capability.label,
          description: capability.description,
          category: capability.category,
          phase_codes: capability.phaseCodes,
          weight: capability.weight,
          is_tenant_scoped: capability.isTenantScoped,
          is_experimental: capability.isExperimental ?? false,
          metadata: {},
        },
        {
          onConflict: 'key',
        }
      );

    if (error) {
      console.error(`Failed to upsert capability ${capability.key}:`, error);
      throw error;
    }
  }

  console.log(`✓ Bootstrapped ${GUARDIAN_CAPABILITIES.length} Guardian capabilities`);
}

/**
 * Get all capabilities from manifest
 */
export async function getAllCapabilities(): Promise<GuardianCapabilityDefinition[]> {
  return GUARDIAN_CAPABILITIES;
}

/**
 * Get capability by key
 */
export async function getCapabilityByKey(key: string): Promise<GuardianCapabilityDefinition | null> {
  return GUARDIAN_CAPABILITIES.find((c) => c.key === key) ?? null;
}

/**
 * Get capabilities by category
 */
export async function getCapabilitiesByCategory(
  category: GuardianCapabilityDefinition['category']
): Promise<GuardianCapabilityDefinition[]> {
  return GUARDIAN_CAPABILITIES.filter((c) => c.category === category);
}
