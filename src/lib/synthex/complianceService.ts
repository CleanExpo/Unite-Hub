/**
 * Synthex Compliance Service
 * Phase D09: AI Compliance Validator
 *
 * Validates marketing content against regulatory frameworks
 * including CAN-SPAM, GDPR, ACMA, CCPA, and CASL.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { createHash } from "crypto";

// =====================================================
// Types
// =====================================================

export type Framework = "can-spam" | "gdpr" | "acma" | "ccpa" | "casl";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type IssueSeverity = "required" | "recommended" | "informational";
export type IssueStatus = "missing" | "partial" | "present";

export interface ComplianceFramework {
  id: string;
  code: Framework;
  name: string;
  description?: string;
  jurisdiction: string;
  content_types: string[];
  applies_to_b2b: boolean;
  applies_to_b2c: boolean;
  requirements: ComplianceRequirement[];
  max_penalty?: string;
  penalty_details?: string;
  is_active: boolean;
  effective_date?: string;
  documentation_url?: string;
}

export interface ComplianceRequirement {
  code: string;
  description: string;
  severity: IssueSeverity;
}

export interface ComplianceIssue {
  framework: Framework;
  requirement: string;
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  suggestion?: string;
  location?: { start: number; end: number };
}

export interface ComplianceCheck {
  id: string;
  tenant_id: string;
  content_type: string;
  content_id?: string;
  content_preview?: string;
  content_hash?: string;
  frameworks_checked: Framework[];
  target_jurisdictions: string[];
  is_compliant: boolean;
  compliance_score: number;
  risk_level: RiskLevel;
  issues: ComplianceIssue[];
  passes: ComplianceIssue[];
  warnings: ComplianceIssue[];
  ai_analysis?: string;
  ai_model?: string;
  confidence?: number;
  status: "pending" | "processing" | "completed" | "failed";
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  checked_at: string;
  expires_at?: string;
  metadata: Record<string, unknown>;
}

export interface ComplianceExemption {
  id: string;
  tenant_id: string;
  framework_code: Framework;
  requirement_code: string;
  scope: "tenant" | "content_type" | "specific_content";
  content_type?: string;
  content_id?: string;
  reason: string;
  legal_basis?: string;
  documentation_url?: string;
  approved_by?: string;
  approved_at?: string;
  legal_review: boolean;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface ComplianceSettings {
  id: string;
  tenant_id: string;
  enabled_frameworks: Framework[];
  default_jurisdictions: string[];
  auto_check_templates: boolean;
  auto_check_campaigns: boolean;
  block_non_compliant: boolean;
  strictness_level: "lenient" | "standard" | "strict";
  business_type?: string;
  physical_address?: string;
  company_name?: string;
  contact_email?: string;
  unsubscribe_url?: string;
  notify_on_violations: boolean;
  notify_email?: string;
  notify_slack_webhook?: string;
  auto_generate_monthly_report: boolean;
  report_recipients: string[];
}

export interface ComplianceReport {
  id: string;
  tenant_id: string;
  report_type: string;
  period_start?: string;
  period_end?: string;
  frameworks: Framework[];
  total_content_checked: number;
  compliant_count: number;
  non_compliant_count: number;
  compliance_rate: number;
  issues_by_severity: Record<string, number>;
  issues_by_framework: Record<string, number>;
  issues_by_requirement: Record<string, number>;
  most_common_issues: Array<{ issue: string; count: number }>;
  recommendations: string[];
  priority_actions: string[];
  status: "draft" | "generated" | "reviewed" | "published";
  generated_at?: string;
  created_at: string;
}

export interface CheckContentInput {
  content: string;
  contentType: string;
  contentId?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  frameworks?: Framework[];
  jurisdictions?: string[];
}

// =====================================================
// Lazy Anthropic Client
// =====================================================

let anthropicClient: import("@anthropic-ai/sdk").Anthropic | null = null;
let anthropicFailed = false;

async function getAnthropicClient(): Promise<import("@anthropic-ai/sdk").Anthropic | null> {
  if (anthropicFailed) {
return null;
}

  if (!anthropicClient) {
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch {
      console.warn("[ComplianceService] Anthropic SDK not available");
      anthropicFailed = true;
      return null;
    }
  }
  return anthropicClient;
}

// =====================================================
// Framework Management
// =====================================================

/**
 * Get all compliance frameworks
 */
