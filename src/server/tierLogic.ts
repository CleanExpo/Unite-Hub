/**
 * Tier Logic System
 * Phase 5: Intelligence Layer
 *
 * Determines audit scope and frequency based on:
 * - User subscription tier (free, starter, pro, enterprise)
 * - Active addons
 * - Usage limits
 * - Last audit timestamp
 *
 * Handles tier transitions and addon activations.
 */

import type { AuditTier, AuditAddon, AuditConfig } from "@/lib/seo/auditTypes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface TierConfig {
  tier: AuditTier;
  auditsPerMonth: number;
  frequency: "daily" | "twice_weekly" | "weekly" | "every_7_days";
  features: string[];
  dataforSEOTasks: string[];
  maxKeywords: number;
  maxCompetitors: number;
}

export const TIER_CONFIGS: Record<AuditTier, TierConfig> = {
  free: {
    tier: "free",
    auditsPerMonth: 4,
    frequency: "every_7_days",
    features: ["Basic Snapshot", "Health Score"],
    dataforSEOTasks: [],
    maxKeywords: 5,
    maxCompetitors: 0,
  },
  starter: {
    tier: "starter",
    auditsPerMonth: 4,
    frequency: "weekly",
    features: ["Complete SEO Audit", "Social Audit", "Recommendations"],
    dataforSEOTasks: ["serp_keywords", "on_page_score"],
    maxKeywords: 20,
    maxCompetitors: 2,
  },
  pro: {
    tier: "pro",
    auditsPerMonth: 8,
    frequency: "twice_weekly",
    features: [
      "Full DataForSEO Expanded Audit",
      "Competitor Tracking",
      "Keyword Gap",
      "Backlinks",
    ],
    dataforSEOTasks: [
      "serp_keywords",
      "on_page_score",
      "competitor_analysis",
      "keyword_gap",
      "backlinks",
    ],
    maxKeywords: 50,
    maxCompetitors: 5,
  },
  enterprise: {
    tier: "enterprise",
    auditsPerMonth: 30,
    frequency: "daily",
    features: [
      "Full Stack Intelligence",
      "GEO Tracking",
      "Competitors",
      "Social Signals",
      "Priority Support",
    ],
    dataforSEOTasks: [
      "serp_keywords",
      "on_page_score",
      "competitor_analysis",
      "keyword_gap",
      "backlinks",
      "local_geo_pack",
      "social_signals",
    ],
    maxKeywords: 200,
    maxCompetitors: 10,
  },
};

export class TierLogic {
  /**
   * Get tier configuration for a user
   */
  static getTierConfig(tier: AuditTier): TierConfig {
    return TIER_CONFIGS[tier];
  }

