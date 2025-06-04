const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

async function crawlSite() {
  const baseUrl = process.env.CRAWLER_BASE_URL || 'http://localhost:3000';
  const pages = [
    '/',
    '/login',
    '/dashboard',
    '/dashboard/crm',
    '/dashboard/crm/deals',
    '/dashboard/crm/clients',
    '/dashboard/crm/tasks',
    '/dashboard/crm/communication',
    '/dashboard/analytics',
    '/book-consultation',
    '/features',
    '/pricing',
    '/about',
    '/contact'
  ];

  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      totalPages: 0,
      totalErrors: 0,
      errorsByType: {}
    }
  };

  for (const page of pages) {
    try {
      let response;
      const fullUrl = `${baseUrl}${page}`;
      console.log(`Crawling ${fullUrl}...`);

      if (fullUrl.startsWith('https:')) {
        response = await new Promise((resolve, reject) => {
          https.get(fullUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
          }).on('error', reject);
        });
      } else {
        response = await new Promise((resolve, reject) => {
          http.get(fullUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
          }).on('error', reject);
        });
      }

      // Simple parsing to get title if possible
      const titleMatch = response.match(/<title>([^<]*)<\/title>/);
      const title = titleMatch ? titleMatch[1] : fullUrl;

      results.pages.push({
        url: fullUrl,
        title,
        status: 200,
        loadTime: 0, // Placeholder
        errors: []
      });

      results.summary.totalPages++;
    } catch (error) {
      console.error(`Failed to crawl ${baseUrl}${page}:`, error.message);
      results.summary.totalErrors++;
      results.summary.errorsByType[error.name] = (results.summary.errorsByType[error.name] || 0) + 1;
    }
  }

  // Save results to a file
  const logsDir = path.join(process.cwd(), 'logs');
  await fs.mkdir(logsDir, { recursive: true });
  const date = new Date();
  const filename = `crawler-report-${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}.json`;
  const filepath = path.join(logsDir, filename);
  await fs.writeFile(filepath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filepath}`);
}

crawlSite().catch(console.error);