export async function listFrameworks(): Promise<ComplianceFramework[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_frameworks")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to list frameworks: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific framework
 */
export async function getFramework(code: Framework): Promise<ComplianceFramework | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_frameworks")
    .select("*")
    .eq("code", code)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get framework: ${error.message}`);
  }

  return data;
}

// =====================================================
// Settings Management
// =====================================================

/**
 * Get compliance settings for a tenant
 */
export async function getSettings(tenantId: string): Promise<ComplianceSettings | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get settings: ${error.message}`);
  }

  return data;
}

/**
 * Create or update compliance settings
 */
export async function upsertSettings(
  tenantId: string,
  settings: Partial<ComplianceSettings>
): Promise<ComplianceSettings> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_settings")
    .upsert(
      {
        tenant_id: tenantId,
        ...settings,
      },
      { onConflict: "tenant_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }

  return data;
}

// =====================================================
// Content Checking
// =====================================================

/**
 * Check content for compliance
 */
export async function checkContent(
  tenantId: string,
  input: CheckContentInput
): Promise<ComplianceCheck> {
  // Get settings for default frameworks
  const settings = await getSettings(tenantId);
  const frameworks = input.frameworks || settings?.enabled_frameworks || ["can-spam", "gdpr"];
  const jurisdictions = input.jurisdictions || settings?.default_jurisdictions || ["US", "EU"];

  // Get exemptions
  const exemptions = await getActiveExemptions(tenantId, frameworks, input.contentType, input.contentId);

  // Create initial check record
  const contentHash = createHash("sha256").update(input.content).digest("hex");

  const { data: check, error: checkError } = await supabaseAdmin
    .from("synthex_library_compliance_checks")
    .insert({
      tenant_id: tenantId,
      content_type: input.contentType,
      content_id: input.contentId,
      content_preview: input.content.substring(0, 500),
      content_hash: contentHash,
      frameworks_checked: frameworks,
      target_jurisdictions: jurisdictions,
      is_compliant: true, // Will be updated
      compliance_score: 1.0, // Will be updated
      risk_level: "low", // Will be updated
      issues: [],
      passes: [],
      warnings: [],
      status: "processing",
    })
    .select()
    .single();

  if (checkError) {
    throw new Error(`Failed to create check: ${checkError.message}`);
  }

  try {
    // Run AI compliance check
    const result = await runComplianceCheck(input, frameworks, settings, exemptions);

    // Update check with results
    const { data: updatedCheck, error: updateError } = await supabaseAdmin
      .from("synthex_library_compliance_checks")
      .update({
        is_compliant: result.isCompliant,
        compliance_score: result.score,
        risk_level: result.riskLevel,
        issues: result.issues,
        passes: result.passes,
        warnings: result.warnings,
        ai_analysis: result.analysis,
        ai_model: "claude-sonnet-4-5-20250514",
        confidence: result.confidence,
        status: "completed",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .eq("id", check.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedCheck;
  } catch (err) {
    // Update check as failed
    await supabaseAdmin
      .from("synthex_library_compliance_checks")
      .update({
        status: "failed",
        metadata: { error: err instanceof Error ? err.message : "Unknown error" },
      })
      .eq("id", check.id);

    throw err;
  }
}

async function runComplianceCheck(
  input: CheckContentInput,
  frameworks: Framework[],
  settings: ComplianceSettings | null,
  exemptions: Array<{ framework: string; requirement: string }>
): Promise<{
  isCompliant: boolean;
  score: number;
  riskLevel: RiskLevel;
  issues: ComplianceIssue[];
  passes: ComplianceIssue[];
  warnings: ComplianceIssue[];
  analysis: string;
  confidence: number;
}> {
  const anthropic = await getAnthropicClient();

  if (!anthropic) {
    // Fall back to rule-based checking
    return runRuleBasedCheck(input, frameworks, settings, exemptions);
  }

  const prompt = buildCompliancePrompt(input, frameworks, settings, exemptions);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = JSON.parse(content.text);

    const issues: ComplianceIssue[] = result.issues || [];
    const passes: ComplianceIssue[] = result.passes || [];
    const warnings: ComplianceIssue[] = result.warnings || [];

    // Calculate risk level
    const riskLevel = calculateRiskLevel(issues);

    // Calculate compliance score
    const totalChecks = issues.length + passes.length;
    const score = totalChecks > 0 ? passes.length / totalChecks : 1.0;

    return {
      isCompliant: issues.filter((i) => i.severity === "required").length === 0,
      score: Math.round(score * 100) / 100,
      riskLevel,
      issues,
      passes,
      warnings,
      analysis: result.analysis || "",
      confidence: result.confidence || 0.85,
    };
  } catch (err) {
    console.error("[ComplianceService] AI check failed:", err);
    return runRuleBasedCheck(input, frameworks, settings, exemptions);
  }
}

function buildCompliancePrompt(
  input: CheckContentInput,
  frameworks: Framework[],
  settings: ComplianceSettings | null,
  exemptions: Array<{ framework: string; requirement: string }>
): string {
  const exemptionList = exemptions.map((e) => `- ${e.framework}: ${e.requirement}`).join("\n");

  return `Analyze this marketing content for compliance with the specified regulatory frameworks.

CONTENT TYPE: ${input.contentType}
${input.subject ? `SUBJECT: ${input.subject}` : ""}
${input.fromName ? `FROM NAME: ${input.fromName}` : ""}
${input.fromEmail ? `FROM EMAIL: ${input.fromEmail}` : ""}

CONTENT:
${input.content}

FRAMEWORKS TO CHECK: ${frameworks.join(", ")}

BUSINESS CONTEXT:
- Business Type: ${settings?.business_type || "not specified"}
- Physical Address: ${settings?.physical_address ? "provided" : "not configured"}
- Company Name: ${settings?.company_name || "not specified"}
- Unsubscribe URL: ${settings?.unsubscribe_url ? "configured" : "not configured"}

${exemptions.length > 0 ? `DOCUMENTED EXEMPTIONS (skip these checks):\n${exemptionList}` : ""}

For each framework, check all applicable requirements. Return a JSON object:

{
  "issues": [
    {
      "framework": "can-spam|gdpr|acma|ccpa|casl",
      "requirement": "requirement_code",
      "severity": "required|recommended|informational",
      "status": "missing|partial",
      "description": "What is wrong",
      "suggestion": "How to fix it"
    }
  ],
  "passes": [
    {
      "framework": "framework_code",
      "requirement": "requirement_code",
      "severity": "required|recommended",
      "status": "present",
      "description": "What requirement is satisfied"
    }
  ],
  "warnings": [
    {
      "framework": "framework_code",
      "requirement": "best_practice",
      "severity": "informational",
      "status": "partial",
      "description": "Recommendation for improvement",
      "suggestion": "Suggested improvement"
    }
  ],
  "analysis": "Brief overall analysis of compliance status",
  "confidence": 0.0-1.0
}

Key requirements to check:
- CAN-SPAM: sender identity, subject accuracy, physical address, unsubscribe option
- GDPR: consent indication, data usage clarity, privacy notice reference
- ACMA: consent acknowledgment, sender identification, unsubscribe facility
- CCPA: privacy notice reference, opt-out indication
- CASL: express consent, sender identity, unsubscribe mechanism

Return ONLY valid JSON.`;
}

function runRuleBasedCheck(
  input: CheckContentInput,
  frameworks: Framework[],
  settings: ComplianceSettings | null,
  exemptions: Array<{ framework: string; requirement: string }>
): {
  isCompliant: boolean;
  score: number;
  riskLevel: RiskLevel;
  issues: ComplianceIssue[];
  passes: ComplianceIssue[];
  warnings: ComplianceIssue[];
  analysis: string;
  confidence: number;
} {
  const issues: ComplianceIssue[] = [];
  const passes: ComplianceIssue[] = [];
  const warnings: ComplianceIssue[] = [];

  const content = input.content.toLowerCase();
  const exemptionSet = new Set(exemptions.map((e) => `${e.framework}:${e.requirement}`));

  const isExempt = (framework: Framework, requirement: string) =>
    exemptionSet.has(`${framework}:${requirement}`);

  // CAN-SPAM checks
  if (frameworks.includes("can-spam") && input.contentType === "email") {
    // Physical address
    if (!isExempt("can-spam", "physical_address")) {
      const hasAddress = /\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive)/i.test(input.content);
      if (hasAddress || settings?.physical_address) {
        passes.push({
          framework: "can-spam",
          requirement: "physical_address",
          severity: "required",
          status: "present",
          description: "Physical address is included",
        });
      } else {
        issues.push({
          framework: "can-spam",
          requirement: "physical_address",
          severity: "required",
          status: "missing",
          description: "No physical postal address found",
          suggestion: "Add your valid physical mailing address to the email",
        });
      }
    }

    // Unsubscribe
    if (!isExempt("can-spam", "unsubscribe_option")) {
      const hasUnsubscribe = /unsubscribe|opt[ -]?out|manage\s+preferences/i.test(input.content);
      if (hasUnsubscribe || settings?.unsubscribe_url) {
        passes.push({
          framework: "can-spam",
          requirement: "unsubscribe_option",
          severity: "required",
          status: "present",
          description: "Unsubscribe option is present",
        });
      } else {
        issues.push({
          framework: "can-spam",
          requirement: "unsubscribe_option",
          severity: "required",
          status: "missing",
          description: "No unsubscribe mechanism found",
          suggestion: "Add a clear unsubscribe link or text",
        });
      }
    }

    // Sender identity
    if (!isExempt("can-spam", "sender_identity")) {
      if (input.fromName || settings?.company_name) {
        passes.push({
          framework: "can-spam",
          requirement: "sender_identity",
          severity: "required",
          status: "present",
          description: "Sender is identified",
        });
      } else {
        warnings.push({
          framework: "can-spam",
          requirement: "sender_identity",
          severity: "recommended",
          status: "partial",
          description: "Sender name should be clearly identified",
          suggestion: "Ensure the 'From' name clearly identifies your business",
        });
      }
    }
  }

  // GDPR checks
  if (frameworks.includes("gdpr")) {
    // Privacy reference
    if (!isExempt("gdpr", "privacy_notice")) {
      const hasPrivacyRef = /privacy\s+policy|privacy\s+notice|data\s+protection/i.test(input.content);
      if (hasPrivacyRef) {
        passes.push({
          framework: "gdpr",
          requirement: "privacy_notice",
          severity: "required",
          status: "present",
          description: "Privacy notice reference found",
        });
      } else {
        warnings.push({
          framework: "gdpr",
          requirement: "privacy_notice",
          severity: "recommended",
          status: "missing",
          description: "No privacy policy reference found",
          suggestion: "Consider adding a link to your privacy policy",
        });
      }
    }
  }

  // Calculate results
  const riskLevel = calculateRiskLevel(issues);
  const totalChecks = issues.length + passes.length;
  const score = totalChecks > 0 ? passes.length / totalChecks : 1.0;

  return {
    isCompliant: issues.filter((i) => i.severity === "required").length === 0,
    score: Math.round(score * 100) / 100,
    riskLevel,
    issues,
    passes,
    warnings,
    analysis: "Rule-based compliance check completed",
    confidence: 0.6,
  };
}

function calculateRiskLevel(issues: ComplianceIssue[]): RiskLevel {
  const critical = issues.filter((i) => i.severity === "required" && i.status === "missing").length;
  const high = issues.filter((i) => i.severity === "required" && i.status === "partial").length;
  const medium = issues.filter((i) => i.severity === "recommended").length;

  if (critical > 0) {
return "critical";
}
  if (high > 0) {
return "high";
}
  if (medium > 2) {
return "medium";
}
  return "low";
}

/**
 * Get a compliance check by ID
 */
export async function getCheck(checkId: string): Promise<ComplianceCheck | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_checks")
    .select("*")
    .eq("id", checkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get check: ${error.message}`);
  }

  return data;
}

/**
 * List compliance checks for a tenant
 */
export async function listChecks(
  tenantId: string,
  filters?: {
    is_compliant?: boolean;
    risk_level?: RiskLevel;
    content_type?: string;
    limit?: number;
  }
): Promise<ComplianceCheck[]> {
  let query = supabaseAdmin
    .from("synthex_library_compliance_checks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("checked_at", { ascending: false });

  if (filters?.is_compliant !== undefined) {
    query = query.eq("is_compliant", filters.is_compliant);
  }
  if (filters?.risk_level) {
    query = query.eq("risk_level", filters.risk_level);
  }
  if (filters?.content_type) {
    query = query.eq("content_type", filters.content_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list checks: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Exemptions
// =====================================================

/**
 * Get active exemptions
 */
async function getActiveExemptions(
  tenantId: string,
  frameworks: Framework[],
  contentType?: string,
  contentId?: string
): Promise<Array<{ framework: string; requirement: string }>> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_exemptions")
    .select("framework_code, requirement_code")
    .eq("tenant_id", tenantId)
    .in("framework_code", frameworks)
    .eq("is_active", true)
    .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);

  if (error) {
    console.error("[ComplianceService] Failed to get exemptions:", error);
    return [];
  }

  return (data || [])
    .filter((e) => {
      // Filter by scope if needed
      return true; // Simplified for now
    })
    .map((e) => ({
      framework: e.framework_code,
      requirement: e.requirement_code,
    }));
}

/**
 * Create an exemption
 */
export async function createExemption(
  tenantId: string,
  exemption: Partial<ComplianceExemption>,
  userId?: string
): Promise<ComplianceExemption> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_exemptions")
    .insert({
      tenant_id: tenantId,
      framework_code: exemption.framework_code,
      requirement_code: exemption.requirement_code,
      scope: exemption.scope || "tenant",
      content_type: exemption.content_type,
      content_id: exemption.content_id,
      reason: exemption.reason,
      legal_basis: exemption.legal_basis,
      documentation_url: exemption.documentation_url,
      valid_from: exemption.valid_from || new Date().toISOString(),
      valid_until: exemption.valid_until,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exemption: ${error.message}`);
  }

  return data;
}

