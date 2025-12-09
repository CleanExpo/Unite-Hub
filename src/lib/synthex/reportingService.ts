/**
 * External Reporting & Investor Pack Service
 *
 * Phase: D54 - External Reporting & Investor Pack Engine
 * Tables: unite_report_templates, unite_report_sections, unite_reports, unite_report_audiences
 *
 * Features:
 * - Professional report templates for external audiences
 * - AI-powered narrative generation
 * - Multi-audience support (investors, partners, stakeholders)
 * - Report generation from templates
 * - Export tracking and management
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type ReportFrequency = 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type SectionType = 'executive_summary' | 'metrics_overview' | 'financial_highlights' | 'growth_metrics' | 'operational_kpis' | 'market_analysis' | 'risk_assessment' | 'recommendations' | 'appendix' | 'custom';
export type ReportStatus = 'draft' | 'generating' | 'review' | 'finalized' | 'sent' | 'archived';
export type AudienceType = 'investor' | 'board' | 'partner' | 'stakeholder' | 'internal' | 'public';

export interface ReportTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  frequency: ReportFrequency;
  default_audience: AudienceType;
  cover_config?: Record<string, unknown>;
  section_order?: string[];
  tone?: string;
  focus_areas?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSection {
  id: string;
  template_id: string;
  section_type: SectionType;
  title: string;
  section_order: number;
  data_sources?: Record<string, unknown>;
  visualization_config?: Record<string, unknown>;
  ai_prompt_template?: string;
  min_words?: number;
  max_words?: number;
  include_charts: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  tenant_id: string;
  template_id?: string;
  title: string;
  period_start?: string;
  period_end?: string;
  status: ReportStatus;
  audience_type: AudienceType;
  sections?: Record<string, unknown>;
  ai_generated_narrative?: Record<string, unknown>;
  data_snapshot?: Record<string, unknown>;
  exported_formats?: string[];
  export_urls?: Record<string, unknown>;
  generated_by?: string;
  generated_at?: string;
  finalized_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportAudience {
  id: string;
  tenant_id: string;
  report_id: string;
  audience_name: string;
  audience_type: AudienceType;
  email_list?: string[];
  access_granted_at: string;
  access_expires_at?: string;
  view_count: number;
  last_viewed_at?: string;
  custom_message?: string;
  hidden_sections?: string[];
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  frequency?: ReportFrequency;
  default_audience?: AudienceType;
  tone?: string;
  focus_areas?: string[];
  created_by?: string;
}

export interface CreateSectionInput {
  template_id: string;
  section_type: SectionType;
  title: string;
  section_order: number;
  data_sources?: Record<string, unknown>;
  ai_prompt_template?: string;
}

export interface CreateReportInput {
  template_id: string;
  title: string;
  period_start?: string;
  period_end?: string;
  audience_type: AudienceType;
  generated_by?: string;
}

export interface CreateAudienceInput {
  report_id: string;
  audience_name: string;
  audience_type: AudienceType;
  email_list?: string[];
  custom_message?: string;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Report Templates
// =============================================================================

/**
 * Create a report template
 */
export async function createReportTemplate(
  tenantId: string,
  input: CreateTemplateInput
): Promise<ReportTemplate> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_templates')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description,
      category: input.category,
      frequency: input.frequency || 'monthly',
      default_audience: input.default_audience || 'investor',
      tone: input.tone || 'formal',
      focus_areas: input.focus_areas || [],
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return data as ReportTemplate;
}

/**
 * Get report template by ID
 */
export async function getReportTemplate(
  tenantId: string,
  templateId: string
): Promise<ReportTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_templates')
    .select('*')
    .eq('id', templateId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get template: ${error.message}`);
  return data as ReportTemplate | null;
}

/**
 * List report templates
 */
export async function listReportTemplates(
  tenantId: string,
  filters?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
  }
): Promise<ReportTemplate[]> {
  let query = supabaseAdmin
    .from('unite_report_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list templates: ${error.message}`);
  return data as ReportTemplate[];
}

/**
 * Update report template
 */
