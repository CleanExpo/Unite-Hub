/**
 * Creative Director Engine
 * Phase 61: Central creative intelligence for brand consistency
 */

import { createClient } from '@supabase/supabase-js';

// Brand element types
export type BrandElement =
  | 'primary_palette'
  | 'secondary_palette'
  | 'typography_scale'
  | 'tone_of_voice'
  | 'iconography_style'
  | 'grid_spacing'
  | 'motion_style';

// Visual source providers
export type VisualSource = 'nano_banana_2' | 'dalle_3' | 'gemini_veo_3' | 'elevenlabs';

// Quality check types
export type QualityCheck =
  | 'brand_consistency'
  | 'web_accessibility'
  | 'color_contrast'
  | 'readability'
  | 'tone_accuracy'
  | 'persona_fit'
  | 'truth_layer_compliance';

export interface BrandSignature {
  id: string;
  client_id: string;
  name: string;
  primary_colors: string[];
  secondary_colors: string[];
  typography: {
    heading_font: string;
    body_font: string;
    scale: number[];
  };
  tone_of_voice: string;
  iconography_style: string;
  grid_spacing: number;
  motion_style: 'subtle' | 'dynamic' | 'minimal' | 'none';
  created_at: string;
  updated_at: string;
}

export interface CreativeAsset {
  id: string;
  client_id: string;
  type: 'visual' | 'video' | 'copy' | 'layout';
  source: VisualSource | 'manual';
  quality_score: number;
  brand_consistency_score: number;
  checks_passed: QualityCheck[];
  checks_failed: QualityCheck[];
  created_at: string;
}

export interface CreativeInsight {
  id: string;
  client_id: string;
  type: 'consistency' | 'quality' | 'opportunity' | 'warning';
  title: string;
  description: string;
  metrics: Record<string, number | string>;
  recommended_actions: string[];
  created_at: string;
}

export interface CreativeBriefing {
  generated_at: string;
  total_clients: number;
  avg_quality_score: number;
  avg_consistency_score: number;
  assets_generated_7d: number;
  top_performers: { client_id: string; score: number }[];
  attention_needed: { client_id: string; issue: string }[];
  action_items: string[];
}

// Creative Director constraints
const CREATIVE_CONSTRAINTS = {
  no_fake_brand_assets: true,
  no_unscoped_creative_styles: true,
  always_explain_creative_rationale: true,
  founder_override_for_major_brand_shifts: true,
};

/**
 * Main Creative Director Engine
 * Manages brand consistency and creative quality
 */
