/**
 * SEO Audit API Route (Stub)
 * GET /api/seo-enhancement/audit?url=https://example.com
 * POST - Create new audit job (returns stub data)
 */

import { NextRequest, NextResponse } from 'next/server';

interface SEOAuditResult {
  id: string;
  url: string;
  domain: string;
  audit_type: string;
  status: string;
  overall_score: number;
  core_web_vitals: {
    lcp_ms: number;
    fid_ms: number;
    cls_score: number;
    ttfb_ms: number;
    fcp_ms: number;
  };
  issues: {
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'opportunity' | 'passed';
    title: string;
    description: string;
    affected_urls: string[];
    fix_recommendation: string;
  }[];
  summary: {
    critical: number;
    warnings: number;
    opportunities: number;
    passed: number;
    total_pages_crawled: number;
  };
  created_at: string;
  completed_at: string;
}

function generateStubAudit(url: string): SEOAuditResult {
  const domain = new URL(url).hostname;
  return {
    id: 'audit_' + Date.now().toString(36),
    url,
    domain,
    audit_type: 'full',
    status: 'completed',
    overall_score: 72,
    core_web_vitals: {
      lcp_ms: 2340,
      fid_ms: 85,
      cls_score: 0.12,
      ttfb_ms: 620,
      fcp_ms: 1480,
    },
    issues: [
      {
        id: 'iss_001',
        type: 'meta_description',
        severity: 'warning',
        title: 'Missing meta descriptions on 3 pages',
        description: 'Some pages lack meta descriptions which can reduce click-through rates in search results.',
        affected_urls: [`${url}/about`, `${url}/services`, `${url}/contact`],
        fix_recommendation: 'Add unique, descriptive meta descriptions (120-160 chars) to each page.',
      },
      {
        id: 'iss_002',
        type: 'image_alt',
        severity: 'warning',
        title: '12 images missing alt text',
        description: 'Images without alt text reduce accessibility and miss keyword opportunities.',
        affected_urls: [`${url}/gallery`],
        fix_recommendation: 'Add descriptive alt text to all images, incorporating target keywords where natural.',
      },
      {
        id: 'iss_003',
        type: 'performance',
        severity: 'critical',
        title: 'LCP exceeds 2.5s threshold',
        description: 'Largest Contentful Paint at 2340ms is near the "needs improvement" threshold.',
        affected_urls: [url],
        fix_recommendation: 'Optimize hero images, implement lazy loading, and consider a CDN.',
      },
      {
        id: 'iss_004',
        type: 'mobile_usability',
        severity: 'opportunity',
        title: 'Tap targets too close together on mobile',
        description: 'Some interactive elements are spaced less than 8px apart on mobile viewports.',
        affected_urls: [`${url}/nav`],
        fix_recommendation: 'Increase spacing between clickable elements to at least 8px.',
      },
      {
        id: 'iss_005',
        type: 'ssl',
        severity: 'passed',
        title: 'SSL certificate valid',
        description: 'The site uses HTTPS with a valid SSL certificate.',
        affected_urls: [],
        fix_recommendation: 'No action needed.',
      },
    ],
    summary: {
      critical: 1,
      warnings: 2,
      opportunities: 1,
      passed: 1,
      total_pages_crawled: 24,
    },
    created_at: new Date(Date.now() - 300000).toISOString(),
    completed_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const jobId = searchParams.get('jobId');

    if (!url && !jobId) {
      return NextResponse.json(
        { error: 'url or jobId query parameter is required. Usage: /api/seo-enhancement/audit?url=https://example.com' },
        { status: 400 }
      );
    }

    const targetUrl = url || 'https://example.com';

    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Provide a full URL including protocol.' },
        { status: 400 }
      );
    }

    const audit = generateStubAudit(targetUrl);

    return NextResponse.json({
      success: true,
      data: audit,
      _stub: true,
      _message: 'This is placeholder data. Connect DataForSEO credentials for live audits.',
    });
  } catch (error) {
    console.error('[API] SEO Audit GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, auditType } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'url is required in request body' },
        { status: 400 }
      );
    }

    const audit = generateStubAudit(url);
    audit.audit_type = auditType || 'full';
    audit.status = 'pending';
    audit.completed_at = '';

    return NextResponse.json({
      success: true,
      data: { job: audit },
      _stub: true,
      _message: 'Audit job created (stub). Connect DataForSEO credentials for live processing.',
    });
  } catch (error) {
    console.error('[API] SEO Audit POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
