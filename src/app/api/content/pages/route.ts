// src/app/api/content/pages/route.ts
// List available pages from architecture

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // In production, load from site-architecture.json
    // For now, return structure
    const pages = [
      { id: 'synthex-home', url: '/', type: 'landing', title: 'Synthex | Autonomous Marketing' },
      { id: 'trades', url: '/trades', type: 'pillar', title: 'Marketing for Trades' },
      {
        id: 'professional-services',
        url: '/professional-services',
        type: 'pillar',
        title: 'Marketing for Professional Services',
      },
      { id: 'health-wellness', url: '/health', type: 'pillar', title: 'Marketing for Health & Wellness' },
      {
        id: 'hospitality-retail',
        url: '/hospitality',
        type: 'pillar',
        title: 'Marketing for Hospitality & Retail',
      },
    ];

    const filtered = type ? pages.filter((p) => p.type === type) : pages;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      pages: filtered,
    });
  } catch (error) {
     
    console.error('[API] Pages list error:', error);
    return NextResponse.json(
      { error: 'Failed to list pages', details: String(error) },
      { status: 500 }
    );
  }
}