export class CreativeDirectorEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get brand signature for a client
   */
  async getBrandSignature(clientId: string): Promise<BrandSignature | null> {
    const { data, error } = await this.supabase
      .from('brand_signatures')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as BrandSignature;
  }

  /**
   * Create or update brand signature
   */
  async saveBrandSignature(signature: Partial<BrandSignature>): Promise<BrandSignature> {
    const { data, error } = await this.supabase
      .from('brand_signatures')
      .upsert({
        ...signature,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save brand signature: ${error.message}`);
    }

    return data as BrandSignature;
  }

  /**
   * Get creative insights for a client
   */
  async getClientInsights(clientId: string): Promise<CreativeInsight[]> {
    const insights: CreativeInsight[] = [];

    // Get brand signature
    const signature = await this.getBrandSignature(clientId);

    // Get recent assets
    const { data: assets } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!signature) {
      insights.push({
        id: `${clientId}-no-signature`,
        client_id: clientId,
        type: 'warning',
        title: 'No Brand Signature Defined',
        description: 'Client needs a brand signature for consistent creative output.',
        metrics: {},
        recommended_actions: [
          'Create brand signature',
          'Define primary colors',
          'Set typography rules',
        ],
        created_at: new Date().toISOString(),
      });
    }

    if (assets && assets.length > 0) {
      const avgQuality = assets.reduce((sum, a) => sum + a.quality_score, 0) / assets.length;
      const avgConsistency = assets.reduce((sum, a) => sum + a.brand_consistency_score, 0) / assets.length;

      if (avgQuality < 70) {
        insights.push({
          id: `${clientId}-low-quality`,
          client_id: clientId,
          type: 'warning',
          title: 'Quality Score Below Target',
          description: `Average quality score of ${Math.round(avgQuality)} is below the 70 target.`,
          metrics: {
            avg_quality: Math.round(avgQuality),
            target: 70,
            assets_reviewed: assets.length,
          },
          recommended_actions: [
            'Review rejected assets',
            'Adjust generation parameters',
            'Update brand guidelines',
          ],
          created_at: new Date().toISOString(),
        });
      }

      if (avgConsistency < 80) {
        insights.push({
          id: `${clientId}-low-consistency`,
          client_id: clientId,
          type: 'consistency',
          title: 'Brand Consistency Needs Attention',
          description: `Consistency score of ${Math.round(avgConsistency)} indicates drift from brand guidelines.`,
          metrics: {
            avg_consistency: Math.round(avgConsistency),
            target: 80,
          },
          recommended_actions: [
            'Review brand signature',
            'Update visual prompts',
            'Train on approved examples',
          ],
          created_at: new Date().toISOString(),
        });
      }

      if (avgQuality >= 85 && avgConsistency >= 90) {
        insights.push({
          id: `${clientId}-high-performer`,
          client_id: clientId,
          type: 'opportunity',
          title: 'Excellent Creative Performance',
          description: 'Client creative output is consistently high quality.',
          metrics: {
            avg_quality: Math.round(avgQuality),
            avg_consistency: Math.round(avgConsistency),
          },
          recommended_actions: [
            'Consider for showcase',
            'Document as best practice',
            'Expand creative scope',
          ],
          created_at: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  /**
   * Generate daily creative briefing
   */
  async generateDailyBriefing(): Promise<CreativeBriefing> {
    // Get all clients with creative assets
    const { data: clients } = await this.supabase
      .from('contacts')
      .select('id, name, company')
      .eq('is_client', true);

    const clientScores: { client_id: string; quality: number; consistency: number }[] = [];
    const attentionNeeded: { client_id: string; issue: string }[] = [];
    let totalAssets = 0;

    for (const client of clients || []) {
      const { data: assets } = await this.supabase
        .from('creative_assets')
        .select('quality_score, brand_consistency_score')
        .eq('client_id', client.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (assets && assets.length > 0) {
        const avgQuality = assets.reduce((sum, a) => sum + a.quality_score, 0) / assets.length;
        const avgConsistency = assets.reduce((sum, a) => sum + a.brand_consistency_score, 0) / assets.length;

        clientScores.push({
          client_id: client.id,
          quality: avgQuality,
          consistency: avgConsistency,
        });

        totalAssets += assets.length;

        if (avgQuality < 60) {
          attentionNeeded.push({ client_id: client.id, issue: 'Low quality score' });
        }
        if (avgConsistency < 70) {
          attentionNeeded.push({ client_id: client.id, issue: 'Brand consistency drift' });
        }
      }
    }

    const avgQuality = clientScores.length > 0
      ? clientScores.reduce((sum, c) => sum + c.quality, 0) / clientScores.length
      : 0;
    const avgConsistency = clientScores.length > 0
      ? clientScores.reduce((sum, c) => sum + c.consistency, 0) / clientScores.length
      : 0;

    const topPerformers = clientScores
      .sort((a, b) => (b.quality + b.consistency) - (a.quality + a.consistency))
      .slice(0, 3)
      .map((c) => ({ client_id: c.client_id, score: Math.round((c.quality + c.consistency) / 2) }));

    const actionItems: string[] = [];
    if (attentionNeeded.length > 0) {
      actionItems.push(`🔴 ${attentionNeeded.length} client(s) need creative attention`);
    }
    if (topPerformers.length > 0) {
      actionItems.push(`🟢 ${topPerformers.length} top performing client(s) to showcase`);
    }
    actionItems.push('📊 Review weekly creative metrics');
    actionItems.push('🎨 Update brand signatures as needed');

    return {
      generated_at: new Date().toISOString(),
      total_clients: clients?.length || 0,
      avg_quality_score: Math.round(avgQuality),
      avg_consistency_score: Math.round(avgConsistency),
      assets_generated_7d: totalAssets,
      top_performers: topPerformers,
      attention_needed: attentionNeeded,
      action_items: actionItems,
    };
  }

  /**
   * Validate asset against brand signature
   */
  async validateAsset(
    clientId: string,
    assetType: CreativeAsset['type'],
    assetData: Record<string, any>
  ): Promise<{
    quality_score: number;
    consistency_score: number;
    checks_passed: QualityCheck[];
    checks_failed: QualityCheck[];
    rationale: string;
  }> {
    const signature = await this.getBrandSignature(clientId);
    const checksPassed: QualityCheck[] = [];
    const checksFailed: QualityCheck[] = [];
    let qualityScore = 70;
    let consistencyScore = 70;

    // Brand consistency check
    if (signature) {
      if (assetData.colors) {
        const colorsMatch = assetData.colors.some((c: string) =>
          signature.primary_colors.includes(c) || signature.secondary_colors.includes(c)
        );
        if (colorsMatch) {
          checksPassed.push('brand_consistency');
          consistencyScore += 10;
        } else {
          checksFailed.push('brand_consistency');
          consistencyScore -= 15;
        }
      }

      // Tone accuracy
      if (assetData.tone && assetData.tone === signature.tone_of_voice) {
        checksPassed.push('tone_accuracy');
        qualityScore += 5;
      } else if (assetData.tone) {
        checksFailed.push('tone_accuracy');
        qualityScore -= 5;
      }
    }

    // Web accessibility check
    if (assetData.contrast_ratio && assetData.contrast_ratio >= 4.5) {
      checksPassed.push('web_accessibility');
      checksPassed.push('color_contrast');
      qualityScore += 10;
    } else {
      checksFailed.push('color_contrast');
      qualityScore -= 10;
    }

    // Readability check
    if (assetData.readability_score && assetData.readability_score >= 60) {
      checksPassed.push('readability');
      qualityScore += 5;
    }

    // Truth layer compliance
    if (!assetData.contains_forbidden_claims) {
      checksPassed.push('truth_layer_compliance');
      qualityScore += 5;
    } else {
      checksFailed.push('truth_layer_compliance');
      qualityScore -= 20;
    }

    const rationale = this.generateRationale(checksPassed, checksFailed);

    return {
      quality_score: Math.max(0, Math.min(100, qualityScore)),
      consistency_score: Math.max(0, Math.min(100, consistencyScore)),
      checks_passed: checksPassed,
      checks_failed: checksFailed,
      rationale,
    };
  }

  private generateRationale(passed: QualityCheck[], failed: QualityCheck[]): string {
    const parts: string[] = [];

    if (passed.includes('brand_consistency')) {
      parts.push('Colors align with brand signature.');
    }
    if (passed.includes('truth_layer_compliance')) {
      parts.push('Content is truth-layer compliant.');
    }
    if (failed.includes('color_contrast')) {
      parts.push('Color contrast needs improvement for accessibility.');
    }
    if (failed.includes('brand_consistency')) {
      parts.push('Colors deviate from approved brand palette.');
    }

    return parts.join(' ') || 'Asset reviewed successfully.';
  }
}

export default CreativeDirectorEngine;
