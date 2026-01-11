# Competitor Intelligence Scraper

On-demand competitive intelligence system for tracking competitor websites, pricing, and social metrics.

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
BRIGHTDATA_API_KEY=your_api_key_here
BRIGHTDATA_ZONE=unite_hub  # Your Bright Data zone name
```

Get your API key from [Bright Data](https://brightdata.com/)

### 2. Apply Migration

```bash
# Run via Supabase Dashboard → SQL Editor
# File: supabase/migrations/20260111_competitor_intelligence_scraping.sql
```

### 3. Install Dependencies (if needed)

```bash
npm install axios
```

## Usage

### Add a Competitor

```bash
POST /api/competitors?workspaceId=YOUR_WORKSPACE_ID
Content-Type: application/json

{
  "domain": "competitor.com",
  "name": "Competitor Name",
  "category": "website",
  "social_handles": {
    "reddit": "r/subreddit",
    "twitter": "handle"
  }
}
```

### Trigger Scraping

```bash
POST /api/competitors/scrape?workspaceId=YOUR_WORKSPACE_ID
Content-Type: application/json

{
  "competitorId": "uuid-from-add-competitor",
  "domain": "competitor.com",
  "jobType": "full_scrape",  # or "pricing", "social", "reddit"
  "socialHandles": {
    "reddit": "r/subreddit"
  }
}
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "competitorId": "uuid",
  "pricing": [...],
  "socialMetrics": [...],
  "keywords": [...]
}
```

### Get Competitor Data

```bash
GET /api/competitors/COMPETITOR_ID?workspaceId=YOUR_WORKSPACE_ID
```

Returns:
- Competitor info
- Latest scrape data (pricing, social metrics)
- Scrape job history

### List All Competitors

```bash
GET /api/competitors?workspaceId=YOUR_WORKSPACE_ID
```

### Delete Competitor

```bash
DELETE /api/competitors/COMPETITOR_ID?workspaceId=YOUR_WORKSPACE_ID
```

## Scrape Job Types

| Type | Purpose | Time |
|------|---------|------|
| `full_scrape` | Homepage + pricing pages + social | ~30s |
| `pricing` | Pricing/products pages only | ~10s |
| `social` | Social media metrics (Reddit) | ~5s |
| `reddit` | Reddit community specific | ~5s |

## Data Stored

### Raw Content
- Original HTML/JSON responses
- HTTP status, headers
- Timestamp, URL

### Structured Data
```json
{
  "pricing": [
    {
      "product": "Plan name",
      "price": "$X",
      "currency": "USD",
      "url": "page-url"
    }
  ],
  "social_metrics": [
    {
      "platform": "reddit",
      "followers": 5000,
      "posts": 100,
      "engagement": 250
    }
  ],
  "keywords": ["term1", "term2"],
  "content_summary": "What they do"
}
```

## Change Detection

Automatically detects and logs:
- Price changes
- New features added
- Social growth
- Content updates

Query changes:
```sql
SELECT * FROM competitor_changes
WHERE workspace_id = 'your-workspace-id'
ORDER BY detected_at DESC;
```

## Rate Limiting

Bright Data handles:
- robots.txt compliance ✅
- User-agent rotation ✅
- IP rotation ✅
- Request throttling ✅

Default: 1 second between requests, 3 concurrent

Customize in scraper-agent:
```typescript
const rateLimit = options.rateLimit || {
  delayMs: 1000,      // ms between requests
  concurrent: 3       // max parallel
};
```

## Architecture

```
POST /api/competitors/scrape
         ↓
scrapeCompetitor() (agent-reliability)
         ↓
┌────────┴────────┐
├─ scrapeUrl()    ├─ Bright Data API
├─ extractFromHTML()  ├─ Claude (pricing/keywords)
├─ scrapeReddit()     ├─ Reddit JSON API
└────────┬────────┘
         ↓
Store in Supabase
├─ scrape_results_raw (raw HTML)
├─ competitor_data (structured)
├─ scrape_jobs (tracking)
└─ competitor_changes (delta)
```

## Multi-Tenant Safety

All queries filter by `workspace_id`:
```typescript
.eq("workspace_id", workspaceId)  // ← MANDATORY
```

RLS policies enforce isolation:
```sql
WHERE workspace_id = get_current_workspace_id()
```

## Cost Considerations

- **Bright Data**: ~$0.01-0.05 per request
- **Claude API**: ~$0.01 per extraction
- Budget: Set soft limits on scrape jobs

Monitor usage:
```typescript
const quota = await getQuotaStatus(); // Returns remaining requests
```

## Troubleshooting

### "BRIGHTDATA_API_KEY not set"
→ Add to `.env.local` and restart dev server

### Scrape failed with HTTP 403/429
→ Bright Data rate limit hit (check quota_status)
→ Increase delay between requests

### No pricing data extracted
→ HTML structure different (common for dynamic sites)
→ May need custom parser for that competitor

### Social metrics showing zero
→ Reddit handle incorrect or subreddit private
→ Check `social_handles` configuration

## Future Enhancements

- [ ] Visual comparison dashboard
- [ ] Change notifications/alerts
- [ ] Scheduled recurring scrapes
- [ ] Custom field extraction (industry-specific)
- [ ] Sentiment analysis on reviews
- [ ] Competitor grouping/segmentation