/**
 * List exemptions
 */
export async function listExemptions(
  tenantId: string,
  frameworkCode?: Framework
): Promise<ComplianceExemption[]> {
  let query = supabaseAdmin
    .from("synthex_library_compliance_exemptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (frameworkCode) {
    query = query.eq("framework_code", frameworkCode);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list exemptions: ${error.message}`);
  }

  return data || [];
}

/**
 * Revoke an exemption
 */
export async function revokeExemption(exemptionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_compliance_exemptions")
    .update({ is_active: false })
    .eq("id", exemptionId);

  if (error) {
    throw new Error(`Failed to revoke exemption: ${error.message}`);
  }
}

// =====================================================
// Reports
// =====================================================

/**
 * Generate a compliance report
 */
export async function generateReport(
  tenantId: string,
  options: {
    type: "snapshot" | "audit" | "monthly" | "quarterly" | "annual";
    frameworks?: Framework[];
    periodStart?: string;
    periodEnd?: string;
  }
): Promise<ComplianceReport> {
  const settings = await getSettings(tenantId);
  const frameworks = options.frameworks || settings?.enabled_frameworks || ["can-spam", "gdpr"];

  // Get checks for the period
  let checksQuery = supabaseAdmin
    .from("synthex_library_compliance_checks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "completed");

  if (options.periodStart) {
    checksQuery = checksQuery.gte("checked_at", options.periodStart);
  }
  if (options.periodEnd) {
    checksQuery = checksQuery.lte("checked_at", options.periodEnd);
  }

  const { data: checks, error: checksError } = await checksQuery;

  if (checksError) {
    throw new Error(`Failed to get checks: ${checksError.message}`);
  }

  // Calculate statistics
  const totalChecked = checks?.length || 0;
  const compliantCount = checks?.filter((c) => c.is_compliant).length || 0;
  const nonCompliantCount = totalChecked - compliantCount;
  const complianceRate = totalChecked > 0 ? (compliantCount / totalChecked) * 100 : 100;

  // Issue breakdown
  const issuesBySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const issuesByFramework: Record<string, number> = {};
  const issuesByRequirement: Record<string, number> = {};

  for (const check of checks || []) {
    issuesBySeverity[check.risk_level] = (issuesBySeverity[check.risk_level] || 0) + 1;

    for (const issue of (check.issues as ComplianceIssue[]) || []) {
      issuesByFramework[issue.framework] = (issuesByFramework[issue.framework] || 0) + 1;
      issuesByRequirement[issue.requirement] = (issuesByRequirement[issue.requirement] || 0) + 1;
    }
  }

  // Most common issues
  const mostCommon = Object.entries(issuesByRequirement)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  // Generate recommendations
  const recommendations: string[] = [];
  if (nonCompliantCount > 0) {
    recommendations.push(`Address ${nonCompliantCount} non-compliant content items`);
  }
  if (mostCommon.length > 0) {
    recommendations.push(`Focus on fixing "${mostCommon[0].issue}" - most common issue`);
  }

  // Create report
  const { data: report, error: reportError } = await supabaseAdmin
    .from("synthex_library_compliance_reports")
    .insert({
      tenant_id: tenantId,
      report_type: options.type,
      period_start: options.periodStart,
      period_end: options.periodEnd,
      frameworks,
      total_content_checked: totalChecked,
      compliant_count: compliantCount,
      non_compliant_count: nonCompliantCount,
      compliance_rate: Math.round(complianceRate * 100) / 100,
      issues_by_severity: issuesBySeverity,
      issues_by_framework: issuesByFramework,
      issues_by_requirement: issuesByRequirement,
      most_common_issues: mostCommon,
      recommendations,
      priority_actions: mostCommon.slice(0, 3).map((i) => `Fix ${i.issue} issues`),
      status: "generated",
      generated_at: new Date().toISOString(),
      generated_by: "system",
    })
    .select()
    .single();

  if (reportError) {
    throw new Error(`Failed to create report: ${reportError.message}`);
  }

  return report;
}

/**
 * Get a compliance report
 */
export async function getReport(reportId: string): Promise<ComplianceReport | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get report: ${error.message}`);
  }

  return data;
}

