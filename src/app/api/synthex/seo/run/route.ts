/**
 * POST /api/synthex/seo/run
 *
 * Run an SEO analysis using Claude Sonnet and persist the report.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   brandId?: string
 *   targetUrl: string (required)
 *   keywords?: string[]
 *   competitors?: string[]
 * }
 *
 * Response:
 * {
 *   status: 'ok',
 *   report: SeoReport
 * }
 *
 * Phase: B2 - Synthex SEO Reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getAnthropicClient,
  recordAnthropicSuccess,
  recordAnthropicFailure,
} from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';
import { createSeoReport, type SeoIssue, type SeoRecommendation } from '@/lib/synthex/seoService';

const AGENT_VERSION = 'sonnet-4.5-seo-v1';

// ============================================================================
// SEO Analysis Prompt
// ============================================================================

function buildSeoPrompt(targetUrl: string, keywords: string[], competitors: string[]): string {
  const keywordSection = keywords.length > 0
    ? `\nTarget Keywords: ${keywords.join(', ')}`
    : '';

  const competitorSection = competitors.length > 0
    ? `\nCompetitor URLs to compare against: ${competitors.join(', ')}`
    : '';

  return `You are an expert SEO analyst. Analyze the following website and provide a comprehensive SEO report.

Target URL: ${targetUrl}${keywordSection}${competitorSection}

Analyze the website's SEO health and provide your response as a VALID JSON object with this EXACT structure:

{
  "score": <number 0-100>,
  "issues": [
    {
      "category": "<string: 'technical' | 'content' | 'links' | 'performance' | 'mobile'>",
      "description": "<string: clear description of the issue>",
      "severity": "<string: 'critical' | 'warning' | 'info'>",
      "impact": "<string: explanation of business impact>"
    }
  ],
  "recommendations": [
    {
      "action": "<string: specific actionable recommendation>",
      "impact": "<string: 'high' | 'medium' | 'low'>",
      "priority": <number 1-10>,
      "effort": "<string: 'quick' | 'moderate' | 'significant'>"
    }
  ],
  "summary": "<string: 2-3 sentence executive summary>"
}

Important:
- Return ONLY valid JSON, no markdown, no explanation text
- Score should reflect overall SEO health (0=poor, 100=excellent)
- List 3-8 issues, prioritized by severity
- List 3-8 recommendations, prioritized by impact
- Be specific and actionable in recommendations
- Consider technical SEO, content quality, backlinks, mobile-friendliness, and page speed`;
}

// ============================================================================
// Parse Claude Response
// ============================================================================

interface ParsedSeoResponse {
  score: number;
  issues: SeoIssue[];
  recommendations: SeoRecommendation[];
  summary?: string;
}

function parseSeoResponse(rawOutput: string): ParsedSeoResponse {
  // Try to extract JSON from the response
  let jsonStr = rawOutput.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize
    const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 50;

    const issues: SeoIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues.map((issue: Record<string, unknown>) => ({
          category: String(issue.category || 'technical'),
          description: String(issue.description || 'Unknown issue'),
          severity: ['critical', 'warning', 'info'].includes(String(issue.severity))
            ? (String(issue.severity) as SeoIssue['severity'])
            : 'warning',
          impact: issue.impact ? String(issue.impact) : undefined,
        }))
      : [];

    const recommendations: SeoRecommendation[] = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map((rec: Record<string, unknown>) => ({
          action: String(rec.action || 'Review SEO best practices'),
          impact: ['high', 'medium', 'low'].includes(String(rec.impact))
            ? (String(rec.impact) as SeoRecommendation['impact'])
            : 'medium',
          priority: typeof rec.priority === 'number' ? rec.priority : 5,
          effort: ['quick', 'moderate', 'significant'].includes(String(rec.effort))
            ? (String(rec.effort) as SeoRecommendation['effort'])
            : undefined,
        }))
      : [];

    return {
      score,
      issues,
      recommendations,
      summary: parsed.summary ? String(parsed.summary) : undefined,
    };
  } catch (parseError) {
    console.error('[seo/run] Failed to parse Claude response as JSON:', parseError);
    throw new Error('Failed to parse SEO analysis response');
  }
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, targetUrl, keywords = [], competitors = [] } = body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tenantId' },
        { status: 400 }
      );
    }

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid targetUrl' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid targetUrl format. Must be a valid URL.' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Ensure user owns this tenant
    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    // Validate brandId if provided
    if (brandId) {
      const { data: brand, error: brandError } = await supabaseAdmin
        .from('synthex_brands')
        .select('id')
        .eq('id', brandId)
        .eq('tenant_id', tenantId)
        .single();

      if (brandError || !brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }
    }

    // Build prompt
    const keywordsArray = Array.isArray(keywords) ? keywords : [];
    const competitorsArray = Array.isArray(competitors) ? competitors : [];
    const prompt = buildSeoPrompt(targetUrl, keywordsArray, competitorsArray);

    // Call Claude Sonnet
    let rawOutput: string;
    try {
      const anthropic = getAnthropicClient();

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODELS.SONNET_4_5,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      recordAnthropicSuccess();

      // Extract text response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      rawOutput = textContent.text;
    } catch (apiError) {
      recordAnthropicFailure(apiError);
      console.error('[seo/run] Claude API error:', apiError);
      return NextResponse.json(
        { error: 'SEO analysis failed: AI service unavailable' },
        { status: 500 }
      );
    }

    // Parse response
    let parsedResponse: ParsedSeoResponse;
    try {
      parsedResponse = parseSeoResponse(rawOutput);
    } catch (parseError) {
      console.error('[seo/run] Parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse SEO analysis results' },
        { status: 500 }
      );
    }

    // Save report to database
    const durationMs = Date.now() - startTime;
    const report = await createSeoReport({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      targetUrl,
      keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
      competitors: competitorsArray.length > 0 ? competitorsArray : undefined,
      score: parsedResponse.score,
      issues: parsedResponse.issues,
      recommendations: parsedResponse.recommendations,
      rawOutput,
      agentVersion: AGENT_VERSION,
      meta: {
        scanType: 'full',
        duration_ms: durationMs,
        summary: parsedResponse.summary,
      },
    });

    return NextResponse.json(
      {
        status: 'ok',
        report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[seo/run] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
