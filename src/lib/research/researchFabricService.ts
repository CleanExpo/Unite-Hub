/**
 * Research Fabric Service
 * Phase D03: Research Fabric v1
 *
 * AI-powered research workflows with web search, document analysis,
 * and knowledge synthesis using Anthropic tools and MCP integration.
 *
 * @module research/researchFabricService
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getAnthropicClient,
  recordAnthropicSuccess,
  recordAnthropicFailure,
} from '@/lib/anthropic/client';

// =====================================================
// Types
// =====================================================

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type QueryType = 'general' | 'competitor' | 'market' | 'technical' | 'trend' | 'sentiment' | 'citation';
export type QueryStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type FindingType = 'insight' | 'fact' | 'trend' | 'opportunity' | 'threat' | 'quote' | 'statistic' | 'recommendation';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type KnowledgeContentType = 'summary' | 'definition' | 'process' | 'comparison' | 'timeline' | 'faq' | 'custom';
export type RunType = 'manual' | 'scheduled' | 'triggered' | 'background';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TimeHorizon = 'current' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'all_time';
export type RefreshFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

// =====================================================
// Interfaces
// =====================================================

export interface ResearchProject {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: ProjectStatus;
  sources: string[];
  focus_keywords: string[];
  exclude_keywords: string[];
  domain: string | null;
  time_horizon: TimeHorizon | null;
  geographic_scope: string[];
  auto_refresh: boolean;
  refresh_frequency: RefreshFrequency | null;
  next_refresh_at: string | null;
  last_refresh_at: string | null;
  findings_count: number;
  insights_count: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchQuery {
  id: string;
  tenant_id: string;
  project_id: string | null;
  query: string;
  query_type: QueryType;
  status: QueryStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  result_count: number;
  result_summary: string | null;
  raw_results: unknown[];
  ai_analysis: string | null;
  ai_confidence: number | null;
  error_message: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface ResearchFinding {
  id: string;
  tenant_id: string;
  project_id: string | null;
  query_id: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  finding_type: FindingType;
  relevance_score: number;
  confidence_score: number;
  source_url: string | null;
  source_title: string | null;
  source_domain: string | null;
  source_date: string | null;
  topics: string[];
  entities: string[];
  sentiment: Sentiment | null;
  is_reviewed: boolean;
  is_starred: boolean;
  is_actionable: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface ResearchDocument {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  file_path: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  status: DocumentStatus;
  processed_at: string | null;
  extracted_text: string | null;
  page_count: number | null;
  word_count: number | null;
  ai_summary: string | null;
  key_points: unknown[];
  entities: Record<string, unknown>;
  topics: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface ResearchKnowledge {
  id: string;
  tenant_id: string;
  topic: string;
  content: string;
  content_type: KnowledgeContentType;
  source_project_ids: string[];
  source_finding_ids: string[];
  source_document_ids: string[];
  citation_count: number;
  confidence_score: number;
  last_validated_at: string | null;
  is_verified: boolean;
  view_count: number;
  last_accessed_at: string | null;
  tags: string[];
  related_topics: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchAgentRun {
  id: string;
  tenant_id: string;
  project_id: string | null;
  run_type: RunType;
  trigger_source: string | null;
  status: RunStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  queries_executed: number;
  findings_created: number;
  documents_processed: number;
  ai_model: string | null;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number | null;
  summary: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

// =====================================================
// Input Types
// =====================================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  objective?: string;
  sources?: string[];
  focus_keywords?: string[];
  exclude_keywords?: string[];
  domain?: string;
  time_horizon?: TimeHorizon;
  geographic_scope?: string[];
  auto_refresh?: boolean;
  refresh_frequency?: RefreshFrequency;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateQueryInput {
  project_id?: string;
  query: string;
  query_type?: QueryType;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  date?: string;
}

// =====================================================
// Project Functions
// =====================================================

/**
 * Create a new research project
 */