export async function updateReportTemplate(
  tenantId: string,
  templateId: string,
  updates: Partial<Omit<ReportTemplate, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<ReportTemplate> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_templates')
    .update(updates)
    .eq('id', templateId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return data as ReportTemplate;
}

/**
 * Delete report template
 */
export async function deleteReportTemplate(
  tenantId: string,
  templateId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_report_templates')
    .delete()
    .eq('id', templateId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Failed to delete template: ${error.message}`);
}

// =============================================================================
// Report Sections
// =============================================================================

/**
 * Create a report section
 */
export async function createReportSection(
  input: CreateSectionInput
): Promise<ReportSection> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_sections')
    .insert({
      template_id: input.template_id,
      section_type: input.section_type,
      title: input.title,
      section_order: input.section_order,
      data_sources: input.data_sources || {},
      ai_prompt_template: input.ai_prompt_template,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create section: ${error.message}`);
  return data as ReportSection;
}

/**
 * List sections for a template
 */
export async function listTemplateSections(
  templateId: string
): Promise<ReportSection[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_sections')
    .select('*')
    .eq('template_id', templateId)
    .order('section_order', { ascending: true });

  if (error) throw new Error(`Failed to list sections: ${error.message}`);
  return data as ReportSection[];
}

/**
 * Delete report section
 */
export async function deleteReportSection(sectionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_report_sections')
    .delete()
    .eq('id', sectionId);

  if (error) throw new Error(`Failed to delete section: ${error.message}`);
}

// =============================================================================
// Reports
// =============================================================================

/**
 * Create a report
 */
export async function createReport(
  tenantId: string,
  input: CreateReportInput
): Promise<Report> {
  const { data, error } = await supabaseAdmin
    .from('unite_reports')
    .insert({
      tenant_id: tenantId,
      template_id: input.template_id,
      title: input.title,
      period_start: input.period_start,
      period_end: input.period_end,
      audience_type: input.audience_type,
      status: 'draft',
      generated_by: input.generated_by,
      sections: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create report: ${error.message}`);
  return data as Report;
}

/**
 * Get report by ID
 */
export async function getReport(
  tenantId: string,
  reportId: string
): Promise<Report | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_reports')
    .select('*')
    .eq('id', reportId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get report: ${error.message}`);
  return data as Report | null;
}

/**
 * List reports
 */
export async function listReports(
  tenantId: string,
  filters?: {
    status?: ReportStatus;
    audienceType?: AudienceType;
    templateId?: string;
    limit?: number;
  }
): Promise<Report[]> {
  let query = supabaseAdmin
    .from('unite_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.audienceType) {
    query = query.eq('audience_type', filters.audienceType);
  }

  if (filters?.templateId) {
    query = query.eq('template_id', filters.templateId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list reports: ${error.message}`);
  return data as Report[];
}

/**
 * Update report
 */
export async function updateReport(
  tenantId: string,
  reportId: string,
  updates: Partial<Report>
): Promise<Report> {
  const { data, error } = await supabaseAdmin
    .from('unite_reports')
    .update(updates)
    .eq('id', reportId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update report: ${error.message}`);
  return data as Report;
}

/**
 * Delete report
 */
export async function deleteReport(
  tenantId: string,
  reportId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_reports')
    .delete()
    .eq('id', reportId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Failed to delete report: ${error.message}`);
}

// =============================================================================
// Report Audiences
// =============================================================================

/**
 * Create report audience
 */
export async function createReportAudience(
  tenantId: string,
  input: CreateAudienceInput
): Promise<ReportAudience> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_audiences')
    .insert({
      tenant_id: tenantId,
      report_id: input.report_id,
      audience_name: input.audience_name,
      audience_type: input.audience_type,
      email_list: input.email_list || [],
      custom_message: input.custom_message,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create audience: ${error.message}`);
  return data as ReportAudience;
}

/**
 * List audiences for a report
 */
export async function listReportAudiences(
  reportId: string
): Promise<ReportAudience[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_report_audiences')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list audiences: ${error.message}`);
  return data as ReportAudience[];
}

/**
 * Get report engagement metrics
 */
export async function getReportEngagement(
  reportId: string
): Promise<Array<{
  audience_name: string;
  audience_type: AudienceType;
  recipient_count: number;
  total_views: number;
  last_viewed: string | null;
  engagement_rate: number;
}>> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_report_engagement', {
    p_report_id: reportId,
  });

  if (error) throw new Error(`Failed to get engagement: ${error.message}`);
  return data || [];
}

