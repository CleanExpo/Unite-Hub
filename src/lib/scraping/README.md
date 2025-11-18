# Unite-Hub Web Scraping System

Complete web scraping and competitor intelligence system for Unite-Hub.

## 📁 Directory Structure

```
src/lib/scraping/
├── web-scraper.py              # Basic scraping with BeautifulSoup
├── advanced-scraper.py         # JavaScript rendering with Playwright
├── competitor-intelligence.py  # Full competitor analysis
└── README.md                   # This file

scripts/scraping/
└── scrape-competitor.mjs       # CLI interface

src/app/api/scraping/
├── analyze/route.ts            # Analysis endpoint
└── monitor/route.ts            # Monitoring endpoint

supabase/migrations/
└── 047_web_scraping_tables.sql # Database schema
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Run Database Migration

Go to Supabase Dashboard → SQL Editor:

```sql
\i supabase/migrations/047_web_scraping_tables.sql
```

### 3. Test Scraping

```bash
# CLI test
npm run scrape https://example.com

# Or with Python directly
python src/lib/scraping/web-scraper.py https://example.com
```

## 📚 Modules

### web-scraper.py

**Basic web scraping with BeautifulSoup**

Features:
- HTML/XML parsing
- Metadata extraction (title, description, keywords)
- Link extraction (internal/external)
- Image extraction
- Text content extraction
- Retry logic with exponential backoff
- Rate limiting
- Random user agents

Classes:
- `WebScraper` - Basic scraping functionality
- `CompetitorAnalyzer` - Competitor-focused analysis

Usage:
```python
from web_scraper import WebScraper, CompetitorAnalyzer

# Basic scraping
scraper = WebScraper(delay=1.0)
result = scraper.scrape_page("https://example.com")

# Competitor analysis
analyzer = CompetitorAnalyzer()
analysis = analyzer.analyze_website("https://competitor.com")
```

### advanced-scraper.py

**JavaScript rendering with Playwright**

Features:
- Browser automation
- JavaScript execution
- SPA scraping with scroll support
- Screenshot capture
- Structured data extraction (JSON-LD, Open Graph)
- SEO analysis

Classes:
- `JavaScriptScraper` - Async Playwright scraper
- `SEOAnalyzer` - SEO-focused analysis

Usage:
```python
import asyncio
from advanced_scraper import JavaScriptScraper, SEOAnalyzer

async def scrape():
    async with JavaScriptScraper() as scraper:
        result = await scraper.scrape_page("https://example.com")
        return result

asyncio.run(scrape())
```

### competitor-intelligence.py

**Complete competitor intelligence**

Features:
- Full website analysis
- Pricing page detection
- Feature extraction
- Technology detection
- Competitive insights generation
- Change monitoring

Classes:
- `CompetitorIntelligence` - Main intelligence service

Usage:
```python
import asyncio
from competitor_intelligence import CompetitorIntelligence

async def analyze():
    intel = CompetitorIntelligence()
    result = await intel.full_analysis("https://competitor.com")
    return result

asyncio.run(analyze())
```

## 🔌 API Endpoints

### POST /api/scraping/analyze

Analyze a website.

**Request:**
```typescript
{
  url: string;
  analysisType: 'basic' | 'seo' | 'full' | 'competitor';
  saveToDatabase?: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    url: string;
    basic_analysis?: {...};
    seo_analysis?: {...};
    pricing_info?: {...};
    features?: string[];
    technologies?: {...};
    insights?: {...};
  };
  timestamp: string;
}
```

### POST /api/scraping/monitor

Monitor competitor for changes.

**Request:**
```typescript
{
  url: string;
  competitorId?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  changes_detected: boolean;
  changes: Array<{
    field: string;
    old: any;
    new: any;
    type: 'change' | 'addition' | 'removal';
  }>;
}
```

### GET /api/scraping/monitor

Get monitoring history.

**Query Params:**
- `workspaceId` (required)
- `competitorId` (optional)

## 🗄️ Database Schema

### competitor_analysis

Stores analysis results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workspace_id | UUID | Workspace reference |
| user_id | UUID | User reference |
| url | TEXT | Analyzed URL |
| analysis_type | TEXT | Type of analysis |
| data | JSONB | Analysis results |
| created_at | TIMESTAMPTZ | Creation time |

### competitor_monitoring

Stores change detection results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workspace_id | UUID | Workspace reference |
| competitor_id | UUID | Competitor contact reference |
| url | TEXT | Monitored URL |
| changes_detected | BOOLEAN | Whether changes found |
| changes | JSONB | Array of changes |
| monitored_at | TIMESTAMPTZ | Monitoring time |

### scraping_jobs

Queue for scheduled jobs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workspace_id | UUID | Workspace reference |
| url | TEXT | Target URL |
| analysis_type | TEXT | Type of analysis |
| frequency | TEXT | daily/weekly/monthly |
| next_run_at | TIMESTAMPTZ | Next execution time |
| status | TEXT | pending/running/completed/failed |

## 🛠️ CLI Tools

### scrape-competitor.mjs

Node.js CLI wrapper for Python scrapers.

```bash
# Full competitor analysis
npm run scrape https://competitor.com

