/**
 * SEO Credential Validation Schemas
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Zod schemas for validating SEO credential inputs, API requests, and responses.
 * All schemas align with seoTypes.ts type definitions.
 *
 * Includes validation for:
 * - Google Search Console Analytics API
 * - Bing IndexNow and URL Inspection APIs
 * - Brave Search API (public)
 * - Brave Creator Console Stats API
 * - Credential encryption markers
 * - Token refresh operations
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const SeoPackageTierSchema = z.enum(["good", "better", "best"]);

export const SeoCredentialTypeSchema = z.enum([
  "gsc",
  "gmb",
  "bing_webmaster",
  "brave_console",
  "social_facebook",
  "social_instagram",
  "social_linkedin",
  "social_tiktok",
  "other",
]);

export const SeoSnapshotSourceSchema = z.enum([
  "google",
  "bing",
  "brave",
  "internal_matrix",
]);

export const KeywordIntentSchema = z.enum([
  "informational",
  "commercial",
  "transactional",
  "navigational",
]);

export const UserRoleSchema = z.enum(["owner", "admin", "member"]);

// ============================================================================
// GSC (GOOGLE SEARCH CONSOLE) SCHEMAS
// ============================================================================

export const GscAuthUrlRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
});

export const GscTokenResponseSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().min(1, "Refresh token is required"),
  expires_in: z.number().positive("Expires in must be positive"),
  token_type: z.string().min(1, "Token type is required"),
  scope: z.string().min(1, "Scope is required"),
});

export const GscPropertySchema = z.object({
  siteUrl: z.string().url("Invalid site URL"),
  permissionLevel: z.enum(["siteOwner", "siteFullUser", "siteRestrictedUser"]),
});

export const LinkGscCredentialSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  token_response: GscTokenResponseSchema,
  property_url: z.string().url("Invalid property URL").optional(),
});

// ============================================================================
// BING WEBMASTER SCHEMAS
// ============================================================================

export const BingApiKeyFormatSchema = z
  .string()
  .min(32, "API key must be at least 32 characters")
  .max(64, "API key must be at most 64 characters")
  .regex(
    /^[A-Za-z0-9]{32,64}$/,
    "API key must contain only alphanumeric characters"
  );

export const SaveBingKeyRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  api_key: BingApiKeyFormatSchema,
});

export const BingSiteSchema = z.object({
  url: z.string().url("Invalid site URL"),
  verified: z.boolean(),
  verificationMethod: z.string().optional(),
});

export const LinkBingCredentialSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  api_key: BingApiKeyFormatSchema,
  verified_sites: z.array(z.string().url()).optional(),
});

// ============================================================================
// BRAVE CREATOR CONSOLE SCHEMAS
// ============================================================================

export const BraveApiKeyFormatSchema = z
  .string()
  .min(32, "API key must be at least 32 characters")
  .max(64, "API key must be at most 64 characters")
  .regex(
    /^[A-Za-z0-9-]{32,64}$/,
    "API key must contain only alphanumeric characters and hyphens"
  );

export const BraveAuthUrlRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
});

export const BraveTokenResponseSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().min(1, "Refresh token is optional").optional(),
  expires_in: z.number().positive("Expires in must be positive"),
  token_type: z.string().min(1, "Token type is required"),
  scope: z.string().min(1, "Scope is required"),
});

export const BraveChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  name: z.string().min(1, "Channel name is required"),
  url: z.string().url("Invalid channel URL"),
  verified: z.boolean(),
  platform: z.enum(["website", "youtube", "twitter", "reddit", "github"]),
});

export const LinkBraveOAuthCredentialSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  token_response: BraveTokenResponseSchema,
  channel_id: z.string().optional(),
});

export const LinkBraveApiKeyCredentialSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  api_key: BraveApiKeyFormatSchema,
  channel_id: z.string().optional(),
});

// ============================================================================
// CREDENTIAL SERVICE SCHEMAS
// ============================================================================

export const UnlinkCredentialRequestSchema = z.object({
  credential_id: z.string().uuid("Invalid credential ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
});

export const GetCredentialsRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  credential_type: SeoCredentialTypeSchema.optional(),
});

export const UserContextSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  role: UserRoleSchema,
});

// ============================================================================
// SEO PROFILE SCHEMAS
// ============================================================================

export const CreateSeoProfileSchema = z.object({
  organization_id: z.string().uuid("Invalid organization ID"),
  workspace_id: z.string().uuid("Invalid workspace ID").nullable().optional(),
  client_id: z.string().uuid("Invalid client ID").nullable().optional(),
  project_id: z.string().uuid("Invalid project ID").nullable().optional(),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
      "Invalid domain format"
    ),
  primary_geo_region: z.string().nullable().optional(),
  primary_service_vertical: z.string().nullable().optional(),
  package_tier: SeoPackageTierSchema.default("good"),
});

export const UpdateSeoProfileSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
      "Invalid domain format"
    )
    .optional(),
  primary_geo_region: z.string().nullable().optional(),
  primary_service_vertical: z.string().nullable().optional(),
  package_tier: SeoPackageTierSchema.optional(),
  gsc_property_id: z.string().nullable().optional(),
  bing_site_id: z.string().nullable().optional(),
  brave_channel_id: z.string().nullable().optional(),
  gmb_location_id: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ============================================================================
// KEYWORD & COMPETITOR SCHEMAS
// ============================================================================

export const CreateKeywordSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  keyword: z.string().min(1, "Keyword is required").max(255, "Keyword too long"),
  intent: KeywordIntentSchema.nullable().optional(),
  priority: z
    .number()
    .int("Priority must be an integer")
    .min(1, "Priority must be at least 1")
    .max(5, "Priority must be at most 5")
    .default(3),
  target_url: z.string().url("Invalid target URL").nullable().optional(),
  is_primary: z.boolean().default(false),
});

export const CreateCompetitorSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  competitor_domain: z
    .string()
    .min(1, "Competitor domain is required")
    .regex(
      /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
      "Invalid domain format"
    ),
  label: z.string().max(100, "Label too long").nullable().optional(),
});

// ============================================================================
// SNAPSHOT SCHEMAS
// ============================================================================

export const CreateSnapshotSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  snapshot_date: z.string().datetime("Invalid snapshot date"),
  source: SeoSnapshotSourceSchema,
  payload: z.record(z.unknown()),
  matrix_score: z
    .number()
    .min(0, "Matrix score must be at least 0")
    .max(100, "Matrix score must be at most 100")
    .nullable()
    .optional(),
});

// ============================================================================
// PACKAGE SCHEMAS
// ============================================================================

export const UpsertSeoPackageSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  package_tier: SeoPackageTierSchema,
  includes_social: z.boolean().default(false),
  includes_matrix_v11: z.boolean().default(true),
  includes_indexnow: z.boolean().default(false),
  includes_brave_goggles: z.boolean().default(false),
  includes_nano_banana: z.boolean().default(false),
  includes_golden_key: z.boolean().default(false),
  effective_from: z.string().datetime("Invalid effective from date").optional(),
  effective_to: z.string().datetime("Invalid effective to date").nullable().optional(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const SeoApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total_count: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate domain format (lowercase alphanumeric with dots/hyphens).
 * Returns normalized domain (lowercase, no protocol, no www, no trailing slash).
 */
