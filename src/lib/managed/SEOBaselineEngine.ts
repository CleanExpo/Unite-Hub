/**
 * SEO Baseline Engine
 *
 * Performs initial SEO analysis using DataForSEO and SEMrush
 * for new managed service projects. Generates baseline report.
 *
 * Integrates with:
 * - DataForSEO API (SERP rankings, keywords, backlinks)
 * - SEMrush (competitor analysis, traffic estimation)
 * - Google Search Console (real search data)
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'SEOBaselineEngine' });

interface BaselineAnalysis {
  domainMetrics: {
    domain: string;
    trafficEstimate: number;
    domainRank: number;
    backlinksCount: number;
    organicKeywords: number;
  };
  topKeywords: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    currentRank?: number;
  }>;
  competitors: Array<{
    domain: string;
    traffic: number;
    commonKeywords: number;
  }>;
  technicalIssues: string[];
  opportunities: string[];
  timestamp: string;
}

/**
 * Fetch domain metrics from DataForSEO
 */
async function fetchDomainMetrics(domain: string): Promise<any> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) {
    logger.warn('⚠️ DataForSEO API key not configured');
    return null;
  }

  try {
    // DataForSEO domain metrics endpoint
    const response = await fetch('https://api.dataforseo.com/v3/domain_analytics/overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        data: [
          {
            domain,
            country_code: 'US',
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.warn('⚠️ DataForSEO domain metrics failed', { status: response.status });
      return null;
    }

    const data = await response.json();
    return data.tasks?.[0]?.result?.[0] || null;

  } catch (error) {
    logger.error('❌ Error fetching domain metrics', { error });
    return null;
  }
}

/**
 * Fetch top keywords from DataForSEO
 */
async function fetchTopKeywords(domain: string, limit: number = 20): Promise<any[]> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.dataforseo.com/v3/domain_analytics/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        data: [
          {
            domain,
            country_code: 'US',
            limit,
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.tasks?.[0]?.result?.[0]?.keywords || [];

  } catch (error) {
    logger.error('❌ Error fetching keywords', { error });
    return [];
  }
}

/**
 * Fetch competitor data from DataForSEO
 */
async function fetchCompetitors(domain: string, limit: number = 5): Promise<any[]> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.dataforseo.com/v3/domain_analytics/competitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        data: [
          {
            domain,
            country_code: 'US',
            limit,
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.tasks?.[0]?.result?.[0]?.competitors || [];

  } catch (error) {
    logger.error('❌ Error fetching competitors', { error });
    return [];
  }
}

/**
 * Perform technical SEO audit
 */
async function performTechnicalAudit(website: string): Promise<string[]> {
  const issues: string[] = [];

  try {
    // Fetch page to check for basic issues
    const response = await fetch(website, { timeout: 5000 });
    const html = await response.text();

    // Check for title tag
    if (!html.includes('<title>') || html.match(/<title>\s*<\/title>/)) {
      issues.push('Missing or empty page title');
    }

    // Check for meta description
    if (!html.includes('meta name="description"')) {
      issues.push('Missing meta description');
    }

    // Check for h1 tag
    if (!html.includes('<h1')) {
      issues.push('Missing H1 tag');
    }

    // Check for mobile viewport
    if (!html.includes('viewport')) {
      issues.push('No mobile viewport meta tag');
    }

  } catch (error) {
    logger.warn('⚠️ Could not perform full technical audit', { error });
  }

  return issues;
}

/**
 * Generate improvement opportunities
 */
function generateOpportunities(topKeywords: any[], competitors: any[]): string[] {
  const opportunities: string[] = [];

  // Low-hanging fruit: Low difficulty keywords with decent volume
  const lowDiffKeywords = topKeywords.filter(k => k.difficulty < 30 && k.search_volume > 100);
  if (lowDiffKeywords.length > 0) {
    opportunities.push(`${lowDiffKeywords.length} low-difficulty keywords with good search volume`);
  }

  // Competitor analysis
  if (competitors.length > 0) {
    const avgCompetitorTraffic = competitors.reduce((sum, c) => sum + (c.organic_traffic || 0), 0) / competitors.length;
    opportunities.push(`Opportunity to gain traffic from ${Math.round(avgCompetitorTraffic)} avg competitor traffic`);
  }

  // Content gaps
  opportunities.push('Conduct competitor content gap analysis to identify missing topics');
  opportunities.push('Create comprehensive guides for top 10 keywords');

  return opportunities;
}

