# WebSocket Setup Guide - Ably Integration

**Status**: Production-ready
**Provider**: Ably (https://ably.com)
**Cost**: $29/mo base + usage (200 connections included)

---

## 1. Environment Setup

Add to `.env.local` and production env:

```bash
# Ably Real-Time Authentication
ABLY_API_KEY=your_ably_api_key_here

# Optional: Ably configuration
ABLY_LOG_LEVEL=2  # 0=errors, 1=warnings, 2=debug (default)
```

## 2. Ably Account Setup

### Create Ably Account
1. Go to https://ably.com/
2. Sign up for free account (includes 200 connections)
3. Create application in dashboard
4. Copy API key (appears as `YOUR_API_KEY`)

### Verification
```bash
curl -s "https://rest.ably.io/stats" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq .
```

---

## 3. Server-Side Integration

### Already Configured ✅

**Ably Client Initialization** (`src/lib/realtime/ably-client.ts`):
```typescript
// Auto-initializes on first use with lazy-loading singleton
const client = getAblyClient();

// Publishes threat via channel
await publishThreat(workspaceId, threat);

// Publishes monitoring status
await publishMonitoringStatus(workspaceId, status);
```

**Threat Detection Integration** (`src/lib/monitoring/seo-threat-monitor.ts`):
```typescript
// Automatically broadcasts critical threats to WebSocket
await broadcastThreatAlert(workspaceId, threat, ['websocket']);
```

**Cron Scheduler Integration** (`src/lib/monitoring/cron-scheduler.ts`):
```typescript
// Publishes monitoring completion and threat summary
await publishMonitoringStatusToWebSocket(workspaceId, domain, threats);
```

### API Endpoint

**Token Generation** (`src/app/api/realtime/token/route.ts`):
```typescript
// POST /api/realtime/token?workspaceId=xxx
// Returns: { token: "...", expiresIn: 3600 }
```

---

## 4. Client-Side Integration

### React Hook Usage

**In Dashboard Components**:
```typescript
'use client';

import { useRealTimethreats } from '@/lib/hooks/useRealTimethreats';

export function ThreatDashboard({ workspaceId }) {
  const {
    threats,      // Array of threat updates
    summary,      // { total, critical, high, medium, low }
    loading,      // boolean
    error,        // Error | null
    isConnected,  // boolean
    reconnect,    // function
  } = useRealTimethreats(workspaceId, 'example.com');

  if (loading) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Threats: {summary?.total || 0}</div>
      <div>Critical: {summary?.critical || 0}</div>
      {/* Render threats... */}
    </div>
  );
}
```

### Features

✅ **Real-Time Updates**: <1s latency for threat notifications
✅ **Automatic Reconnection**: Handles network failures gracefully
✅ **Fallback Polling**: If WebSocket unavailable, polls every 30s
✅ **Multi-Workspace**: Workspace-scoped token + channels
✅ **Battery-Efficient**: Closes connections on unmount
✅ **Browser Compatibility**: WebSocket → XHR → Polling fallback

---

## 5. Data Flow

```
┌─────────────────────────────────┐
│ Cron Scheduler (6-hour interval)│
│ executeMonitoringCheck()        │
└────────────────┬────────────────┘
                 │
         ┌───────▼────────┐
         │ detectThreats()│
         └───────┬────────┘
                 │
         ┌───────▼──────────────┐
         │ Store in database    │
         └───────┬──────────────┘
                 │
         ┌───────▼──────────────────────────┐
         │ broadcastThreatAlert()           │
         │ → publishThreat() via Ably       │
         └───────┬──────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────────────┐  ┌──────▼────────────┐
│ WebSocket Client │  │ API Fallback Poll │
│ (real-time)      │  │ (every 30s)       │
└───────┬──────────┘  └──────┬────────────┘
        │                    │
        └────────┬───────────┘
                 │
         ┌───────▼──────────┐
         │ useRealTimethreats
         │ Hook updates UI  │
         └──────────────────┘
```

---

## 6. Monitoring Channel Structure

### Channel Names
```
threats:workspace-{workspaceId}
```

### Message Types

**Threat Detection**:
```json
{
  "type": "threat",
  "name": "threat_detected",
  "data": {
    "type": "threat_detected",
    "threat": {
      "id": "threat-123",
      "type": "ranking_drop",
      "severity": "critical",
      "domain": "example.com",
      "title": "Ranking drop detected",
      "description": "...",
      "detectedAt": "2026-01-11T12:00:00Z",
      "impactEstimate": "High - 10-20% traffic loss",
      "recommendedAction": "...",
      "data": { "affectedKeywords": [...] }
    },
    "timestamp": "2026-01-11T12:00:00Z"
  }
}
```

**Monitoring Status**:
```json
{
  "type": "status",
  "name": "monitoring_status",
  "data": {
    "type": "monitoring_status",
    "status": {
      "domain": "example.com",
      "checkCompletedAt": "2026-01-11T12:00:00Z",
      "nextCheckAt": "2026-01-11T18:00:00Z",
      "threatsDetected": 3
    },
    "timestamp": "2026-01-11T12:00:00Z"
  }
}
```

**Threat Summary**:
```json
{
  "type": "summary",
  "name": "threat_summary",
  "data": {
    "type": "threat_summary",
    "summary": {
      "domain": "example.com",
      "total": 5,
      "critical": 1,
      "high": 2,
      "medium": 2,
      "low": 0,
      "mostRecent": "2026-01-11T12:00:00Z"
    },
    "timestamp": "2026-01-11T12:00:00Z"
  }
}
```

---

## 7. Security & Multi-Tenancy

### Token Scope
```typescript
// Each token is workspace-scoped:
capability: {
  "threats:workspace-{workspaceId}": ["subscribe"]
}
```

✅ **No Cross-Workspace Access**: Token can only subscribe to their workspace channel
✅ **No Publishing Rights**: Clients cannot publish (server-only)
✅ **1-Hour TTL**: Tokens expire after 1 hour, forcing re-auth
✅ **Server-Side Validation**: API validates workspaceId before token generation

---

## 8. Performance & Limits

| Metric | Value | Notes |
|--------|-------|-------|
| **Message Latency** | <1s | Real-time delivery |
| **Connections/Plan** | 200 | Base Ably plan |
| **Monthly Messages** | 10M | Included in plan |
| **Polling Interval** | 30s | Fallback frequency |
| **Threat History** | 20 | Recent threats stored |
| **Circuit Breaker** | 3/day | Max alerts per workspace |

### Scaling
- **1-5 workspaces**: Fits in $29/mo plan (200 connections)
- **5-50 workspaces**: Upgrade to $129/mo plan (1000 connections)
- **50+ workspaces**: Enterprise plan (~$500+/mo)

---

## 9. Testing

### Local Development

```bash
# 1. Add ABLY_API_KEY to .env.local
export ABLY_API_KEY=your_test_key

# 2. Run tests
npm run test tests/unit/realtime/

# 3. Start dev server
npm run dev

# 4. Open dashboard and trigger threat detection
```

### Integration Testing

```typescript
// Simulate threat in console:
const { publishThreat } = await import('@/lib/realtime/ably-client');
await publishThreat('test-workspace', {
  id: 'test-threat',
  type: 'ranking_drop',
  severity: 'critical',
  domain: 'example.com',
  title: 'Test Threat',
  description: 'Test',
  detectedAt: new Date().toISOString(),
  impactEstimate: 'High',
  recommendedAction: 'Test action',
  data: {},
});
```

---

## 10. Troubleshooting

### Connection Fails
```
Problem: "Connection failed: authentication failed"
Solution: Verify ABLY_API_KEY is set correctly in .env
```

### Token Generation Fails
```
Problem: "Failed to get authentication token"
Solution: Check /api/realtime/token endpoint returns 200 OK
```

### No Real-Time Updates
```
Problem: Threats detected but UI not updating
Solution: Check isConnected value - if false, fallback polling active
         Verify no browser console errors
```

### High Latency
```
Problem: >1s delay for threat updates
Solution: Check network connection quality
         Verify not exceeding plan message limits
         Consider increasing Ably plan size
```

---

## 11. Monitoring

### Ably Dashboard
- https://dashboard.ably.io/ → Your App → Statistics
- Monitor: connections, messages, bandwidth

### Integration Health Check

```typescript
// Check Ably health:
const health = await checkAblyHealth();
console.log(health);
// { status: 'connected', uptime: 12345, connectedChannels: 5 }
```

---

## 12. Production Deployment

### Environment Variables
```bash
# Add to Vercel/DigitalOcean secrets:
ABLY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Monitoring
- Alert if `isConnected === false` for >5 minutes
- Track message latency in Datadog
- Monitor token generation API latency

### Capacity Planning
- Current setup: 200 concurrent connections (1 per monitoring browser)
- At scale: ~20-50 connections/hour during peak times
- Should upgrade to larger plan at 100+ workspaces

---

## 13. Cost Estimates

**Current**: Ably $29/mo (200 included connections)

**Scaling**:
- <10 workspaces: $29/mo
- <100 workspaces: $129/mo
- <1000 workspaces: $500+/mo (enterprise)

**Alternative**: Self-hosted Socket.io would require DevOps overhead (~$200+/mo infrastructure)

---

## 14. Next Steps

### Immediate (Complete ✅)
- [x] Ably account setup
- [x] Server-side integration (publishThreat, publishStatus)
- [x] Client-side hook (useRealTimethreats)
- [x] API token endpoint
- [x] Error handling and fallbacks
- [x] Tests and documentation

### Phase 3B (Alert System)
- [ ] Slack integration (webhook notifications)
- [ ] Email alerts (Sendgrid/Resend)
- [ ] Alert customization (frequency, quiet hours)
- [ ] User notification preferences

### Future (Phase 4)
- [ ] Presence tracking (see who's watching dashboard)
- [ ] Broadcast "danger zone" warnings
- [ ] Real-time competitor activity updates
- [ ] Dashboard animations for threat severity

---

## 15. Support

**Ably Docs**: https://ably.com/documentation
**SDK Docs**: https://github.com/ably/ably-js
**Support**: https://support.ably.io/

---

**Setup Complete ✅**

WebSocket integration is production-ready. Monitor the Ably dashboard for performance metrics and upgrade plan as workspaces scale.

*Last Updated: 2026-01-11*
