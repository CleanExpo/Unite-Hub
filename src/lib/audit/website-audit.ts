/**
 * Website Audit Module
 * Phase 15-17 New Feature
 *
 * Automated website auditing with:
 * - SEO analysis
 * - Technical audit (performance, accessibility)
 * - GEO (local SEO) analysis
 * - Content quality assessment
 */

import { getSupabaseServer } from "@/lib/supabase";

export interface AuditConfig {
  url: string;
  workspaceId: string;
  auditTypes: AuditType[];
  depth?: number; // How many pages to crawl
  includeScreenshots?: boolean;
}

export type AuditType = "seo" | "technical" | "geo" | "content" | "full";

export interface AuditResult {
  id: string;
  url: string;
  workspaceId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  scores: AuditScores;
  issues: AuditIssue[];
  recommendations: string[];
  rawData?: Record<string, unknown>;
}

export interface AuditScores {
  overall: number;
  seo: number;
  technical: number;
  geo: number;
  content: number;
  accessibility: number;
  performance: number;
}

export interface AuditIssue {
  id: string;
  category: AuditType | "accessibility" | "performance";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  affectedPages?: string[];
  howToFix?: string;
}

// Base audit template schema
export const AUDIT_SCHEMA = {
  version: "1.0.0",
  categories: {
    seo: {
      checks: [
        "meta_title",
        "meta_description",
        "h1_tags",
        "image_alt",
        "canonical",
        "robots_txt",
        "sitemap",
        "structured_data",
        "mobile_friendly",
        "page_speed",
      ],
      weights: {
        critical: ["meta_title", "h1_tags", "mobile_friendly"],
        important: ["meta_description", "canonical", "page_speed"],
        moderate: ["image_alt", "structured_data", "sitemap", "robots_txt"],
      },
    },
    technical: {
      checks: [
        "ssl_certificate",
        "response_time",
        "broken_links",
        "redirect_chains",
        "duplicate_content",
        "core_web_vitals",
        "javascript_errors",
        "css_issues",
      ],
      weights: {
        critical: ["ssl_certificate", "broken_links", "core_web_vitals"],
        important: ["response_time", "redirect_chains"],
        moderate: ["duplicate_content", "javascript_errors", "css_issues"],
      },
    },
    geo: {
      checks: [
        "nap_consistency",
        "local_keywords",
        "google_business_profile",
        "local_schema",
        "reviews",
        "location_pages",
      ],
      weights: {
        critical: ["nap_consistency", "google_business_profile"],
        important: ["local_keywords", "local_schema"],
        moderate: ["reviews", "location_pages"],
      },
    },
    content: {
      checks: [
        "word_count",
        "readability",
        "keyword_density",
        "internal_links",
        "external_links",
        "freshness",
        "originality",
      ],
      weights: {
        critical: ["word_count", "originality"],
        important: ["readability", "keyword_density"],
        moderate: ["internal_links", "external_links", "freshness"],
      },
    },
    accessibility: {
      checks: [
        "color_contrast",
        "aria_labels",
        "form_labels",
        "skip_links",
        "keyboard_nav",
        "focus_indicators",
      ],
      weights: {
        critical: ["color_contrast", "aria_labels", "form_labels"],
        important: ["keyboard_nav", "focus_indicators"],
        moderate: ["skip_links"],
      },
    },
  },
};

/**
 * Create a new website audit
 */
