// Simple crawler using Node.js built-in modules
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

function crawlSite(baseURL) {
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
    const fullUrl = url.resolve(baseURL, page);
    https.get(fullUrl, (res) => {
      const content = [];
      res.on('data', (chunk) => content.push(chunk));
      res.on('end', () => {
        results.pages.push({
          url: fullUrl,
          status: res.statusCode,
          title: page,
          content: 'Content truncated for display purposes',
          timestamp: new Date().toISOString()
        });
        results.summary.totalPages++;
        console.log(`Crawled ${fullUrl} - Status: ${res.statusCode}`);
      });
    }).on('error', (err) => {
      console.error(`Failed to crawl ${fullUrl}:`, err.message);
    });
  }

  console.log('Crawler complete. Results can be found in the console.');
}

// Set the base URL for the crawler
const crawlerBaseURL = process.env.CRAWLER_BASE_URL || 'http://localhost:3000';

// Start the crawler
crawlSite(crawlerBaseURL);
