import { NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/utils/sitemap-generator';

export async function GET(request: Request) {
  try {
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Create sitemap generator
    const generator = new SitemapGenerator({
      baseUrl,
      excludePatterns: [
        '/dashboard/*',
        '/admin/*',
        '/api/*',
        '/:path*'
      ]
    });

    // Generate the visual sitemap
    const visualSitemap = await generator.generateVisualSitemap();

    // Return JSON response
    return NextResponse.json(visualSitemap);
  } catch (error) {
    console.error('Visual sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate visual sitemap' },
      { status: 500 }
    );
  }
}
