// src/app/api/content/estimate/route.ts
// Estimate content generation costs

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Average tokens per section (based on real usage)
    const tokensPerSection: Record<string, number> = {
      hero: 800,
      problem: 1200,
      features: 1500,
      process: 800,
      testimonials: 400,
      results: 600,
      cta: 400,
      faq: 2000,
      industry_intro: 1500,
      service_detail: 3000,
    };

    // Using DeepSeek V3 pricing (default)
    const costPer1kTokens = 0.00069; // Avg of input + output

    // Estimate for full site
    const pageEstimates = {
      landing: {
        count: 1,
        sections: ['hero', 'problem', 'features', 'process', 'testimonials', 'results', 'cta'],
      },
      pillar: {
        count: 7,
        sections: ['hero', 'industry_intro', 'features', 'process', 'testimonials', 'faq', 'cta'],
      },
      subpillar: {
        count: 28,
        sections: ['hero', 'service_detail', 'features', 'faq', 'testimonials', 'cta'],
      },
      service: {
        count: 4,
        sections: ['hero', 'service_detail', 'features', 'process', 'faq', 'cta'],
      },
    };

    let totalTokens = 0;
    const breakdown: Record<string, { pages: number; tokens: number; cost: number }> = {};

    for (const [pageType, config] of Object.entries(pageEstimates)) {
      let pageTokens = 0;
      for (const section of config.sections) {
        pageTokens += tokensPerSection[section] || 1000;
      }
      const typeTokens = pageTokens * config.count;
      totalTokens += typeTokens;

      breakdown[pageType] = {
        pages: config.count,
        tokens: typeTokens,
        cost: (typeTokens / 1000) * costPer1kTokens,
      };
    }

    return NextResponse.json({
      success: true,
      estimate: {
        total_pages: Object.values(pageEstimates).reduce((sum, c) => sum + c.count, 0),
        total_tokens: totalTokens,
        total_cost_usd: (totalTokens / 1000) * costPer1kTokens,
        cost_per_1k_tokens: costPer1kTokens,
        default_model: 'DeepSeek V3',
        breakdown,
      },
    });
  } catch (error) {
     
    console.error('[API] Estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to estimate costs', details: String(error) },
      { status: 500 }
    );
  }
}