export function validateAndNormalizeDomain(domain: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  try {
    // Remove protocol
    let normalized = domain.replace(/^https?:\/\//i, "");

    // Remove www
    normalized = normalized.replace(/^www\./i, "");

    // Remove trailing slash and path
    normalized = normalized.split("/")[0];

    // Lowercase
    normalized = normalized.toLowerCase().trim();

    // Validate format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(normalized)) {
      return {
        valid: false,
        error: "Invalid domain format. Expected: example.com",
      };
    }

    return { valid: true, normalized };
  } catch {
    return {
      valid: false,
      error: "Failed to parse domain",
    };
  }
}

/**
 * Validate keyword priority (1-5).
 */
export function validateKeywordPriority(priority: number): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isInteger(priority)) {
    return { valid: false, error: "Priority must be an integer" };
  }
  if (priority < 1 || priority > 5) {
    return { valid: false, error: "Priority must be between 1 and 5" };
  }
  return { valid: true };
}

/**
 * Validate Matrix score (0-100).
 */
export function validateMatrixScore(score: number): {
  valid: boolean;
  error?: string;
} {
  if (typeof score !== "number" || isNaN(score)) {
    return { valid: false, error: "Matrix score must be a number" };
  }
  if (score < 0 || score > 100) {
    return { valid: false, error: "Matrix score must be between 0 and 100" };
  }
  return { valid: true };
}

