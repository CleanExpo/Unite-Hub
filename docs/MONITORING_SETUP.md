# Unite-Hub Monitoring & Observability Setup

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Phase**: 11 - Deployment Infrastructure

---

## Overview

This guide covers the monitoring and observability stack for Unite-Hub production deployment.

### Stack Components

| Component | Tool | Purpose |
|-----------|------|---------|
| Error Tracking | Sentry | Exception monitoring, stack traces |
| APM | Datadog | Performance metrics, tracing |
| Logging | Vercel Logs + Datadog | Centralized log aggregation |
| Uptime | Checkly | Synthetic monitoring |
| Alerts | PagerDuty/Slack | Incident notification |

---

## 1. Sentry Setup (Error Tracking)

### 1.1 Installation

```bash
npm install @sentry/nextjs
```

### 1.2 Configuration

Create `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter out noise
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network request failed",
    "Load failed",
  ],

  // Before send hook
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});
```

Create `sentry.server.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

### 1.3 Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=unite-hub
SENTRY_PROJECT=unite-hub-nextjs
```

### 1.4 Custom Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI />;
    }
    return this.props.children;
  }
}
```

---

## 2. Datadog APM Setup

### 2.1 Installation

```bash
npm install dd-trace
```

### 2.2 Initialization

Create `instrumentation.ts` (Next.js 16 instrumentation):

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const tracer = await import("dd-trace");

    tracer.default.init({
      service: "unite-hub",
      env: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA,

      // APM settings
      runtimeMetrics: true,
      logInjection: true,
      profiling: true,

      // Sampling
      sampleRate: 0.1,

      // Integrations
      plugins: true,
    });
  }
}
```

### 2.3 Custom Metrics

```typescript
// src/lib/monitoring/metrics.ts
import { StatsD } from "hot-shots";

const dogstatsd = new StatsD({
  host: process.env.DD_AGENT_HOST || "localhost",
  port: 8125,
  prefix: "unitehub.",
  globalTags: {
    env: process.env.NODE_ENV || "development",
    service: "unite-hub",
  },
});

export const metrics = {
  // Counters
  increment: (name: string, tags?: Record<string, string>) => {
    dogstatsd.increment(name, 1, tags);
  },

  // Gauges
  gauge: (name: string, value: number, tags?: Record<string, string>) => {
    dogstatsd.gauge(name, value, tags);
  },

  // Histograms (for timing)
  histogram: (name: string, value: number, tags?: Record<string, string>) => {
    dogstatsd.histogram(name, value, tags);
  },

  // Timing helper
  timing: (name: string, startTime: number, tags?: Record<string, string>) => {
    const duration = Date.now() - startTime;
    dogstatsd.histogram(name, duration, tags);
  },
};

// Usage examples
// metrics.increment("api.requests", { endpoint: "/contacts" });
// metrics.timing("api.latency", startTime, { endpoint: "/contacts" });
// metrics.gauge("queue.length", queueSize);
```

### 2.4 Environment Variables

```env
DD_API_KEY=your-datadog-api-key
DD_APP_KEY=your-datadog-app-key
DD_AGENT_HOST=localhost
DD_SERVICE=unite-hub
DD_ENV=production
DD_VERSION=1.0.0
```

---

## 3. Logging Setup

### 3.1 Structured Logging

```typescript
// src/lib/logging/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Structured format
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Add default fields
  base: {
    service: "unite-hub",
    env: process.env.NODE_ENV,
    version: process.env.VERCEL_GIT_COMMIT_SHA,
  },

  // Redact sensitive data
  redact: {
    paths: ["password", "token", "apiKey", "*.password", "*.token"],
    censor: "[REDACTED]",
  },
});

export { logger };

// Usage
// logger.info({ userId, action: "login" }, "User logged in");
// logger.error({ err, requestId }, "API request failed");
```

### 3.2 Request Logging Middleware

```typescript
// src/middleware/logging.ts
import { NextRequest } from "next/server";
import { logger } from "@/lib/logging/logger";
import { v4 as uuidv4 } from "uuid";

export function logRequest(req: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();

  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for") || req.ip,
  }, "Request started");

  return {
    requestId,
    startTime,
    finish: (statusCode: number) => {
      const duration = Date.now() - startTime;
      logger.info({
        requestId,
        statusCode,
        duration,
      }, "Request completed");
    },
  };
}
```

---

## 4. Uptime Monitoring (Checkly)

### 4.1 Configuration

Create `checkly.config.ts`:

```typescript
import { defineConfig } from "checkly";

export default defineConfig({
  projectName: "Unite-Hub",
  logicalId: "unite-hub-monitoring",

  checks: {
    frequency: 5, // Check every 5 minutes
    locations: ["ap-southeast-2", "us-east-1"], // Sydney + US

    browserChecks: {
      testMatch: "**/checks/**/*.check.ts",
    },

    // Alerting
    alertChannels: [
      {
        type: "slack",
        channel: "#unite-hub-alerts",
      },
      {
        type: "email",
        address: "alerts@unite-group.in",
      },
    ],
  },
});
```

### 4.2 Health Check Script

Create `checks/api-health.check.ts`:

