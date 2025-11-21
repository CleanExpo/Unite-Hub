/**
 * GRH Engine - Global Regulatory Harmonisation & Region-Aware Policy Engine
 * Phase 90 - Multi-tenant RLS compliant
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RegionalRegulation {
  id: string;
  tenant_id: string;
  region: string;
  regulation_name: string;
  regulation_type: string;
  requirements: Record<string, any>;
  effective_date: string;
  status: 'active' | 'pending' | 'expired';
}

export interface HarmonisationStatus {
  region: string;
  harmonised: boolean;
  conflicts: string[];
  adaptations_required: string[];
}

export interface PolicyMapping {
  source_region: string;
  target_region: string;
  mappings: Record<string, string>;
  compatibility_score: number;
}

export class GRHEngine {
  /**
   * Get regulations for a specific region
   */
  async getRegionalRegulations(tenantId: string, region: string): Promise<RegionalRegulation[]> {
    const { data, error } = await supabase
      .from('grh_regional_regulations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('region', region)
      .eq('status', 'active')
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('[GRHEngine] Error fetching regulations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check harmonisation status between regions
   */
  async checkHarmonisation(
    tenantId: string,
    sourceRegion: string,
    targetRegion: string
  ): Promise<HarmonisationStatus> {
    const sourceRegs = await this.getRegionalRegulations(tenantId, sourceRegion);
    const targetRegs = await this.getRegionalRegulations(tenantId, targetRegion);

    const conflicts: string[] = [];
    const adaptationsRequired: string[] = [];

    // Compare regulation types
    const sourceTypes = new Set(sourceRegs.map(r => r.regulation_type));
    const targetTypes = new Set(targetRegs.map(r => r.regulation_type));

    // Find regulations in source not in target
    for (const type of sourceTypes) {
      if (!targetTypes.has(type)) {
        adaptationsRequired.push(`${type} regulation needs adaptation for ${targetRegion}`);
      }
    }

    // Check for conflicting requirements
    for (const sourceReg of sourceRegs) {
      const matchingTarget = targetRegs.find(t => t.regulation_type === sourceReg.regulation_type);
      if (matchingTarget) {
        // Simple conflict detection - in production this would be more sophisticated
        const sourceKeys = Object.keys(sourceReg.requirements);
        const targetKeys = Object.keys(matchingTarget.requirements);

        for (const key of sourceKeys) {
          if (targetKeys.includes(key) &&
              JSON.stringify(sourceReg.requirements[key]) !== JSON.stringify(matchingTarget.requirements[key])) {
            conflicts.push(`${sourceReg.regulation_type}: ${key} requirement differs between regions`);
          }
        }
      }
    }

    return {
      region: targetRegion,
      harmonised: conflicts.length === 0 && adaptationsRequired.length === 0,
      conflicts,
      adaptations_required: adaptationsRequired
    };
  }

  /**
   * Create regional regulation
   */
  async createRegulation(
    tenantId: string,
    region: string,
    regulationName: string,
    regulationType: string,
    requirements: Record<string, any>,
    effectiveDate: string
  ): Promise<RegionalRegulation | null> {
    const { data, error } = await supabase
      .from('grh_regional_regulations')
      .insert({
        tenant_id: tenantId,
        region,
        regulation_name: regulationName,
        regulation_type: regulationType,
        requirements,
        effective_date: effectiveDate,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[GRHEngine] Error creating regulation:', error);
      return null;
    }

    return data;
  }

  /**
   * Generate policy mapping between regions
   */
  async generatePolicyMapping(
    tenantId: string,
    sourceRegion: string,
    targetRegion: string
  ): Promise<PolicyMapping> {
    const sourceRegs = await this.getRegionalRegulations(tenantId, sourceRegion);
    const targetRegs = await this.getRegionalRegulations(tenantId, targetRegion);

    const mappings: Record<string, string> = {};
    let compatibilityScore = 100;

    for (const sourceReg of sourceRegs) {
      const matchingTarget = targetRegs.find(t => t.regulation_type === sourceReg.regulation_type);

      if (matchingTarget) {
        mappings[sourceReg.regulation_name] = matchingTarget.regulation_name;
      } else {
        mappings[sourceReg.regulation_name] = 'NO_EQUIVALENT';
        compatibilityScore -= 10;
      }
    }

    // Store mapping
    await supabase
      .from('grh_policy_mappings')
      .upsert({
        tenant_id: tenantId,
        source_region: sourceRegion,
        target_region: targetRegion,
        mappings,
        compatibility_score: Math.max(0, compatibilityScore),
        updated_at: new Date().toISOString()
      });

    return {
      source_region: sourceRegion,
      target_region: targetRegion,
      mappings,
      compatibility_score: Math.max(0, compatibilityScore)
    };
  }

  /**
   * Get all regions with active regulations
   */
  async getActiveRegions(tenantId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('grh_regional_regulations')
      .select('region')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (error) {
      console.error('[GRHEngine] Error fetching regions:', error);
      return [];
    }

    // Return unique regions
    return [...new Set(data?.map(r => r.region) || [])];
  }

  /**
   * Check compliance with regional regulations
   */
  async checkRegionalCompliance(tenantId: string, region: string): Promise<{
    compliant: boolean;
    score: number;
    gaps: string[];
  }> {
    const regulations = await this.getRegionalRegulations(tenantId, region);

    if (regulations.length === 0) {
      return {
        compliant: true,
        score: 100,
        gaps: ['No regulations defined for this region']
      };
    }

    let score = 100;
    const gaps: string[] = [];

    for (const reg of regulations) {
      // Check if regulation has requirements defined
      if (!reg.requirements || Object.keys(reg.requirements).length === 0) {
        score -= 5;
        gaps.push(`${reg.regulation_name}: No requirements specified`);
      }

      // Check if effective date is in the future
      if (new Date(reg.effective_date) > new Date()) {
        gaps.push(`${reg.regulation_name}: Not yet effective`);
      }
    }

    return {
      compliant: score >= 70,
      score: Math.max(0, score),
      gaps
    };
  }
}

export const grhEngine = new GRHEngine();
