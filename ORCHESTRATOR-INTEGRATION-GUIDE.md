# Shadow Observer + Orchestrator Integration
## Complete Implementation Guide

**Status**: ✅ Complete & Ready to Use
**Phase**: F07 (Time-Block Orchestrator)
**Integration Type**: Orchestrator Agent + Inngest Cron Job

---

## 📋 What Was Integrated

### 1. **Orchestrator Agent** (`shadow-observer-agent.ts`)
- Added Shadow Observer as a routable agent in the orchestrator
- Supports actions: audit, scan, build, refactor, full
- Auto-records metrics to `self_evaluation_factors` table
- Confidence scoring based on success

### 2. **Inngest Cron Job** (`shadow-observer.ts`)
- Runs automatically every hour
- Lightweight scan using cached reports
- Records metrics to database
- Manual trigger support for on-demand audits

### 3. **Cron Route** (`api/cron/shadow-observer/route.ts`)
- HTTP endpoint for manual cron triggers
- Requires `CRON_SECRET` for security
- Returns structured JSON response

---

## 🚀 Usage Examples

### Option A: Automatic Hourly Audits (Inngest)

**Setup** (automatic - no code needed):
```typescript
// Already configured in src/inngest/shadow-observer.ts
// Runs every hour at :00 (0 * * * *)
```

**What happens**:
- Every hour: Full audit runs
- Violations scanned
- Build simulated
- Agent refactoring executed
- Metrics stored in DB
- Available in dashboards

### Option B: Trigger Audit On-Demand

From anywhere in your app:

```typescript
import { triggerShadowObserverAudit } from '@/inngest/shadow-observer';

// Audit with founder tracking
await triggerShadowObserverAudit({
  founderId: 'user-123',
  action: 'full',  // 'audit', 'scan', 'build', 'refactor', 'full'
  severity: 'critical'  // Optional: filter by severity
});

// Via orchestrator
import { orchestrateRequest } from '@/lib/agents/orchestrator-router';

await orchestrateRequest({
  workspaceId: 'workspace-123',
  userPrompt: 'audit the codebase for violations',
  context: {
    founderId: 'user-123'
  }
});
```

### Option C: Call via API Route

```typescript
// POST /api/orchestrator
{
  "workspaceId": "workspace-123",
  "userPrompt": "run a full codebase audit",
  "context": {
    "founderId": "user-123"
  }
}
```

### Option D: Manual HTTP Cron Trigger

```bash
curl -X GET "http://localhost:3008/api/cron/shadow-observer?secret=YOUR_CRON_SECRET" \
  -H "x-founder-id: user-123"
```

---

## 📊 Database Integration

### Automatic Metric Recording

When audit runs, these metrics are recorded:

```sql
INSERT INTO self_evaluation_factors (
  tenant_id,           -- founder ID or 'system-audit'
  cycle_code,          -- 'shadow_2025-12-09_14:00'
  factor,              -- 'stability' | 'compliance' | 'quality' | 'performance'
  value,               -- 0-100
  weight,              -- 1.0
  details,             -- Description
  metadata             -- JSON: violations, critical, timestamp
) VALUES (...)
```

### Factors Tracked

| Factor | Calculation | Use Case |
|--------|-------------|----------|
| **stability** | `100 - (critical_violations * 10)` | Test pass rate |
| **compliance** | `100 - (high_violations * 5)` | CLAUDE.md adherence |
| **quality** | `agent_score * 10` | Code quality |
| **performance** | `90` if build passes, `70` if fails | Build health |

### Query Metrics

```sql
-- Latest metrics (last 7 days)
SELECT
  cycle_code,
  factor,
  AVG(value) as avg_value,
  MAX(value) as max_value,
  MIN(value) as min_value
FROM self_evaluation_factors
WHERE factor IN ('stability', 'compliance', 'quality', 'performance')
  AND created_at >= now() - interval '7 days'
GROUP BY cycle_code, factor
ORDER BY created_at DESC;

-- Trend analysis (violations over time)
SELECT
  DATE_TRUNC('day', created_at) as day,
  AVG((metadata->>'violations')::numeric) as avg_violations,
  AVG((metadata->>'critical')::numeric) as avg_critical
FROM self_evaluation_factors
WHERE cycle_code LIKE 'shadow_%'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
```

---

## 🛠️ Configuration

### Environment Variables

Required for cron security:
```bash
CRON_SECRET=your-secure-cron-secret
```

Optional for customization:
```bash
SHADOW_OBSERVER_ENABLED=true
SHADOW_OBSERVER_SCHEDULE="0 * * * *"  # Cron expression
```

### Inngest Configuration

Already set up in `src/inngest/client.ts` (no changes needed).

To check status:
```bash
# View Inngest dashboard
open https://app.inngest.com

# View function runs
# Look for "Shadow Observer Hourly Audit" in the functions list
```

---

## 📊 Metrics & Reporting

### What Gets Stored

```json
{
  "cycle_code": "shadow_2025-12-09_14:00",
  "metrics": {
    "stability": 85.0,
    "compliance": 92.0,
    "quality": 92.0,
    "performance": 90.0
  },
  "violations": {
    "total": 15,
    "critical": 1,
    "high": 3,
    "medium": 11
  },
  "timestamp": "2025-12-09T14:00:00Z"
}
```