# SEO analysis only
npm run scrape https://competitor.com -- --type seo

# Save to file
npm run scrape https://competitor.com -- --save --output results.json

# Show help
npm run scrape:help
```

## 📊 Data Structures

### Basic Analysis Result

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

### SEO Analysis Result

```typescript
interface SEOAnalysis {
  url: string;
  title: {
    text: string;
    length: number;
    optimal: boolean;
  };
  description: {
    text: string;
    length: number;
    optimal: boolean;
  };
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
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

### Competitor Intelligence Result

```typescript
interface CompetitorIntelligence {
  url: string;
  basic_analysis: BasicAnalysis;
  seo_analysis: SEOAnalysis;
  pricing_info: {
    has_pricing_page: boolean;
    pricing_url: string | null;
    detected_plans: Array<{
      name: string;
      price: string | null;
    }>;
  };
  features: string[];
  technologies: {
    frontend: string[];
    analytics: string[];
    marketing: string[];
    frameworks: string[];
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
}
```

## 🎯 Use Cases

### 1. Competitor Analysis

```typescript
import { analyzeCompetitor } from '@/examples/scraping-quickstart';

const analysis = await analyzeCompetitor(
  workspaceId,
  'https://competitor.com'
);

console.log('SEO:', analysis.seo_analysis);
console.log('Pricing:', analysis.pricing_info);
console.log('Technologies:', analysis.technologies);
```

### 2. SEO Monitoring

```typescript
import { analyzeSEO } from '@/examples/scraping-quickstart';

const seo = await analyzeSEO(workspaceId, 'https://mysite.com');

if (!seo.title.optimal) {
  console.log('⚠️ Title needs optimization');
}

if (!seo.description.optimal) {
  console.log('⚠️ Description needs optimization');
}
```

### 3. Change Detection

```typescript
import { monitorCompetitor } from '@/examples/scraping-quickstart';

const result = await monitorCompetitor(
  workspaceId,
  'https://competitor.com'
);

if (result.changes_detected) {
  result.changes.forEach(change => {
    console.log(`${change.field}: ${change.old} → ${change.new}`);
  });
}
```

### 4. Scheduled Monitoring

```typescript
import { scheduleCompetitorMonitoring } from '@/examples/scraping-quickstart';

await scheduleCompetitorMonitoring(
  workspaceId,
  'https://competitor.com',
  'weekly'
);
```

## ⚙️ Configuration

### Environment Variables

Add to `.env.local`:

```env
# Optional: Custom scraping settings
SCRAPING_DELAY=2000           # Delay between requests (ms)
SCRAPING_TIMEOUT=30000        # Request timeout (ms)
SCRAPING_MAX_RETRIES=3        # Max retry attempts
SCRAPING_USER_AGENT=MyBot/1.0 # Custom user agent
```

### Rate Limiting

Configure in Python scripts:

```python
# Adjust delay between requests
scraper = WebScraper(delay=2.0)  # 2 seconds

# Adjust timeout
scraper = WebScraper(timeout=60)  # 60 seconds
```

## 🔒 Security & Ethics

### Best Practices

✅ **DO:**
- Check `robots.txt` before scraping
- Use appropriate delays (minimum 1 second)
- Identify your bot with user agents
- Cache results to minimize requests
- Respect website terms of service

❌ **DON'T:**
- Scrape personal data without consent
- Ignore `robots.txt` directives
- Overload target servers
- Bypass authentication
- Resell scraped data

### robots.txt Checker

```python
from urllib.robotparser import RobotFileParser

def can_scrape(url):
    rp = RobotFileParser()
    rp.set_url(f"{url}/robots.txt")
    rp.read()
    return rp.can_fetch("*", url)
```

## 🐛 Troubleshooting

### Python not found

```bash
# Check Python installation
python --version

# Windows: Add to PATH
# macOS/Linux: Use python3
python3 --version
```

### Playwright browsers not installed

```bash
playwright install chromium
```

### SSL certificate errors

```python
# Disable SSL verification (use cautiously)
import requests
requests.get(url, verify=False)
```

### Timeout errors

```python
# Increase timeout
scraper = WebScraper(timeout=60)
```

## 📈 Performance

### Parallel Processing

```python
import asyncio

urls = ['url1', 'url2', 'url3']

async def scrape_all():
    async with JavaScriptScraper() as scraper:
        tasks = [scraper.scrape_page(url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

asyncio.run(scrape_all())
```

### Caching

```typescript
// Save to database for caching
await fetch('/api/scraping/analyze', {
  body: JSON.stringify({
    url,
    saveToDatabase: true,  // Enable caching
  }),
});
```

## 📝 Examples

See [examples/scraping-quickstart.ts](../../../examples/scraping-quickstart.ts) for:
- Basic competitor analysis
- SEO analysis
- Change monitoring
- Scheduled scraping
- Technology detection
- Pricing extraction
- Competitor comparison

## 🆘 Support

For issues or questions:
- Review logs in console/stderr
- Check database connection
- Verify Python installation
- See [docs/WEB_SCRAPING_GUIDE.md](../../../docs/WEB_SCRAPING_GUIDE.md)
- Create GitHub issue with details

---

**Version:** 1.0.0
**Last Updated:** 2025-11-19
