# Datadog APM Integration Guide

Complete guide for integrating Unite-Hub health monitoring with Datadog APM platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Component Architecture](#component-architecture)
5. [Quick Start](#quick-start)
6. [Dashboard Setup](#dashboard-setup)
7. [Alert Configuration](#alert-configuration)
8. [SLA Monitoring](#sla-monitoring)
9. [Trending & Forecasting](#trending--forecasting)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Datadog APM integration provides:

- **Real-time health metrics** from 672 API routes
- **Dependency monitoring** (database, cache, AI services, external APIs)
- **Automated alerting** with configurable thresholds
- **SLA tracking** with error budget monitoring
- **Historical trending** and anomaly detection
- **Pre-built dashboards** for instant visibility

**Key Metrics:**
- Health check latency (p50, p95, p99)
- Route success rate (99.5% SLA target)
- Dependency availability
- Cache hit rate (80%+ target)
- Verification success rate (99.9% SLA)

---

## Prerequisites

1. **Datadog Account**
   - Free trial: https://www.datadoghq.com/
   - Or existing Datadog organization

2. **API Keys**
   - API Key (for sending metrics)
   - Application Key (for querying/creating dashboards)
   - Get from: https://app.datadoghq.com/organization-settings/api-keys

3. **Node.js Environment**
   - Node.js 18+ (Unite-Hub requirement)
   - Access to production/staging environment

---

## Environment Setup

### Step 1: Add Environment Variables

Add to `.env` or `.env.local`:

```env
# Datadog Configuration
DATADOG_API_KEY=your-api-key-here
DATADOG_APP_KEY=your-app-key-here
DATADOG_SITE=datadoghq.com  # or datadoghq.eu for EU region
DATADOG_SERVICE_NAME=unite-hub
NODE_ENV=production  # or staging, development
```

### Step 2: Initialize Datadog Client

In your application startup (`src/app/api/health/deep/route.ts` or similar):

```typescript
import { initializeDatadog } from '@/lib/monitoring/datadog-client';

// Initialize on app startup
const datadogClient = initializeDatadog(
  process.env.DATADOG_API_KEY,
  process.env.DATADOG_APP_KEY,
  '1.0.0' // service version
);
```

### Step 3: Verify Connection

Test the connection:

```bash
# Call health endpoint with Datadog export enabled
curl "http://localhost:3008/api/health/deep?export=datadog"

# Check Datadog Metrics Explorer for:
# - health.overall.status
# - health.check.latency_ms
# - health.dependency.*.status
```

---

## Component Architecture

### 1. Datadog Client (`datadog-client.ts`)

**Purpose:** Low-level API client for sending metrics and events

**Key Methods:**
- `queueMetric(name, value, tags, type)` - Queue metric for batch sending
- `sendMetric(name, value, tags, type)` - Send single metric immediately
- `createEvent(title, text, tags, priority, alertType)` - Create timeline event
- `getMetricHistory(name, hours)` - Retrieve historical data
- `flushMetrics()` - Manually flush queued metrics

**Batching:**
- Automatic batching (100 metrics per batch)
- Auto-flush every 10 seconds
- Manual flush on shutdown

**Example:**
```typescript
import { getDatadogClient } from '@/lib/monitoring/datadog-client';

const client = getDatadogClient();

// Queue metrics (preferred for performance)
client.queueMetric('health.check.latency_ms', 45, ['check_type:database'], 'gauge');
client.queueMetric('verification.executions', 1, ['success:true'], 'count');

// Send immediately (use sparingly)
await client.sendMetric('alert.triggered', 1, ['severity:high'], 'count');
```

### 2. Health Metrics Exporter (`health-metrics-exporter.ts`)

**Purpose:** Converts health check data to Datadog format

**Key Methods:**
- `exportHealthMetrics(healthSnapshot)` - Export deep health check
- `exportRouteHealth(routeSnapshot)` - Export route inventory health
- `exportVerificationMetrics(taskId, success, duration)` - Export verification results
- `exportCacheMetrics(hits, misses)` - Export cache performance

**Metric Naming Convention:**
```
health.overall.status           # 0=healthy, 1=degraded, 2=unhealthy
health.check.{type}.latency_ms  # Per-check latency
health.dependency.{name}.status # Dependency health
health.routes.success_rate      # Route success percentage
verification.success_rate       # Verification success percentage
cache.hit_rate                  # Cache hit percentage
```

**Example:**
```typescript
import HealthMetricsExporter from '@/lib/monitoring/health-metrics-exporter';

const exporter = new HealthMetricsExporter(client);

await exporter.exportHealthMetrics({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  checks: {
    database: { status: 'healthy', latency_ms: 45, timestamp: '...' },
    cache: { status: 'healthy', latency_ms: 12, timestamp: '...' },
    // ...
  },
});
```

### 3. Alert Configuration (`datadog-alerts.ts`)

**Purpose:** Create and manage Datadog monitors

**Pre-configured Alerts:**
1. Health check latency > 5s (critical)
2. Health check latency > 3s (warning)
3. Route success rate < 95% (critical)
4. Database latency > 2s (warning)
5. Cache hit rate < 75% (warning)
6. Dependency health degraded (warning)
7. Verification success < 99.9% (critical)

**Example:**
```typescript
import { initializeDatadogAlerts } from '@/lib/monitoring/datadog-alerts';

const alerts = initializeDatadogAlerts(
  apiKey,
  appKey,
  ['@slack-alerts', '@pagerduty']  // notification channels
);

// Create all health check alerts
const result = await alerts.createHealthCheckAlerts();
console.log('Created alerts:', result.rules);

// Create custom alert
await alerts.createAlertRule(
  'Custom Alert',
  'custom.metric',
  100,  // threshold
  5,    // duration in minutes
  'Alert message with @slack-alerts'
);
```

### 4. Trending & Forecasting (`datadog-trending.ts`)

**Purpose:** Analyze metric trends and detect anomalies

**Features:**
- Trend direction (up/down/stable)
- Linear forecasting
- Z-score anomaly detection
- Statistical baselines

**Example:**
```typescript
import DatadogTrending from '@/lib/monitoring/datadog-trending';

const trending = new DatadogTrending(client);

// Calculate 7-day trend
const trend = await trending.calculateTrend('health.check.latency_ms', 7);
console.log('Direction:', trend.direction);
console.log('Change:', trend.change_percent, '%');
console.log('Forecast:', trend.forecast);

// Detect anomaly
const anomaly = await trending.detectAnomaly(
  'cache.hit_rate',
  65,  // current value
  'medium'  // sensitivity
);

if (anomaly.is_anomaly) {
  console.log('Anomaly detected! Severity:', anomaly.severity);
  console.log('Z-score:', anomaly.z_score);
}
```

### 5. SLA Monitoring (`sla-monitor.ts`)

**Purpose:** Track SLA compliance and error budgets

**Pre-configured SLAs:**
- Uptime: 99.9% monthly
- Health check latency: p95 < 500ms
- Route success rate: 99.5% daily
- Verification success: 99.9% daily

**Example:**
```typescript
import SLAMonitor from '@/lib/monitoring/sla-monitor';

const slaMonitor = new SLAMonitor(client);

// Check specific SLA
const status = await slaMonitor.checkSLACompliance('uptime_monthly');

if (!status.is_compliant) {
  console.log('SLA BREACH!');
  console.log('Current:', status.current_percentage, '%');
  console.log('Target:', status.target_percentage, '%');
  console.log('Error budget remaining:', status.error_budget_remaining, '%');
  console.log('Time to exhaustion:', status.time_to_exhaustion_hours, 'hours');
}

// Generate monthly report
const report = await slaMonitor.generateSLAReport(30);
console.log('SLA Health:', report.summary.overall_health);
console.log('Compliant:', report.summary.compliant);
console.log('Non-compliant:', report.summary.non_compliant);
```

### 6. Dashboard Configuration (`datadog-dashboard-config.ts`)

**Purpose:** Create pre-built Datadog dashboards

**Dashboard Widgets:**
- Overall health status
- Health check latency (timeseries)
- Route success rate (query value)
- Cache hit rate (gauge)
- 7-day performance trends
- Dependency heat maps
- SLA compliance charts
- Route inventory heat map (672 routes)
- Events timeline

**Example:**
```typescript
import { initializeDatadogDashboard } from '@/lib/monitoring/datadog-dashboard-config';

const dashboard = initializeDatadogDashboard(apiKey, appKey);

// Create health monitoring dashboard
const result = await dashboard.createHealthDashboard();

console.log('Dashboard created!');
console.log('ID:', result.dashboardId);
console.log('URL:', result.url);

// Create verification dashboard
await dashboard.createVerificationDashboard();

// Export config for version control
const config = dashboard.getHealthDashboardConfig();
await fs.writeFile('dashboards/health.json', config);
```

---

## Quick Start

### 1. Basic Integration (5 minutes)

```typescript
// In your health endpoint
import { getDatadogClient } from '@/lib/monitoring/datadog-client';
import HealthMetricsExporter from '@/lib/monitoring/health-metrics-exporter';

export async function GET(request: NextRequest) {
  const shouldExport = request.nextUrl.searchParams.get('export') === 'datadog';

  // ... run health checks ...

  if (shouldExport && process.env.DATADOG_API_KEY) {
    const client = getDatadogClient();
    const exporter = new HealthMetricsExporter(client);
    await exporter.exportHealthMetrics(healthSnapshot);
  }

  return NextResponse.json(healthSnapshot);
}
```

### 2. Setup Cron Job (Automated Export)

```bash
# Every 5 minutes
*/5 * * * * curl -s "https://your-app.com/api/health/deep?export=datadog" > /dev/null

# Every minute (for critical monitoring)
* * * * * curl -s "https://your-app.com/api/health/routes?export=datadog" > /dev/null
```

### 3. Create Dashboards

```bash
# Run setup script
node scripts/setup-datadog-dashboards.mjs
```

Or manually in Datadog UI:
1. Go to Dashboards → New Dashboard
2. Import JSON from `dashboard.getHealthDashboardConfig()`
3. Save and share

---

## Dashboard Setup

### Pre-built Dashboard Configuration

The health monitoring dashboard includes:

**Row 1: System Health**
- Overall health status (gauge)
- Health check latency by type (timeseries)
- Route success rate (query value)
- Cache hit rate (gauge)

**Row 2: Performance Trends**
- 7-day latency trend (timeseries)
- 7-day success rate (timeseries)
- 7-day cache performance (timeseries)

**Row 3: Dependencies**
- Database health (heat map)
- Cache health (heat map)
- AI services health (heat map)
- External APIs health (heat map)

**Row 4: SLA Status**
- Uptime SLA (99.9%) with threshold line
- Route success SLA (99.5%) with threshold line

**Row 5: Route Inventory**
- Heat map of 672 routes by status

**Row 6: Alerts & Events**
- Timeline of recent alerts and deployments

### Custom Dashboard Queries

Add these queries to custom widgets:

```
# Average latency across all checks
avg:health.check.latency_ms{service:unite-hub}

# Success rate by route
avg:health.routes.success_rate{service:unite-hub} by {route}

# Cache hit rate over time
avg:cache.hit_rate{service:unite-hub}

# Verification success rate
avg:verification.success_rate{service:unite-hub}

# Error budget burn rate
rate(health.routes.unhealthy{service:unite-hub})
```

---

## Alert Configuration

### Notification Channels

Configure in Datadog:
1. **Slack**: `@slack-alerts`
2. **PagerDuty**: `@pagerduty`
3. **Email**: `@email-oncall@your-company.com`

### Alert Customization

```typescript
const alerts = getDatadogAlerts();

// Custom latency alert
await alerts.createAlertRule(
  'Database Latency Critical',
  'health.check.database.latency_ms',
  3000,  // 3 seconds
  10,    // for 10 minutes
  `{{#is_alert}}
Database latency exceeded 3 seconds for 10 minutes!
Current: {{value}}ms
@pagerduty @slack-alerts
{{/is_alert}}`
);

// Success rate alert with recovery
await alerts.createAlertRule(
  'Route Success Rate Warning',
  'health.routes.success_rate',
  97,
  15,
  `{{#is_alert}}
Route success rate dropped to {{value}}%
Warning threshold: 97%
@slack-alerts
{{/is_alert}}

{{#is_recovery}}
Route success rate recovered to {{value}}%
{{/is_recovery}}`
);
```

---

## SLA Monitoring

### Define Custom SLA

```typescript
const slaMonitor = new SLAMonitor(client);

slaMonitor.defineSLA(
  'api_latency_p99',
  'API Latency P99 SLA',
  'health.check.latency_ms',
  95.0,  // 95% of requests
  168,   // 7-day window
  'latency_percentile',
  1000,  // < 1000ms
  99     // p99
);
```

### Monitor Error Budget

```typescript
// Get all SLA statuses
const statuses = await slaMonitor.getSLAStatus();

for (const sla of statuses) {
  console.log(`${sla.name}:`);
  console.log(`  Compliant: ${sla.is_compliant}`);
  console.log(`  Current: ${sla.current_percentage.toFixed(3)}%`);
  console.log(`  Error budget: ${sla.error_budget_remaining.toFixed(3)}%`);

  if (sla.error_budget_used > 80) {
    console.log(`  ⚠️  WARNING: 80% of error budget consumed!`);
  }

  if (sla.time_to_exhaustion_hours) {
    console.log(`  ⏰ Error budget exhausts in ${sla.time_to_exhaustion_hours.toFixed(1)}h`);
  }
}
```

### Generate SLA Report

```typescript
// Monthly SLA report
const report = await slaMonitor.generateSLAReport(30);

console.log('=== SLA Report ===');
console.log('Period:', report.period_start, 'to', report.period_end);
console.log('Overall Health:', report.summary.overall_health);
console.log('');

for (const sla of report.slas) {
  console.log(`${sla.definition.name}:`);
  console.log(`  Target: ${sla.definition.target_percentage}%`);
  console.log(`  Actual: ${sla.status.current_percentage.toFixed(3)}%`);
  console.log(`  Violations: ${sla.violations}`);

  if (sla.breach_windows.length > 0) {
    console.log(`  Breach windows:`);
    for (const breach of sla.breach_windows) {
      console.log(`    - ${breach.start} (${breach.duration_minutes}m, ${breach.severity})`);
    }
  }
}
```

---

## Trending & Forecasting

### Analyze Trends

```typescript
const trending = new DatadogTrending(client);

// Get trend report for key metrics
const report = await trending.getHealthTrendReport(7);

for (const metric of report) {
  console.log(`\n${metric.metric}:`);
  console.log(`  Trend: ${metric.trend.direction} (${metric.trend.change_percent.toFixed(1)}%)`);
  console.log(`  Baseline: ${metric.baseline.average.toFixed(2)}`);
  console.log(`  Current: ${metric.trend.current_value.toFixed(2)}`);
  console.log(`  Forecast: ${metric.trend.forecast.toFixed(2)}`);

  if (metric.anomaly.is_anomaly) {
    console.log(`  🚨 ANOMALY DETECTED!`);
    console.log(`     Severity: ${metric.anomaly.severity}`);
    console.log(`     Z-score: ${metric.anomaly.z_score.toFixed(2)}`);
  }
}
```

### Forecast Future Values

```typescript
// Forecast next day's latency
const forecast = await trending.forecastMetric('health.check.latency_ms', 7);
console.log('Tomorrow\'s expected latency:', forecast.toFixed(2), 'ms');

// Compare to baseline
const baseline = await trending.getMetricBaseline('health.check.latency_ms', 7);
const deviation = ((forecast - baseline.average) / baseline.average) * 100;

if (Math.abs(deviation) > 20) {
  console.log(`⚠️ Forecast deviates ${deviation.toFixed(1)}% from baseline!`);
}
```

---

## API Reference

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATADOG_API_KEY` | Yes | Datadog API key | - |
| `DATADOG_APP_KEY` | Yes | Datadog application key | - |
| `DATADOG_SITE` | No | Datadog site (US/EU) | `datadoghq.com` |
| `DATADOG_SERVICE_NAME` | No | Service name in Datadog | `unite-hub` |
| `NODE_ENV` | No | Environment name | `production` |

### Health Endpoint Query Parameters

```
GET /api/health/deep?export=datadog
GET /api/health/routes?export=datadog
```

### Metric Types

- **Gauge**: Point-in-time value (e.g., cache hit rate)
- **Count**: Incrementing counter (e.g., total requests)
- **Rate**: Per-second rate (e.g., requests per second)

### Tag Structure

All metrics include these tags:
- `service:unite-hub` (or configured service name)
- `env:production` (or configured environment)
- Custom tags per metric (e.g., `check_type:database`)

---

## Troubleshooting

### Metrics Not Appearing in Datadog

**Problem:** Metrics queued but not visible in Datadog

**Solutions:**
1. Check API key is correct: `echo $DATADOG_API_KEY`
2. Verify network connectivity to Datadog API
3. Check logs for API errors
4. Manually flush metrics: `await client.flushMetrics()`
5. Wait 1-2 minutes for metrics to appear

### Dashboard Creation Failed

**Problem:** `createHealthDashboard()` returns error

**Solutions:**
1. Verify Application Key has dashboard create permissions
2. Check JSON configuration is valid
3. Try creating manually in Datadog UI first
4. Check for quota limits in Datadog account

### Alert Not Triggering

**Problem:** Alert created but not firing

**Solutions:**
1. Verify metric is being sent: Check Metrics Explorer
2. Check alert query syntax
3. Ensure thresholds are correct
4. Verify notification channels are configured
5. Check alert is unmuted

### SLA Shows 0% Compliance

**Problem:** All SLAs showing 0% despite healthy system

**Solutions:**
1. Check metric history is available (takes 5-10 minutes)
2. Verify metric naming matches SLA definition
3. Ensure tags match (service, env)
4. Check baseline window is appropriate

### High Batch Queue Size

**Problem:** `client.getQueueStatus()` shows 1000+ queued metrics

**Solutions:**
1. Reduce metric sending frequency
2. Increase batch size: `client.batchSize = 500`
3. Reduce flush interval: `client.batchFlushInterval = 5000`
4. Check for API rate limiting

---

## Cost Optimization

### Metric Volume Calculation

Metrics per hour: ~100-200 (depending on health check frequency)

**Cost estimate:**
- Datadog Free: 100 metrics included
- Datadog Pro: $15/host/month (includes 100 metrics)
- Additional metrics: $0.05/metric/month

### Reduce Costs

1. **Batch aggressively**
   ```typescript
   client.batchSize = 500;  // Larger batches
   ```

2. **Sample routes instead of all 672**
   ```typescript
   // Check only 10% of routes
   const routesToCheck = routes.filter((_, i) => i % 10 === 0);
   ```

3. **Increase check intervals**
   ```bash
   # Every 15 minutes instead of 5
   */15 * * * * curl ...
   ```

4. **Use metric aggregation**
   ```typescript
   // Instead of per-route metrics, use aggregates
   client.queueMetric('health.routes.avg_latency', avgLatency);
   ```

---

## Next Steps

1. **Set up automated exports**: Add cron job
2. **Create dashboards**: Run `createHealthDashboard()`
3. **Configure alerts**: Run `createHealthCheckAlerts()`
4. **Monitor SLAs**: Set up daily SLA report email
5. **Tune thresholds**: Adjust based on actual performance

For questions or issues, refer to:
- Datadog Docs: https://docs.datadoghq.com/
- Unite-Hub Health Docs: `docs/HEALTH_MONITORING.md`
