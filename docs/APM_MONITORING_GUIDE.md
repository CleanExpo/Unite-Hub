# APM Monitoring Guide

## Overview

Unite-Hub includes comprehensive Application Performance Monitoring (APM) for production deployments. The APM system tracks:

- **Request/Response Metrics** - HTTP request latency, status codes, throughput
- **Database Queries** - Query performance, table access patterns, connection usage
- **AI Service Calls** - Model usage, token consumption, latency, costs
- **Error Tracking** - Exceptions with full context and stack traces
- **Custom Metrics** - Counters, gauges, histograms for business metrics
- **Health Checks** - Automated monitoring of system components

## Quick Start

### 1. Enable APM

Add to `.env.local`:

```env
# Enable APM
ENABLE_APM=true

# Choose provider: "datadog", "opentelemetry", or "custom"
APM_PROVIDER=datadog

# Service identification
APM_SERVICE_NAME=unite-hub

# Sample 100% of requests in staging, 30% in production
APM_SAMPLE_RATE=0.3

# Flush metrics every 10 seconds
APM_FLUSH_INTERVAL=10000
```

### 2. Configure Provider

**Datadog**:
```env
DD_API_KEY=your-datadog-api-key
DD_SITE=datadoghq.com
DD_SERVICE=unite-hub
DD_ENV=production
```

**OpenTelemetry**:
```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=unite-hub
```

### 3. Use APM in Code

```typescript
import { apm } from '@/lib/monitoring/apm';

// Track HTTP requests
const span = apm.startHTTPSpan('POST', '/api/contacts');
// ... handle request
span.finish({ statusCode: 200 });

// Track database queries
const dbSpan = apm.startDatabaseSpan('SELECT', 'contacts');
// ... execute query
dbSpan.finish({ rowCount: 10 });

// Track AI calls
const aiSpan = apm.startAISpan('claude-sonnet-4-5', 'content-generation');
// ... call AI
aiSpan.finish({ tokens: 1500, cost: 0.015 });
```

## Usage Patterns

### Automatic Request Tracking

Use middleware wrapper for API routes:

```typescript
import { withAPMTracking } from '@/lib/monitoring/apm';

export const POST = withAPMTracking(async (req: NextRequest) => {
  // Your handler code
  return NextResponse.json({ success: true });
});
```

### Database Query Tracking

Wrap database operations:

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring/apm';

const contacts = await trackDatabaseQuery('SELECT', 'contacts', async () => {
  return await supabase.from('contacts').select('*').eq('workspace_id', workspaceId);
});
```

### AI Service Call Tracking

Track AI API calls:

```typescript
import { trackAICall } from '@/lib/monitoring/apm';

const result = await trackAICall('claude-sonnet-4-5', 'intent-extraction', async () => {
  return await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    messages: [{ role: 'user', content: emailContent }],
  });
});
```

### Custom Metrics

Record business metrics:

```typescript
import { apm } from '@/lib/monitoring/apm';

// Increment counter
apm.incrementCounter('contacts.created', 1, {
  workspace_id: workspaceId,
  source: 'api',
});

// Set gauge
apm.setGauge('active_users', activeUserCount);

// Record histogram
apm.recordHistogram('email.processing_time', processingTimeMs);
```

### Error Tracking

Track errors with context:

```typescript
import { apm } from '@/lib/monitoring/apm';

try {
  await processEmail(emailId);
} catch (error) {
  apm.trackError(error as Error, {
    email_id: emailId,
    workspace_id: workspaceId,
    operation: 'email_processing',
  });
  throw error;
}
```

### Nested Spans

Create child spans for detailed tracking:

```typescript
const parentSpan = apm.startSpan('email.process');

// Child span 1
const extractSpan = apm.startSpan('email.extract_intent', parentSpan.getContext());
// ... extract intent
extractSpan.finish();

// Child span 2
const scoreSpan = apm.startSpan('email.calculate_score', parentSpan.getContext());
// ... calculate score
scoreSpan.finish();

parentSpan.finish();
```

## Health Checks

### System Health Endpoint

GET `/api/health/system` returns:

```json
{
  "status": "healthy",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "latency": 45,
      "lastChecked": 1705334400000
    },
    {
      "name": "redis",
      "status": "healthy",
      "latency": 12,
      "lastChecked": 1705334400000
    },
    {
      "name": "ai_service",
      "status": "healthy",
      "lastChecked": 1705334400000
    }
  ],
  "timestamp": 1705334400000,
  "uptime": 3600000,
  "version": "1.0.0"
}
```

**Status Codes**:
- `200` - All systems healthy
- `206` - Some systems degraded but operational
- `503` - Critical systems unhealthy

### Custom Health Checks

Add custom health checks:

```typescript
import { healthCheckManager } from '@/lib/monitoring/health-checks';

