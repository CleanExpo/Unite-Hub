/**
 * SEO/GEO Intelligence Module - TypeScript Type Definitions
 * Phase 4 Step 1: Core Architecture
 *
 * These types align 1:1 with migration 045_seo_geo_core.sql
 */

// ============================================================================
// ENUMS AND LITERAL TYPES
// ============================================================================

export type SeoPackageTier = "good" | "better" | "best";

export type SeoCredentialType =
  | "gsc"
  | "gmb"
  | "bing_webmaster"
  | "brave_console"
  | "social_facebook"
  | "social_instagram"
  | "social_linkedin"
  | "social_tiktok"
  | "other";

export type SeoSnapshotSource = "google" | "bing" | "brave" | "internal_matrix";

export type KeywordIntent = "informational" | "commercial" | "transactional" | "navigational";

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

export interface SeoProfile {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  client_id: string | null;
  project_id: string | null;
  domain: string;
  primary_geo_region: string | null;
  primary_service_vertical: string | null;
  package_tier: SeoPackageTier;
  gsc_property_id: string | null;
  bing_site_id: string | null;
  brave_channel_id: string | null;
  gmb_location_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoCredential {
  id: string;
  seo_profile_id: string;
  organization_id: string;
  credential_type: SeoCredentialType;
  credential_data: Record<string, unknown>;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoKeyword {
  id: string;
  seo_profile_id: string;
  keyword: string;
  intent: KeywordIntent | null;
  priority: number;
  target_url: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoCompetitor {
  id: string;
  seo_profile_id: string;
  competitor_domain: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoSnapshot {
  id: string;
  seo_profile_id: string;
  snapshot_date: string;
  source: SeoSnapshotSource;
  payload: Record<string, unknown>;
  matrix_score: number | null;
  created_at: string;
}

export interface SeoPackage {
  id: string;
  seo_profile_id: string;
  package_tier: SeoPackageTier;
  includes_social: boolean;
  includes_matrix_v11: boolean;
  includes_indexnow: boolean;
  includes_brave_goggles: boolean;
  includes_nano_banana: boolean;
  includes_golden_key: boolean;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSeoProfileInput {
  organization_id: string;
  workspace_id?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  domain: string;
  primary_geo_region?: string | null;
  primary_service_vertical?: string | null;
  package_tier?: SeoPackageTier;
}

export interface UpdateSeoProfileInput {
  domain?: string;
  primary_geo_region?: string | null;
  primary_service_vertical?: string | null;
  package_tier?: SeoPackageTier;
  gsc_property_id?: string | null;
  bing_site_id?: string | null;
  brave_channel_id?: string | null;
  gmb_location_id?: string | null;
  is_active?: boolean;
}

export interface CreateKeywordInput {
  seo_profile_id: string;
  keyword: string;
  intent?: KeywordIntent | null;
  priority?: number;
  target_url?: string | null;
  is_primary?: boolean;
}

export interface CreateCompetitorInput {
  seo_profile_id: string;
  competitor_domain: string;
  label?: string | null;
}

export interface CreateSnapshotInput {
  seo_profile_id: string;
  snapshot_date: string;
  source: SeoSnapshotSource;
  payload: Record<string, unknown>;
  matrix_score?: number | null;
}

export interface UpsertSeoPackageInput {
  seo_profile_id: string;
  package_tier: SeoPackageTier;
  includes_social?: boolean;
  includes_matrix_v11?: boolean;
  includes_indexnow?: boolean;
  includes_brave_goggles?: boolean;
  includes_nano_banana?: boolean;
  includes_golden_key?: boolean;
  effective_from?: string;
  effective_to?: string | null;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface SeoProfileFilter {
  organization_id?: string;
  workspace_id?: string;
  client_id?: string;
  project_id?: string;
  domain?: string;
  package_tier?: SeoPackageTier;
  is_active?: boolean;
}

export interface SeoSnapshotFilter {
  seo_profile_id: string;
  date_from?: string;
  date_to?: string;
  source?: SeoSnapshotSource;
  min_matrix_score?: number;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface UserContext {
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "member";
}

export interface OrganizationContext {
  organization_id: string;
  workspace_id?: string | null;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SeoApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
