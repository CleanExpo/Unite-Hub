/**
 * Synthex AGI Bridge
 *
 * Unified integration bridge between Synthex job queue and AGI agent stack.
 * Converts Synthex job payloads to AGI-compatible format, executes agents,
 * and stores results back to Synthex database.
 *
 * Architecture:
 * Synthex Job Queue → routeAndExecuteJob → Call appropriate agent → Store results
 *
 * Supported Agents:
 * - contentAgent - Content generation, email, social media
 * - researchAgent - SEO research, competitor analysis, keyword strategy
 * - analysisAgent - Analytics, reporting, insights
 * - coordinationAgent - Multi-step workflows, orchestration
 * - businessBrain - Strategic decisions, business logic
 *
 * Integration Points:
 * - Reads from: synthex_project_jobs (job definitions)
 * - Reads from: synthex_brands (brand context)
 * - Reads from: synthex_tenants (tenant context)
 * - Writes to: synthex_job_results (agent outputs)
 * - Calls: AGI agents via Anthropic API
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/lib/supabase.types';
import {
  routeJobToAgent,
  updateJobStatus,
  storeJobResult,
  getJob,
} from './synthexJobRouter';
import { getLLMClient } from './llmProviderClient';

type SynthexProjectJob = Database['public']['Tables']['synthex_project_jobs']['Row'];

// ============================================================================
// AGENT EXECUTION TYPES
// ============================================================================

export interface AgentExecutionRequest {
  jobId: string;
  jobType: string;
  agentName: string;
  agentPayload: Record<string, any>;
  timeoutSeconds?: number;
}

export interface AgentExecutionResult {
  success: boolean;
  jobId: string;
  resultType: string;
  data: Record<string, any>;
  executionTimeMs: number;
  error?: string;
  cost?: number; // USD
}

export interface ExecutionContext {
  jobId: string;
  tenantId: string;
  brandId?: string;
  jobType: string;
  agentName: string;
  startTime: number;
}

// ============================================================================
// AGENT PAYLOAD BUILDERS
// ============================================================================

/**
 * Build initial launch pack payload
 */
function buildInitialLaunchPackPayload(payload: Record<string, any>, brand: any, tenant: any) {
  return {
    ...payload,
    instructions: `Create comprehensive first-time setup for ${payload.brand_name}:
- Website foundation: home page, services, about, contact
- Social media templates: LinkedIn, Facebook, Instagram (3 posts each)
- Email starter: welcome sequence (3 emails)
Adapt tone and content to: industry=${tenant.industry}, region=${tenant.region}`,
    outputFormat: {
      website: ['homepage_draft', 'services_page', 'about_page', 'contact_page'],
      social: ['linkedin_posts', 'facebook_posts', 'instagram_posts'],
      email: ['welcome_email_1', 'welcome_email_2', 'welcome_email_3'],
    },
  };
}

/**
 * Build content batch payload
 */
function buildContentBatchPayload(payload: Record<string, any>, brand: any) {
  return {
    ...payload,
    instructions: `Generate ${payload.count || 5} pieces of marketing content for ${payload.brand_name}:
- Content types: ${(payload.content_types || []).join(', ')}
- Tone and voice: ${brand?.tone_voice || 'professional'}
- Target audience: ${brand?.target_audience || 'general'}
- Key messages: ${payload.key_messages || 'not specified'}`,
    outputFormat: {
      contentPieces: Array(payload.count || 5).fill(0).map((_, i) => ({
        id: `content_${i + 1}`,
        type: '',
        title: '',
        body: '',
        cta: '',
      })),
    },
  };
}

/**
 * Build SEO launch payload
 */
function buildSeoLaunchPayload(payload: Record<string, any>, brand: any, tenant: any) {
  return {
    ...payload,
    instructions: `Execute SEO launch for ${payload.primary_domain}:
1. Research target keywords: ${(payload.target_keywords || []).join(', ')}
2. Analyze current rankings
3. Create optimized landing pages (minimum 5)
4. Provide SEO strategy document
Region: ${tenant.region || 'global'}`,
    outputFormat: {
      keywordResearch: {
        primaryKeywords: [],
        secondaryKeywords: [],
        competitorAnalysis: [],
      },
      landingPages: Array(5).fill(0).map((_, i) => ({
        id: `seo_page_${i + 1}`,
        title: '',
        metaDescription: '',
        content: '',
        keywords: [],
      })),
      strategyDocument: '',
    },
  };
}

