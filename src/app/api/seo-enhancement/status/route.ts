/**
 * SEO Intelligence Platform — Status Endpoint
 * GET /api/seo-enhancement/status
 *
 * Returns the operational status of all SEO Intelligence Platform endpoints.
 * UNI-812 — Activate SEO Intelligence Platform API endpoints.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    endpoints: {
      audit: '/api/seo-enhancement/audit',
      competitors: '/api/seo-enhancement/competitors',
      content: '/api/seo-enhancement/content',
      schema: '/api/seo-enhancement/schema',
      ctr: '/api/seo-enhancement/ctr',
    },
    status: 'operational',
    version: '1.0.0',
    description: 'Unite-Group SEO Intelligence Platform — forensic site audit, competitor gap analysis, content optimisation, schema markup generation, and CTR improvement.',
    _note: 'All endpoints return structured stub data. Connect DataForSEO and Google Search Console credentials for live analysis.',
  });
}
