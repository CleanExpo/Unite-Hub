# Web Scraping & Competitor Analysis Guide

Complete guide to using Unite-Hub's web scraping and competitor intelligence features.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Features](#features)
4. [Usage](#usage)
5. [API Reference](#api-reference)
6. [CLI Tools](#cli-tools)
7. [Best Practices](#best-practices)
8. [Legal & Ethical Considerations](#legal--ethical-considerations)

---

## Overview

Unite-Hub includes a comprehensive web scraping and competitor analysis system built with:

- **BeautifulSoup 4** - HTML/XML parsing
- **Scrapy** - Advanced web scraping framework
- **Playwright** - JavaScript-rendered content scraping
- **Custom analyzers** - SEO, pricing, feature extraction
- **Change monitoring** - Track competitor website changes over time

### What Can You Do?

✅ **Website Analysis**
- Extract metadata (title, description, keywords)
- Analyze SEO factors (headings, structured data, alt text)
- Detect technologies used
- Extract contact information

✅ **Competitor Intelligence**
- Analyze competitor websites
- Extract pricing information
- Identify product features
- Track social media presence
- Monitor changes over time

✅ **Marketing Research**
- SEO analysis and recommendations
- Content analysis (word count, readability)
- CTA extraction
- Technology stack detection

---

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- beautifulsoup4
- scrapy
- playwright
- selenium
- pandas
- nltk
- advertools
- And many more...

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Run Database Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Run migration
\i supabase/migrations/047_web_scraping_tables.sql
```

This creates tables:
- `competitor_analysis` - Store analysis results
- `competitor_monitoring` - Track changes
- `scraping_jobs` - Schedule recurring jobs

---

## Features

### 1. Basic Web Scraping

Extract basic information from any website:

```python
from src.lib.scraping.web_scraper import WebScraper

scraper = WebScraper(delay=1.0)
result = scraper.scrape_page("https://example.com")

print(result['metadata'])  # Title, description, etc.
print(result['links'])      # All links
print(result['images'])     # All images
print(result['text_content'])  # Clean text
```

### 2. Competitor Analysis

Comprehensive competitor website analysis:

```python
from src.lib.scraping.web_scraper import CompetitorAnalyzer

analyzer = CompetitorAnalyzer()
analysis = analyzer.analyze_website("https://competitor.com")

print(analysis['seo_analysis'])
print(analysis['content_analysis'])
print(analysis['technology_stack'])
print(analysis['social_presence'])
print(analysis['call_to_actions'])
```

### 3. JavaScript Rendering Support

For Single Page Applications (SPAs):

```python
import asyncio
from src.lib.scraping.advanced_scraper import JavaScriptScraper

async def scrape_spa():
    async with JavaScriptScraper() as scraper:
        result = await scraper.scrape_page("https://spa-website.com")
        print(result)

asyncio.run(scrape_spa())
```

### 4. SEO Analysis

Detailed SEO factor analysis:

```python
import asyncio
from src.lib.scraping.advanced_scraper import SEOAnalyzer

async def analyze_seo():
    analyzer = SEOAnalyzer()
    result = await analyzer.analyze_seo("https://example.com")
    print(result)

asyncio.run(analyze_seo())
```

### 5. Full Competitor Intelligence

Complete analysis with insights:

```python
import asyncio
from src.lib.scraping.competitor_intelligence import CompetitorIntelligence

async def full_analysis():
    intelligence = CompetitorIntelligence()
    result = await intelligence.full_analysis("https://competitor.com")

    print(result['basic_analysis'])
    print(result['seo_analysis'])
    print(result['pricing_info'])
    print(result['features'])
    print(result['insights'])  # AI-generated competitive insights

asyncio.run(full_analysis())
```

---

## Usage

### Via API (Recommended for Production)

#### 1. Analyze Competitor Website

**Endpoint:** `POST /api/scraping/analyze`

```typescript
const analyzeCompetitor = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`/api/scraping/analyze?workspaceId=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      url: 'https://competitor.com',
      analysisType: 'competitor',  // 'basic', 'seo', 'full', 'competitor'
      saveToDatabase: true,
    }),
  });

  const result = await response.json();
  console.log(result.data);
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://competitor.com",
    "basic_analysis": { ... },
    "seo_analysis": { ... },
    "pricing_info": { ... },
    "features": [...],
    "technologies": { ... },
    "insights": {
      "strengths": [...],
      "weaknesses": [...],
      "recommendations": [...]
    }
  },
  "analysisType": "competitor",
  "timestamp": "2025-11-19T10:30:00Z"
}
```

#### 2. Monitor Competitor Changes

**Endpoint:** `POST /api/scraping/monitor`

```typescript
const monitorCompetitor = async (url: string, competitorId: string) => {
  const response = await fetch(`/api/scraping/monitor?workspaceId=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      url,
      competitorId,
    }),
  });

  const result = await response.json();

  if (result.changes_detected) {
    console.log('Changes found:', result.changes);
  }
};
```

#### 3. Get Monitoring History

**Endpoint:** `GET /api/scraping/monitor`

```typescript
const getMonitoringHistory = async (competitorId?: string) => {
  const params = new URLSearchParams({
    workspaceId,
    ...(competitorId && { competitorId }),
  });

  const response = await fetch(`/api/scraping/monitor?${params}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  const { data } = await response.json();
  console.log(data);  // Last 50 monitoring results
};
```

### Via CLI

#### Analyze Competitor

```bash
# Full competitor analysis
node scripts/scraping/scrape-competitor.mjs https://competitor.com

# SEO analysis only
node scripts/scraping/scrape-competitor.mjs https://competitor.com --type seo

# Save results to file
node scripts/scraping/scrape-competitor.mjs https://competitor.com --save --output results.json
```

#### Direct Python Usage

```bash
# Basic scraping
python src/lib/scraping/web-scraper.py https://example.com

# SEO analysis
python src/lib/scraping/advanced-scraper.py https://example.com

# Full competitor intelligence
python src/lib/scraping/competitor-intelligence.py https://competitor.com
```

---

## API Reference

### Analysis Types

| Type | Description | Response Time |
|------|-------------|---------------|
| `basic` | Metadata, links, images, text | ~2-5 seconds |
| `seo` | SEO factors, structured data | ~5-10 seconds |
| `full` | Everything + pricing + features | ~15-30 seconds |
| `competitor` | Complete analysis + insights | ~20-40 seconds |

### Data Structure

#### Basic Analysis

```typescript
interface BasicAnalysis {
  url: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    og_title: string;
    og_description: string;
    og_image: string;
    canonical_url: string;
    language: string;
    author: string;
  };
  links: string[];
  internal_links: string[];
  images: Array<{
    src: string;
    alt: string;
    title: string;
  }>;
  text_content: string;
  timestamp: number;
}
```

#### SEO Analysis

```typescript
interface SEOAnalysis {
  url: string;
  title: {
    text: string;
    length: number;
    optimal: boolean;  // 30-60 characters
  };
  description: {
    text: string;
    length: number;
    optimal: boolean;  // 120-160 characters
  };
  headings: {
    h1: number;
    h2: number;
    h3: number;
    // ...
  };
  links: {
    total: number;
    with_text: number;
  };
  structured_data: {
    has_json_ld: boolean;
    has_open_graph: boolean;
  };
  content: {
    word_count: number;
    character_count: number;
  };
}
```

#### Competitive Insights

```typescript
interface CompetitiveInsights {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
}
```

---

## CLI Tools

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "scrape": "node scripts/scraping/scrape-competitor.mjs",
    "scrape:save": "node scripts/scraping/scrape-competitor.mjs --save"
  }
}
```

Usage:

```bash
npm run scrape https://competitor.com
npm run scrape:save https://competitor.com
```

---

## Best Practices

### 1. Respect Rate Limits

```python
# Use appropriate delays between requests
scraper = WebScraper(delay=2.0)  # 2 seconds between requests
```

### 2. Use User Agents

The scraper automatically rotates user agents, but you can customize:

```python
custom_headers = {
    'User-Agent': 'MyBot/1.0 (contact@example.com)'
}

