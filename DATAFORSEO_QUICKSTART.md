# DataForSEO MCP Server - Quick Start

## ⚠️ ACTION REQUIRED

**Enter your DataForSEO password in `.env.local` (line 94)**:

```env
DATAFORSEO_API_PASSWORD=your-password-here
```

Then **restart Claude Code** to activate the MCP server.

---

## Account Details

- **Email**: phill@disasterrecovery.com.au
- **Dashboard**: https://app.dataforseo.com/
- **Documentation**: https://docs.dataforseo.com/v3/

---

## What's Been Set Up

✅ **Environment Variables** (`.env.local`):
```env
DATAFORSEO_API_LOGIN=phill@disasterrecovery.com.au
DATAFORSEO_API_PASSWORD=          # ⚠️ ENTER PASSWORD HERE
```

✅ **MCP Server Configuration** (`.claude/mcp.json`):
```json
{
  "dataforseo": {
    "command": "npx",
    "args": ["dataforseo-mcp-server"],
    "env": {
      "DATAFORSEO_API_LOGIN": "${DATAFORSEO_API_LOGIN}",
      "DATAFORSEO_API_PASSWORD": "${DATAFORSEO_API_PASSWORD}"
    }
  }
}
```

✅ **Integration Code**:
- `src/server/dataforseoClient.ts` - Full API client (370+ lines)
- `src/server/auditEngine.ts` - Audit orchestration (400+ lines)
- `src/server/tierLogic.ts` - Tier-based access control (300+ lines)
- `src/lib/seo/auditTypes.ts` - TypeScript types (200+ lines)

---

## How to Use

### 1. Add Password
```bash
# Open .env.local
code .env.local

# Line 94:
DATAFORSEO_API_PASSWORD=your-actual-password-here
```

### 2. Restart Claude Code
- Close Claude Code completely
- Reopen and load Unite-Hub project
- DataForSEO MCP server starts automatically

### 3. Test Connection
```typescript
// In any TypeScript file or via Claude Code
import { DataForSEOClient } from "@/server/dataforseoClient";

const client = new DataForSEOClient(
  process.env.DATAFORSEO_API_LOGIN!,
  process.env.DATAFORSEO_API_PASSWORD!
);

// Test
const connected = await client.testConnection();
console.log("Connected:", connected);

// Get balance
const info = await client.getAccountInfo();
console.log("Balance:", info.balance, info.currency);
```

---

## Available APIs

| API | Purpose | Cost |
|-----|---------|------|
| `getSerpKeywords()` | Keyword rankings | $0.01/keyword |
| `getOnPageScore()` | Technical SEO score | $0.05/domain |
| `getCompetitorAnalysis()` | Competitor SERP analysis | $0.02/competitor |
| `getKeywordGap()` | Keyword gap analysis | $0.03/comparison |
| `getBacklinks()` | Backlink summary | $0.01/domain |
| `getLocalGeoPack()` | Local GEO rankings | $0.02/keyword |
| `getSocialSignals()` | Social engagement | $0 (placeholder) |

---

## Example Usage

### Run Complete SEO Audit
```typescript
import { AuditEngine } from "@/server/auditEngine";
import { TierLogic } from "@/server/tierLogic";

// Build audit config
const config = await TierLogic.buildAuditConfig(
  seoProfileId,
  organizationId
);

// Run audit
const engine = new AuditEngine();
const result = await engine.runAudit(config);

console.log("Health Score:", result.healthScore);
console.log("Recommendations:", result.recommendations);
```

### Get Keyword Rankings
```typescript
const client = new DataForSEOClient(
  process.env.DATAFORSEO_API_LOGIN!,
  process.env.DATAFORSEO_API_PASSWORD!
);

const rankings = await client.getSerpKeywords(
  "example.com",
  ["seo services", "digital marketing"]
);

rankings.forEach(r => {
  console.log(`${r.keyword}: Position ${r.position || 'N/A'}`);
});
```

---

## Cost Estimates

### Per-Audit Costs by Tier

- **Free**: $0.00 (no DataForSEO calls)
- **Starter**: $0.25 (20 keywords + on-page)
- **Pro**: $0.69 (50 keywords + 5 competitors + backlinks)
- **Enterprise**: $2.31 (200 keywords + 10 competitors + GEO)

### Monthly Costs (160 Users)

| Tier | Users | Audits | Total |
|------|-------|--------|-------|
| Free | 10 | 40 | $0 |
| Starter | 100 | 400 | $100 |
| Pro | 40 | 320 | $221 |
| Enterprise | 10 | 300 | $693 |
| **Total** | **160** | **1,060** | **$1,014/mo** |

**Annual**: $12,168
**Revenue**: $118,080
**Margin**: 89.7%

---

## Troubleshooting

### "Authentication failed"
→ Check password in `.env.local` (line 94)
→ Restart Claude Code

### "MCP server failed to start"
```bash
npm install -g dataforseo-mcp-server
```

### "Rate limit exceeded"
→ Limit: 2,000/min, 20,000/day
→ Implement exponential backoff
→ Check usage: https://app.dataforseo.com/usage

### "Insufficient balance"
→ Add funds: https://app.dataforseo.com/billing
→ Recommended: $100-500 initial deposit

---

## Documentation

- **Full Setup Guide**: `docs/DATAFORSEO_MCP_SETUP.md`
- **Phase 5 Documentation**: `docs/PHASE5_INTELLIGENCE_LAYER_FOUNDATION.md`
- **Phase 6 Documentation**: `docs/PHASE6_AUTONOMY_ENGINE_FOUNDATION.md`
- **DataForSEO Docs**: https://docs.dataforseo.com/v3/

---

**Status**: ✅ MCP Server Configured
**Next**: Enter password → Restart Claude Code → Test connection

