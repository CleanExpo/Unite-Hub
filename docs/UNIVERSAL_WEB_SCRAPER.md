# Universal Web Scraper System

Complete end-to-end web scraping platform for article research and competitive intelligence.

**Features:**
- ✅ Automatic URL discovery from keywords
- ✅ Batch scraping with rate limiting
- ✅ Structured data extraction (products, pricing, images)
- ✅ AI-powered insights and article outline generation
- ✅ Multi-keyword support
- ✅ Progress tracking

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Bright Data (web scraping)
BRIGHTDATA_API_KEY=your_api_key
BRIGHTDATA_ZONE=unite_hub

# URL Discovery
EXA_API_KEY=your_exa_key  # For web search (optional)
```

Get API keys:
- **Bright Data**: https://brightdata.com/
- **Exa**: https://exa.ai/ (optional)

### 2. Apply Migrations

```bash
# Run via Supabase Dashboard → SQL Editor
# File: supabase/migrations/20260111_universal_web_scraper.sql
```

### 3. Install Dependencies

```bash
npm install cheerio axios
```

## Quick Start

### Create a Scraping Project

```bash
POST /api/scraper/projects?workspaceId=YOUR_WORKSPACE_ID
Content-Type: application/json

{
  "name": "AI Tools Comparison",
  "description": "Research latest AI tools and pricing",
  "seedUrl": "openai.com",
  "keywords": ["AI pricing", "API costs", "models"],
  "maxUrlsToScrape": 20,
  "includeImages": true,
  "includePricing": true
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "projectId": "uuid",
  "urlsDiscovered": 18,
  "urlsScraped": 15,
  "urlsFailed": 3,
  "products": [...],
  "pricing": [...],
  "articleOutline": {...}
}
```

### Check Project Status

```bash
GET /api/scraper/projects/PROJECT_ID?workspaceId=YOUR_WORKSPACE_ID
```

### List All Projects

```bash
GET /api/scraper/projects?workspaceId=YOUR_WORKSPACE_ID
```

### Delete Project

```bash
DELETE /api/scraper/projects/PROJECT_ID?workspaceId=YOUR_WORKSPACE_ID
```

## How It Works

### Stage 1: URL Discovery (30-60s)

**Strategies:**
1. Exa AI search (if configured) - searches keywords
2. Domain patterns - guesses /pricing, /products, etc.
3. Keyword-based URLs - generates /blog/keyword pages
4. Deduplication - removes duplicates, filters by relevance

**Output:** 20 unique, ranked URLs

### Stage 2: Batch Scraping (2-5 min)

**Process:**
- Uses Bright Data for ethical scraping
- Rotates IPs, respects robots.txt
- 2s delay between requests, 2 concurrent
- Stores raw HTML

**Rate:** ~10-15 URLs/min

### Stage 3: Data Extraction (3-10 min)

**Per Page:**
1. HTML parsing with cheerio
   - Products with pricing
   - Images (product/logo/feature)
   - Contact info, social links
   - Features, testimonials

2. Claude AI enhancement
   - Page summary for article
   - Key insights extraction
   - Pricing model summary

**Extracted Data per URL:**
- Title, meta description
- Products with prices/features
- Images (up to 15)
- Contact info, social links
- Article summary + key insights

### Stage 4: Aggregation (1 min)

**Combines all data:**
- Combined products list
- Pricing comparison with min/max range
- All images (up to 20)
- Common features (mentioned 2+ times)
- AI-generated article outline with sources

## Output Data

### Products
```json
{
  "name": "Pro Plan",
  "description": "...",
  "price": "99",
  "currency": "USD",
  "imageUrl": "...",
  "url": "...",
  "features": ["Feature 1", "Feature 2"]
}
```

### Pricing Models
```json
{
  "name": "Professional",
  "price": "99",
  "currency": "USD",
  "features": ["Unlimited API calls", "Priority support"],
  "description": "For growing teams"
}
```

### Images
```json
{
  "url": "https://...",
  "altText": "Product screenshot",
  "type": "product"  // or "feature", "logo", "other"
}
```

### Article Outline
```json
{
  "title": "Complete AI Pricing Guide",
  "sections": [
    {
      "title": "Introduction",
      "content": "...",
      "sources": ["url1", "url2"]
    },
    {
      "title": "Pricing Comparison",
      "content": "...",
      "sources": ["url3"]
    }
  ],
  "highlights": ["Key insight 1", "Key insight 2"],
  "callToAction": "Try these tools today"
}
```

## Performance

| Stage | Time | Rate |
|-------|------|------|
| Discovery | 30-60s | - |
| Scraping | 2-5 min | 10-15 URLs/min |
| Extraction | 3-10 min | 2-3 URLs/min |
| Aggregation | 1 min | - |
| **Total** | **7-20 min** | **Up to 50 URLs** |

## Using Results for Articles

### 1. Use Generated Outline
Ready-to-use article structure with:
- Suggested sections
- Key talking points
- Source URLs for citations

### 2. Product Comparison Table
```markdown
| Product | Price | Key Features |
|---------|-------|--------------|
| Pro | $99/mo | Feature 1, Feature 2 |
| Starter | $29/mo | Feature 1 |
```

### 3. Add Extracted Images
```markdown
![Product](image-url)
```

### 4. Insert Key Insights
```markdown
### Key Findings
- Insight from data
- Finding from research
- Observation from multiple sources
```

## Advanced Configuration

### Keywords Tips
- Be specific: "AI pricing" > "AI"
- 2-5 keywords optimal
- Include intent: "best", "review", "how to"

### URL Count
- 10-15 URLs: Quick research (3-5 min)
- 20-30 URLs: Comprehensive (10-15 min)
- 40-50 URLs: Exhaustive (20+ min)

### Timeout
Default: 600s (10 minutes) - adjust for large projects

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `workspaceId required` | Pass `?workspaceId=ID` in query |
| `BRIGHTDATA_API_KEY not set` | Add to `.env.local`, restart |
| 0 URLs discovered | Check keywords, try Exa API key |
| No products extracted | Site may use JavaScript, needs custom rules |
| Timeout (>20 min) | Reduce maxUrlsToScrape to 10-15 |
| Rate limit hit | Wait 5-10 min before new project |

## Architecture

```
Create Project
    ↓
├─ discoverURLs()
│  └─ 20 unique URLs
├─ scrapeBatch()
│  └─ Raw HTML for each
├─ extractDataFromHTML()
│  ├─ HTML parsing
│  ├─ Claude enhancement
│  └─ Structured data
└─ aggregateResults()
   └─ Combined data + outline
      ↓
   Supabase Storage
```

## Multi-Tenant Safety

All queries filter by `workspace_id`. RLS policies enforce isolation.

## Limitations

- Max 50 URLs per project
- Max 5 keywords
- JavaScript-rendered sites: Limited support
- PDF extraction: Not supported
- Real-time data: Snapshots only
- Video transcripts: Not supported

## Future Enhancements

- [ ] Scheduled scraping
- [ ] Custom extraction per domain
- [ ] PDF support
- [ ] Video transcripts
- [ ] Sentiment analysis
- [ ] Alert notifications
- [ ] Google Docs export
- [ ] AI article generation
- [ ] Multi-language support
