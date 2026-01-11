/**
 * Health Check Orchestrator
 * Coordinates comprehensive website health analysis
 *
 * Pipeline:
 * 1. Create job record (status: queued)
 * 2. Parallel execution of 5 modules
 * 3. Aggregate results and score
 * 4. Generate recommendations
 * 5. Store results and update job status
 */

import { getSupabaseServer } from '@/lib/supabase';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import Anthropic from '@anthropic-ai/sdk';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { analyzeEEAT as analyzeEEATImpl } from '@/lib/health-check/eeat-analyzer';
import { analyzeTechnical as analyzeTechnicalImpl } from '@/lib/health-check/technical-auditor';
import { analyzeCompetitors as analyzeCompetitorsImpl } from '@/lib/health-check/competitor-discovery';
import { analyzeRevenueImpact as analyzeRevenueImpactImpl } from '@/lib/health-check/revenue-impact-modeler';

// Analysis module interfaces
export interface EEATAnalysis {
  expertiseScore: number; // 0-100
  authorityScore: number; // 0-100
  trustworthinessScore: number; // 0-100
  signals: {
    expertise: string[];
    authority: string[];
    trustworthiness: string[];
  };
}

export interface TechnicalAnalysis {
  technicalSeoScore: number; // 0-100
  coreWebVitalsScore: number; // 0-100
  securityScore: number; // 0-100
  mobileFriendlyScore: number; // 0-100
  cwv: {
    lcpMs: number;
    fcpMs: number;
    clsScore: number;
    inpMs: number;
    ttfbMs: number;
  };
  issues: {
    critical: TechnicalIssue[];
    high: TechnicalIssue[];
    medium: TechnicalIssue[];
    low: TechnicalIssue[];
  };
  security: {
    hasHttps: boolean;
    mixedContentCount: number;
    securityHeaders: Record<string, boolean>;
  };
}

export interface CompetitorAnalysis {
  competitors: CompetitorData[];
  gaps: OpportunityGap[];
  recommendations: string[];
}

export interface RevenueImpact {
  currentMonthlyTraffic: number;
  predictedMonthlyTraffic: number;
  trafficImprovement: number; // Percentage improvement potential
  currentEstimatedRevenue: number;
  predictedEstimatedRevenue: number;
  revenueGain: number; // Absolute dollar amount
}

export interface HealthCheckAnalysis {
  overallScore: number; // 0-100
  scoreLevel: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  eeat: EEATAnalysis;
  technical: TechnicalAnalysis;
  competitors: CompetitorAnalysis;
  revenueImpact: RevenueImpact;
  actionableInsights: Recommendation[];
  rawData: {
    crawlData?: unknown;
    performanceData?: unknown;
  };
}

export interface TechnicalIssue {
  id: string;
  title: string;
  description: string;
  affectedUrl?: string;
  affectedCount?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  estimatedImpact: string;
}

export interface CompetitorData {
  domain: string;
  healthScore: number;
  position: number; // SERP position
  authority: number;
  estimatedTraffic: number;
  gaps: string[];
}

export interface OpportunityGap {
  category: string;
  gap: string;
  impact: 'high' | 'medium' | 'low';
  effortToClose: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedTimeToImplement: string; // e.g., "1-2 hours"
  estimatedImpactScoreIncrease: number; // 0-100 scale
}

