/**
 * Business Consistency Service
 *
 * Manages NAP (Name, Address, Phone) consistency across all platforms.
 * Implements the Business Consistency Framework with:
 * - Tier 1-4 data management
 * - Schema.org JSON-LD generation
 * - Platform citation tracking
 * - Consistency auditing
 *
 * @module lib/consistency/business-consistency-service
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export interface BusinessConsistencyMaster {
  id: string;
  workspace_id: string;
  client_id: string | null;

  // Tier 1: Critical NAP
  legal_business_name: string;
  trading_name: string | null;
  street_address: string;
  address_line_2: string | null;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  primary_phone: string;
  phone_format: string | null;

  // Tier 2: Essential
  website_url: string;
  email_address: string;
  business_hours: BusinessHours | null;
  primary_category: string;
  secondary_categories: string[] | null;

  // Tier 3: Important
  short_description: string | null;
  medium_description: string | null;
  long_description: string | null;
  service_areas: string[] | null;
  payment_methods: string[] | null;

  // Tier 4: Australia-specific
  abn: string | null;
  acn: string | null;
  license_numbers: Record<string, string> | null;

  // Social & Geo
  social_profiles: SocialProfiles | null;
  geo_coordinates: GeoCoordinates | null;

  // Schema
  schema_local_business: object | null;
  schema_organization: object | null;

  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  public_holidays?: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface SocialProfiles {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  pinterest?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface CitationListing {
  id: string;
  consistency_master_id: string;
  platform_name: string;
  platform_tier: number;
  platform_url: string | null;
  listing_url: string | null;
  listing_status: 'not_claimed' | 'claimed' | 'pending_verification' | 'verified' | 'needs_update' | 'suspended';
  current_nap: NAPData | null;
  is_consistent: boolean | null;
  inconsistencies: string[] | null;
  last_checked: string | null;
  last_updated: string | null;
}

export interface NAPData {
  name: string;
  address: string;
  phone: string;
}

export interface ConsistencyAuditResult {
  overall_score: number;
  tier1_score: number;
  tier2_score: number;
  tier3_score: number;
  platforms: PlatformAuditResult[];
  recommendations: string[];
}

export interface PlatformAuditResult {
  platform: string;
  tier: number;
  is_consistent: boolean;
  issues: string[];
}

export interface CreateMasterInput {
  workspace_id: string;
  client_id?: string;
  legal_business_name: string;
  trading_name?: string;
  street_address: string;
  address_line_2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country?: string;
  primary_phone: string;
  phone_format?: string;
  website_url: string;
  email_address: string;
  business_hours?: BusinessHours;
  primary_category: string;
  secondary_categories?: string[];
  short_description?: string;
  medium_description?: string;
  long_description?: string;
  service_areas?: string[];
  payment_methods?: string[];
  abn?: string;
  acn?: string;
  license_numbers?: Record<string, string>;
  social_profiles?: SocialProfiles;
  geo_coordinates?: GeoCoordinates;
}

// ============================================
// Platform Priority List (per Framework)
// ============================================

export const PLATFORM_TIERS = {
  tier1_mandatory: [
    { name: 'google_business_profile', displayName: 'Google Business Profile', url: 'business.google.com' },
    { name: 'bing_places', displayName: 'Bing Places for Business', url: 'bingplaces.com' },
    { name: 'apple_maps', displayName: 'Apple Maps Connect', url: 'mapsconnect.apple.com' },
    { name: 'facebook', displayName: 'Facebook Business Page', url: 'facebook.com/business' },
  ],
  tier2_essential_australia: [
    { name: 'yellow_pages', displayName: 'Yellow Pages Australia', url: 'yellowpages.com.au' },
    { name: 'true_local', displayName: 'True Local', url: 'truelocal.com.au' },
    { name: 'yelp', displayName: 'Yelp Australia', url: 'yelp.com.au' },
    { name: 'white_pages', displayName: 'White Pages', url: 'whitepages.com.au' },
    { name: 'hotfrog', displayName: 'Hotfrog Australia', url: 'hotfrog.com.au' },
  ],
  tier3_social: [
    { name: 'linkedin', displayName: 'LinkedIn Company Page', url: 'linkedin.com/company' },
    { name: 'instagram', displayName: 'Instagram Business', url: 'instagram.com' },
    { name: 'youtube', displayName: 'YouTube Channel', url: 'youtube.com' },
    { name: 'tiktok', displayName: 'TikTok Business', url: 'tiktok.com' },
  ],
  tier4_australian_directories: [
    { name: 'startlocal', displayName: 'StartLocal', url: 'startlocal.com.au' },
    { name: 'dlook', displayName: 'dLook', url: 'dlook.com.au' },
    { name: 'local_com_au', displayName: 'Local.com.au', url: 'local.com.au' },
    { name: 'womo', displayName: 'Word of Mouth Online', url: 'wordofmouth.com.au' },
    { name: 'foursquare', displayName: 'Foursquare', url: 'business.foursquare.com' },
  ],
  tier5_industry_specific: {
    trades: [
      { name: 'oneflare', displayName: 'Oneflare', url: 'oneflare.com.au' },
      { name: 'hipages', displayName: 'hipages', url: 'hipages.com.au' },
      { name: 'serviceseeking', displayName: 'ServiceSeeking', url: 'serviceseeking.com.au' },
    ],
    healthcare: [
      { name: 'healthengine', displayName: 'HealthEngine', url: 'healthengine.com.au' },
    ],
    real_estate: [
      { name: 'realestate_com_au', displayName: 'RealEstate.com.au', url: 'realestate.com.au' },
    ],
  },
};

// ============================================
// Service Class
// ============================================

export class BusinessConsistencyService {
  /**
   * Create a new consistency master document
   */
  async createMaster(input: CreateMasterInput): Promise<BusinessConsistencyMaster> {
    const supabase = await getSupabaseServer();

    // Generate schema markup
    const schemaLocalBusiness = this.generateLocalBusinessSchema(input);
    const schemaOrganization = this.generateOrganizationSchema(input);

    const { data, error } = await supabase
      .from('business_consistency_master')
      .insert({
        workspace_id: input.workspace_id,
        client_id: input.client_id || null,
        legal_business_name: input.legal_business_name,
        trading_name: input.trading_name || null,
        street_address: input.street_address,
        address_line_2: input.address_line_2 || null,
        suburb: input.suburb,
        state: input.state,
        postcode: input.postcode,
        country: input.country || 'Australia',
        primary_phone: input.primary_phone,
        phone_format: input.phone_format || null,
        website_url: input.website_url,
        email_address: input.email_address,
        business_hours: input.business_hours || null,
        primary_category: input.primary_category,
        secondary_categories: input.secondary_categories || null,
        short_description: input.short_description || null,
        medium_description: input.medium_description || null,
        long_description: input.long_description || null,
        service_areas: input.service_areas || null,
        payment_methods: input.payment_methods || null,
        abn: input.abn || null,
        acn: input.acn || null,
        license_numbers: input.license_numbers || null,
        social_profiles: input.social_profiles || null,
        geo_coordinates: input.geo_coordinates || null,
        schema_local_business: schemaLocalBusiness,
        schema_organization: schemaOrganization,
      })
      .select()
      .single();

    if (error) {
      console.error('[BusinessConsistencyService] Failed to create master:', error);
      throw new Error(`Failed to create consistency master: ${error.message}`);
    }

    // Initialize citation listings for all platforms
    await this.initializeCitationListings(data.id);

    return data;
  }

  /**
   * Get consistency master by ID
   */
  async getMaster(id: string, workspaceId: string): Promise<BusinessConsistencyMaster | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('business_consistency_master')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get consistency master: ${error.message}`);
    }

    return data;
  }

  /**
   * Get consistency master by workspace and optionally client
   */
  async getMasterByWorkspace(workspaceId: string, clientId?: string): Promise<BusinessConsistencyMaster | null> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('business_consistency_master')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.is('client_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get consistency master: ${error.message}`);
    }

    return data;
  }

  /**
   * Update consistency master
   */
  async updateMaster(id: string, workspaceId: string, updates: Partial<CreateMasterInput>): Promise<BusinessConsistencyMaster> {
    const supabase = await getSupabaseServer();

    // Get current master to merge with updates for schema regeneration
    const current = await this.getMaster(id, workspaceId);
    if (!current) {
      throw new Error('Consistency master not found');
    }

    // Merge current with updates for schema generation
    const merged = { ...current, ...updates };
    const schemaLocalBusiness = this.generateLocalBusinessSchema(merged as CreateMasterInput);
    const schemaOrganization = this.generateOrganizationSchema(merged as CreateMasterInput);

    const { data, error } = await supabase
      .from('business_consistency_master')
      .update({
        ...updates,
        schema_local_business: schemaLocalBusiness,
        schema_organization: schemaOrganization,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update consistency master: ${error.message}`);
    }

    return data;
  }

  /**
   * Generate LocalBusiness schema.org JSON-LD
   */
  generateLocalBusinessSchema(input: CreateMasterInput): object {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness', // Can be more specific based on category
      name: input.legal_business_name,
      url: input.website_url,
      telephone: input.primary_phone,
      email: input.email_address,
      address: {
        '@type': 'PostalAddress',
        streetAddress: input.street_address + (input.address_line_2 ? `, ${input.address_line_2}` : ''),
        addressLocality: input.suburb,
        addressRegion: input.state,
        postalCode: input.postcode,
        addressCountry: input.country || 'AU',
      },
    };

    // Add geo coordinates if available
    if (input.geo_coordinates) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: input.geo_coordinates.latitude,
        longitude: input.geo_coordinates.longitude,
      };
    }

    // Add opening hours if available
    if (input.business_hours) {
      schema.openingHoursSpecification = this.formatOpeningHours(input.business_hours);
    }

    // Add description
    if (input.long_description) {
      schema.description = input.long_description;
    } else if (input.medium_description) {
      schema.description = input.medium_description;
    } else if (input.short_description) {
      schema.description = input.short_description;
    }

    // Add service areas
    if (input.service_areas && input.service_areas.length > 0) {
      schema.areaServed = input.service_areas.map(area => ({
        '@type': 'Place',
        name: area,
      }));
    }

    // Add payment methods
    if (input.payment_methods && input.payment_methods.length > 0) {
      schema.paymentAccepted = input.payment_methods.join(', ');
    }

    // Add social profiles as sameAs
    if (input.social_profiles) {
      const sameAs = Object.values(input.social_profiles).filter(Boolean);
      if (sameAs.length > 0) {
        schema.sameAs = sameAs;
      }
    }

    return schema;
  }

  /**
   * Generate Organization schema.org JSON-LD
   */
  generateOrganizationSchema(input: CreateMasterInput): object {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: input.legal_business_name,
      url: input.website_url,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: input.primary_phone,
        email: input.email_address,
        contactType: 'customer service',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: input.street_address,
        addressLocality: input.suburb,
        addressRegion: input.state,
        postalCode: input.postcode,
        addressCountry: input.country || 'AU',
      },
    };

    // Add social profiles as sameAs
    if (input.social_profiles) {
      const sameAs = Object.values(input.social_profiles).filter(Boolean);
      if (sameAs.length > 0) {
        schema.sameAs = sameAs;
      }
    }

    return schema;
  }

  /**
   * Format business hours for schema.org
   */
  private formatOpeningHours(hours: BusinessHours): object[] {
    const dayMap: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };

    const specs: object[] = [];

    for (const [day, dayHours] of Object.entries(hours)) {
      if (day === 'public_holidays' || !dayHours || dayHours.closed) continue;

      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[day],
        opens: dayHours.open,
        closes: dayHours.close,
      });
    }

    return specs;
  }

  /**
   * Initialize citation listings for all platforms
   */
  private async initializeCitationListings(masterId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const listings: Omit<CitationListing, 'id'>[] = [];

    // Tier 1 platforms
    PLATFORM_TIERS.tier1_mandatory.forEach(platform => {
      listings.push({
        consistency_master_id: masterId,
        platform_name: platform.name,
        platform_tier: 1,
        platform_url: platform.url,
        listing_url: null,
        listing_status: 'not_claimed',
        current_nap: null,
        is_consistent: null,
        inconsistencies: null,
        last_checked: null,
        last_updated: null,
      });
    });

    // Tier 2 platforms
    PLATFORM_TIERS.tier2_essential_australia.forEach(platform => {
      listings.push({
        consistency_master_id: masterId,
        platform_name: platform.name,
        platform_tier: 2,
        platform_url: platform.url,
        listing_url: null,
        listing_status: 'not_claimed',
        current_nap: null,
        is_consistent: null,
        inconsistencies: null,
        last_checked: null,
        last_updated: null,
      });
    });

    // Tier 3 platforms
    PLATFORM_TIERS.tier3_social.forEach(platform => {
      listings.push({
        consistency_master_id: masterId,
        platform_name: platform.name,
        platform_tier: 3,
        platform_url: platform.url,
        listing_url: null,
        listing_status: 'not_claimed',
        current_nap: null,
        is_consistent: null,
        inconsistencies: null,
        last_checked: null,
        last_updated: null,
      });
    });

    // Tier 4 platforms
    PLATFORM_TIERS.tier4_australian_directories.forEach(platform => {
      listings.push({
        consistency_master_id: masterId,
        platform_name: platform.name,
        platform_tier: 4,
        platform_url: platform.url,
        listing_url: null,
        listing_status: 'not_claimed',
        current_nap: null,
        is_consistent: null,
        inconsistencies: null,
        last_checked: null,
        last_updated: null,
      });
    });

    const { error } = await supabase
      .from('citation_listings')
      .insert(listings);

    if (error) {
      console.error('[BusinessConsistencyService] Failed to initialize citation listings:', error);
    }
  }

  /**
   * Get all citation listings for a master
   */
  async getCitationListings(masterId: string): Promise<CitationListing[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('citation_listings')
      .select('*')
      .eq('consistency_master_id', masterId)
      .order('platform_tier', { ascending: true });

    if (error) {
      throw new Error(`Failed to get citation listings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a citation listing
   */
  async updateCitationListing(
    id: string,
    masterId: string,
    updates: Partial<CitationListing>
  ): Promise<CitationListing> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('citation_listings')
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('consistency_master_id', masterId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update citation listing: ${error.message}`);
    }

    return data;
  }

  /**
   * Run consistency audit
   */
  async runAudit(masterId: string, workspaceId: string): Promise<ConsistencyAuditResult> {
    const master = await this.getMaster(masterId, workspaceId);
    if (!master) {
      throw new Error('Consistency master not found');
    }

    const listings = await this.getCitationListings(masterId);

    const platformResults: PlatformAuditResult[] = [];
    const recommendations: string[] = [];

    let tier1Score = 0;
    let tier2Score = 0;
    let tier3Score = 0;
    let tier1Total = 0;
    let tier2Total = 0;
    let tier3Total = 0;

    for (const listing of listings) {
      const issues: string[] = [];

      // Check if listing is claimed
      if (listing.listing_status === 'not_claimed') {
        issues.push(`Listing not claimed on ${listing.platform_name}`);
        recommendations.push(`Claim your listing on ${listing.platform_name}`);
      }

      // Check NAP consistency if we have current data
      if (listing.current_nap) {
        if (listing.current_nap.name !== master.legal_business_name) {
          issues.push(`Business name mismatch: "${listing.current_nap.name}" vs "${master.legal_business_name}"`);
        }
        if (listing.current_nap.phone !== master.primary_phone) {
          issues.push(`Phone mismatch: "${listing.current_nap.phone}" vs "${master.primary_phone}"`);
        }
      }

      const isConsistent = issues.length === 0 && listing.listing_status === 'verified';

      platformResults.push({
        platform: listing.platform_name,
        tier: listing.platform_tier,
        is_consistent: isConsistent,
        issues,
      });

      // Calculate tier scores
      if (listing.platform_tier === 1) {
        tier1Total++;
        if (isConsistent) tier1Score++;
      } else if (listing.platform_tier === 2) {
        tier2Total++;
        if (isConsistent) tier2Score++;
      } else if (listing.platform_tier === 3) {
        tier3Total++;
        if (isConsistent) tier3Score++;
      }
    }

    // Calculate percentages
    const tier1Pct = tier1Total > 0 ? Math.round((tier1Score / tier1Total) * 100) : 0;
    const tier2Pct = tier2Total > 0 ? Math.round((tier2Score / tier2Total) * 100) : 0;
    const tier3Pct = tier3Total > 0 ? Math.round((tier3Score / tier3Total) * 100) : 0;

    // Overall score (weighted: Tier 1 = 50%, Tier 2 = 30%, Tier 3 = 20%)
    const overallScore = Math.round(tier1Pct * 0.5 + tier2Pct * 0.3 + tier3Pct * 0.2);

    const result: ConsistencyAuditResult = {
      overall_score: overallScore,
      tier1_score: tier1Pct,
      tier2_score: tier2Pct,
      tier3_score: tier3Pct,
      platforms: platformResults,
      recommendations: [...new Set(recommendations)], // Dedupe
    };

    // Save audit log
    await this.saveAuditLog(masterId, result, listings.map(l => l.platform_name));

    return result;
  }

  /**
   * Save audit log
   */
  private async saveAuditLog(
    masterId: string,
    result: ConsistencyAuditResult,
    platformsChecked: string[]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const issuesFound = result.platforms.filter(p => !p.is_consistent).length;
    const issuesResolved = 0; // Would need to compare with previous audit

    const { error } = await supabase
      .from('consistency_audit_log')
      .insert({
        consistency_master_id: masterId,
        audit_type: 'full_audit',
        platforms_checked: platformsChecked,
        issues_found: issuesFound,
        issues_resolved: issuesResolved,
        overall_score: result.overall_score,
        audit_report: result,
      });

    if (error) {
      console.error('[BusinessConsistencyService] Failed to save audit log:', error);
    }
  }

  /**
   * Get audit history
   */
  async getAuditHistory(masterId: string, limit = 10): Promise<object[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('consistency_audit_log')
      .select('*')
      .eq('consistency_master_id', masterId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get audit history: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const businessConsistencyService = new BusinessConsistencyService();
