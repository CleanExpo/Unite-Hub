/**
 * Guardian Z10: Meta Stack Readiness Service
 * Aggregates Z01-Z09 component status to compute overall meta stack readiness
 * Non-binding advisory gate for Z-series rollout (experimental/limited/recommended)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { loadMetaGovernancePrefsForTenant } from './metaGovernanceService';

// ===== TYPE DEFINITIONS =====

export type GuardianMetaComponentStatus = 'not_configured' | 'partial' | 'ready';
export type GuardianMetaStackOverallStatus = 'experimental' | 'limited' | 'recommended';

export interface GuardianMetaStackComponent {
  key: string;
  label: string;
  status: GuardianMetaComponentStatus;
  notes?: string;
}

export interface GuardianMetaStackReadiness {
  tenantId: string;
  computedAt: Date;
  components: GuardianMetaStackComponent[];
  overallStatus: GuardianMetaStackOverallStatus;
  readyCount: number;
  partialCount: number;
  notConfiguredCount: number;
  blockers: string[];
  warnings: string[];
  recommendations: string[];
}

// ===== READINESS COMPUTATION =====

/**
 * Compute meta stack readiness for tenant
 * Aggregates Z01-Z09 component configuration status
 * Determines overall advisory status (experimental/limited/recommended)
 */
