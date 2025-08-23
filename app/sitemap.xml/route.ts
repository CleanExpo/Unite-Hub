import { NextResponse } from 'next/server';

const baseUrl = 'https://unite-group.in';

const staticPages = [
  '',
  '/about-us',
  '/services',
  '/services/business-strategy-consulting',
  '/services/custom-software-development',
  '/services/education-training',
  '/services/initial-consultation',
  '/services/quality-assurance-testing',
  '/services/strategic-seo-services',
  '/case-studies',
  '/contact',
  '/pricing',
  '/innovation-lab',
  '/success-blueprint',
  '/unite-ecosystem',
  '/privacy-policy',
  '/terms-of-service',
  // New pages from Agency repo
  '/agile-marketing',
  '/agile-marketing/certification',
  '/agile-marketing/frameworks',
  '/agile-marketing/team-training',
  '/agile-marketing/transformation',
  '/competitive-analysis',
  '/competitive-analysis/benchmarking',
  '/competitive-analysis/guide',
  '/competitive-analysis/seo-audit',
  '/competitive-analysis/tracker',
  '/consultation',
  '/contractor-business-automation',
  '/contractor-business-automation/customer-communication',
  '/contractor-business-automation/process-optimization',
  '/contractor-business-automation/workflow-automation',
  '/digital-transformation-trades',
  '/digital-transformation-trades/cloud-migration-guide',
  '/digital-transformation-trades/job-management-software',
  '/digital-transformation-trades/mobile-workforce-apps',
  '/growth-hacking',
  '/growth-hacking/calculator',
  '/growth-hacking/case-studies',
  '/growth-hacking/guide',
  '/growth-hacking/tools',
  '/growth-hacking/workshop',
  '/local-seo-contractors',
  '/local-seo-contractors/google-business-profile',
  '/local-seo-contractors/local-link-building',
  '/local-seo-contractors/review-management',
  '/market-research',
  '/market-research/guide',
  '/market-research/industry-reports',
  '/market-research/persona-development',
  '/market-research/surveys',
  '/roadmap',
  '/safety-compliance-software',
  '/safety-compliance-software/digital-swms',
  '/safety-compliance-software/incident-reporting',
  '/safety-compliance-software/training-management',
  '/seo-synthesizer',
  '/showcase',
  '/sitemap',
  '/social-advertising',
  '/social-advertising/facebook-ads',
  '/social-advertising/guide',
  '/social-advertising/linkedin-b2b',
  '/social-advertising/roi-calculator',
  '/team',
  '/testimonials',
  '/trade-business-scaling',
  '/trade-business-scaling/financial-management',
  '/trade-business-scaling/hiring-retention',
  '/trade-business-scaling/systems-processes',
];

function generateSitemapXML(pages: string[]): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urlEntries = pages.map(page => {
    const url = `${baseUrl}${page}`;
    const priority = page === '' ? '1.0' : 
                    page.includes('/services') ? '0.9' : 
                    page.split('/').length === 2 ? '0.8' : '0.7';
    const changefreq = page === '' ? 'daily' : 
                       page.includes('/services') ? 'weekly' : 
                       'monthly';
    
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlEntries}
</urlset>`;
}

export async function GET() {
  const sitemap = generateSitemapXML(staticPages);
  
  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
