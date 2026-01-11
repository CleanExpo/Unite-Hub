import { getSupabaseServer } from '@/lib/supabase';

/**
 * Guardian Edition Profile Definition
 * Describes a named packaging of Guardian capabilities
 */
export interface GuardianEditionProfileDefinition {
  key: string;
  label: string;
  description: string;
  tier: 'core' | 'pro' | 'elite' | 'custom';
  category: 'packaging';
  capabilitiesRequired: string[];
  capabilitiesNiceToHave?: string[];
  minOverallScore: number;
  recommendedOverallScore: number;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Canonical Guardian Edition Profiles
 * Core -> Pro -> Network-Intelligent progression
 */
export const GUARDIAN_EDITIONS: GuardianEditionProfileDefinition[] = [
  {
    key: 'guardian_core',
    label: 'Guardian Core',
    description:
      'Essential Guardian capabilities: rule engine, alert routing, incident tracking, and basic risk scoring. Ideal for teams starting their rule-based monitoring journey.',
    tier: 'core',
    category: 'packaging',
    capabilitiesRequired: [
      'guardian.core.rules',
      'guardian.core.alerts',
      'guardian.core.incidents',
    ],
    capabilitiesNiceToHave: ['guardian.core.risk'],
    minOverallScore: 0,
    recommendedOverallScore: 40,
    isDefault: true,
    isActive: true,
  },

  {
    key: 'guardian_pro',
    label: 'Guardian Pro',
    description:
      'Extended capabilities: Core + Risk Engine for incident prioritization + QA simulation for regression testing. Ideal for organizations scaling monitoring and testing automation.',
    tier: 'pro',
    category: 'packaging',
    capabilitiesRequired: [
      'guardian.core.rules',
      'guardian.core.alerts',
      'guardian.core.incidents',
      'guardian.core.risk',
      'guardian.qa.i_series.simulation',
    ],
    capabilitiesNiceToHave: [
      'guardian.qa.i_series.regression',
      'guardian.ai_intelligence.h_series.assistance',
    ],
    minOverallScore: 35,
    recommendedOverallScore: 60,
    isDefault: false,
    isActive: true,
  },

  {
    key: 'guardian_network_intelligent',
    label: 'Guardian Network Intelligent',
    description:
      'Full-stack Guardian: Pro + Network Intelligence suite (telemetry, anomalies, early warnings, governance console) + peer benchmarking. Ideal for organizations leveraging cohort insights and network-wide observability.',
    tier: 'elite',
    category: 'packaging',
    capabilitiesRequired: [
      'guardian.core.rules',
      'guardian.core.alerts',
      'guardian.core.incidents',
      'guardian.core.risk',
      'guardian.qa.i_series.simulation',
      'guardian.network.x01_telemetry',
      'guardian.network.x02_anomalies',
      'guardian.network.x03_early_warnings',
      'guardian.network.x04_console',
    ],
    capabilitiesNiceToHave: [
      'guardian.network.x05_lifecycle',
      'guardian.network.x06_recommendations',
      'guardian.ai_intelligence.h_series.assistance',
    ],
    minOverallScore: 55,
    recommendedOverallScore: 80,
    isDefault: false,
    isActive: true,
  },

  {
    key: 'guardian_custom',
    label: 'Guardian Custom',
    description:
      'Flexible packaging designed for organizations with bespoke capability combinations. Fully configurable; no preset capability requirements.',
    tier: 'custom',
    category: 'packaging',
    capabilitiesRequired: [],
    capabilitiesNiceToHave: [],
    minOverallScore: 0,
    recommendedOverallScore: 50,
    isDefault: false,
    isActive: true,
  },
];

/**
 * Upsert canonical edition profiles into the database
 * Called during system initialization or maintenance
 */
export async function upsertEditionProfiles(): Promise<void> {
  const supabase = getSupabaseServer();

  // Ensure at most one default profile
  const defaultProfiles = GUARDIAN_EDITIONS.filter((e) => e.isDefault);
  if (defaultProfiles.length > 1) {
    console.warn('Multiple default editions found; only first will be set as default');
  }

  for (const edition of GUARDIAN_EDITIONS) {
    const { error } = await supabase
      .from('guardian_edition_profiles')
      .upsert(
        {
          key: edition.key,
          label: edition.label,
          description: edition.description,
          tier: edition.tier,
          category: edition.category,
          capabilities_required: edition.capabilitiesRequired,
          capabilities_nice_to_have: edition.capabilitiesNiceToHave || [],
          min_overall_score: edition.minOverallScore,
          recommended_overall_score: edition.recommendedOverallScore,
          is_default: edition.isDefault && edition.key === GUARDIAN_EDITIONS.find((e) => e.isDefault)?.key,
          is_active: edition.isActive !== false,
          updated_at: new Date(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.error(`Failed to upsert edition profile "${edition.key}":`, error);
      throw error;
    }
  }

  console.log(`✓ Upserted ${GUARDIAN_EDITIONS.length} edition profiles`);
}

/**
 * Get all active edition profiles from database
 */
export async function getAllEditionProfiles(): Promise<GuardianEditionProfileDefinition[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_edition_profiles')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch edition profiles: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    key: row.key,
    label: row.label,
    description: row.description,
    tier: row.tier,
    category: row.category,
    capabilitiesRequired: row.capabilities_required,
    capabilitiesNiceToHave: row.capabilities_nice_to_have,
    minOverallScore: row.min_overall_score,
    recommendedOverallScore: row.recommended_overall_score,
    isDefault: row.is_default,
    isActive: row.is_active,
  }));
}

/**
 * Get a single edition profile by key
 */
export async function getEditionProfileByKey(key: string): Promise<GuardianEditionProfileDefinition | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_edition_profiles')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch edition profile: ${error.message}`);
  }

  return {
    key: data.key,
    label: data.label,
    description: data.description,
    tier: data.tier,
    category: data.category,
    capabilitiesRequired: data.capabilities_required,
    capabilitiesNiceToHave: data.capabilities_nice_to_have,
    minOverallScore: data.min_overall_score,
    recommendedOverallScore: data.recommended_overall_score,
    isDefault: data.is_default,
    isActive: data.is_active,
  };
}

/**
 * Get the default edition profile
 */
export async function getDefaultEditionProfile(): Promise<GuardianEditionProfileDefinition | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_edition_profiles')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, use guardian_core as fallback
      return getEditionProfileByKey('guardian_core');
    }
    throw new Error(`Failed to fetch default edition: ${error.message}`);
  }

  return {
    key: data.key,
    label: data.label,
    description: data.description,
    tier: data.tier,
    category: data.category,
    capabilitiesRequired: data.capabilities_required,
    capabilitiesNiceToHave: data.capabilities_nice_to_have,
    minOverallScore: data.min_overall_score,
    recommendedOverallScore: data.recommended_overall_score,
    isDefault: data.is_default,
    isActive: data.is_active,
  };
}
