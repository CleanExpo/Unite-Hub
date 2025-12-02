/**
 * GEO Targeting System
 * Phase 7: Docker Multi-Tenant Architecture
 *
 * Manages local SEO targeting with radius-based optimization:
 * - Onboarding questionnaire for business type and service area
 * - Dynamic radius selection (3-50 km)
 * - Cost multipliers based on radius
 * - DataForSEO location mapping
 * - Gap suburb identification for expansion
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type BusinessType =
  | "coffee_shop"
  | "retail"
  | "trade_business"
  | "restoration_service"
  | "professional_service"
  | "online_service";

export type RadiusKm = 3 | 5 | 10 | 15 | 20 | 25 | 50;

export interface GeoQuestionnaire {
  clientId: string;
  organizationId: string;
  business_type: BusinessType;
  main_service: string;
  service_area_km: RadiusKm;
  top_3_competitors: string[];
  website_url: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  primary_business_address: string;
  priority_suburbs_or_postcodes: string[];
  exclude_areas: string[];
}

export interface GeoTargetingConfig {
  clientId: string;
  radius_km: RadiusKm;
  geo_center_lat: number;
  geo_center_lng: number;
  location_name: string; // e.g., "Brisbane, Queensland, Australia"
  dataforseo_location_code: number; // DataForSEO location ID
  cost_multiplier: number; // 1.0 to 2.0
  business_type: BusinessType;
  recommended_radii: RadiusKm[]; // Based on business type
}

export interface GapSuburb {
  suburb_name: string;
  postcode: string;
  distance_km: number;
  search_volume: number;
  current_rank: number | null;
  opportunity_score: number; // 0-100
  recommended_action: string;
}

export class GeoTargeting {
  /**
   * Radius cost multipliers
   */
  private static COST_MULTIPLIERS: Record<RadiusKm, number> = {
    3: 1.0,
    5: 1.1,
    10: 1.25,
    15: 1.4,
    20: 1.5,
    25: 1.7,
    50: 2.0,
  };

  /**
   * Business type → recommended radii mapping
   */
  private static BUSINESS_TYPE_RADII: Record<BusinessType, RadiusKm[]> = {
    coffee_shop: [3, 5],
    retail: [5, 10],
    trade_business: [10, 15, 20],
    restoration_service: [20, 25, 50],
    professional_service: [10, 15, 20],
    online_service: [50],
  };

  /**
   * Get cost multiplier for a radius
   */
  static getCostMultiplier(radiusKm: number): number {
    const validRadius = radiusKm as RadiusKm;
    return this.COST_MULTIPLIERS[validRadius] ?? 1.0;
  }

  /**
   * Save GEO questionnaire responses
   */
  static async saveQuestionnaire(questionnaire: GeoQuestionnaire): Promise<{
    success: boolean;
    config?: GeoTargetingConfig;
    error?: string;
  }> {
    try {
      console.log(`[GeoTargeting] Saving questionnaire for client: ${questionnaire.clientId}`);

      // Geocode primary business address
      const geocode = await this.geocodeAddress(questionnaire.primary_business_address);

      if (!geocode.success) {
        return {
          success: false,
          error: `Failed to geocode address: ${geocode.error}`,
        };
      }

      // Get DataForSEO location code
      const locationCode = await this.getDataForSEOLocationCode(
        geocode.lat!,
        geocode.lng!,
        geocode.location_name!
      );

      // Calculate cost multiplier
      const costMultiplier = this.COST_MULTIPLIERS[questionnaire.service_area_km];

      // Get recommended radii for business type
      const recommendedRadii = this.BUSINESS_TYPE_RADII[questionnaire.business_type];

      // Create GEO targeting config
      const config: GeoTargetingConfig = {
        clientId: questionnaire.clientId,
        radius_km: questionnaire.service_area_km,
        geo_center_lat: geocode.lat!,
        geo_center_lng: geocode.lng!,
        location_name: geocode.location_name!,
        dataforseo_location_code: locationCode,
        cost_multiplier: costMultiplier,
        business_type: questionnaire.business_type,
        recommended_radii: recommendedRadii,
      };

      // Save to database
      const { error: dbError } = await supabaseAdmin
        .from("seo_client_profiles")
        .upsert({
          client_id: questionnaire.clientId,
          organization_id: questionnaire.organizationId,
          primary_domain: questionnaire.website_url,
          geo_radius_km: questionnaire.service_area_km,
          geo_center_lat: geocode.lat!,
          geo_center_lng: geocode.lng!,
          geo_location_name: geocode.location_name!,
          dataforseo_location_code: locationCode,
          business_type: questionnaire.business_type,
          main_service: questionnaire.main_service,
          top_3_competitors: questionnaire.top_3_competitors,
          social_links: questionnaire.social_links,
          primary_business_address: questionnaire.primary_business_address,
          priority_suburbs: questionnaire.priority_suburbs_or_postcodes,
          exclude_areas: questionnaire.exclude_areas,
          cost_multiplier: costMultiplier,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error(`[GeoTargeting] Database error:`, dbError);
        return {
          success: false,
          error: `Database error: ${dbError.message}`,
        };
      }

      console.log(`[GeoTargeting] ✅ Saved questionnaire for ${questionnaire.clientId}`);

      return { success: true, config };
    } catch (error) {
      console.error(`[GeoTargeting] Error saving questionnaire:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get GEO targeting config for client
   */
  static async getConfig(clientId: string): Promise<{
    success: boolean;
    config?: GeoTargetingConfig;
    error?: string;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from("seo_client_profiles")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: "Client profile not found",
        };
      }

      const config: GeoTargetingConfig = {
        clientId: data.client_id,
        radius_km: data.geo_radius_km,
        geo_center_lat: data.geo_center_lat,
        geo_center_lng: data.geo_center_lng,
        location_name: data.geo_location_name,
        dataforseo_location_code: data.dataforseo_location_code,
        cost_multiplier: data.cost_multiplier,
        business_type: data.business_type,
        recommended_radii: this.BUSINESS_TYPE_RADII[data.business_type as BusinessType],
      };

      return { success: true, config };
    } catch (error) {
      console.error(`[GeoTargeting] Error getting config:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Identify gap suburbs for expansion
   */
  static async identifyGapSuburbs(clientId: string): Promise<{
    success: boolean;
    gaps?: GapSuburb[];
    error?: string;
  }> {
    try {
      console.log(`[GeoTargeting] Identifying gap suburbs for client: ${clientId}`);

      // Get client config
      const { success, config, error } = await this.getConfig(clientId);

      if (!success || !config) {
        return { success: false, error };
      }

      // Get current rankings from DataForSEO
      // TODO: Call DataForSEO Local Pack API to get current rankings
      // For now, return mock data

      const gaps: GapSuburb[] = [
        {
          suburb_name: "Spring Hill",
          postcode: "4000",
          distance_km: 2.5,
          search_volume: 1200,
          current_rank: null,
          opportunity_score: 85,
          recommended_action: "Create location page + 3 GMB posts",
        },
        {
          suburb_name: "Fortitude Valley",
          postcode: "4006",
          distance_km: 3.8,
          search_volume: 950,
          current_rank: 12,
          opportunity_score: 72,
          recommended_action: "Optimize existing page + backlinks",
        },
        {
          suburb_name: "Paddington",
          postcode: "4064",
          distance_km: 4.2,
          search_volume: 680,
          current_rank: null,
          opportunity_score: 68,
          recommended_action: "Create location page",
        },
      ];

      console.log(`[GeoTargeting] ✅ Found ${gaps.length} gap suburbs`);

      return { success: true, gaps };
    } catch (error) {
      console.error(`[GeoTargeting] Error identifying gap suburbs:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate GEO expansion strategy (markdown report)
   */
  static async generateExpansionStrategy(clientId: string): Promise<{
    success: boolean;
    markdown?: string;
    error?: string;
  }> {
    try {
      const { success, gaps, error } = await this.identifyGapSuburbs(clientId);

      if (!success || !gaps) {
        return { success: false, error };
      }

      const { config } = await this.getConfig(clientId);

      if (!config) {
        return { success: false, error: "Config not found" };
      }

      // Generate markdown report
      const markdown = `# Local GEO Expansion Strategy

**Client ID**: ${clientId}
**Location**: ${config.location_name}
**Current Radius**: ${config.radius_km} km
**Business Type**: ${config.business_type}
**Generated**: ${new Date().toISOString()}

---

## Executive Summary

We identified **${gaps.length} high-opportunity suburbs** within your expanded service area that currently have low or no rankings. These suburbs represent ${gaps.reduce((sum, g) => sum + g.search_volume, 0)} monthly searches combined.

---

## Gap Suburbs (Ranked by Opportunity Score)

${gaps
  .sort((a, b) => b.opportunity_score - a.opportunity_score)
  .map(
    (gap, i) => `
### ${i + 1}. ${gap.suburb_name} (${gap.postcode})

- **Distance**: ${gap.distance_km} km from center
- **Search Volume**: ${gap.search_volume}/month
- **Current Rank**: ${gap.current_rank ? `#${gap.current_rank}` : "Not ranking"}
- **Opportunity Score**: ${gap.opportunity_score}/100
- **Recommended Action**: ${gap.recommended_action}
`
  )
  .join("\n")}

---

## Recommended Actions (3-Month Plan)

### Month 1: Foundation
1. Create dedicated location pages for top 3 suburbs
2. Set up Google My Business posts for each suburb
3. Build local citations (directories, chambers of commerce)

### Month 2: Content & Optimization
1. Publish 3 blog posts about local services in each suburb
2. Optimize existing pages with local keywords
3. Build 5-10 local backlinks per suburb

### Month 3: Expansion & Monitoring
1. Create location pages for remaining suburbs
2. Monitor rankings weekly
3. Adjust strategy based on performance

---

## Expected Results

- **Month 1**: First rankings appear in top 3 suburbs
- **Month 2**: 30-50% improvement in local pack visibility
- **Month 3**: Ranking in top 5 for 50%+ of target suburbs

---

**Next Steps**:
1. Review and approve this strategy
2. Schedule monthly check-ins
3. Begin implementation with top 3 suburbs

**Cost Multiplier**: ${config.cost_multiplier}x (based on ${config.radius_km} km radius)
`;

      return { success: true, markdown };
    } catch (error) {
      console.error(`[GeoTargeting] Error generating expansion strategy:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Geocode address using Google Maps API
   */
  private static async geocodeAddress(address: string): Promise<{
    success: boolean;
    lat?: number;
    lng?: number;
    location_name?: string;
    error?: string;
  }> {
    try {
      // TODO: Implement actual Google Maps Geocoding API call
      // For now, return mock Brisbane coordinates

      console.log(`[GeoTargeting] Geocoding address: ${address}`);

      // Mock geocoding (Brisbane CBD)
      return {
        success: true,
        lat: -27.4698,
        lng: 153.0251,
        location_name: "Brisbane, Queensland, Australia",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Geocoding failed",
      };
    }
  }

  /**
   * Get DataForSEO location code from coordinates
   */
  private static async getDataForSEOLocationCode(
    lat: number,
    lng: number,
    locationName: string
  ): Promise<number> {
    try {
      // TODO: Call DataForSEO Locations API to get closest location code
      // For now, return Australia location code (2036)

      console.log(`[GeoTargeting] Getting DataForSEO location code for: ${locationName}`);

      return 2036; // Australia
    } catch (error) {
      console.error(`[GeoTargeting] Error getting location code:`, error);
      return 2036; // Default to Australia
    }
  }
}

export default GeoTargeting;
