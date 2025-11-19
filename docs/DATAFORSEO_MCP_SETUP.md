# DataForSEO MCP Server Setup Guide

**Date**: 2025-11-19
**Purpose**: Enable DataForSEO API integration via Model Context Protocol (MCP)
**Phase**: Phase 5 (Intelligence Layer) & Phase 6 (Autonomy Engine)

---

## Overview

This guide explains how to configure the DataForSEO MCP server for Unite-Hub's SEO Intelligence and Autonomy features. The MCP server provides direct access to DataForSEO's comprehensive SEO APIs through Claude Code.

**DataForSEO Capabilities**:
- SERP keyword rankings (Google, Bing, Brave)
- Competitor SERP analysis
- Keyword gap analysis
- Backlink summaries
- On-page SEO scoring
- Technical SEO audits
- Local GEO pack tracking
- Social signals (where available)

---

## Prerequisites

1. **DataForSEO Account**
   - Account Email: `phill@disasterrecovery.com.au`
   - Account Dashboard: https://app.dataforseo.com/
   - API Documentation: https://docs.dataforseo.com/v3/

2. **Node.js & NPM**
   - Node.js >= 18.x
   - NPM >= 9.x

3. **Claude Code**
   - Version with MCP support (latest)

---

## Step 1: Add Credentials to `.env.local`

The credentials have already been added to your `.env.local` file:

```env
# ----------------------------------
# DataForSEO API (Phase 5 & 6: SEO Intelligence & Autonomy)
# ----------------------------------
# Login: phill@disasterrecovery.com.au
# Password: [ENTER YOUR PASSWORD HERE]
DATAFORSEO_API_LOGIN=phill@disasterrecovery.com.au
DATAFORSEO_API_PASSWORD=
```

### Action Required:

**Enter your DataForSEO password** on line 94 of `.env.local`:

```env
DATAFORSEO_API_PASSWORD=your-actual-password-here
```

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## Step 2: MCP Server Configuration

The DataForSEO MCP server has been configured in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "npx",
      "args": [
        "dataforseo-mcp-server"
      ],
      "env": {
        "DATAFORSEO_API_LOGIN": "${DATAFORSEO_API_LOGIN}",
        "DATAFORSEO_API_PASSWORD": "${DATAFORSEO_API_PASSWORD}"
      },
      "description": "DataForSEO API - SEO intelligence (SERP, competitors, keywords, backlinks, local GEO)"
    }
  }
}
```

**How it works**:
1. Claude Code reads `.env.local` and loads environment variables
2. When the MCP server starts, it receives `DATAFORSEO_API_LOGIN` and `DATAFORSEO_API_PASSWORD`
3. The server uses these credentials to authenticate with DataForSEO API
4. All API calls are automatically authenticated

---

## Step 3: Verify Installation

### Test Connection

Run this command to verify the MCP server can connect:

```bash
# Test if npx can run the server
npx dataforseo-mcp-server --help
```

**Expected Output**:
```
DataForSEO MCP Server v2.x.x
Usage: dataforseo-mcp-server [options]
```

### Test API Credentials

Use the DataForSEO client directly:

```typescript
// In src/server/dataforseoClient.ts
const client = new DataForSEOClient(
  process.env.DATAFORSEO_API_LOGIN || "",
  process.env.DATAFORSEO_API_PASSWORD || ""
);

// Test connection
const isConnected = await client.testConnection();
console.log("DataForSEO connected:", isConnected);

