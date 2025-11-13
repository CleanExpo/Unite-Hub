# Competitor Analysis API

## Overview

The Competitor Analysis API provides endpoints for managing competitors and running AI-powered competitive analysis. This is a **Professional tier feature**.

## Authentication

All endpoints require authentication via session or API key.

## Endpoints

### Competitor Management

#### Create Competitor
```http
POST /api/competitors
Content-Type: application/json

{
  "clientId": "client_id",
  "competitorName": "Competitor Inc",
  "website": "https://competitor.com",
  "description": "Brief description...",
  "category": "direct",
  "strengths": ["Strong brand"],
  "weaknesses": ["Poor support"],
  "pricing": {
    "model": "Subscription",
    "range": "$99-$299/mo"
  },
  "targetAudience": ["SMBs"],
  "marketingChannels": ["Facebook"],
  "socialPresence": {
    "facebook": "@competitor"
  }
}
```

#### Get Competitors
```http
GET /api/competitors?clientId={clientId}&category={category}
```

Query parameters:
- `clientId` (required): Client ID
- `category` (optional): Filter by category (direct, indirect, potential)

#### Get Single Competitor
```http
GET /api/competitors/{competitorId}
```

#### Update Competitor
```http
PUT /api/competitors/{competitorId}
Content-Type: application/json

{
  "updates": {
    "competitorName": "New Name",
    "strengths": ["Updated strength"]
  }
}
```

#### Delete Competitor
```http
DELETE /api/competitors/{competitorId}
```

### Analysis

#### Run AI Analysis
```http
POST /api/competitors/analyze
Content-Type: application/json

{
  "clientId": "client_id"
}
```

Returns comprehensive competitive analysis including:
- Market gaps
- Differentiation opportunities
- SWOT analysis
- Pricing analysis
- Content gaps
- Actionable insights

#### Get Latest Analysis
```http
GET /api/competitors/analysis/latest?clientId={clientId}
```

#### Compare Competitors
```http
POST /api/competitors/compare
Content-Type: application/json

{
  "competitorIds": ["id1", "id2", "id3"]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Rate Limits

- Standard tier: Not available
- Professional tier: Unlimited
- Analysis runs: Unlimited (but may take 30-60 seconds)

## Tier Restrictions

- **Starter**: 3 competitors max, NO analysis feature
- **Professional**: 10 competitors max, full analysis
- **Enterprise**: Unlimited competitors, full analysis

## Examples

### Add a Competitor
```bash
curl -X POST https://unite-hub.com/api/competitors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId": "client_123",
    "competitorName": "Acme Corp",
    "website": "https://acme.com",
    "description": "Leading competitor in our space",
    "category": "direct",
    "strengths": ["Large market share", "Strong brand"],
    "weaknesses": ["High prices", "Poor support"]
  }'
```

### Run Analysis
```bash
curl -X POST https://unite-hub.com/api/competitors/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId": "client_123"
  }'
```

### Get Latest Analysis
```bash
curl -X GET "https://unite-hub.com/api/competitors/analysis/latest?clientId=client_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

1. **Complete Data**: Provide as much competitor data as possible for better analysis
2. **Regular Updates**: Update competitor information quarterly
3. **Analysis Frequency**: Run analysis quarterly or when major changes occur
4. **Action Items**: Use actionable insights to guide strategy

## Error Codes

- `400`: Bad request (missing required fields)
- `401`: Unauthorized (invalid or missing auth)
- `403`: Forbidden (tier restriction)
- `404`: Not found (competitor or analysis not found)
- `500`: Server error (analysis failed, database error)

## Support

For API support, contact: support@unite-group.in
