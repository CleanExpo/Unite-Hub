/**
 * SEO Reports Service Layer
 *
 * Encapsulates all database operations for synthex_seo_reports table.
 * Used by API routes for creating and listing SEO analysis reports.
 *
 * Phase: B2 - Synthex SEO Reports
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface SeoIssue {
  category: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  impact?: string;
}

export interface SeoRecommendation {
  action: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  effort?: 'quick' | 'moderate' | 'significant';
}

export interface SeoReportMeta {
  scanType?: 'full' | 'quick' | 'keyword-focused';
  language?: string;
  region?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export interface SeoReportInsert {
  tenantId: string;
  brandId?: string | null;
  userId?: string | null;
  targetUrl: string;
  keywords?: string[];
  competitors?: string[];
  score?: number | null;
  issues?: SeoIssue[];
  recommendations?: SeoRecommendation[];
  rawOutput?: string | null;
  agentVersion?: string;
  meta?: SeoReportMeta;
}

export interface SeoReport {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string | null;
  created_at: string;
  target_url: string;
  keywords: string[] | null;
  competitors: string[] | null;
  score: number | null;
  issues: SeoIssue[] | null;
  recommendations: SeoRecommendation[] | null;
  raw_output: string | null;
  agent_version: string | null;
  meta: SeoReportMeta | null;
}

export interface ListReportsParams {
  tenantId: string;
  brandId?: string | null;
  limit?: number;
  offset?: number;
}

export interface ListReportsResult {
  reports: SeoReport[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create a new SEO report in the database
 *
 * @param payload - Report data to insert
 * @returns The inserted report
 * @throws Error if insert fails
 */
export async function createSeoReport(payload: SeoReportInsert): Promise<SeoReport> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: payload.tenantId,
    brand_id: payload.brandId || null,
    user_id: payload.userId || null,
    target_url: payload.targetUrl,
    keywords: payload.keywords || null,
    competitors: payload.competitors || null,
    score: payload.score ?? null,
    issues: payload.issues ? JSON.stringify(payload.issues) : null,
    recommendations: payload.recommendations ? JSON.stringify(payload.recommendations) : null,
    raw_output: payload.rawOutput || null,
    agent_version: payload.agentVersion || null,
    meta: payload.meta ? JSON.stringify(payload.meta) : null,
  };

  const { data, error } = await supabase
    .from('synthex_seo_reports')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[seoService] Failed to create SEO report:', error);
    throw new Error(`Failed to create SEO report: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after insert');
  }

  // Parse JSONB fields back to objects
  return {
    ...data,
    issues: data.issues ? (typeof data.issues === 'string' ? JSON.parse(data.issues) : data.issues) : null,
    recommendations: data.recommendations ? (typeof data.recommendations === 'string' ? JSON.parse(data.recommendations) : data.recommendations) : null,
    meta: data.meta ? (typeof data.meta === 'string' ? JSON.parse(data.meta) : data.meta) : null,
  } as SeoReport;
}

/**
 * List SEO reports for a tenant with optional brand filter and pagination
 *
 * @param params - Query parameters
 * @returns Paginated list of reports
 */
export async function listSeoReportsByTenant(params: ListReportsParams): Promise<ListReportsResult> {
  const { tenantId, brandId, limit = 20, offset = 0 } = params;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('synthex_seo_reports')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Optional brand filter
  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[seoService] Failed to list SEO reports:', error);
    throw new Error(`Failed to list SEO reports: ${error.message}`);
  }

  const reports: SeoReport[] = (data || []).map((row) => ({
    ...row,
    issues: row.issues ? (typeof row.issues === 'string' ? JSON.parse(row.issues) : row.issues) : null,
    recommendations: row.recommendations ? (typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations) : null,
    meta: row.meta ? (typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta) : null,
  }));

  const total = count || 0;
  const hasMore = offset + reports.length < total;

  return { reports, total, hasMore };
}

/**
 * Get a single SEO report by ID
 *
 * @param reportId - Report UUID
 * @param tenantId - Tenant UUID (for authorization)
 * @returns The report or null if not found
 */
export async function getSeoReportById(reportId: string, tenantId: string): Promise<SeoReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_seo_reports')
    .select('*')
    .eq('id', reportId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error('[seoService] Failed to get SEO report:', error);
    throw new Error(`Failed to get SEO report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    issues: data.issues ? (typeof data.issues === 'string' ? JSON.parse(data.issues) : data.issues) : null,
    recommendations: data.recommendations ? (typeof data.recommendations === 'string' ? JSON.parse(data.recommendations) : data.recommendations) : null,
    meta: data.meta ? (typeof data.meta === 'string' ? JSON.parse(data.meta) : data.meta) : null,
  } as SeoReport;
}

/**
 * Delete an SEO report
 *
 * @param reportId - Report UUID
 * @param tenantId - Tenant UUID (for authorization)
 * @returns true if deleted, false if not found
 */
export async function deleteSeoReport(reportId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('synthex_seo_reports')
    .delete({ count: 'exact' })
    .eq('id', reportId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[seoService] Failed to delete SEO report:', error);
    throw new Error(`Failed to delete SEO report: ${error.message}`);
  }

  return (count || 0) > 0;
}

/**
 * Get the latest SEO report for a tenant (for dashboard widgets)
 *
 * @param tenantId - Tenant UUID
 * @param brandId - Optional brand UUID
 * @returns The most recent report or null
 */
export async function getLatestSeoReport(tenantId: string, brandId?: string): Promise<SeoReport | null> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_seo_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[seoService] Failed to get latest SEO report:', error);
    throw new Error(`Failed to get latest SEO report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    issues: data.issues ? (typeof data.issues === 'string' ? JSON.parse(data.issues) : data.issues) : null,
    recommendations: data.recommendations ? (typeof data.recommendations === 'string' ? JSON.parse(data.recommendations) : data.recommendations) : null,
    meta: data.meta ? (typeof data.meta === 'string' ? JSON.parse(data.meta) : data.meta) : null,
  } as SeoReport;
}