// Get account info
const accountInfo = await client.getAccountInfo();
console.log("Balance:", accountInfo.balance, accountInfo.currency);
```

---

## Step 4: Using the MCP Server in Claude Code

Once configured, you can access DataForSEO tools directly in Claude Code conversations.

### Available MCP Tools

The DataForSEO MCP server provides these tools:

#### 1. **`dataforseo_serp_keywords`**
Get keyword rankings for a domain.

```typescript
// Example usage in Claude Code
{
  "domain": "example.com",
  "keywords": ["seo services", "digital marketing"],
  "location_code": 2840, // United States
  "language_code": "en"
}
```

#### 2. **`dataforseo_on_page_score`**
Get technical SEO score for a domain.

```typescript
{
  "domain": "example.com",
  "max_crawl_pages": 10
}
```

#### 3. **`dataforseo_competitor_analysis`**
Analyze competitor domains.

```typescript
{
  "target": "your-domain.com",
  "competitors": ["competitor1.com", "competitor2.com"],
  "location_code": 2840
}
```

#### 4. **`dataforseo_keyword_gap`**
Find keyword gaps between domains.

```typescript
{
  "target1": "your-domain.com",
  "target2": "competitor.com",
  "location_code": 2840
}
```

#### 5. **`dataforseo_backlinks`**
Get backlink summary.

```typescript
{
  "domain": "example.com"
}
```

#### 6. **`dataforseo_local_geo_pack`**
Get local GEO pack rankings.

```typescript
{
  "keyword": "plumbers near me",
  "location_name": "Brisbane, Queensland, Australia"
}
```

---

## Step 5: Cost Tracking

DataForSEO uses a **credit-based pricing model**:

| Task Type | Cost per Request |
|-----------|------------------|
| SERP Keywords | $0.01 per keyword |
| On-Page Score | $0.05 per domain |
| Competitor Analysis | $0.02 per competitor |
| Keyword Gap | $0.03 per comparison |
| Backlinks | $0.01 per domain |
| Local GEO Pack | $0.02 per keyword |

### Example Audit Costs by Tier

**Free Tier** (0 DataForSEO tasks):
- Cost: $0.00

**Starter Tier** (serp_keywords + on_page_score):
- 20 keywords × $0.01 = $0.20
- 1 domain × $0.05 = $0.05
- **Total**: $0.25 per audit

**Pro Tier** (5 tasks):
- 50 keywords × $0.01 = $0.50
- 1 on-page score × $0.05 = $0.05
- 5 competitors × $0.02 = $0.10
- 1 keyword gap × $0.03 = $0.03
- 1 backlinks × $0.01 = $0.01
- **Total**: $0.69 per audit

**Enterprise Tier** (7 tasks including GEO):
- 200 keywords × $0.01 = $2.00
- 1 on-page score × $0.05 = $0.05
- 10 competitors × $0.02 = $0.20
- 1 keyword gap × $0.03 = $0.03
- 1 backlinks × $0.01 = $0.01
- 1 local GEO × $0.02 = $0.02
- **Total**: $2.31 per audit

### Monthly Cost Projections (160 users)

| Tier | Users | Audits/Month | Cost/Audit | Total Cost |
|------|-------|--------------|------------|------------|
| Free | 10 | 4 × 10 = 40 | $0.00 | $0 |
| Starter | 100 | 4 × 100 = 400 | $0.25 | $100 |
| Pro | 40 | 8 × 40 = 320 | $0.69 | $221 |
| Enterprise | 10 | 30 × 10 = 300 | $2.31 | $693 |
| **Total** | **160** | **1,060** | - | **$1,014/month** |

**Annual Cost**: $12,168
**Revenue** (160 users): $118,080/year
**Net Margin**: 89.7% ($105,912 profit)

---

## Step 6: Monitoring Usage

### Check Account Balance

```bash
# Via API
curl -u "phill@disasterrecovery.com.au:YOUR_PASSWORD" \
  https://api.dataforseo.com/v3/appendix/user_data