/**
 * Build geo pages payload
 */
function buildGeoPagesPayload(payload: Record<string, any>, brand: any) {
  const locations = payload.locations || [];
  return {
    ...payload,
    instructions: `Create location-specific landing pages for ${payload.service_name}:
- Locations: ${locations.join(', ')}
- One unique page per location with local content
- Include local SEO elements (address, local keywords)
- Tone: ${brand?.tone_voice || 'professional'}`,
    outputFormat: {
      pages: locations.map((loc: string) => ({
        location: loc,
        pageId: `geo_${loc.replace(/\s+/g, '_').toLowerCase()}`,
        title: '',
        metaDescription: '',
        content: '',
        localSEO: {
          address: '',
          phone: '',
          hours: '',
        },
      })),
    },
  };
}

/**
 * Build review campaign payload
 */
function buildReviewCampaignPayload(payload: Record<string, any>, brand: any) {
  return {
    ...payload,
    instructions: `Create review request campaign for ${brand?.brand_name || 'client'}:
- Platforms: ${(payload.review_platforms || []).join(', ')}
- Generate email sequence (3-5 emails) requesting reviews
- Include SMS templates for each platform
- Customize messaging by platform`,
    outputFormat: {
      emailSequence: [],
      smsTemplates: {},
      campaignStrategy: '',
    },
  };
}

/**
 * Build monthly report payload
 */
function buildMonthlyReportPayload(payload: Record<string, any>, brand: any) {
  return {
    ...payload,
    instructions: `Generate monthly performance report for ${brand?.brand_name || 'client'}:
- Month: ${payload.month}
- Analyze: website traffic, email engagement, social performance, conversions
- Provide 5-10 actionable optimization recommendations
- Include competitive benchmarking`,
    outputFormat: {
      reportSections: [
        'executive_summary',
        'traffic_analysis',
        'engagement_metrics',
        'conversion_analysis',
        'recommendations',
        'competitive_benchmarks',
      ],
      metrics: {},
      recommendations: [],
    },
  };
}

/**
 * Build email sequence payload
 */
function buildEmailSequencePayload(payload: Record<string, any>, brand: any) {
  return {
    ...payload,
    instructions: `Create ${payload.email_count || 3} email sequence for ${brand?.brand_name || 'client'}:
- Type: ${payload.email_type || 'nurture'}
- Purpose: ${payload.purpose || 'build relationship and drive engagement'}
- Tone: ${brand?.tone_voice || 'professional'}
- Include subject lines, preview text, and full HTML`,
    outputFormat: {
      emails: Array(payload.email_count || 3).fill(0).map((_, i) => ({
        id: `email_${i + 1}`,
        sequenceNumber: i + 1,
        subjectLine: '',
        previewText: '',
        htmlContent: '',
        plaintextContent: '',
        cta: '',
      })),
    },
  };
}

// ============================================================================
// AGENT EXECUTION
// ============================================================================

/**
 * Execute a job by calling the appropriate AGI agent
 * This is the main entry point for job execution
 */
export async function routeAndExecuteJob(jobId: string): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    // 1. Fetch job details
    const job = await getJob(jobId);
    if (!job) {
      return {
        success: false,
        jobId,
        resultType: 'error',
        data: {},
        executionTimeMs: Date.now() - startTime,
        error: 'Job not found',
      };
    }

    // Update status to running
    await updateJobStatus(jobId, 'running');

    // 2. Route job to agent and get payload
    const { agentName, agentPayload, error: routeError } = await routeJobToAgent(jobId);

    if (routeError || !agentName) {
      await updateJobStatus(jobId, 'failed', routeError || 'Failed to route job');
      return {
        success: false,
        jobId,
        resultType: 'error',
        data: {},
        executionTimeMs: Date.now() - startTime,
        error: routeError || 'Failed to route job',
      };
    }

    // 3. Execute the agent
    const result = await executeAgent({
      jobId,
      jobType: job.job_type,
      agentName,
      agentPayload,
      timeoutSeconds: 300,
    });

    // 4. Store results
    if (result.success) {
      await storeJobResult(jobId, result.resultType, result.data);
      await updateJobStatus(jobId, 'completed');
    } else {
      await updateJobStatus(jobId, 'failed', result.error);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'failed', errorMessage);
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: {},
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Execute an agent with the given payload
 */