```typescript
import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("api-health", {
  name: "API Health Check",
  request: {
    url: "https://unite-hub.com/api/v1/health",
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("$.status").equals("healthy"),
      AssertionBuilder.responseTime().lessThan(1000),
    ],
  },
  frequency: 1, // Every minute
  locations: ["ap-southeast-2"],
  alertChannels: ["slack-critical"],
});
```

### 4.3 Browser Check Script

Create `checks/login-flow.check.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("Login flow", async ({ page }) => {
  // Navigate to login
  await page.goto("https://unite-hub.com/login");

  // Verify login page loads
  await expect(page.locator("text=Continue with Google")).toBeVisible();

  // Check page title
  await expect(page).toHaveTitle(/Unite-Hub/);

  // Verify no console errors
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.waitForTimeout(2000);
  expect(errors.length).toBe(0);
});
```

---

## 5. Alert Configuration

### 5.1 Alert Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API Down | Health check fails 2x | Critical | PagerDuty + Slack |
| High Error Rate | >5% errors in 5 min | High | Slack |
| Slow Response | p95 > 2s for 5 min | Medium | Slack |
| High Memory | >90% for 10 min | Medium | Slack |
| SSL Expiry | <30 days | Low | Email |

### 5.2 Slack Alert Template

```typescript
// src/lib/alerts/slack.ts
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface AlertOptions {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  details?: Record<string, string>;
}

export async function sendAlert(options: AlertOptions) {
  const color = {
    critical: "#FF0000",
    high: "#FFA500",
    medium: "#FFFF00",
    low: "#00FF00",
  }[options.severity];

  const channel = options.severity === "critical"
    ? "#unite-hub-critical"
    : "#unite-hub-alerts";

  await slack.chat.postMessage({
    channel,
    attachments: [
      {
        color,
        title: `${options.severity.toUpperCase()}: ${options.title}`,
        text: options.message,
        fields: options.details
          ? Object.entries(options.details).map(([title, value]) => ({
              title,
              value,
              short: true,
            }))
          : undefined,
        footer: "Unite-Hub Monitoring",
        ts: String(Date.now() / 1000),
      },
    ],
  });
}
```

### 5.3 PagerDuty Integration

```typescript
// src/lib/alerts/pagerduty.ts
import { event } from "@pagerduty/pdjs";

interface PagerDutyAlert {
  title: string;
  details: string;
  severity: "critical" | "error" | "warning" | "info";
  source: string;
  dedup_key?: string;
}

export async function triggerPagerDuty(alert: PagerDutyAlert) {
  await event({
    data: {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY!,
      event_action: "trigger",
      dedup_key: alert.dedup_key,
      payload: {
        summary: alert.title,
        source: alert.source,
        severity: alert.severity,
        custom_details: {
          details: alert.details,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        },
      },
    },
  });
}

export async function resolvePagerDuty(dedup_key: string) {
  await event({
    data: {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY!,
      event_action: "resolve",
      dedup_key,
    },
  });
}
```

---

## 6. Dashboard Setup

### 6.1 Datadog Dashboard JSON

Import this dashboard in Datadog:

```json
{
  "title": "Unite-Hub Production",
  "description": "Main production monitoring dashboard",
  "widgets": [
    {
      "definition": {
        "title": "Request Rate",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:unitehub.api.requests{env:production}.as_rate()"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Error Rate",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:unitehub.api.errors{env:production}.as_rate() / sum:unitehub.api.requests{env:production}.as_rate() * 100"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Response Time (p95)",
        "type": "timeseries",
        "requests": [
          {
            "q": "p95:unitehub.api.latency{env:production}"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Active Users",
        "type": "query_value",
        "requests": [
          {
            "q": "sum:unitehub.users.active{env:production}"
          }
        ]
      }
    }
  ]
}
```

### 6.2 Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| `api.requests` | Total API requests | - |
| `api.latency` | Response time | p95 < 500ms |
| `api.errors` | Error count | < 1% |
| `db.query_time` | Database latency | p95 < 100ms |
| `cache.hit_rate` | Redis cache hits | > 80% |
| `ai.tokens` | AI token usage | Within budget |
| `users.active` | Active users | Growing |

---

## 7. Environment Variables Summary

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Datadog
DD_API_KEY=
DD_APP_KEY=
DD_SERVICE=unite-hub
DD_ENV=production

# Slack
SLACK_BOT_TOKEN=
SLACK_WEBHOOK_URL=

# PagerDuty
PAGERDUTY_ROUTING_KEY=

# Checkly
CHECKLY_API_KEY=
CHECKLY_ACCOUNT_ID=
```

---

## 8. Runbook Integration

For incident response procedures, see `docs/INCIDENT_RUNBOOK.md`.

Quick links:
- [Database Issues](/docs/INCIDENT_RUNBOOK.md#1-database-issues)
- [Authentication Issues](/docs/INCIDENT_RUNBOOK.md#2-authentication-issues)
- [API Issues](/docs/INCIDENT_RUNBOOK.md#3-api-issues)
- [Performance Issues](/docs/INCIDENT_RUNBOOK.md#5-performance-issues)

---

*Last updated: 2025-11-30*
