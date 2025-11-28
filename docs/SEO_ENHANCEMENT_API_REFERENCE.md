# SEO Enhancement Suite - API Reference

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer {session.access_token}
```

---

## Audit Endpoints

### POST /api/seo-enhancement/audit

Create and run a technical SEO audit.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "url": "https://example.com",
  "auditType": "full"
}
```

**Audit Types:**
- `full` - Complete technical audit
- `core-web-vitals` - CWV metrics only
- `mobile` - Mobile-friendliness
- `security` - Security analysis

**Response:**
```json
{
  "job": {
    "id": "uuid",
    "status": "pending",
    "url": "https://example.com"
  }
}
```

### GET /api/seo-enhancement/audit

Get audit results.

**Query Parameters:**
- `workspaceId` (required)
- `jobId` (optional) - Get specific audit
- `domain` (optional) - Filter by domain
- `limit` (optional, default: 20)

**Response:**
```json
{
  "audits": [
    {
      "id": "uuid",
      "domain": "example.com",
      "overall_score": 85,
      "status": "completed",
      "created_at": "2025-11-28T..."
    }
  ]
}
```

---

## Content Endpoints

### POST /api/seo-enhancement/content

Analyze page content for optimization.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "url": "https://example.com/page",
  "targetKeyword": "main keyword",
  "secondaryKeywords": ["keyword2", "keyword3"]
}
```

**Response:**
```json
{
  "job": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### GET /api/seo-enhancement/content

Get content analysis results.

**Query Parameters:**
- `workspaceId` (required)
- `jobId` (optional)
- `url` (optional)
- `limit` (optional, default: 20)

---

## Schema Endpoints

### POST /api/seo-enhancement/schema

Generate schema markup.

**Request Body (Generate):**
```json
{
  "workspaceId": "uuid",
  "url": "https://example.com",
  "schemaType": "Article",
  "pageInfo": {
    "title": "Page Title",
    "description": "Description"
  }
}
```

**Request Body (Check Opportunity):**
```json
{
  "workspaceId": "uuid",
  "action": "checkOpportunity",
  "url": "https://example.com",
  "keyword": "target keyword"
}
```

**Schema Types:**
- `Article`
- `Product`
- `LocalBusiness`
- `FAQ`
- `HowTo`
- `Recipe`
- `Event`
- `Organization`
- `Person`
- `Review`
- `VideoObject`
- `BreadcrumbList`

**Response:**
```json
{
  "schema": {
    "id": "uuid",
    "schema_type": "Article",
    "schema_json": { ... }
  },
  "scriptTag": "<script type=\"application/ld+json\">...</script>"
}
```

### GET /api/seo-enhancement/schema

Get schemas or monitoring data.

**Query Parameters:**
- `workspaceId` (required)
- `url` (optional)
- `type` (optional) - Schema type filter
- `monitoring` (optional) - Set to "true" for monitoring data
- `limit` (optional, default: 20)

---

## CTR Endpoints

### POST /api/seo-enhancement/ctr

CTR optimization actions.

**Actions:**

#### createTest
```json
{
  "workspaceId": "uuid",
  "action": "createTest",
  "url": "https://example.com",
  "keyword": "target keyword",
  "variantATitle": "Original Title",
  "variantAMeta": "Original meta description",
  "variantBTitle": "Test Title",
  "variantBMeta": "Test meta description"
}
```

#### startTest
```json
{
  "workspaceId": "uuid",
  "action": "startTest",
  "testId": "uuid"
}
```

#### completeTest
```json
{
  "workspaceId": "uuid",
  "action": "completeTest",
  "testId": "uuid"
}
```

#### analyzeBenchmark
```json
{
  "workspaceId": "uuid",
  "action": "analyzeBenchmark",
  "url": "https://example.com",
  "keyword": "target keyword",
  "currentData": {
    "impressions": 1000,
    "clicks": 30,
    "position": 5
  }
}
```

#### generateTitles
```json
{
  "workspaceId": "uuid",
  "action": "generateTitles",
  "keyword": "target keyword",
  "currentTitle": "Current page title",
  "context": { "industry": "construction" }
}
```

#### generateMetas
```json
{
  "workspaceId": "uuid",
  "action": "generateMetas",
  "keyword": "target keyword",
  "currentMeta": "Current meta description",
  "context": { "industry": "construction" }
}
```

### GET /api/seo-enhancement/ctr

Get tests or benchmarks.

**Query Parameters:**
- `workspaceId` (required)
- `type` - "tests" (default) or "benchmarks"
- `status` (optional) - Filter by test status
- `opportunityLevel` (optional) - Filter benchmarks
- `url` (optional)
- `limit` (optional, default: 20)

---

## Competitor Endpoints

### POST /api/seo-enhancement/competitors

Competitor management and analysis.

**Actions:**

#### addCompetitor
```json
{
  "workspaceId": "uuid",
  "clientDomain": "your-site.com",
  "action": "addCompetitor",
  "competitorDomain": "competitor.com",
  "competitorName": "Competitor Inc"
}
```

#### analyzeKeywords
```json
{
  "workspaceId": "uuid",
  "clientDomain": "your-site.com",
  "action": "analyzeKeywords"
}
```

#### analyzeContent
```json
{
  "workspaceId": "uuid",
  "clientDomain": "your-site.com",
  "action": "analyzeContent"
}
```

#### analyzeBacklinks
```json
{
  "workspaceId": "uuid",
  "clientDomain": "your-site.com",
  "action": "analyzeBacklinks"
}
```

#### analyzeAll
```json
{
  "workspaceId": "uuid",
  "clientDomain": "your-site.com",
  "action": "analyzeAll"
}
```

### GET /api/seo-enhancement/competitors

Get competitor data.

**Query Parameters:**
- `workspaceId` (required)
- `clientDomain` (required for filtered results)
- `type` - "competitors", "keywords", "content", "backlinks", or "all"
- `limit` (optional, default: 20)

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized
- `500` - Internal Server Error

---

## Rate Limits

- Audits: 10 per hour per workspace
- Content Analysis: 20 per hour per workspace
- Schema Generation: 50 per hour per workspace
- CTR Tests: 5 active per workspace
- Competitor Analysis: 5 per hour per workspace

---

## Webhooks (Future)

Planned webhook support for:
- Audit completion
- Test statistical significance
- New competitor keyword opportunities
