/**
 * Web Scraping Quick Start Examples
 * Demonstrates how to use Unite-Hub's scraping features
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Example 1: Basic Competitor Analysis
 */
export async function analyzeCompetitor(
  workspaceId: string,
  competitorUrl: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `/api/scraping/analyze?workspaceId=${workspaceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        url: competitorUrl,
        analysisType: 'competitor',
        saveToDatabase: true,
      }),
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  console.log('✅ Analysis complete!');
  console.log('📊 SEO Score:', result.data.seo_analysis);
  console.log('💰 Pricing:', result.data.pricing_info);
  console.log('🛠️ Technologies:', result.data.technologies);
  console.log('💡 Insights:', result.data.insights);

  return result.data;
}

/**
 * Example 2: SEO-Only Analysis
 */
export async function analyzeSEO(
  workspaceId: string,
  url: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `/api/scraping/analyze?workspaceId=${workspaceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        url,
        analysisType: 'seo',
        saveToDatabase: false,
      }),
    }
  );

  const result = await response.json();

  return result.data;
}

/**
 * Example 3: Monitor Competitor for Changes
 */
export async function monitorCompetitor(
  workspaceId: string,
  competitorUrl: string,
  competitorId?: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `/api/scraping/monitor?workspaceId=${workspaceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        url: competitorUrl,
        competitorId,
      }),
    }
  );

  const result = await response.json();

  if (result.changes_detected) {
    console.log('🔔 Changes detected!');
    result.changes.forEach((change: any) => {
      console.log(`  ${change.field}: ${change.old} → ${change.new}`);
    });
  } else {
    console.log('✅ No changes detected');
  }

  return result;
}

/**
 * Example 4: Get Analysis History
 */
export async function getAnalysisHistory(
  workspaceId: string,
  url?: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  let query = supabase
    .from('competitor_analysis')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (url) {
    query = query.eq('url', url);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Example 5: Schedule Recurring Analysis
 */
export async function scheduleCompetitorMonitoring(
  workspaceId: string,
  url: string,
  frequency: 'daily' | 'weekly' | 'monthly'
) {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert({
      workspace_id: workspaceId,
      url,
      analysis_type: 'competitor',
      frequency,
      next_run_at: calculateNextRun(frequency),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`✅ Scheduled ${frequency} monitoring for ${url}`);

  return data;
}

/**
 * Example 6: Compare Multiple Competitors
 */
export async function compareCompetitors(
  workspaceId: string,
  competitorUrls: string[]
) {
  const { data: { session } } = await supabase.auth.getSession();

  // Analyze all competitors
  const results = await Promise.all(
    competitorUrls.map(async (url) => {
      const response = await fetch(
        `/api/scraping/analyze?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            url,
            analysisType: 'competitor',
            saveToDatabase: true,
          }),
        }
      );

      return response.json();
    })
  );

  // Compare results
  const comparison = {
    competitors: results.map((r) => ({
      url: r.data.url,
      seo_score: calculateSEOScore(r.data.seo_analysis),
      has_pricing: r.data.pricing_info?.has_pricing_page,
      technologies: r.data.technologies,
      strengths: r.data.insights?.strengths || [],
      weaknesses: r.data.insights?.weaknesses || [],
    })),
  };

  return comparison;
}

/**
 * Example 7: Extract Pricing from Competitor
 */
export async function extractCompetitorPricing(
  workspaceId: string,
  competitorUrl: string
) {
  const analysis = await analyzeCompetitor(workspaceId, competitorUrl);

  const pricing = {
    has_pricing_page: analysis.pricing_info?.has_pricing_page,
    pricing_url: analysis.pricing_info?.pricing_url,
    plans: analysis.pricing_info?.detected_plans || [],
  };

  if (pricing.has_pricing_page) {
    console.log('💰 Pricing Information:');
    pricing.plans.forEach((plan: any) => {
      console.log(`  ${plan.name}: ${plan.price || 'N/A'}`);
    });
  } else {
    console.log('⚠️ No pricing page found');
  }

  return pricing;
}

/**
 * Example 8: Technology Stack Detection
 */
export async function detectTechStack(
  workspaceId: string,
  competitorUrl: string
) {
  const analysis = await analyzeCompetitor(workspaceId, competitorUrl);

  const technologies = analysis.technologies || {};

  console.log('🛠️ Technology Stack:');
  console.log('Frontend:', technologies.frontend || []);
  console.log('Analytics:', technologies.analytics || []);
  console.log('Marketing:', technologies.marketing || []);

  return technologies;
}

/**
 * Helper Functions
 */

function calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function calculateSEOScore(seoAnalysis: any): number {
  if (!seoAnalysis) return 0;

  let score = 0;

  // Title optimization (20 points)
  if (seoAnalysis.title?.optimal) score += 20;

  // Description optimization (20 points)
  if (seoAnalysis.description?.optimal) score += 20;

  // H1 count (10 points)
  if (seoAnalysis.headings?.h1 === 1) score += 10;

  // Structured data (20 points)
  if (seoAnalysis.structured_data?.has_json_ld) score += 10;
  if (seoAnalysis.structured_data?.has_open_graph) score += 10;

  // Content quality (30 points)
  const wordCount = seoAnalysis.content?.word_count || 0;
  if (wordCount > 1500) score += 30;
  else if (wordCount > 1000) score += 20;
  else if (wordCount > 500) score += 10;

  return Math.min(score, 100);
}

/**
 * Usage Example (React Component)
 */

/*
import { useState } from 'react';
import { analyzeCompetitor, monitorCompetitor } from '@/examples/scraping-quickstart';

export function CompetitorAnalysisComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await analyzeCompetitor(
        'workspace-id',
        'https://competitor.com'
      );
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Competitor'}
      </button>

      {result && (
        <div>
          <h3>Analysis Results</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
*/
