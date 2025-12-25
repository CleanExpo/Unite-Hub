/**
 * Type definitions for Suburb Authority MCP Server
 */

export interface SuburbAuthorityConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export interface SuburbAuthorityData {
  workspace_id: string;
  suburb: string;
  state: string;
  total_jobs: number;
  completed_jobs: number;
  postcodes_covered: string[];
  before_after_photo_count: number;
  completion_photo_count: number;
  total_photo_count: number;
  verified_review_count: number;
  avg_suburb_rating: number;
  authority_score: number; // 0-100
  total_revenue: number;
  avg_job_value: number;
  first_job_date: string | null;
  latest_job_date: string | null;
  avg_content_gap_score: number;
  avg_geographic_gap_score: number;
  schema_ready_jobs: number;
  last_updated: string;
}

export interface QuerySuburbAuthorityParams {
  workspaceId: string;
  minAuthorityScore?: number; // Default 50 (gaps only)
  maxAuthorityScore?: number; // For filtering strong suburbs
  state?: string; // Filter by AU state
  vacuumType?: 'geographic' | 'content';
  limit?: number; // Default 50
}

export interface GeographicGap {
  suburb: string;
  state: string;
  authority_score: number;
  gap_severity: number; // 100 - authority_score
  total_jobs: number;
  total_photo_count: number;
  opportunity_score: number; // Calculated based on population, competition, etc.
}

export interface ContentGap {
  suburb: string;
  state: string;
  authority_score: number;
  avg_content_gap_score: number;
  missing_proof_types: string[]; // ['before_after_photo', 'client_review']
  schema_ready_jobs: number;
  total_jobs: number;
}