/**
 * List reports
 */
export async function listReports(
  tenantId: string,
  limit = 10
): Promise<ComplianceReport[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_compliance_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list reports: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Stats
// =====================================================

/**
 * Get compliance statistics
 */
export async function getComplianceStats(tenantId: string): Promise<{
  total_checks: number;
  compliant_count: number;
  non_compliant_count: number;
  compliance_rate: number;
  checks_by_risk: Record<RiskLevel, number>;
  recent_issues: ComplianceIssue[];
  active_exemptions: number;
}> {
  const { data: checks } = await supabaseAdmin
    .from("synthex_library_compliance_checks")
    .select("is_compliant, risk_level, issues")
    .eq("tenant_id", tenantId)
    .eq("status", "completed");

  const { count: exemptionCount } = await supabaseAdmin
    .from("synthex_library_compliance_exemptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const total = checks?.length || 0;
  const compliant = checks?.filter((c) => c.is_compliant).length || 0;
  const nonCompliant = total - compliant;

  const checksByRisk: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const recentIssues: ComplianceIssue[] = [];

  for (const check of checks || []) {
    checksByRisk[check.risk_level as RiskLevel]++;
    for (const issue of ((check.issues as ComplianceIssue[]) || []).slice(0, 2)) {
      if (recentIssues.length < 5) {
        recentIssues.push(issue);
      }
    }
  }

  return {
    total_checks: total,
    compliant_count: compliant,
    non_compliant_count: nonCompliant,
    compliance_rate: total > 0 ? Math.round((compliant / total) * 100) : 100,
    checks_by_risk: checksByRisk,
    recent_issues: recentIssues,
    active_exemptions: exemptionCount || 0,
  };
}