const customCheck = await healthCheckManager.performHealthCheck(
  'external_api',
  async () => {
    const response = await fetch('https://api.example.com/health');
    return response.ok;
  }
);
```

## Metrics Reference

### HTTP Metrics

- `span.duration.http.request` - Request latency (histogram)
- Tags: `method`, `path`, `status_code`, `success`

### Database Metrics

- `span.duration.database.query` - Query latency (histogram)
- Tags: `operation`, `table`, `success`

### AI Service Metrics

- `span.duration.ai.request` - AI call latency (histogram)
- `ai.tokens.input` - Input tokens consumed (counter)
- `ai.tokens.output` - Output tokens generated (counter)
- `ai.cost` - Estimated cost (gauge)
- Tags: `model`, `purpose`, `success`

### Error Metrics

- `errors.count` - Total errors (counter)
- Tags: `error_type`, `operation`, `workspace_id`

### Business Metrics

- `contacts.created` - Contacts created (counter)
- `emails.processed` - Emails processed (counter)
- `campaigns.sent` - Campaigns sent (counter)
- `ai.content_generated` - Content pieces generated (counter)

## Provider Setup

### Datadog Setup

1. Sign up at [Datadog](https://www.datadoghq.com/)
2. Get API key from Organization Settings → API Keys
3. Add to environment:
   ```env
   DD_API_KEY=your-api-key
   DD_SITE=datadoghq.com
   DD_SERVICE=unite-hub
   DD_ENV=production
   ```
4. View metrics at: https://app.datadoghq.com/dashboard

**Cost**: $15-31/host/month

### OpenTelemetry Setup

1. Deploy OpenTelemetry Collector:
   ```bash
   docker run -p 4318:4318 otel/opentelemetry-collector-contrib
   ```

2. Configure environment:
   ```env
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   OTEL_SERVICE_NAME=unite-hub
   ```

3. Configure collector to export to your backend (Prometheus, Jaeger, etc.)

**Cost**: Free (self-hosted) or backend-dependent

### Custom Backend Setup

1. Set provider to "custom":
   ```env
   APM_PROVIDER=custom
   ```

2. Implement `sendToCustomBackend()` in `src/lib/monitoring/apm.ts`:
   ```typescript
   private async sendToCustomBackend(type: string, data: any): Promise<void> {
     await fetch('https://your-metrics-api.com/ingest', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ type, data }),
     });
   }
   ```

## Performance Impact

### Memory Usage

- Active spans: ~1KB per span
- Metrics buffer: ~100 bytes per metric
- Typical memory overhead: 5-10MB

### CPU Usage

- Span creation: <0.1ms
- Metric recording: <0.01ms
- Flush operation: 1-5ms per 1000 metrics
- Typical CPU overhead: 1-2%

### Network Usage

- Metrics flush: ~10KB per flush (default: every 10s)
- Hourly bandwidth: ~3.6MB
- Daily bandwidth: ~86MB

### Sampling

Reduce overhead with sampling:

```env
# Sample 10% of requests (90% overhead reduction)
APM_SAMPLE_RATE=0.1
```

## Best Practices

1. **Sample Appropriately**:
   - Development: 100% (debugging)
   - Staging: 100% (testing)
   - Production: 10-30% (cost optimization)

2. **Tag Consistently**:
   - Always include: `workspace_id`, `operation`
   - Use snake_case for tag names
   - Limit tag cardinality (<1000 unique values)

3. **Set Meaningful Operation Names**:
   - Good: `api.contacts.create`, `db.contacts.select`
   - Bad: `operation`, `query`, `request`

4. **Track Business Metrics**:
   - User actions: signups, conversions, purchases
   - System health: cache hit rate, queue depth
   - Cost metrics: AI token usage, email sends

5. **Create Dashboards**:
   - Key metrics: Latency p50/p95/p99, error rate, throughput
   - Component health: Database, Redis, AI service
   - Business KPIs: Active users, revenue, usage

## Troubleshooting

### Metrics Not Appearing

1. Check APM is enabled: `ENABLE_APM=true`
2. Verify provider configuration (API keys, endpoints)
3. Check flush interval (should flush every 10s)
4. Review logs for errors: `console.error('[APM]')`

### High Memory Usage

1. Reduce sample rate: `APM_SAMPLE_RATE=0.1`
2. Increase flush interval: `APM_FLUSH_INTERVAL=30000`
3. Ensure spans are finished (prevents leaks)

### Slow Performance

1. Reduce sample rate to <30%
2. Disable synchronous operations
3. Use async metric recording
4. Batch flush operations

## API Reference

See `src/lib/monitoring/apm.ts` for complete API:

- `apm.startSpan(operation, tags)` - Start generic span
- `apm.startHTTPSpan(method, path, tags)` - Track HTTP request
- `apm.startDatabaseSpan(operation, table, tags)` - Track database query
- `apm.startAISpan(model, purpose, tags)` - Track AI call
- `apm.recordMetric(name, value, type, tags)` - Record custom metric
- `apm.incrementCounter(name, value, tags)` - Increment counter
- `apm.setGauge(name, value, tags)` - Set gauge value
- `apm.recordHistogram(name, value, tags)` - Record histogram
- `apm.trackError(error, context)` - Track error
- `apm.flush()` - Manually flush metrics
- `apm.shutdown()` - Shutdown APM client

## Resources

- [Datadog APM Docs](https://docs.datadoghq.com/tracing/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Datadog Pricing](https://www.datadoghq.com/pricing/)

---

**Last Updated**: 2025-01-15
**Status**: Production Ready