export async function executeHealthCheck(
  url: string,
  workspaceId: string,
  includeCompetitors: boolean = true,
  analyzeThreats: boolean = true
): Promise<{ jobId: string; status: string }> {
  const supabase = getSupabaseServer();

  // 1. Validate URL
  const parsedUrl = parseURL(url);
  if (!parsedUrl) {
    throw new Error('Invalid URL provided');
  }

  // 2. Create job record
  const { data: job, error: jobError } = await supabase
    .from('health_check_jobs')
    .insert({
      workspace_id: workspaceId,
      url: parsedUrl.href,
      domain: parsedUrl.hostname,
      status: 'pending',
      include_competitors: includeCompetitors,
      analyze_threats: analyzeThreats,
    })
    .select()
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to create job: ${jobError?.message}`);
  }

  // 3. Start background analysis (non-blocking)
  analyzeInBackground(job.id, url, workspaceId, includeCompetitors, analyzeThreats);

  return {
    jobId: job.id,
    status: 'pending',
  };
}

async function analyzeInBackground(
  jobId: string,
  url: string,
  workspaceId: string,
  includeCompetitors: boolean,
  analyzeThreats: boolean
): Promise<void> {
  const supabase = getSupabaseServer();
  const startTime = Date.now();

  try {
    // Update status to running
    await supabase
      .from('health_check_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId);

    // Execute analysis modules in parallel
    const [eeatResult, technicalResult, competitorResult, revenueResult] =
      await Promise.all([
        analyzeEEAT(url),
        analyzeTechnical(url),
        includeCompetitors ? analyzeCompetitors(url, jobId, workspaceId) : Promise.resolve(null),
        analyzeRevenueImpact(url),
      ]);

    // Aggregate scores
    const scores = [
      eeatResult?.expertiseScore ?? 0,
      eeatResult?.authorityScore ?? 0,
      eeatResult?.trustworthinessScore ?? 0,
      technicalResult?.technicalSeoScore ?? 0,
      technicalResult?.coreWebVitalsScore ?? 0,
      technicalResult?.securityScore ?? 0,
      technicalResult?.mobileFriendlyScore ?? 0,
    ];

    const overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
    const scoreLevel = getScoreLevel(overallScore);

    // Generate recommendations
    const recommendations = generateRecommendations(
      eeatResult || ({} as EEATAnalysis),
      technicalResult || ({} as TechnicalAnalysis),
      competitorResult || ({} as CompetitorAnalysis)
    );

    // Store results
    await supabase.from('health_check_results').insert({
      workspace_id: workspaceId,
      job_id: jobId,
      overall_score: overallScore,
      score_level: scoreLevel,

      // E.E.A.T.
      eeat_expertise_score: eeatResult?.expertiseScore,
      eeat_authority_score: eeatResult?.authorityScore,
      eeat_trustworthiness_score: eeatResult?.trustworthinessScore,

      // Technical
      technical_seo_score: technicalResult?.technicalSeoScore,
      core_web_vitals_score: technicalResult?.coreWebVitalsScore,
      security_score: technicalResult?.securityScore,
      mobile_friendly_score: technicalResult?.mobileFriendlyScore,

      // CWV metrics
      lcp_ms: technicalResult?.cwv?.lcpMs,
      fcp_ms: technicalResult?.cwv?.fcpMs,
      cls_score: technicalResult?.cwv?.clsScore,
      inp_ms: technicalResult?.cwv?.inpMs,
      ttfb_ms: technicalResult?.cwv?.ttfbMs,

      // Issues
      critical_issues_count: technicalResult?.issues?.critical?.length ?? 0,
      high_issues_count: technicalResult?.issues?.high?.length ?? 0,
      medium_issues_count: technicalResult?.issues?.medium?.length ?? 0,
      low_issues_count: technicalResult?.issues?.low?.length ?? 0,
      critical_issues: technicalResult?.issues?.critical ?? [],
      high_issues: technicalResult?.issues?.high ?? [],
      medium_issues: technicalResult?.issues?.medium ?? [],
      low_issues: technicalResult?.issues?.low ?? [],

      // Security
      has_https: technicalResult?.security?.hasHttps,
      mixed_content_count: technicalResult?.security?.mixedContentCount,
      security_headers: technicalResult?.security?.securityHeaders,

      // Mobile
      is_mobile_friendly: technicalResult?.mobileFriendlyScore ?? 0 > 70,

      // Schema
      schema_types_found: [],
      schema_errors: [],
    });

    // Update job status
    const duration = Date.now() - startTime;
    await supabase
      .from('health_check_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      .eq('id', jobId);
  } catch (error) {
    console.error(`Health check failed for job ${jobId}:`, error);

    // Update job with error
    await supabase
      .from('health_check_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'ANALYSIS_FAILED',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', jobId);
  }
}

// Module implementations (stubs - will be implemented in separate files)

async function analyzeEEAT(url: string): Promise<EEATAnalysis> {
  // Real implementation - 70% reuse from seoLeakAgent
  return await analyzeEEATImpl(url);
}

async function analyzeTechnical(url: string): Promise<TechnicalAnalysis> {
  // Real implementation - 90% reuse from seoAuditService
  return await analyzeTechnicalImpl(url);
}

async function analyzeCompetitors(
  url: string,
  jobId: string,
  workspaceId: string
): Promise<CompetitorAnalysis> {
  // Real implementation - NEW - DataForSEO API integration
  return await analyzeCompetitorsImpl(url, jobId, workspaceId);
}

async function analyzeRevenueImpact(url: string): Promise<RevenueImpact> {
  // Real implementation - NEW - ranking → traffic → revenue model
  return await analyzeRevenueImpactImpl(url);
}

function generateRecommendations(
  eeat: EEATAnalysis,
  technical: TechnicalAnalysis,
  competitors: CompetitorAnalysis
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // E.E.A.T. recommendations
  if (eeat.expertiseScore < 70) {
    recommendations.push({
      priority: 'high',
      category: 'E.E.A.T.',
      title: 'Improve Author Credentials',
      description: 'Add author bio and credentials to content',
      actionItems: [
        'Create author bio section on key articles',
        'Link to author social profiles',
        'Add author expertise badges',
      ],
      estimatedTimeToImplement: '2-4 hours',
      estimatedImpactScoreIncrease: 8,
    });
  }

  // Technical recommendations
  if (technical.coreWebVitalsScore < 70) {
    recommendations.push({
      priority: 'critical',
      category: 'Technical SEO',
      title: 'Improve Core Web Vitals',
      description: 'LCP above threshold needs optimization',
      actionItems: ['Optimize images', 'Implement lazy loading', 'Minimize JavaScript'],
      estimatedTimeToImplement: '1-3 days',
      estimatedImpactScoreIncrease: 12,
    });
  }

  return recommendations;
}

function getScoreLevel(
  score: number
): 'critical' | 'poor' | 'fair' | 'good' | 'excellent' {
  if (score < 20) return 'critical';
  if (score < 40) return 'poor';
  if (score < 60) return 'fair';
  if (score < 80) return 'good';
  return 'excellent';
}

function parseURL(urlString: string): URL | null {
  try {
    if (!urlString.startsWith('http')) {
      urlString = 'https://' + urlString;
    }
    return new URL(urlString);
  } catch {
    return null;
  }
}

export async function getHealthCheckJob(jobId: string, workspaceId: string) {
  const supabase = getSupabaseServer();

  const { data: job, error: jobError } = await supabase
    .from('health_check_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('workspace_id', workspaceId)
    .single();

  if (jobError) {
    throw new Error(`Job not found: ${jobError.message}`);
  }

  // If completed, also fetch results
  if (job.status === 'completed') {
    const { data: results } = await supabase
      .from('health_check_results')
      .select('*')
      .eq('job_id', jobId)
      .single();

    return { ...job, results };
  }

  return job;
}