result = scraper.fetch_page(url, custom_headers=custom_headers)
```

### 3. Handle Errors Gracefully

```python
try:
    result = scraper.scrape_page(url)
    if 'error' in result:
        logger.error(f"Scraping failed: {result['error']}")
except Exception as e:
    logger.error(f"Exception: {str(e)}")
```

### 4. Cache Results

```typescript
// Save to database for caching
await fetch('/api/scraping/analyze', {
  body: JSON.stringify({
    url,
    analysisType: 'competitor',
    saveToDatabase: true,  // Enable caching
  }),
});
```

### 5. Monitor Respectfully

```typescript
// Don't monitor too frequently
// Recommended: Daily for most competitors, weekly for others
const frequency = competitor.tier === 'primary' ? 'daily' : 'weekly';
```

---

## Legal & Ethical Considerations

### ✅ DO

- **Check robots.txt** - Respect website scraping policies
- **Use rate limiting** - Don't overwhelm target servers
- **Identify your bot** - Use descriptive user agents
- **Cache results** - Minimize redundant requests
- **Follow ToS** - Respect website terms of service

### ❌ DON'T

- **Scrape personal data** - Avoid GDPR/CCPA violations
- **Ignore robots.txt** - Don't scrape disallowed paths
- **Overload servers** - Use appropriate delays
- **Bypass auth** - Don't scrape authenticated content without permission
- **Resell data** - Respect intellectual property

### robots.txt Checker

```python
from urllib.robotparser import RobotFileParser