// =============================================================================
// AI-Powered Features
// =============================================================================

/**
 * Generate report from template with AI
 */
export async function aiGenerateReport(
  tenantId: string,
  templateId: string,
  dataSnapshot: Record<string, unknown>
): Promise<{
  sections: Record<string, { title: string; content: string; insights: string[] }>;
  executive_summary: string;
  key_highlights: string[];
  recommendations: string[];
}> {
  const client = getAnthropicClient();

  // Get template and sections
  const template = await getReportTemplate(tenantId, templateId);
  if (!template) throw new Error('Template not found');

  const sections = await listTemplateSections(templateId);

  const prompt = `Generate a professional ${template.category || 'business'} report with the following details:

**Template**: ${template.name}
**Tone**: ${template.tone || 'formal'}
**Focus Areas**: ${(template.focus_areas || []).join(', ')}

**Data Snapshot**:
${JSON.stringify(dataSnapshot, null, 2)}

**Required Sections** (${sections.length}):
${sections.map((s) => `${s.section_order}. ${s.title} (${s.section_type})`).join('\n')}

Generate a comprehensive report in JSON format:
{
  "sections": {
    "section_1": {
      "title": "Executive Summary",
      "content": "Detailed narrative for this section...",
      "insights": ["Key insight 1", "Key insight 2"]
    }
  },
  "executive_summary": "High-level overview of the entire report",
  "key_highlights": [
    "Most important metric or achievement",
    "Critical trend or change"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Strategic suggestion 2"
  ]
}

Requirements:
- Professional ${template.tone || 'formal'} tone
- Data-driven insights
- Clear, concise language
- Focus on ${(template.focus_areas || ['performance']).join(', ')}
- Each section should be 150-300 words`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse AI report response');
  }
}

/**
 * AI-generate executive summary for report
 */
export async function aiGenerateExecutiveSummary(
  report: Report,
  sectionsData: Record<string, unknown>
): Promise<{
  summary: string;
  key_metrics: Array<{ label: string; value: string; change: string }>;
  outlook: string;
}> {
  const client = getAnthropicClient();

  const prompt = `Generate an executive summary for this business report:

**Report Title**: ${report.title}
**Period**: ${report.period_start} to ${report.period_end}
**Audience**: ${report.audience_type}

**Sections Data**:
${JSON.stringify(sectionsData, null, 2)}

Provide analysis in JSON format:
{
  "summary": "Concise 3-4 sentence executive summary hitting key points",
  "key_metrics": [
    {
      "label": "Revenue",
      "value": "$X.XM",
      "change": "+X% vs prior period"
    }
  ],
  "outlook": "Forward-looking statement about trends and opportunities"
}

Focus on:
- Most critical business metrics
- Notable changes or trends
- Strategic implications
- Actionable insights`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      summary: 'Unable to generate executive summary',
      key_metrics: [],
      outlook: '',
    };
  }
}

/**
 * Get report summary statistics
 */
export async function getReportSummary(
  tenantId: string,
  months: number = 12
): Promise<{
  total_reports: number;
  reports_by_status: Record<string, number>;
  reports_by_audience: Record<string, number>;
  avg_generation_time_minutes: number;
  most_used_template_id: string | null;
  most_used_template_name: string | null;
}> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_report_summary', {
    p_tenant_id: tenantId,
    p_months: months,
  });

  if (error) throw new Error(`Failed to get report summary: ${error.message}`);

  if (!data || data.length === 0) {
    return {
      total_reports: 0,
      reports_by_status: {},
      reports_by_audience: {},
      avg_generation_time_minutes: 0,
      most_used_template_id: null,
      most_used_template_name: null,
    };
  }

  return data[0];
}