export async function computeMetaStackReadiness(tenantId: string): Promise<GuardianMetaStackReadiness> {
  const supabase = getSupabaseServer();
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const components: GuardianMetaStackComponent[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // ===== Z01: READINESS SCORING =====
  try {
    const { data: readinessData } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('id, computed_at')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1);

    const hasReadiness = readinessData && readinessData.length > 0;
    const isRecentReadiness = hasReadiness && new Date(readinessData[0].computed_at) > thirtyDaysAgo;

    components.push({
      key: 'z01_readiness',
      label: 'Z01: Readiness Scoring',
      status: isRecentReadiness ? 'ready' : hasReadiness ? 'partial' : 'not_configured',
      notes: hasReadiness ? 'Has readiness profile' : 'No readiness profile',
    });

    if (!hasReadiness) blockers.push('Z01: Readiness profile not configured');
  } catch (error) {
    console.error('Error checking Z01 readiness:', error);
    components.push({
      key: 'z01_readiness',
      label: 'Z01: Readiness Scoring',
      status: 'not_configured',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z02: UPLIFT PLANNING =====
  try {
    const { data: upliftData } = await supabase
      .from('guardian_tenant_uplift_plans')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(1);

    const hasActivePlans = upliftData && upliftData.length > 0;

    components.push({
      key: 'z02_uplift',
      label: 'Z02: Uplift Planning',
      status: hasActivePlans ? 'ready' : 'partial',
      notes: hasActivePlans ? 'Has active uplift plans' : 'No active plans',
    });

    if (!hasActivePlans) {
      warnings.push('Z02: No active uplift plans (optional but recommended)');
      recommendations.push('Create uplift plans to drive Guardian capability growth');
    }
  } catch (error) {
    console.error('Error checking Z02 uplift:', error);
    components.push({
      key: 'z02_uplift',
      label: 'Z02: Uplift Planning',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z03: EDITION FIT SCORING =====
  try {
    const { data: editionData } = await supabase
      .from('guardian_edition_fit_scores')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasEditionFit = editionData && editionData.length > 0;

    components.push({
      key: 'z03_editions',
      label: 'Z03: Edition Fit Scoring',
      status: hasEditionFit ? 'ready' : 'not_configured',
      notes: hasEditionFit ? 'Edition fit scores defined' : 'Not configured',
    });

    if (!hasEditionFit) {
      warnings.push('Z03: Edition fit not evaluated (optional)');
    }
  } catch (error) {
    console.error('Error checking Z03 editions:', error);
    components.push({
      key: 'z03_editions',
      label: 'Z03: Edition Fit Scoring',
      status: 'not_configured',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z04: EXECUTIVE REPORTING =====
  try {
    const { data: execData } = await supabase
      .from('guardian_executive_reports')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    const hasReports = execData && execData.length > 0;
    const isRecentReport = hasReports && new Date(execData[0].created_at) > thirtyDaysAgo;

    components.push({
      key: 'z04_executive',
      label: 'Z04: Executive Reporting',
      status: isRecentReport ? 'ready' : hasReports ? 'partial' : 'not_configured',
      notes: hasReports ? 'Reports generated' : 'No reports yet',
    });

    if (!hasReports) {
      warnings.push('Z04: No executive reports generated (valuable for exec alignment)');
      recommendations.push('Create executive reports to demonstrate Guardian ROI');
    }
  } catch (error) {
    console.error('Error checking Z04 executive:', error);
    components.push({
      key: 'z04_executive',
      label: 'Z04: Executive Reporting',
      status: 'not_configured',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z05: ADOPTION COACH =====
  try {
    const { data: adoptionData } = await supabase
      .from('guardian_adoption_scores')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasAdoption = adoptionData && adoptionData.length > 0;

    components.push({
      key: 'z05_adoption',
      label: 'Z05: Adoption Coach',
      status: hasAdoption ? 'ready' : 'partial',
      notes: hasAdoption ? 'Adoption scores tracking' : 'Not configured',
    });

    if (!hasAdoption) {
      warnings.push('Z05: Adoption tracking not active');
      recommendations.push('Enable adoption tracking to monitor team usage');
    }
  } catch (error) {
    console.error('Error checking Z05 adoption:', error);
    components.push({
      key: 'z05_adoption',
      label: 'Z05: Adoption Coach',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z06: DATA LIFECYCLE =====
  try {
    const { data: lifecycleData } = await supabase
      .from('guardian_meta_lifecycle_policies')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasLifecycle = lifecycleData && lifecycleData.length > 0;

    components.push({
      key: 'z06_lifecycle',
      label: 'Z06: Data Lifecycle',
      status: hasLifecycle ? 'ready' : 'partial',
      notes: hasLifecycle ? 'Custom policies defined' : 'Using defaults',
    });
  } catch (error) {
    console.error('Error checking Z06 lifecycle:', error);
    components.push({
      key: 'z06_lifecycle',
      label: 'Z06: Data Lifecycle',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z07: META INTEGRATIONS =====
  try {
    const { data: integrationData } = await supabase
      .from('guardian_meta_integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasIntegrations = integrationData && integrationData.length > 0;

    components.push({
      key: 'z07_integrations',
      label: 'Z07: Meta Integrations',
      status: hasIntegrations ? 'ready' : 'partial',
      notes: hasIntegrations ? 'Integrations configured' : 'Not configured',
    });

    if (!hasIntegrations) {
      warnings.push('Z07: No external integrations (optional)');
    }
  } catch (error) {
    console.error('Error checking Z07 integrations:', error);
    components.push({
      key: 'z07_integrations',
      label: 'Z07: Meta Integrations',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z08: PROGRAM GOALS & OKRS =====
  try {
    const { data: goalData } = await supabase
      .from('guardian_program_goals')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasGoals = goalData && goalData.length > 0;

    components.push({
      key: 'z08_goals',
      label: 'Z08: Program Goals & OKRs',
      status: hasGoals ? 'ready' : 'not_configured',
      notes: hasGoals ? 'Goals defined' : 'No goals set',
    });

    if (!hasGoals) {
      warnings.push('Z08: No program goals defined (optional but recommended)');
      recommendations.push('Define clear goals and OKRs for Guardian program');
    }
  } catch (error) {
    console.error('Error checking Z08 goals:', error);
    components.push({
      key: 'z08_goals',
      label: 'Z08: Program Goals & OKRs',
      status: 'not_configured',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z09: PLAYBOOK LIBRARY & KNOWLEDGE HUB =====
  try {
    const { data: playbookData } = await supabase
      .from('guardian_playbooks')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasPlaybooks = playbookData && playbookData.length > 0;

    components.push({
      key: 'z09_playbooks',
      label: 'Z09: Playbook Library',
      status: hasPlaybooks ? 'ready' : 'partial',
      notes: hasPlaybooks ? 'Custom playbooks defined' : 'Using global templates',
    });
  } catch (error) {
    console.error('Error checking Z09 playbooks:', error);
    components.push({
      key: 'z09_playbooks',
      label: 'Z09: Playbook Library',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z10: META GOVERNANCE =====
  try {
    const prefs = await loadMetaGovernancePrefsForTenant(tenantId);
    components.push({
      key: 'z10_governance',
      label: 'Z10: Meta Governance',
      status: 'ready',
      notes: `Risk: ${prefs.riskPosture}, AI: ${prefs.aiUsagePolicy}`,
    });
  } catch (error) {
    console.error('Error checking Z10 governance:', error);
    components.push({
      key: 'z10_governance',
      label: 'Z10: Meta Governance',
      status: 'ready',
      notes: 'Default settings applied',
    });
  }

  // ===== Z11: META EXPORT BUNDLES =====
  try {
    const { data: bundleData } = await supabase
      .from('guardian_meta_export_bundles')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasExportBundles = bundleData && bundleData.length > 0;

    components.push({
      key: 'z11_exports',
      label: 'Z11: Meta Export Bundles',
      status: hasExportBundles ? 'ready' : 'partial',
      notes: hasExportBundles ? 'Export bundles available' : 'No bundles created',
    });
  } catch (error) {
    console.error('Error checking Z11 exports:', error);
    components.push({
      key: 'z11_exports',
      label: 'Z11: Meta Export Bundles',
      status: 'partial',
      notes: 'Error checking configuration',
    });
  }

  // ===== Z12: CONTINUOUS IMPROVEMENT LOOP =====
  try {
    const { data: cycleData } = await supabase
      .from('guardian_meta_improvement_cycles')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .limit(1);

    const hasCycles = cycleData && cycleData.length > 0;

    let cilStatus: GuardianMetaComponentStatus = 'not_configured';
    if (hasCycles) {
      // Check if any cycle has captured outcomes
      const { data: outcomeData } = await supabase
        .from('guardian_meta_improvement_outcomes')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1);

      cilStatus = outcomeData && outcomeData.length > 0 ? 'ready' : 'partial';
    }

    components.push({
      key: 'z12_improvement_loop',
      label: 'Z12: Continuous Improvement Loop',
      status: cilStatus,
      notes:
        cilStatus === 'ready'
          ? 'Active cycles with outcomes'
          : cilStatus === 'partial'
            ? 'Improvement cycles configured'
            : 'Not configured',
    });

    if (cilStatus === 'not_configured') {
      recommendations.push('Create improvement cycles to operationalize Z-series insights');
    }
  } catch (error) {
    console.error('Error checking Z12 improvement loop:', error);
    components.push({
      key: 'z12_improvement_loop',
      label: 'Z12: Continuous Improvement Loop',
      status: 'not_configured',
      notes: 'Error checking configuration',
    });
  }

  // ===== COMPUTE OVERALL STATUS =====
  const readyCount = components.filter((c) => c.status === 'ready').length;
  const partialCount = components.filter((c) => c.status === 'partial').length;
  const notConfiguredCount = components.filter((c) => c.status === 'not_configured').length;

  let overallStatus: GuardianMetaStackOverallStatus = 'experimental';

  try {
    const prefs = await loadMetaGovernancePrefsForTenant(tenantId);

    if (prefs.riskPosture === 'conservative') {
      // Conservative: require 8+ ready
      if (readyCount >= 8) overallStatus = 'recommended';
      else if (readyCount >= 5) overallStatus = 'limited';
      else overallStatus = 'experimental';

      recommendations.push('Conservative posture: Focus on Z01 (readiness) and Z02 (uplift) first');
    } else if (prefs.riskPosture === 'experimental') {
      // Experimental: lower bar
      if (readyCount >= 4) overallStatus = 'recommended';
      else if (readyCount >= 2) overallStatus = 'limited';
      else overallStatus = 'experimental';

      recommendations.push('Experimental posture: Ready to explore Z-series features broadly');
    } else {
      // Standard: 6+ ready
      if (readyCount >= 6) overallStatus = 'recommended';
      else if (readyCount >= 4) overallStatus = 'limited';
      else overallStatus = 'experimental';

      recommendations.push('Standard posture: Focus on Z01, Z02, Z04, Z05 for balanced rollout');
    }
  } catch (error) {
    console.error('Error determining overall status:', error);
  }

  return {
    tenantId,
    computedAt: now,
    components,
    overallStatus,
    readyCount,
    partialCount,
    notConfiguredCount,
    blockers,
    warnings,
    recommendations,
  };
}

/**
 * Get a single component status
 */
export async function getMetaStackComponentStatus(
  tenantId: string,
  componentKey: string
): Promise<GuardianMetaStackComponent | null> {
  const readiness = await computeMetaStackReadiness(tenantId);
  return readiness.components.find((c) => c.key === componentKey) || null;
}

/**
 * Check if Z-series stack is ready for full deployment
 * Returns true only if overallStatus is 'recommended'
 */
export async function isMetaStackRecommended(tenantId: string): Promise<boolean> {
  const readiness = await computeMetaStackReadiness(tenantId);
  return readiness.overallStatus === 'recommended';
}

/**
 * Get component readiness percentage (ready / total)
 */
export async function getMetaStackReadinessPercentage(tenantId: string): Promise<number> {
  const readiness = await computeMetaStackReadiness(tenantId);
  const total = readiness.components.length;
  if (total === 0) return 0;
  return Math.round((readiness.readyCount / total) * 100);
}