async function executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    // Route to appropriate executor based on agent name
    let result: AgentExecutionResult;

    switch (request.agentName) {
      case 'content_agent':
        result = await executeContentAgent(request);
        break;
      case 'research_agent':
        result = await executeResearchAgent(request);
        break;
      case 'analysis_agent':
        result = await executeAnalysisAgent(request);
        break;
      case 'coordination_agent':
        result = await executeCoordinationAgent(request);
        break;
      default:
        return {
          success: false,
          jobId: request.jobId,
          resultType: 'error',
          data: {},
          executionTimeMs: Date.now() - startTime,
          error: `Unknown agent: ${request.agentName}`,
        };
    }

    return {
      ...result,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      jobId: request.jobId,
      resultType: 'error',
      data: {},
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Execute content agent (generation, email, social)
 */
async function executeContentAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const { jobId, agentPayload } = request;
  const jobType = agentPayload.jobType;
  const startTime = Date.now();

  try {
    const llmClient = getLLMClient();
    let llmResponse: any;

    if (jobType === 'initial_launch_pack') {
      // Generate comprehensive launch pack
      llmResponse = await llmClient.generateContent(
        'comprehensive business launch',
        `${agentPayload.brand?.brandName || 'Your Business'} (${agentPayload.tenant?.industry})`,
        {
          businessName: agentPayload.tenant?.businessName,
          tagline: agentPayload.brand?.tagline,
          valueProposition: agentPayload.brand?.valueProposition,
          targetAudience: agentPayload.brand?.targetAudience,
          tone: agentPayload.brand?.toneVoice || 'professional',
          industry: agentPayload.tenant?.industry,
        },
        3
      );

      return {
        success: true,
        jobId,
        resultType: 'content_generated',
        data: {
          type: 'initial_launch_pack',
          content: llmResponse.content,
          generatedAt: new Date().toISOString(),
          model: llmResponse.model,
          tokens: {
            input: llmResponse.inputTokens,
            output: llmResponse.outputTokens,
          },
        },
        cost: llmResponse.cost,
        executionTimeMs: Date.now() - startTime,
      };
    } else if (jobType === 'content_batch') {
      // Generate content batch
      llmResponse = await llmClient.generateContent(
        agentPayload.content_types?.[0] || 'marketing content',
        agentPayload.topic || 'business promotion',
        {
          businessName: agentPayload.brand?.brandName,
          tagline: agentPayload.brand?.tagline,
          valueProposition: agentPayload.brand?.valueProposition,
          targetAudience: agentPayload.brand?.targetAudience,
          tone: agentPayload.brand?.toneVoice || 'professional',
          industry: agentPayload.tenant?.industry,
        },
        agentPayload.count || 5
      );

      return {
        success: true,
        jobId,
        resultType: 'content_generated',
        data: {
          type: 'content_batch',
          contentCount: agentPayload.count || 5,
          content: llmResponse.content,
          generatedAt: new Date().toISOString(),
          model: llmResponse.model,
        },
        cost: llmResponse.cost,
        executionTimeMs: Date.now() - startTime,
      };
    } else if (jobType === 'email_sequence') {
      // Generate email sequence
      llmResponse = await llmClient.generateEmailSequence(
        agentPayload.email_type || 'welcome',
        agentPayload.email_count || 3,
        {
          businessName: agentPayload.brand?.brandName,
          tagline: agentPayload.brand?.tagline,
          tone: agentPayload.brand?.toneVoice || 'professional',
          industry: agentPayload.tenant?.industry,
          targetAudience: agentPayload.brand?.targetAudience,
        }
      );

      return {
        success: true,
        jobId,
        resultType: 'email_sequence',
        data: {
          type: 'email_sequence',
          emailCount: agentPayload.email_count || 3,
          content: llmResponse.content,
          generatedAt: new Date().toISOString(),
          model: llmResponse.model,
        },
        cost: llmResponse.cost,
        executionTimeMs: Date.now() - startTime,
      };
    } else if (jobType === 'geo_pages') {
      // Generate location pages
      llmResponse = await llmClient.generateContent(
        'location-specific landing pages',
        `${agentPayload.service_name} in ${(agentPayload.locations || []).join(', ')}`,
        {
          businessName: agentPayload.brand?.brandName,
          tagline: agentPayload.brand?.tagline,
          tone: agentPayload.brand?.toneVoice || 'professional',
          industry: agentPayload.tenant?.industry,
          targetAudience: agentPayload.brand?.targetAudience,
        },
        (agentPayload.locations || []).length
      );

      return {
        success: true,
        jobId,
        resultType: 'seo_pages',
        data: {
          type: 'geo_pages',
          locations: agentPayload.locations || [],
          content: llmResponse.content,
          generatedAt: new Date().toISOString(),
          model: llmResponse.model,
        },
        cost: llmResponse.cost,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Default fallback
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: {},
      executionTimeMs: Date.now() - startTime,
      error: `Unsupported job type: ${jobType}`,
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: { error: String(error) },
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Content generation failed',
    };
  }
}

/**
 * Execute research agent (SEO, keywords, competitor analysis)
 * Uses real Claude API for SEO research and keyword analysis
 */
async function executeResearchAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const { jobId, agentPayload } = request;
  const jobType = agentPayload.jobType;
  const startTime = Date.now();

  try {
    const llmClient = getLLMClient();
    let llmResponse: any;

    // Extract SEO parameters from payload
    const domain = agentPayload.primary_domain || agentPayload.brand?.domain || agentPayload.domain || 'unknown.com';
    const targetKeywords = agentPayload.target_keywords || agentPayload.keywords || [];
    const industry = agentPayload.tenant?.industry || agentPayload.industry || 'general';

    // Call real Claude API for SEO research
    llmResponse = await llmClient.researchSEO(domain, targetKeywords, industry);

    return {
      success: true,
      jobId,
      resultType: jobType === 'seo_launch' ? 'seo_pages' : 'research_complete',
      data: {
        research: {
          content: llmResponse.content,
          domain,
          targetKeywords,
          industry,
        },
        generatedAt: new Date().toISOString(),
        model: llmResponse.model,
        tokens: {
          input: llmResponse.inputTokens,
          output: llmResponse.outputTokens,
        },
      },
      cost: llmResponse.cost,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: { error: String(error) },
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Research agent failed',
    };
  }
}