```

**Expected Response**:
```json
{
  "tasks": [{
    "result": {
      "money": {
        "balance": 1000.00,
        "currency": "USD"
      },
      "limits": {
        "minute": 2000,
        "day": 20000
      }
    }
  }]
}
```

### Dashboard

Monitor usage at: https://app.dataforseo.com/usage

---

## Step 7: Restart Claude Code

After adding your password to `.env.local`, **restart Claude Code** to load the new environment variables:

1. Close Claude Code completely
2. Reopen Claude Code
3. Open the Unite-Hub project
4. The DataForSEO MCP server will automatically start

---

## Troubleshooting

### Issue: "Authentication failed"

**Cause**: Password not set or incorrect in `.env.local`

**Solution**:
1. Open `.env.local`
2. Verify `DATAFORSEO_API_PASSWORD` is set correctly
3. Check for trailing spaces or special characters
4. Restart Claude Code

### Issue: "MCP server failed to start"

**Cause**: `dataforseo-mcp-server` package not installed

**Solution**:
```bash
# Install globally (if npx fails)
npm install -g dataforseo-mcp-server

# Or install locally
npm install dataforseo-mcp-server --save-dev
```

### Issue: "Rate limit exceeded"

**Cause**: Too many requests in short time

**Solution**:
- DataForSEO limits: 2,000 requests/minute, 20,000/day
- Check usage in dashboard
- Implement exponential backoff in `auditEngine.ts`
- Consider upgrading DataForSEO plan

### Issue: "Insufficient balance"

**Cause**: Account balance too low

**Solution**:
1. Log into https://app.dataforseo.com/
2. Go to Billing → Add Funds
3. Add $100-500 depending on usage
4. Retry API call

---

## Next Steps

### Phase 5 Implementation (Weeks 1-8)

1. **Week 1**: Create API routes
   - `POST /api/seo/audit/run` - Trigger audit
   - `GET /api/seo/audit/status/:id` - Check status
   - `GET /api/seo/audit/results/:id` - Get results

2. **Weeks 2-3**: Real API integration
   - Replace mock data in `auditEngine.ts`
   - Implement GSC OAuth flow
   - Test Bing Webmaster Tools API
   - Verify Brave Creators API

3. **Weeks 4-5**: Snapshot engine
   - Claude AI report generation
   - Traffic prediction algorithm
   - Weekly improvement plan

4. **Weeks 6-7**: Email delivery
   - MJML templates
   - SendGrid integration
   - Delivery tracking

5. **Week 8**: Testing
   - Unit tests for audit engine
   - Integration tests for DataForSEO client
   - End-to-end workflow testing

### Phase 6 Implementation (Weeks 9-16)

1. **Weeks 9-10**: Autonomy engine
   - BullMQ worker setup
   - Redis connection
   - Queue processing

2. **Weeks 11-12**: Automation triggers
   - Signup trigger implementation
   - Addon purchase hooks
   - Vercel Cron integration

3. **Weeks 13-14**: Legal safety
   - Opt-in UI
   - Undo log system
   - Staff override controls

4. **Weeks 15-16**: Production deployment
   - Staging environment testing
   - Load testing (100+ concurrent audits)
   - Security audit
   - Production launch

---

## Resources

### Official Documentation
- **DataForSEO API Docs**: https://docs.dataforseo.com/v3/
- **MCP Server**: https://github.com/dataforseo/dataforseo-mcp-server
- **Pricing**: https://dataforseo.com/pricing

### Related Files
- `src/server/dataforseoClient.ts` - DataForSEO API client (370+ lines)
- `src/server/auditEngine.ts` - Audit orchestration (400+ lines)
- `src/server/tierLogic.ts` - Subscription tier logic (300+ lines)
- `src/lib/seo/auditTypes.ts` - TypeScript types (200+ lines)
- `docs/PHASE5_INTELLIGENCE_LAYER_FOUNDATION.md` - Phase 5 documentation

### Support
- **DataForSEO Support**: support@dataforseo.com
- **Live Chat**: https://dataforseo.com/contact
- **Technical Issues**: Create ticket in dashboard

---

**Setup Status**: ✅ **MCP Server Configured**
**Action Required**: Enter DataForSEO password in `.env.local` (line 94)
**Next Step**: Restart Claude Code to activate MCP server