export async function createAudit(
  config: AuditConfig
): Promise<AuditResult> {
  const supabase = await getSupabaseServer();

  // Validate URL
  try {
    new URL(config.url);
  } catch {
    throw new Error("Invalid URL provided");
  }

  // Create audit record
  const auditData = {
    url: config.url,
    workspace_id: config.workspaceId,
    audit_types: config.auditTypes,
    depth: config.depth || 10,
    include_screenshots: config.includeScreenshots || false,
    status: "pending",
    scores: {
      overall: 0,
      seo: 0,
      technical: 0,
      geo: 0,
      content: 0,
      accessibility: 0,
      performance: 0,
    },
    issues: [],
    recommendations: [],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("website_audits")
    .insert([auditData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create audit: ${error.message}`);
  }

  return {
    id: data.id,
    url: data.url,
    workspaceId: data.workspace_id,
    status: data.status,
    startedAt: data.created_at,
    scores: data.scores,
    issues: data.issues,
    recommendations: data.recommendations,
  };
}

/**
 * Get audit by ID
 */
export async function getAudit(
  auditId: string,
  workspaceId: string
): Promise<AuditResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("website_audits")
    .select("*")
    .eq("id", auditId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    url: data.url,
    workspaceId: data.workspace_id,
    status: data.status,
    startedAt: data.created_at,
    completedAt: data.completed_at,
    scores: data.scores,
    issues: data.issues,
    recommendations: data.recommendations,
    rawData: data.raw_data,
  };
}

/**
 * List audits for a workspace
 */
export async function listAudits(
  workspaceId: string,
  options?: {
    limit?: number;
    status?: string;
  }
): Promise<AuditResult[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("website_audits")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list audits: ${error.message}`);
  }

  return (data || []).map((audit) => ({
    id: audit.id,
    url: audit.url,
    workspaceId: audit.workspace_id,
    status: audit.status,
    startedAt: audit.created_at,
    completedAt: audit.completed_at,
    scores: audit.scores,
    issues: audit.issues,
    recommendations: audit.recommendations,
  }));
}

/**
 * Update audit status and results
 */
export async function updateAudit(
  auditId: string,
  workspaceId: string,
  updates: Partial<{
    status: string;
    scores: AuditScores;
    issues: AuditIssue[];
    recommendations: string[];
    rawData: Record<string, unknown>;
    completedAt: string;
  }>
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("website_audits")
    .update({
      status: updates.status,
      scores: updates.scores,
      issues: updates.issues,
      recommendations: updates.recommendations,
      raw_data: updates.rawData,
      completed_at: updates.completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auditId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(`Failed to update audit: ${error.message}`);
  }
}

/**
 * Calculate overall score from individual scores
 */
export function calculateOverallScore(scores: Omit<AuditScores, "overall">): number {
  const weights = {
    seo: 0.25,
    technical: 0.2,
    geo: 0.15,
    content: 0.2,
    accessibility: 0.1,
    performance: 0.1,
  };

  let total = 0;
  let weightSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key as keyof typeof scores];
    if (typeof score === "number" && score > 0) {
      total += score * weight;
      weightSum += weight;
    }
  }

  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

/**
 * Generate recommendations based on issues
 */
export function generateRecommendations(issues: AuditIssue[]): string[] {
  const recommendations: string[] = [];

  // Group issues by severity
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const warningIssues = issues.filter((i) => i.severity === "warning");

  // Add recommendations based on critical issues
  if (criticalIssues.length > 0) {
    recommendations.push(
      `Fix ${criticalIssues.length} critical issue(s) immediately to prevent major SEO/UX impact`
    );

    // Specific recommendations for common critical issues
    const hasSslIssue = criticalIssues.some((i) =>
      i.title.toLowerCase().includes("ssl")
    );
    if (hasSslIssue) {
      recommendations.push("Install and configure SSL certificate for HTTPS");
    }

    const hasSpeedIssue = criticalIssues.some(
      (i) =>
        i.title.toLowerCase().includes("speed") ||
        i.title.toLowerCase().includes("performance")
    );
    if (hasSpeedIssue) {
      recommendations.push(
        "Optimize Core Web Vitals: compress images, defer JS, reduce server response time"
      );
    }
  }

  // Add recommendations based on warning issues
  if (warningIssues.length > 3) {
    recommendations.push(
      `Address ${warningIssues.length} warning issues to improve overall site quality`
    );
  }

  // SEO-specific recommendations
  const seoIssues = issues.filter((i) => i.category === "seo");
  if (seoIssues.length > 0) {
    const hasMissingMeta = seoIssues.some(
      (i) =>
        i.title.toLowerCase().includes("meta") ||
        i.title.toLowerCase().includes("title")
    );
    if (hasMissingMeta) {
      recommendations.push(
        "Add unique, keyword-rich meta titles and descriptions to all pages"
      );
    }
  }

  // GEO-specific recommendations
  const geoIssues = issues.filter((i) => i.category === "geo");
  if (geoIssues.length > 0) {
    recommendations.push(
      "Improve local SEO: ensure NAP consistency, optimize Google Business Profile"
    );
  }

  // Content-specific recommendations
  const contentIssues = issues.filter((i) => i.category === "content");
  if (contentIssues.length > 0) {
    recommendations.push(
      "Enhance content quality: improve readability, add internal links, update stale content"
    );
  }

  return recommendations.slice(0, 10); // Max 10 recommendations
}
