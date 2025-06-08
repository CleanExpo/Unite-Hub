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

    // Generate the sitemap
    const sitemap = await generator.generateSitemap();

    // Return XML response
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}