export async function createProject(
  tenantId: string,
  input: CreateProjectInput,
  userId?: string
): Promise<ResearchProject> {
  const { data, error } = await supabaseAdmin
    .from('research_projects')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description || null,
      objective: input.objective || null,
      status: 'draft',
      sources: input.sources || ['web', 'docs'],
      focus_keywords: input.focus_keywords || [],
      exclude_keywords: input.exclude_keywords || [],
      domain: input.domain || null,
      time_horizon: input.time_horizon || 'last_month',
      geographic_scope: input.geographic_scope || [],
      auto_refresh: input.auto_refresh || false,
      refresh_frequency: input.refresh_frequency || 'manual',
      tags: input.tags || [],
      metadata: input.metadata || {},
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

/**
 * Get a project by ID
 */
export async function getProject(projectId: string): Promise<ResearchProject | null> {
  const { data, error } = await supabaseAdmin
    .from('research_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get project: ${error.message}`);
  }

  return data;
}

/**
 * List projects for a tenant
 */
export async function listProjects(
  tenantId: string,
  options: {
    status?: ProjectStatus;
    limit?: number;
  } = {}
): Promise<ResearchProject[]> {
  const { status, limit = 50 } = options;

  let query = supabaseAdmin
    .from('research_projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  update: Partial<CreateProjectInput> & { status?: ProjectStatus },
  userId?: string
): Promise<ResearchProject> {
  const { data, error } = await supabaseAdmin
    .from('research_projects')
    .update({
      ...update,
      updated_by: userId || null,
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('research_projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

// =====================================================
// Query Functions
// =====================================================

/**
 * Create and execute a research query
 */
export async function executeQuery(
  tenantId: string,
  input: CreateQueryInput,
  userId?: string
): Promise<ResearchQuery> {
  const startTime = Date.now();

  // Create query record
  const { data: queryRecord, error: createError } = await supabaseAdmin
    .from('research_queries')
    .insert({
      tenant_id: tenantId,
      project_id: input.project_id || null,
      query: input.query,
      query_type: input.query_type || 'general',
      status: 'running',
      started_at: new Date().toISOString(),
      metadata: input.metadata || {},
      created_by: userId || null,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create query: ${createError.message}`);
  }

  try {
    // Execute AI-powered research
    const results = await performAIResearch(input.query, input.query_type || 'general');

    const durationMs = Date.now() - startTime;

    // Update query with results
    const { data: updatedQuery, error: updateError } = await supabaseAdmin
      .from('research_queries')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        result_count: results.findings.length,
        result_summary: results.summary,
        raw_results: results.rawResults,
        ai_analysis: results.analysis,
        ai_confidence: results.confidence,
      })
      .eq('id', queryRecord.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update query: ${updateError.message}`);
    }

    // Create findings from results
    if (results.findings.length > 0 && input.project_id) {
      await createFindingsFromResults(
        tenantId,
        input.project_id,
        queryRecord.id,
        results.findings,
        userId
      );

      // Update project findings count
      await supabaseAdmin.rpc('increment_project_findings', {
        p_project_id: input.project_id,
        p_count: results.findings.length,
      });
    }

    return updatedQuery;
  } catch (error) {
    // Update query with error
    await supabaseAdmin
      .from('research_queries')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: (queryRecord.retry_count || 0) + 1,
      })
      .eq('id', queryRecord.id);

    throw error;
  }
}

/**
 * Perform AI-powered research
 */
async function performAIResearch(
  query: string,
  queryType: QueryType
): Promise<{
  summary: string;
  analysis: string;
  confidence: number;
  findings: Array<{
    title: string;
    summary: string;
    finding_type: FindingType;
    relevance_score: number;
    topics: string[];
  }>;
  rawResults: unknown[];
}> {
  try {
    const anthropic = getAnthropicClient();

    const systemPrompt = `You are a research analyst helping founders gather business intelligence.
Your role is to analyze queries and generate structured research findings.
Be thorough, cite sources when possible, and provide actionable insights.`;

    const userPrompt = `Research Query: ${query}
Query Type: ${queryType}

Analyze this research query and generate findings. Return JSON:
{
  "summary": "<2-3 sentence summary of research direction>",
  "analysis": "<detailed analysis paragraph>",
  "confidence": <0.0-1.0>,
  "findings": [
    {
      "title": "<concise finding title>",
      "summary": "<1-2 sentence summary>",
      "finding_type": "<insight|fact|trend|opportunity|threat|recommendation>",
      "relevance_score": <0.0-1.0>,
      "topics": ["<topic1>", "<topic2>"]
    }
  ]
}

Generate 2-5 relevant findings. Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    recordAnthropicSuccess();

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const parsed = JSON.parse(textBlock.text);

    return {
      summary: parsed.summary || '',
      analysis: parsed.analysis || '',
      confidence: parsed.confidence || 0.5,
      findings: parsed.findings || [],
      rawResults: [{ query, response: parsed }],
    };
  } catch (error) {
    recordAnthropicFailure(error);
    throw error;
  }
}

/**
 * Create findings from research results
 */
async function createFindingsFromResults(
  tenantId: string,
  projectId: string,
  queryId: string,
  findings: Array<{
    title: string;
    summary: string;
    finding_type: FindingType;
    relevance_score: number;
    topics: string[];
  }>,
  userId?: string
): Promise<void> {
  const findingsToInsert = findings.map((f) => ({
    tenant_id: tenantId,
    project_id: projectId,
    query_id: queryId,
    title: f.title,
    summary: f.summary,
    finding_type: f.finding_type,
    relevance_score: f.relevance_score,
    confidence_score: 0.7, // Default
    topics: f.topics,
    entities: [],
    created_by: userId || null,
  }));

  const { error } = await supabaseAdmin
    .from('research_findings')
    .insert(findingsToInsert);

  if (error) {
    console.error('Error creating findings:', error);
  }
}

/**
 * List queries for a project
 */
export async function listQueries(
  tenantId: string,
  options: {
    projectId?: string;
    status?: QueryStatus;
    limit?: number;
  } = {}
): Promise<ResearchQuery[]> {
  const { projectId, status, limit = 50 } = options;

  let query = supabaseAdmin
    .from('research_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list queries: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Findings Functions
// =====================================================

/**
 * List findings for a project
 */
export async function listFindings(
  tenantId: string,
  options: {
    projectId?: string;
    findingType?: FindingType;
    starredOnly?: boolean;
    limit?: number;
  } = {}
): Promise<ResearchFinding[]> {
  const { projectId, findingType, starredOnly, limit = 100 } = options;

  let query = supabaseAdmin
    .from('research_findings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (findingType) {
    query = query.eq('finding_type', findingType);
  }
  if (starredOnly) {
    query = query.eq('is_starred', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list findings: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a finding
 */
export async function updateFinding(
  findingId: string,
  update: {
    is_starred?: boolean;
    is_reviewed?: boolean;
    is_actionable?: boolean;
  }
): Promise<ResearchFinding> {
  const { data, error } = await supabaseAdmin
    .from('research_findings')
    .update(update)
    .eq('id', findingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update finding: ${error.message}`);
  }

  return data;
}

// =====================================================
// Knowledge Base Functions
// =====================================================

/**
 * Create a knowledge entry
 */
export async function createKnowledge(
  tenantId: string,
  input: {
    topic: string;
    content: string;
    content_type?: KnowledgeContentType;
    source_project_ids?: string[];
    source_finding_ids?: string[];
    tags?: string[];
    related_topics?: string[];
  },
  userId?: string
): Promise<ResearchKnowledge> {
  const { data, error } = await supabaseAdmin
    .from('research_knowledge_base')
    .insert({
      tenant_id: tenantId,
      topic: input.topic,
      content: input.content,
      content_type: input.content_type || 'summary',
      source_project_ids: input.source_project_ids || [],
      source_finding_ids: input.source_finding_ids || [],
      source_document_ids: [],
      tags: input.tags || [],
      related_topics: input.related_topics || [],
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge: ${error.message}`);
  }

  return data;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  tenantId: string,
  searchTerm: string,
  limit: number = 20
): Promise<ResearchKnowledge[]> {
  const { data, error } = await supabaseAdmin
    .from('research_knowledge_base')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`topic.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search knowledge: ${error.message}`);
  }

  // Increment view count for results
  if (data && data.length > 0) {
    const ids = data.map((k) => k.id);
    await supabaseAdmin
      .from('research_knowledge_base')
      .update({
        view_count: supabaseAdmin.rpc('increment', { x: 1 }),
        last_accessed_at: new Date().toISOString(),
      })
      .in('id', ids);
  }

  return data || [];
}

// =====================================================
// Agent Run Functions
// =====================================================

/**
 * Create an agent run
 */
export async function createAgentRun(
  tenantId: string,
  projectId: string | null,
  runType: RunType,
  userId?: string
): Promise<ResearchAgentRun> {
  const { data, error } = await supabaseAdmin
    .from('research_agent_runs')
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      run_type: runType,
      trigger_source: userId ? 'user' : 'system',
      status: 'pending',
      created_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent run: ${error.message}`);
  }

  return data;
}

/**
 * Update agent run status
 */
export async function updateAgentRun(
  runId: string,
  update: Partial<{
    status: RunStatus;
    started_at: string;
    completed_at: string;
    duration_ms: number;
    queries_executed: number;
    findings_created: number;
    documents_processed: number;
    ai_model: string;
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
    summary: string;
    error_message: string;
  }>
): Promise<ResearchAgentRun> {
  const { data, error } = await supabaseAdmin
    .from('research_agent_runs')
    .update(update)
    .eq('id', runId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update agent run: ${error.message}`);
  }

  return data;
}

/**
 * List recent agent runs
 */
export async function listAgentRuns(
  tenantId: string,
  options: {
    projectId?: string;
    status?: RunStatus;
    limit?: number;
  } = {}
): Promise<ResearchAgentRun[]> {
  const { projectId, status, limit = 20 } = options;

  let query = supabaseAdmin
    .from('research_agent_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list agent runs: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// High-Level Research Workflow
// =====================================================

/**
 * Run a complete research workflow for a project
 */
export async function runProjectResearch(
  tenantId: string,
  projectId: string,
  userId?: string
): Promise<{
  run: ResearchAgentRun;
  queriesExecuted: number;
  findingsCreated: number;
}> {
  // Get project
  const project = await getProject(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Create agent run
  const run = await createAgentRun(tenantId, projectId, 'manual', userId);
  const startTime = Date.now();

  try {
    // Update run to running
    await updateAgentRun(run.id, {
      status: 'running',
      started_at: new Date().toISOString(),
      ai_model: 'claude-sonnet-4-5-20250514',
    });

    // Generate queries from project objective
    const queries = generateQueriesFromProject(project);
    let totalFindings = 0;

    // Execute each query
    for (const queryText of queries) {
      try {
        const result = await executeQuery(tenantId, {
          project_id: projectId,
          query: queryText,
          query_type: 'general',
        }, userId);

        totalFindings += result.result_count;
      } catch (error) {
        console.error(`Query failed: ${queryText}`, error);
      }
    }

    // Complete the run
    const durationMs = Date.now() - startTime;
    const completedRun = await updateAgentRun(run.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      queries_executed: queries.length,
      findings_created: totalFindings,
      summary: `Executed ${queries.length} queries, generated ${totalFindings} findings`,
    });

    // Update project last refresh
    await updateProject(projectId, {
      status: 'active',
    });

    return {
      run: completedRun,
      queriesExecuted: queries.length,
      findingsCreated: totalFindings,
    };
  } catch (error) {
    // Mark run as failed
    await updateAgentRun(run.id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Generate research queries from a project
 */
function generateQueriesFromProject(project: ResearchProject): string[] {
  const queries: string[] = [];

  // Base query from objective
  if (project.objective) {
    queries.push(project.objective);
  } else if (project.name) {
    queries.push(`Research on ${project.name}`);
  }

  // Add keyword-based queries
  for (const keyword of (project.focus_keywords || []).slice(0, 3)) {
    if (project.domain) {
      queries.push(`${keyword} in ${project.domain} industry`);
    } else {
      queries.push(`${keyword} market trends`);
    }
  }

  return queries.slice(0, 5); // Limit to 5 queries per run
}

// =====================================================
// Statistics
// =====================================================

/**
 * Get research statistics for a tenant
 */
export async function getResearchStats(tenantId: string): Promise<{
  totalProjects: number;
  activeProjects: number;
  totalFindings: number;
  starredFindings: number;
  totalKnowledge: number;
  recentRuns: ResearchAgentRun[];
}> {
  const [projectsRes, findingsRes, knowledgeRes, runsRes] = await Promise.all([
    supabaseAdmin
      .from('research_projects')
      .select('id, status')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('research_findings')
      .select('id, is_starred')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('research_knowledge_base')
      .select('id')
      .eq('tenant_id', tenantId),
    listAgentRuns(tenantId, { limit: 5 }),
  ]);

  const projects = projectsRes.data || [];
  const findings = findingsRes.data || [];

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalFindings: findings.length,
    starredFindings: findings.filter((f) => f.is_starred).length,
    totalKnowledge: (knowledgeRes.data || []).length,
    recentRuns: runsRes,
  };
}
