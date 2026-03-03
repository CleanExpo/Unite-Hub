/**
 * Content Optimization API Route (Stub)
 * GET /api/seo-enhancement/content?url=https://example.com&keyword=seo+tools
 * POST - Create content analysis (returns stub data)
 */

import { NextRequest, NextResponse } from 'next/server';

interface ContentAnalysisResult {
  id: string;
  url: string;
  target_keyword: string;
  status: string;
  overall_content_score: number;
  keyword_optimization_score: number;
  readability_score: number;
  search_intent_score: number;
  completeness_score: number;
  keyword_density: number;
  keyword_in_title: boolean;
  keyword_in_h1: boolean;
  keyword_in_meta: boolean;
  keyword_in_url: boolean;
  keyword_occurrences: number;
  word_count: number;
  heading_structure: { tag: string; text: string; has_keyword: boolean }[];
  paragraph_count: number;
  avg_paragraph_length: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  avg_sentence_length: number;
  detected_intent: string;
  recommendations: {
    id: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    current_value: string;
    suggested_value: string;
  }[];
  created_at: string;
}

function generateStubContent(url: string, keyword: string): ContentAnalysisResult {
  return {
    id: 'content_' + Date.now().toString(36),
    url,
    target_keyword: keyword,
    status: 'completed',
    overall_content_score: 68,
    keyword_optimization_score: 72,
    readability_score: 65,
    search_intent_score: 78,
    completeness_score: 60,
    keyword_density: 1.8,
    keyword_in_title: true,
    keyword_in_h1: true,
    keyword_in_meta: false,
    keyword_in_url: false,
    keyword_occurrences: 14,
    word_count: 1240,
    heading_structure: [
      { tag: 'h1', text: `Guide to ${keyword}`, has_keyword: true },
      { tag: 'h2', text: `Why ${keyword} matters`, has_keyword: true },
      { tag: 'h2', text: 'Best practices', has_keyword: false },
      { tag: 'h3', text: 'Getting started', has_keyword: false },
      { tag: 'h2', text: 'Conclusion', has_keyword: false },
    ],
    paragraph_count: 18,
    avg_paragraph_length: 68,
    flesch_reading_ease: 58.2,
    flesch_kincaid_grade: 9.4,
    avg_sentence_length: 16.3,
    detected_intent: 'informational',
    recommendations: [
      {
        id: 'rec_001',
        category: 'keyword',
        priority: 'high',
        title: 'Add keyword to meta description',
        description: `The target keyword "${keyword}" is missing from the meta description.`,
        current_value: 'Generic description without keyword',
        suggested_value: `Discover the best ${keyword} strategies and tips for 2026.`,
      },
      {
        id: 'rec_002',
        category: 'content_length',
        priority: 'medium',
        title: 'Increase content length',
        description: 'Top-ranking pages average 1,800+ words. Current page is 1,240 words.',
        current_value: '1,240 words',
        suggested_value: '1,800+ words',
      },
      {
        id: 'rec_003',
        category: 'readability',
        priority: 'low',
        title: 'Simplify sentence structure',
        description: 'Some paragraphs have long, complex sentences. Aim for shorter sentences.',
        current_value: 'Avg 16.3 words/sentence',
        suggested_value: 'Avg 12-15 words/sentence',
      },
    ],
    created_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const keyword = searchParams.get('keyword');

    if (!url) {
      return NextResponse.json(
        { error: 'url query parameter is required. Usage: /api/seo-enhancement/content?url=https://example.com&keyword=seo+tools' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Provide a full URL including protocol.' },
        { status: 400 }
      );
    }

    const result = generateStubContent(url, keyword || 'seo optimization');

    return NextResponse.json({
      success: true,
      data: result,
      _stub: true,
      _message: 'This is placeholder data. Connect DataForSEO credentials for live content analysis.',
    });
  } catch (error) {
    console.error('[API] Content Optimization GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, targetKeyword } = body;

    if (!url || !targetKeyword) {
      return NextResponse.json(
        { error: 'url and targetKeyword are required in request body' },
        { status: 400 }
      );
    }

    const result = generateStubContent(url, targetKeyword);

    return NextResponse.json({
      success: true,
      data: { job: result },
      _stub: true,
      _message: 'Content analysis created (stub). Connect DataForSEO credentials for live processing.',
    });
  } catch (error) {
    console.error('[API] Content Optimization POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