  /**
   * Check if user can run an audit
   */
  static async canRunAudit(seoProfileId: string): Promise<{
    allowed: boolean;
    reason?: string;
    nextAuditAt?: string;
  }> {
    try {
      // Get user's SEO profile with subscription tier
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("seo_profiles")
        .select("*, subscriptions(tier)")
        .eq("id", seoProfileId)
        .single();

      if (profileError || !profile) {
        return {
          allowed: false,
          reason: "SEO profile not found",
        };
      }

      const tier = (profile.subscriptions?.tier as AuditTier) || "free";
      const tierConfig = this.getTierConfig(tier);

      // Check usage this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: auditsThisMonth, error: auditsError } = await supabaseAdmin
        .from("seo_audit_snapshots")
        .select("id")
        .eq("seo_profile_id", seoProfileId)
        .gte("timestamp", startOfMonth.toISOString());

      if (auditsError) {
        return {
          allowed: false,
          reason: "Failed to check audit history",
        };
      }

      const auditCount = auditsThisMonth?.length || 0;

      if (auditCount >= tierConfig.auditsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly audit limit reached (${auditCount}/${tierConfig.auditsPerMonth})`,
          nextAuditAt: new Date(startOfMonth.setMonth(startOfMonth.getMonth() + 1)).toISOString(),
        };
      }

      // Check last audit timestamp to prevent spam
      const { data: lastAudit, error: lastAuditError } = await supabaseAdmin
        .from("seo_audit_snapshots")
        .select("timestamp")
        .eq("seo_profile_id", seoProfileId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (!lastAuditError && lastAudit) {
        const lastAuditTime = new Date(lastAudit.timestamp);
        const now = new Date();
        const hoursSinceLastAudit = (now.getTime() - lastAuditTime.getTime()) / (1000 * 60 * 60);

        // Minimum 1 hour between audits (prevent spam)
        if (hoursSinceLastAudit < 1) {
          return {
            allowed: false,
            reason: "Please wait at least 1 hour between audits",
            nextAuditAt: new Date(lastAuditTime.getTime() + 60 * 60 * 1000).toISOString(),
          };
        }
      }

      return {
        allowed: true,
      };
    } catch (error) {
      console.error("[TierLogic] Error checking audit eligibility:", error);
      return {
        allowed: false,
        reason: "System error",
      };
    }
  }

  /**
   * Build audit configuration based on tier and addons
   */
  static async buildAuditConfig(
    seoProfileId: string,
    organizationId: string
  ): Promise<AuditConfig | null> {
    try {
      // Get SEO profile with subscription
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("seo_profiles")
        .select("*, subscriptions(tier, addons)")
        .eq("id", seoProfileId)
        .single();

      if (profileError || !profile) {
        console.error("[TierLogic] SEO profile not found");
        return null;
      }

      const tier = (profile.subscriptions?.tier as AuditTier) || "free";
      const addons = (profile.subscriptions?.addons as AuditAddon[]) || [];

      // Get keywords for audit
      const { data: keywords, error: keywordsError } = await supabaseAdmin
        .from("seo_keywords")
        .select("keyword")
        .eq("seo_profile_id", seoProfileId)
        .limit(TIER_CONFIGS[tier].maxKeywords);

      // Get competitor domains
      const { data: competitors, error: competitorsError } = await supabaseAdmin
        .from("seo_competitors")
        .select("domain")
        .eq("seo_profile_id", seoProfileId)
        .limit(TIER_CONFIGS[tier].maxCompetitors);

      const config: AuditConfig = {
        seoProfileId,
        organizationId,
        domain: profile.domain,
        tier,
        keywords: keywords?.map((k) => k.keyword) || [],
        competitorDomains: competitors?.map((c) => c.domain) || [],
        location: profile.location || "",
        addons,
      };

      return config;
    } catch (error) {
      console.error("[TierLogic] Error building audit config:", error);
      return null;
    }
  }

  /**
   * Get next scheduled audit time based on frequency
   */
  static getNextAuditTime(frequency: TierConfig["frequency"], lastAuditAt?: Date): Date {
    const now = lastAuditAt || new Date();

    switch (frequency) {
      case "daily":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case "twice_weekly":
        return new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);
      case "weekly":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "every_7_days":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Handle addon activation
   */
  static applyAddonToConfig(config: AuditConfig, addon: AuditAddon): AuditConfig {
    const updatedConfig = { ...config };

    switch (addon.type) {
      case "competitor_tracking":
        // Ensure competitor analysis is included in DataForSEO tasks
        if (!updatedConfig.competitorDomains || updatedConfig.competitorDomains.length === 0) {
          console.warn("[TierLogic] Competitor tracking addon active but no competitors configured");
        }
        break;

      case "local_pack_tracker":
        // Ensure location is set
        if (!updatedConfig.location) {
          console.warn("[TierLogic] Local pack tracker addon active but no location configured");
        }
        break;

      case "social_intelligence":
        // Add social signals task
        break;

      case "content_velocity":
        // Add Hypnotic Mode insights (handled in UI)
        break;
    }

    return updatedConfig;
  }

  /**
   * Calculate audit cost (DataForSEO credits)
   */
  static calculateAuditCost(tier: AuditTier, addons: AuditAddon[]): number {
    let cost = 0;

    const tierConfig = TIER_CONFIGS[tier];

    // Base cost per DataForSEO task
    const taskCosts: Record<string, number> = {
      serp_keywords: 0.01, // per keyword
      on_page_score: 0.05,
      competitor_analysis: 0.02,
      keyword_gap: 0.03,
      backlinks: 0.01,
      local_geo_pack: 0.02,
      social_signals: 0,
    };

    tierConfig.dataforSEOTasks.forEach((task) => {
      cost += taskCosts[task] || 0;
    });

    // Add addon costs
    addons.forEach((addon) => {
      if (addon.enabled) {
        switch (addon.type) {
          case "competitor_tracking":
            cost += 0.05;
            break;
          case "local_pack_tracker":
            cost += 0.02;
            break;
          case "social_intelligence":
            cost += 0; // Free (uses alternative APIs)
            break;
          case "content_velocity":
            cost += 0; // Free (UI-only)
            break;
        }
      }
    });

    return cost;
  }
}

export default TierLogic;