/**
 * Execute analysis agent (reporting, insights, recommendations)
 * Uses real Claude API for metrics analysis and business insights
 */
async function executeAnalysisAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const { jobId, agentPayload } = request;
  const jobType = agentPayload.jobType;
  const startTime = Date.now();

  try {
    const llmClient = getLLMClient();
    let llmResponse: any;

    // Extract metrics and focus area from payload
    const metrics = agentPayload.metrics || {
      websiteTraffic: agentPayload.websiteTraffic || {},
      emailEngagement: agentPayload.emailEngagement || {},
      socialPerformance: agentPayload.socialPerformance || {},
      conversions: agentPayload.conversions || {},
    };
    const focus = agentPayload.focus || agentPayload.brand?.brandName || 'business performance';

    // Call real Claude API for metrics analysis
    llmResponse = await llmClient.analyzeMetrics(metrics, focus);

    return {
      success: true,
      jobId,
      resultType: 'analysis_report',
      data: {
        analysis: {
          content: llmResponse.content,
          focus,
          metricsAnalyzed: Object.keys(metrics),
        },
        generatedAt: new Date().toISOString(),
        model: llmResponse.model,
        tokens: {
          input: llmResponse.inputTokens,
          output: llmResponse.outputTokens,
        },
      },
      cost: llmResponse.cost,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: { error: String(error) },
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Analysis agent failed',
    };
  }
}

/**
 * Execute coordination agent (multi-step workflows, orchestration)
 * Uses real Claude API with Extended Thinking for strategic planning
 */
async function executeCoordinationAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const { jobId, agentPayload } = request;
  const jobType = agentPayload.jobType;
  const startTime = Date.now();

  try {
    const llmClient = getLLMClient();
    let llmResponse: any;

    // Build business context from payload
    const businessContext = {
      brandName: agentPayload.brand?.brandName || agentPayload.brand_name,
      industry: agentPayload.tenant?.industry || agentPayload.industry,
      businessName: agentPayload.tenant?.businessName || agentPayload.business_name,
      targetAudience: agentPayload.brand?.targetAudience,
      valueProposition: agentPayload.brand?.valueProposition,
      region: agentPayload.tenant?.region,
      jobType,
    };

    // Build analysis request based on job type
    let analysisRequest = '';
    if (jobType === 'initial_launch_pack') {
      analysisRequest = `Create a comprehensive launch strategy for ${businessContext.brandName}:
1. Define the optimal sequence of marketing activities
2. Prioritize channels based on the target audience
3. Create a content calendar for the first 30 days
4. Identify quick wins and long-term strategic goals
5. Recommend resource allocation`;
    } else {
      analysisRequest = `Analyze the workflow requirements for ${jobType} and create an orchestration plan with:
1. Step-by-step execution sequence
2. Dependencies between tasks
3. Resource requirements
4. Success metrics
5. Risk mitigation strategies`;
    }

    // Call real Claude API with Extended Thinking for strategic analysis
    llmResponse = await llmClient.analyzeStrategy(businessContext, analysisRequest);

    return {
      success: true,
      jobId,
      resultType: 'content_generated',
      data: {
        workflow: {
          strategy: llmResponse.content,
          thinkingProcess: llmResponse.thinkingContent,
          status: 'orchestrated',
          businessContext,
        },
        generatedAt: new Date().toISOString(),
        model: llmResponse.model,
        tokens: {
          input: llmResponse.inputTokens,
          output: llmResponse.outputTokens,
        },
      },
      cost: llmResponse.cost,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      resultType: 'error',
      data: { error: String(error) },
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Coordination agent failed',
    };
  }
}