def can_scrape(url):
    rp = RobotFileParser()
    rp.set_url(f"{url}/robots.txt")
    rp.read()

    return rp.can_fetch("*", url)

if can_scrape("https://example.com"):
    # Safe to scrape
    pass
else:
    # Scraping disallowed
    pass
```

---

## Scheduled Jobs

### Create Recurring Scraping Job

```typescript
const scheduleCompetitorMonitoring = async (url: string, frequency: 'daily' | 'weekly' | 'monthly') => {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert({
      workspace_id: workspaceId,
      url,
      analysis_type: 'competitor',
      frequency,
      next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    });

  return data;
};
```

### Process Scheduled Jobs (Cron)

```typescript
// Run this as a cron job
const processScrapingJobs = async () => {
  const supabase = await getSupabaseServer();

  const { data: jobs } = await supabase
    .from('scraping_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('next_run_at', new Date().toISOString());

  for (const job of jobs || []) {
    try {
      await fetch('/api/scraping/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: job.url,
          analysisType: job.analysis_type,
          saveToDatabase: true,
        }),
      });

      // Update job status
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          last_run_at: new Date().toISOString(),
          next_run_at: calculateNextRun(job.frequency),
        })
        .eq('id', job.id);

    } catch (error) {
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', job.id);
    }
  }
};
```

---

## Troubleshooting

### Issue: Python not found

**Solution:**
```bash
# Windows
where python

# macOS/Linux
which python3

# Add to PATH if needed
```

### Issue: Playwright browsers not installed

**Solution:**
```bash
playwright install chromium
```

### Issue: SSL Certificate errors

**Solution:**
```python
# Disable SSL verification (use with caution)
import requests
requests.get(url, verify=False)
```

### Issue: Timeout errors

**Solution:**
```python
# Increase timeout
scraper = WebScraper(timeout=60)  # 60 seconds
```

---

## Performance Tips

1. **Use parallel processing** for multiple URLs:

```python
import asyncio

urls = ['url1', 'url2', 'url3']

async def scrape_all():
    async with JavaScriptScraper() as scraper:
        tasks = [scraper.scrape_page(url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results
```

2. **Cache DNS lookups** in production

3. **Use connection pooling** with `requests.Session()`

4. **Implement exponential backoff** for retries

---

## Support

For issues or questions:
- Check logs: `console.log()` in API routes
- Review Python errors: stderr output
- Database issues: Check Supabase logs
- Create GitHub issue with error details

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
