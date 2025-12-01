# APM Integration Guide

Complete guide for Application Performance Monitoring (APM) integration in Unite-Hub using Datadog and Sentry.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Datadog Setup](#datadog-setup)
5. [Sentry Setup](#sentry-setup)
6. [Usage Examples](#usage-examples)
7. [Metric Dashboard Setup](#metric-dashboard-setup)
8. [Alert Configuration](#alert-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Performance Best Practices](#performance-best-practices)

---

## Overview

Unite-Hub integrates with two APM services:

- **Datadog RUM & APM**: Real User Monitoring, performance tracking, metrics export
- **Sentry**: Error tracking, exception monitoring, performance monitoring

### Architecture

```
Application Request
    ↓
APM Middleware (request tracking)
    ↓
API Route Handler
    ├─→ Success → Track Performance → Export Metrics
    └─→ Error → Capture Exception → Send to Sentry
    ↓
Response (with request ID)
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Datadog Integration | `src/lib/apm/datadog-integration.ts` | RUM client, custom events |
| Sentry Integration | `src/lib/apm/sentry-integration.ts` | Error capture, performance tracking |
| Metrics Exporter | `src/lib/apm/metrics-exporter.ts` | Export metrics to Datadog API |
| APM Middleware | `src/middleware/apm-middleware.ts` | Request/response tracking |
| APM Config | `src/config/apm-config.ts` | Configuration management |
| Verification Script | `scripts/deploy/verify-apm.mjs` | Setup validation |

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @datadog/browser-rum @sentry/nextjs
```

### 2. Set Environment Variables

```bash
# .env.local

# Datadog (Client-side RUM)
NEXT_PUBLIC_DATADOG_APPLICATION_ID=your-app-id
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=your-client-token
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com

# Datadog (Server-side metrics)
DATADOG_API_KEY=your-api-key

# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

### 3. Initialize APM (Client-side)

Add to `src/app/layout.tsx`:

```typescript
import { initializeDatadog } from '@/lib/apm/datadog-integration';
import { initializeSentry } from '@/lib/apm/sentry-integration';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize APM services
    initializeDatadog();
    initializeSentry();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 4. Initialize Metrics Exporter (Server-side)

Add to `src/app/api/route.ts` or API initialization:

```typescript
import { initializeMetricsExporter } from '@/lib/apm/metrics-exporter';

// Initialize once on server startup
initializeMetricsExporter();
```

### 5. Verify Setup

```bash
node scripts/deploy/verify-apm.mjs
```

---

## Environment Variables

### Required Variables

#### Datadog RUM (Browser Monitoring)

```bash
NEXT_PUBLIC_DATADOG_APPLICATION_ID=abc123def456
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=pub_abc123def456
```

**Get these from**: Datadog → UX Monitoring → RUM Applications → Your App → Setup

#### Datadog API (Server-side Metrics)

```bash
DATADOG_API_KEY=abc123def456ghi789
```

**Get this from**: Datadog → Organization Settings → API Keys → New API Key

#### Sentry (Error Tracking)

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Get this from**: Sentry → Settings → Projects → Your Project → Client Keys (DSN)

### Optional Variables

```bash
# Datadog
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com  # Default: datadoghq.com
NEXT_PUBLIC_DATADOG_SERVICE=unite-hub   # Default: unite-hub
NEXT_PUBLIC_DATADOG_ENV=production      # Default: NODE_ENV
NEXT_PUBLIC_APP_VERSION=1.0.0           # For release tracking
DATADOG_API_URL=https://api.datadoghq.com  # Default
DATADOG_METRICS_BATCH_SIZE=100          # Default: 100

# Sentry
SENTRY_ENVIRONMENT=production           # Default: NODE_ENV
SENTRY_RELEASE=v1.0.0                   # For release tracking
SENTRY_ENABLED=true                     # Default: true

# APM
DEPLOYMENT_REGION=us-east-1             # For regional tagging
```

### Environment-based Behavior

| Environment | Traces Sampling | Session Replay | Metrics Export |
|-------------|----------------|----------------|----------------|
| Production  | 10%            | 5%             | 100%           |
| Staging     | 100%           | 100%           | 100%           |
| Development | 0%             | 0%             | 0%             |
| Test        | 0%             | 0%             | 0%             |

---

## Datadog Setup

### 1. Create RUM Application

1. Go to Datadog → **UX Monitoring** → **RUM Applications**
2. Click **New Application**
3. Select **JS** as application type
4. Name: `unite-hub` (or your service name)
5. Copy **Application ID** and **Client Token**

### 2. Create API Key

1. Go to Datadog → **Organization Settings** → **API Keys**
2. Click **New Key**
3. Name: `unite-hub-metrics`
4. Copy the API key

### 3. Configure RUM

```typescript
import { datadogIntegration } from '@/lib/apm/datadog-integration';

// Initialize with custom config
await datadogIntegration.initialize({
  applicationId: 'your-app-id',
  clientToken: 'your-client-token',
  site: 'datadoghq.com',
  service: 'unite-hub',
  env: 'production',
  version: '1.0.0',
  sessionSampleRate: 10,
  sessionReplaySampleRate: 5,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
```

### 4. Set User Context

```typescript
import { datadogIntegration } from '@/lib/apm/datadog-integration';

datadogIntegration.setUser({
  id: user.id,
  name: user.name,
  email: user.email,
  workspaceId: user.workspaceId,
  organizationId: user.organizationId,
});
```

### 5. Track Custom Events

```typescript
datadogIntegration.trackEvent({
  name: 'campaign_created',
  attributes: {
    campaignId: campaign.id,
    type: campaign.type,
    workspaceId: workspace.id,
  },
});
```

### 6. Track Custom Metrics

```typescript
datadogIntegration.trackMetric({
  name: 'api.response.time',
  value: 145, // milliseconds
  tags: {
    endpoint: '/api/campaigns',
    method: 'POST',
  },
});
```

---

## Sentry Setup

### 1. Create Project

1. Go to Sentry → **Projects** → **Create Project**
2. Platform: **Next.js**
3. Name: `unite-hub`
4. Copy the **DSN**

### 2. Configure Sentry

```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

sentryIntegration.initialize({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: 'production',
  release: 'v1.0.0',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
  enabled: true,
});
```

### 3. Set User Context

```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

sentryIntegration.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
  workspaceId: user.workspaceId,
  organizationId: user.organizationId,
});
```

### 4. Capture Exceptions

```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

try {
  await riskyOperation();
} catch (error) {
  sentryIntegration.captureException(error as Error, {
    tags: {
      operation: 'campaign_creation',
      workspaceId: workspace.id,
    },
    extra: {
      campaignData: campaign,
    },
    level: 'error',
  });
}
```

### 5. Track Performance

```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

const result = await sentryIntegration.withPerformanceTracking(
  'campaign_creation',
  'task',
  async () => {
    return await createCampaign(data);
  }
);
```

---

## Usage Examples

### Wrap API Route with APM

```typescript
import { withAPMMiddleware } from '@/middleware/apm-middleware';

export const POST = withAPMMiddleware(async (req: NextRequest) => {
  const data = await req.json();

  // Your route logic here
  const result = await createCampaign(data);

  return Response.json({ success: true, data: result });
});
```

### Track Database Query

```typescript
import { trackDatabaseQuery } from '@/lib/apm/metrics-exporter';

const startTime = Date.now();

const contacts = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId);

const duration = Date.now() - startTime;

trackDatabaseQuery('select', 'contacts', duration, contacts.data?.length);
```

### Track Cache Operation

```typescript
import { trackCacheOperation } from '@/lib/apm/metrics-exporter';

const startTime = Date.now();

const cached = await redis.get(cacheKey);
const duration = Date.now() - startTime;

trackCacheOperation(
  cached ? 'hit' : 'miss',
  cacheKey,
  duration
);
```

### Track AI Token Usage

```typescript
import { trackAITokens } from '@/lib/apm/metrics-exporter';

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  messages: [{ role: 'user', content: 'Hello' }],
});

trackAITokens(
  'claude-sonnet-4-5-20250929',
  response.usage.input_tokens,
  response.usage.output_tokens,
  calculateCost(response.usage),
  'content_generation'
);
```

### Add Breadcrumbs

```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

sentryIntegration.addBreadcrumb({
  type: 'user',
  category: 'action',
  message: 'User clicked create campaign button',
  level: 'info',
  data: {
    campaignType: 'drip',
    workspaceId: workspace.id,
  },
});
```

---

## Metric Dashboard Setup

### Datadog Dashboard

1. Go to Datadog → **Dashboards** → **New Dashboard**
2. Name: `Unite-Hub Performance`

#### Recommended Widgets:

**1. API Request Rate**
```
Metric: unite_hub.http.request.count
Visualization: Timeseries
Group by: path, method
```

**2. API Latency (P95)**
```
Metric: unite_hub.http.request.duration
Visualization: Timeseries
Aggregation: p95
Group by: path
```

**3. Error Rate**
```
Metric: unite_hub.http.request.errors
Visualization: Query Value
Formula: (errors / total_requests) * 100
```

**4. Database Query Performance**
```
Metric: unite_hub.database.query.duration
Visualization: Heatmap
Group by: table, operation
```

**5. Cache Hit Rate**
```
Metric: unite_hub.cache.hit_rate
Visualization: Timeseries
Formula: (hits / (hits + misses)) * 100
```

**6. AI Token Usage**
```
Metric: unite_hub.ai.tokens.total
Visualization: Timeseries
Group by: model, operation
```

**7. AI Cost**
```
Metric: unite_hub.ai.cost
Visualization: Query Value
Aggregation: sum
Group by: model
```

### Sample Dashboard JSON

```json
{
  "title": "Unite-Hub Performance",
  "widgets": [
    {
      "definition": {
        "title": "API Request Rate",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:unite_hub.http.request.count{*} by {path,method}.as_rate()",
            "display_type": "line"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "API Latency (P95)",
        "type": "timeseries",
        "requests": [
          {
            "q": "p95:unite_hub.http.request.duration{*} by {path}",
            "display_type": "line"
          }
        ]
      }
    }
  ]
}
```

---

## Alert Configuration

### Datadog Alerts

#### 1. High Error Rate

```
Metric: unite_hub.http.request.errors
Condition: sum(last_5m) > 100
Alert message: High error rate detected
Notify: @slack-alerts @pagerduty
```

#### 2. Slow API Endpoints

```
Metric: unite_hub.http.request.duration
Condition: p95(last_5m) > 2000
Alert message: API endpoint is slow (p95 > 2s)
Notify: @slack-alerts
```

#### 3. Low Cache Hit Rate

```
Metric: unite_hub.cache.hit_rate
Condition: avg(last_15m) < 60
Alert message: Cache hit rate below 60%
Notify: @slack-alerts
```

#### 4. High AI Cost

```
Metric: unite_hub.ai.cost
Condition: sum(last_1h) > 100
Alert message: High AI API costs (> $100/hour)
Notify: @slack-alerts @email
```

### Sentry Alerts

1. Go to Sentry → **Alerts** → **Create Alert Rule**

#### Alert Rule Examples:

**High Error Volume**
```
Conditions:
- Event count >= 50
- In 1 minute
- Filter: environment:production

Actions:
- Send notification to: Slack #alerts
```

**New Error Type**
```
Conditions:
- First seen event
- Filter: environment:production

Actions:
- Send notification to: Slack #alerts
```

**Performance Degradation**
```
Conditions:
- Transaction duration (p95) >= 2000ms
- In 10 minutes
- Filter: transaction:/api/*

Actions:
- Send notification to: Slack #alerts
```

---

## Troubleshooting

### Datadog Not Receiving Data

**Check 1: Verify API Key**
```bash
curl -X GET "https://api.datadoghq.com/api/v1/validate" \
  -H "DD-API-KEY: your-api-key"
```

**Check 2: Verify RUM Configuration**
```bash
node scripts/deploy/verify-apm.mjs
```

**Check 3: Check Browser Console**
- Open DevTools → Console
- Look for Datadog initialization messages
- Check for CORS errors

**Check 4: Verify Environment Variables**
```bash
printenv | grep DATADOG
```

### Sentry Not Capturing Errors

**Check 1: Verify DSN**
```bash
curl -X POST "https://sentry.io/api/0/projects/your-org/your-project/keys/" \
  -H "Authorization: Bearer your-auth-token"
```

**Check 2: Test Error Capture**
```typescript
import { sentryIntegration } from '@/lib/apm/sentry-integration';

sentryIntegration.captureMessage('Test error', 'error');
```

**Check 3: Check Sentry Dashboard**
- Go to Sentry → Issues
- Filter by: Last 24 hours
- Look for test events

### Metrics Not Appearing

**Check 1: Verify Metrics Exporter Initialization**
```typescript
import { metricsExporter } from '@/lib/apm/metrics-exporter';

console.log('Metrics exporter enabled:', metricsExporter.isEnabled());
console.log('Queue size:', metricsExporter.getQueueSize());
```

**Check 2: Manually Flush Metrics**
```typescript
await metricsExporter.flush();
```

**Check 3: Check Datadog Metrics Explorer**
- Go to Datadog → Metrics → Explorer
- Search for: `unite_hub.*`
- Check if any metrics appear

### High Latency Impact

**Check 1: Verify Sampling Rates**
```typescript
import { getAPMConfig } from '@/config/apm-config';

const config = getAPMConfig();
console.log('Sampling rates:', config.sampling);
```

**Check 2: Reduce Sampling in Production**
```bash
# .env.production
NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE=5  # 5% instead of 10%
```

**Check 3: Disable Session Replay**
```bash
# .env.production
NEXT_PUBLIC_DATADOG_SESSION_REPLAY_RATE=0
```

---

## Performance Best Practices

### 1. Use Appropriate Sampling Rates

```typescript
// Production
sessionSampleRate: 0.1,  // 10% sampling
sessionReplaySampleRate: 0.05,  // 5% replay

// Staging
sessionSampleRate: 1.0,  // 100% sampling
sessionReplaySampleRate: 1.0,  // 100% replay
```

### 2. Batch Metrics Export

```typescript
// Set batch size
metricsExporter.initialize(apiKey, {
  batchSize: 100,  // Send every 100 metrics
});
```

### 3. Filter Sensitive Data

```typescript
// Configure in Sentry initialization
beforeSend: (event) => {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
  }
  return event;
};
```

### 4. Use Request IDs

```typescript
// Automatically added by APM middleware
const requestId = req.headers.get('x-request-id');
```

### 5. Tag All Metrics

```typescript
trackApiPerformance('POST', '/api/campaigns', 200, 145);
// Automatically tagged with: method, path, status, status_class
```

### 6. Set User Context Early

```typescript
// In authentication callback
if (user) {
  datadogIntegration.setUser(user);
  sentryIntegration.setUser(user);
}
```

### 7. Use Error Boundaries

```typescript
import { withErrorBoundary } from '@/lib/errors';

export const POST = withErrorBoundary(
  withAPMMiddleware(async (req) => {
    // Your route logic
  })
);
```

### 8. Monitor Performance Impact

```typescript
// Check APM overhead
const start = Date.now();
await apmOperation();
const overhead = Date.now() - start;

if (overhead > 5) {
  console.warn('APM overhead too high:', overhead);
}
```

---

## Cost Optimization

### Datadog Cost Factors

| Feature | Cost Driver | Optimization |
|---------|-------------|--------------|
| RUM Sessions | Session count | Reduce sample rate in production |
| Session Replay | Replay hours | Sample only errors (100%) |
| Custom Metrics | Metric volume | Batch exports, aggregate data |
| Logs | Log volume | Filter noise, use structured logging |

### Sentry Cost Factors

| Feature | Cost Driver | Optimization |
|---------|-------------|--------------|
| Errors | Event count | Filter known errors, set rate limits |
| Transactions | Transaction count | Reduce trace sample rate |
| Replays | Replay hours | Sample errors only |

### Cost Monitoring

```typescript
// Track metric export count
metricsExporter.getQueueSize();

// Monitor error capture rate
const errorRate = (errorCount / totalRequests) * 100;
```

---

## Next Steps

1. ✅ Complete environment setup
2. ✅ Run verification script
3. ✅ Create Datadog dashboards
4. ✅ Configure Sentry alerts
5. ✅ Test error reporting
6. ✅ Monitor performance impact
7. ✅ Optimize sampling rates
8. ✅ Document custom metrics

---

## Support

- **Datadog Documentation**: https://docs.datadoghq.com/
- **Sentry Documentation**: https://docs.sentry.io/
- **Internal Documentation**: See `CLAUDE.md` for system architecture

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