// ============================================================================
// BATCH JOB EXECUTION
// ============================================================================

/**
 * Process multiple pending jobs in a batch
 */
export async function processPendingJobs(limit: number = 5): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ jobId: string; error: string }>;
}> {
  const { data: pendingJobs, error } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('id')
    .in('status', ['pending', 'queued'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !pendingJobs) {
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [{ jobId: 'batch', error: error?.message || 'Failed to fetch pending jobs' }],
    };
  }

  const results = await Promise.allSettled(
    pendingJobs.map((job) => routeAndExecuteJob(job.id))
  );

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter((r) => r.status === 'rejected' || !r.value?.success).length;
  const errors = results
    .map((r, i) => {
      if (r.status === 'rejected') {
        return { jobId: pendingJobs[i].id, error: String(r.reason) };
      }
      if (!r.value?.success) {
        return { jobId: pendingJobs[i].id, error: r.value?.error || 'Unknown error' };
      }
      return null;
    })
    .filter((e) => e !== null) as Array<{ jobId: string; error: string }>;

  return {
    processed: pendingJobs.length,
    successful,
    failed,
    errors,
  };
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

/**
 * Estimate cost for a job based on job type
 */
export function estimateJobCost(jobType: string): number {
  const costMap: Record<string, number> = {
    initial_launch_pack: 0.45, // Complex multi-step with Extended Thinking
    content_batch: 0.18,       // Multiple content pieces
    seo_launch: 0.30,          // Research + analysis
    geo_pages: 0.25,           // Content per location
    review_campaign: 0.15,     // Email/SMS sequences
    monthly_report: 0.20,      // Analytics + recommendations
    email_sequence: 0.12,      // Single sequence
  };

  return costMap[jobType] || 0.10;
}

/**
 * Calculate total cost for tenant's jobs in a period
 */
export async function calculateTenantCost(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalCost: number;
  jobCount: number;
  breakdown: Record<string, number>;
}> {
  const { data: jobs } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('job_type, status')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!jobs) {
    return { totalCost: 0, jobCount: 0, breakdown: {} };
  }

  const breakdown: Record<string, number> = {};
  let totalCost = 0;

  for (const job of jobs) {
    const cost = estimateJobCost(job.job_type);
    breakdown[job.job_type] = (breakdown[job.job_type] || 0) + cost;
    totalCost += cost;
  }

  return {
    totalCost,
    jobCount: jobs.length,
    breakdown,
  };
}

// ============================================================================
// EXECUTION STATUS & MONITORING
// ============================================================================

/**
 * Get execution status of a job
 */
export async function getJobExecutionStatus(jobId: string): Promise<{
  jobId: string;
  status: string;
  progress: number;
  startTime?: string;
  completionTime?: string;
  resultCount: number;
}> {
  const job = await getJob(jobId);

  if (!job) {
    return {
      jobId,
      status: 'not_found',
      progress: 0,
      resultCount: 0,
    };
  }

  const { data: results } = await supabaseAdmin
    .from('synthex_job_results')
    .select('id')
    .eq('job_id', jobId);

  const statusMap = {
    pending: 0,
    queued: 25,
    running: 50,
    completed: 100,
    failed: 0,
    cancelled: 0,
  };

  return {
    jobId,
    status: job.status,
    progress: statusMap[job.status as keyof typeof statusMap] || 0,
    startTime: job.started_at,
    completionTime: job.completed_at,
    resultCount: results?.length || 0,
  };
}