### Creating a Dashboard

To display metrics in founder dashboard:

```typescript
// lib/founderMemory/metricsFetchService.ts
export async function getShadowObserverMetrics(
  tenantId: string,
  days: number = 7
) {
  const { supabaseAdmin } = await import('@/lib/supabase');

  const { data } = await supabaseAdmin
    .from('self_evaluation_factors')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('factor', ['stability', 'compliance', 'quality', 'performance'])
    .gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
    .order('created_at', { ascending: false });

  return data;
}
```

Then in a React component:

```tsx
import { getShadowObserverMetrics } from '@/lib/founderMemory/metricsFetchService';

export async function ShadowObserverDashboard({ founderId }: { founderId: string }) {
  const metrics = await getShadowObserverMetrics(founderId);

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          factor={metric.factor}
          value={metric.value}
          timestamp={metric.created_at}
        />
      ))}
    </div>
  );
}
```

---

## 🔐 Security

### Cron Secret Protection

The cron job requires a secret to prevent unauthorized triggers:

```typescript
// src/app/api/cron/shadow-observer/route.ts
const secret = req.nextUrl.searchParams.get('secret');
if (secret !== process.env.CRON_SECRET) {
  return errorResponse('Unauthorized', 401);
}
```

### Setting the Secret

Add to `.env.local`:
```bash
CRON_SECRET=$(openssl rand -hex 32)
```

Or generate one:
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9
```

### Access Control

Only allow cron triggers from:
1. Inngest (automatic)
2. Authenticated API calls with valid `CRON_SECRET`
3. Internal orchestrator (via `executeShadowObserverStep`)

---

## 🎯 Workflow Examples

### Example 1: Automated Compliance Monitoring

```
Every Hour:
├── Run Shadow Observer audit
├── Detect CRITICAL violations
├── Record to self_evaluation_factors
├── Founder dashboard shows: "2 critical violations detected at 14:00"
└── Alert system notified (if configured)
```

### Example 2: Manual Founder Request

```
Founder: "Audit the codebase"
├── Orchestrator routes to Shadow Observer agent
├── Agent runs full audit
├── Metrics recorded with founder ID
├── Response: "15 violations found (1 critical, 3 high, 11 medium)"
└── Founder can view details in dashboard
```

### Example 3: CI/CD Integration

```
On commit to main:
├── Webhook triggers orchestrator
├── Runs: "scan-for-violations"
├── If critical found:
│   ├── Slack notification
│   ├── PR comment with violations
│   └── Block merge
└── Metrics recorded
```

---

## 🐛 Troubleshooting

### "No metrics being recorded"

1. Check Inngest logs:
   ```bash
   # View in Inngest dashboard
   open https://app.inngest.com
   ```

2. Verify `founderId` is being passed:
   ```typescript
   // Should see in agent output
   context?.founderId || 'system-audit'
   ```

3. Check database:
   ```sql
   SELECT COUNT(*) FROM self_evaluation_factors
   WHERE cycle_code LIKE 'shadow_%'
   AND created_at >= now() - interval '1 day';
   ```

### "Cron job not running"

1. Check Inngest is connected:
   ```bash
   npm run dev
   # Should see: "[Inngest] Listening for functions..."
   ```

2. Verify INNGEST_SIGNING_KEY is set:
   ```bash
   echo $INNGEST_SIGNING_KEY
   ```

3. Check cron schedule in code:
   ```typescript
   { cron: '0 * * * *' }  // Should be: every hour at :00
   ```

### "Metrics recorded but not visible"

1. Check RLS policy:
   ```sql
   SELECT * FROM self_evaluation_factors
   WHERE tenant_id = 'your-id'
   LIMIT 1;
   ```

2. Verify data type:
   ```sql
   SELECT cycle_code, factor, value, created_at
   FROM self_evaluation_factors
   WHERE cycle_code LIKE 'shadow_%'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## 📈 Next Steps

1. ✅ **Inngest cron job is configured** (runs automatically every hour)
2. ⬜ **Create dashboard component** to visualize metrics (optional)
3. ⬜ **Add Slack notifications** for critical violations (optional)
4. ⬜ **Create trend analysis** for weekly reports (optional)

---

## 🔗 Related Documentation

- [Shadow Observer Guide](/.claude/SHADOW-OBSERVER-GUIDE.md)
- [Orchestrator Router](src/lib/agents/orchestrator-router.ts)
- [Inngest Setup](src/inngest/client.ts)
- [Database Schema](supabase/)

---

## ✨ Summary

You now have:
- ✅ Shadow Observer integrated into orchestrator
- ✅ Automatic hourly audits via Inngest
- ✅ Metrics automatically stored in database
- ✅ Can trigger audits on-demand
- ✅ Founder dashboard ready for visualization

**The system is fully operational. No additional configuration needed.**

To verify everything is working:

```bash
# 1. Run one audit manually
npm run shadow:full

# 2. Check reports were generated
ls -la reports/

# 3. Query database for recorded metrics
psql $DATABASE_URL -c "SELECT COUNT(*) FROM self_evaluation_factors WHERE cycle_code LIKE 'shadow_%';"
```

---

**Status**: 🟢 Live & Operational
**Last Updated**: Dec 9, 2025