/**
 * Validate UUID format.
 */
export function validateUuid(uuid: string): {
  valid: boolean;
  error?: string;
} {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: "Invalid UUID format" };
  }
  return { valid: true };
}

// ============================================================================
// GOOGLE SEARCH CONSOLE ANALYTICS API SCHEMAS
// ============================================================================

export const GscSearchAnalyticsRowSchema = z.object({
  keys: z.array(z.string()),
  clicks: z.number().nonnegative(),
  impressions: z.number().nonnegative(),
  ctr: z.number().min(0).max(1),
  position: z.number().positive(),
});

export const GscSearchAnalyticsRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dimensions: z.array(z.enum(["query", "page", "country", "device"])).optional(),
  row_limit: z.number().int().positive().max(25000).default(1000),
});

export const GscSearchAnalyticsResponseSchema = z.object({
  rows: z.array(GscSearchAnalyticsRowSchema),
  responseAggregationType: z.string().optional(),
});

// ============================================================================
// BING INDEXNOW API SCHEMAS
// ============================================================================

export const BingIndexNowSubmitRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  urls: z.array(z.string().url("Invalid URL")).min(1, "At least one URL required").max(10000, "Max 10,000 URLs per submission"),
  key_location: z.string().url("Invalid key location URL").optional(),
});

export const BingIndexNowResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  status_code: z.number().int(),
});

export const BingUrlInspectionRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  url: z.string().url("Invalid URL"),
});

export const BingUrlInspectionResponseSchema = z.object({
  url: z.string().url(),
  indexed: z.boolean(),
  lastCrawled: z.string().datetime().optional(),
  crawlStatus: z.string().optional(),
  indexStatus: z.string().optional(),
});

// ============================================================================
// BRAVE SEARCH API SCHEMAS (PUBLIC API)
// ============================================================================

export const BraveSearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(400, "Query too long"),
  country: z.string().length(2, "Country must be 2-letter ISO code").default("US"),
  search_lang: z.string().length(2, "Language must be 2-letter ISO code").default("en"),
  count: z.number().int().positive().max(20).default(10),
  offset: z.number().int().nonnegative().default(0),
  safesearch: z.enum(["off", "moderate", "strict"]).default("moderate"),
  freshness: z.enum(["pd", "pw", "pm", "py"]).optional(), // past day/week/month/year
});

export const BraveSearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  age: z.string().optional(),
  language: z.string().optional(),
  family_friendly: z.boolean().optional(),
});

export const BraveSearchResponseSchema = z.object({
  type: z.literal("search"),
  query: z.object({
    original: z.string(),
    show_strict_warning: z.boolean().optional(),
    is_navigational: z.boolean().optional(),
    is_news_breaking: z.boolean().optional(),
  }),
  results: z.object({
    web: z.array(BraveSearchResultSchema).optional(),
    news: z.array(BraveSearchResultSchema).optional(),
  }),
});

// ============================================================================
// BRAVE CREATOR CONSOLE STATS API SCHEMAS
// ============================================================================