/**
 * Run SEO baseline analysis for new project
 */
export async function runSEOBaseline(
  projectId: string,
  website: string
): Promise<BaselineAnalysis | null> {
  try {
    logger.info('🔍 Starting SEO baseline analysis', { projectId, website });

    // Fetch all data in parallel
    const [domainMetrics, topKeywords, competitors, technicalIssues] = await Promise.all([
      fetchDomainMetrics(website),
      fetchTopKeywords(website),
      fetchCompetitors(website),
      performTechnicalAudit(website),
    ]);

    const opportunities = generateOpportunities(topKeywords, competitors);

    const analysis: BaselineAnalysis = {
      domainMetrics: domainMetrics ? {
        domain: website,
        trafficEstimate: domainMetrics.organic_traffic || 0,
        domainRank: domainMetrics.rank || 0,
        backlinksCount: domainMetrics.backlinks || 0,
        organicKeywords: topKeywords.length,
      } : {
        domain: website,
        trafficEstimate: 0,
        domainRank: 0,
        backlinksCount: 0,
        organicKeywords: topKeywords.length,
      },
      topKeywords: topKeywords.slice(0, 10).map(k => ({
        keyword: k.keyword,
        searchVolume: k.search_volume,
        difficulty: k.difficulty,
        currentRank: k.rank,
      })),
      competitors: competitors.map(c => ({
        domain: c.domain,
        traffic: c.organic_traffic || 0,
        commonKeywords: c.common_keywords || 0,
      })),
      technicalIssues,
      opportunities,
      timestamp: new Date().toISOString(),
    };

    logger.info('✅ SEO baseline analysis complete', {
      projectId,
      trafficEstimate: analysis.domainMetrics.trafficEstimate,
      topKeywordsCount: analysis.topKeywords.length,
    });

    // Store analysis in project metadata
    const supabase = getSupabaseAdmin();
    await supabase
      .from('managed_service_projects')
      .update({
        metadata: {
          seo_baseline: analysis,
          baseline_created_at: new Date().toISOString(),
        },
      })
      .eq('id', projectId);

    return analysis;

  } catch (error) {
    logger.error('❌ SEO baseline analysis failed', { error });
    return null;
  }
}

/**
 * Create baseline report task result
 */
export async function saveBaselineReport(
  projectId: string,
  analysis: BaselineAnalysis
) {
  const supabase = getSupabaseAdmin();

  try {
    // Create report
    const { error } = await supabase
      .from('managed_service_reports')
      .insert({
        project_id: projectId,
        report_number: 0,  // 0 = baseline
        report_type: 'milestone',
        period_start_date: new Date().toISOString().split('T')[0],
        period_end_date: new Date().toISOString().split('T')[0],
        executive_summary: `SEO Baseline Analysis - Current organic traffic: ${analysis.domainMetrics.trafficEstimate} monthly visits`,
        highlights: [
          `${analysis.topKeywords.length} tracked keywords`,
          `${analysis.competitors.length} main competitors identified`,
          `${analysis.technicalIssues.length} technical issues found`,
        ],
        kpi_tracking: [
          {
            metricName: 'Organic Traffic',
            value: analysis.domainMetrics.trafficEstimate,
            targetValue: analysis.domainMetrics.trafficEstimate * 1.5,  // 50% growth target
            trend: 'baseline',
          },
          {
            metricName: 'Ranked Keywords',
            value: analysis.topKeywords.length,
            targetValue: analysis.topKeywords.length * 2,  // Double keywords
            trend: 'baseline',
          },
        ],
        recommendations: analysis.opportunities,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('❌ Failed to save baseline report', { error });
      return null;
    }

    logger.info('✅ Baseline report saved', { projectId });
    return true;

  } catch (error) {
    logger.error('❌ Error saving baseline report', { error });
    return null;
  }
}
