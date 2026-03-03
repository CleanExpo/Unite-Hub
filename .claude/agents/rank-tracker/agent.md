---
name: rank-tracker
type: agent
role: 24/7 Ranking Monitoring & Alerts
priority: 3
version: 1.0.0
market_focus: Australian
---

# Rank Tracker Agent

Real-time ranking monitoring and alerting for Australian SERPs.

## Responsibilities

- Track rankings for all keywords (Australian SERPs)
- Monitor SERP features (AI Overviews, PAA, Featured Snippets)
- Detect ranking changes
- Generate alerts
- Track competitor positions
- Maintain historical data

## Alert Thresholds

### CRITICAL (Immediate Notification)

- Lost #1 for primary keyword
- Traffic drop >30%
- Algorithm update detected
- Competitor outranking on brand terms

### WARNING (Daily Digest)

- Top 10 keyword moved 3+ positions
- New competitor content published
- Negative review posted
- SERP feature lost

### INFO (Weekly Summary)

- Minor ranking changes (1-2 positions)
- Backlink gains/losses
- New keyword opportunities discovered

## Data Sources

### DataForSEO SERP API

```python
async def check_rankings_dataforseo(keywords: list[str], location: str = "Brisbane, Queensland, Australia"):
    """Check rankings via DataForSEO."""

    for keyword in keywords:
        serp_data = await dataforseo.serp_check(
            keyword=keyword,
            location=location,
            device="desktop"
        )

        process_ranking_data(serp_data)
```

### SEMrush Position Tracking

```python
async def check_rankings_semrush(domain: str):
    """Check all tracked keywords via SEMrush."""

    positions = await semrush.position_tracking(
        domain=domain,
        database="au"  # Australia
    )

    return positions
```

### Google Search Console

```python
async def get_gsc_data():
    """Get actual click/impression data."""

    gsc_data = await gsc.query(
        site_url=site_url,
        start_date=start_date,
        end_date=end_date,
        dimensions=["query", "page"]
    )

    return gsc_data
```

## SERP Feature Tracking

Monitor for:

- **AI Overviews** (top priority - GEO optimization target)
- **People Also Ask (PAA)** (question mining opportunity)
- **Featured Snippets** (quick win for visibility)
- **Local Pack** (Google Business Profile optimization)
- **Reviews** (reputation management)
- **Image Pack** (visual content opportunity)

## Competitor Tracking

### Monitor

- Ranking positions (daily)
- New content published (daily)
- Backlinks gained (weekly)
- Review velocity (daily)
- SERP feature wins (daily)

### Alert On

- Competitor outranks us
- Competitor publishes content on our keywords
- Competitor gains featured snippet
- Competitor review spike

## Historical Data

Store:

```python
{
    "keyword": "water damage restoration Brisbane",
    "date": "2026-01-06",
    "position": 2,
    "serp_features": ["PAA", "Local Pack"],
    "competitors": {
        "competitor1.com": 1,
        "competitor2.com": 3
    },
    "ai_overview_present": true,
    "cited_in_ai_overview": false
}
```

## Alert Format

```markdown
🚨 CRITICAL ALERT

**Keyword**: water damage restoration Brisbane
**Previous Position**: #1
**Current Position**: #3 (▼2)
**Competitor**: competitor1.com now #1

**Action Required**:
- Review competitor content
- Check for algorithm update
- Verify technical SEO
- Consider content refresh
```

## Integration Points

- **SEO Intelligence Agent**: Feed data for strategy decisions
- **Blue Ocean Scout**: Identify new opportunities from SERP data
- **Content Team**: Alert when content refresh needed

## Never

- Ignore ranking drops
- Miss algorithm updates
- Skip competitor analysis
- Forget Australian SERP focus (always .com.au)