export const BraveCreatorStatsRequestSchema = z.object({
  seo_profile_id: z.string().uuid("Invalid SEO profile ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
  channel_id: z.string().min(1, "Channel ID is required"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

export const BraveCreatorStatsResponseSchema = z.object({
  channel_id: z.string(),
  total_contributions: z.number().nonnegative(),
  total_bat: z.number().nonnegative(),
  contributor_count: z.number().int().nonnegative(),
  stats_by_date: z.array(
    z.object({
      date: z.string().datetime(),
      contributions: z.number().nonnegative(),
      bat_amount: z.number().nonnegative(),
    })
  ),
});

// ============================================================================
// CREDENTIAL REFRESH SCHEMAS
// ============================================================================

export const RefreshCredentialRequestSchema = z.object({
  credential_id: z.string().uuid("Invalid credential ID"),
  organization_id: z.string().uuid("Invalid organization ID"),
});

export const RefreshCredentialResponseSchema = z.object({
  success: z.boolean(),
  credential: z.unknown().optional(),
  error: z.string().optional(),
  refreshed_at: z.string().datetime().optional(),
});

export const BatchRefreshRequestSchema = z.object({
  organization_id: z.string().uuid("Invalid organization ID"),
  credential_types: z.array(SeoCredentialTypeSchema).optional(),
});

export const BatchRefreshResponseSchema = z.object({
  success: z.boolean(),
  refreshed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});

// ============================================================================
// ENCRYPTION SCHEMAS
// ============================================================================

export const EncryptedCredentialDataSchema = z.object({
  _encrypted_access_token: z.boolean().optional(),
  _encrypted_refresh_token: z.boolean().optional(),
  _encrypted_api_key: z.boolean().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  api_key: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  scope: z.string().optional(),
  property_url: z.string().url().optional(),
  channel_id: z.string().optional(),
  verified_sites: z.array(z.string().url()).optional(),
  auth_method: z.enum(["oauth", "api_key"]).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GscAuthUrlRequest = z.infer<typeof GscAuthUrlRequestSchema>;
export type GscTokenResponse = z.infer<typeof GscTokenResponseSchema>;
export type GscSearchAnalyticsRequest = z.infer<typeof GscSearchAnalyticsRequestSchema>;
export type GscSearchAnalyticsResponse = z.infer<typeof GscSearchAnalyticsResponseSchema>;
export type SaveBingKeyRequest = z.infer<typeof SaveBingKeyRequestSchema>;
export type BingIndexNowSubmitRequest = z.infer<typeof BingIndexNowSubmitRequestSchema>;
export type BingIndexNowResponse = z.infer<typeof BingIndexNowResponseSchema>;
export type BingUrlInspectionRequest = z.infer<typeof BingUrlInspectionRequestSchema>;
export type BingUrlInspectionResponse = z.infer<typeof BingUrlInspectionResponseSchema>;
export type BraveAuthUrlRequest = z.infer<typeof BraveAuthUrlRequestSchema>;
export type BraveSearchRequest = z.infer<typeof BraveSearchRequestSchema>;
export type BraveSearchResponse = z.infer<typeof BraveSearchResponseSchema>;
export type BraveCreatorStatsRequest = z.infer<typeof BraveCreatorStatsRequestSchema>;
export type BraveCreatorStatsResponse = z.infer<typeof BraveCreatorStatsResponseSchema>;
export type LinkGscCredential = z.infer<typeof LinkGscCredentialSchema>;
export type LinkBingCredential = z.infer<typeof LinkBingCredentialSchema>;
export type LinkBraveOAuthCredential = z.infer<
  typeof LinkBraveOAuthCredentialSchema
>;
export type LinkBraveApiKeyCredential = z.infer<
  typeof LinkBraveApiKeyCredentialSchema
>;
export type RefreshCredentialRequest = z.infer<typeof RefreshCredentialRequestSchema>;
export type RefreshCredentialResponse = z.infer<typeof RefreshCredentialResponseSchema>;
export type BatchRefreshRequest = z.infer<typeof BatchRefreshRequestSchema>;
export type BatchRefreshResponse = z.infer<typeof BatchRefreshResponseSchema>;
export type CreateSeoProfile = z.infer<typeof CreateSeoProfileSchema>;
export type UpdateSeoProfile = z.infer<typeof UpdateSeoProfileSchema>;
export type CreateKeyword = z.infer<typeof CreateKeywordSchema>;
export type CreateCompetitor = z.infer<typeof CreateCompetitorSchema>;
export type CreateSnapshot = z.infer<typeof CreateSnapshotSchema>;
export type UpsertSeoPackage = z.infer<typeof UpsertSeoPackageSchema>;
