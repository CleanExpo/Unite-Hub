# Synthex CLI - Integration Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Target Audience**: DevOps engineers, system integrators, developers

---

## Table of Contents

1. [Introduction](#introduction)
2. [CI/CD Integration](#cicd-integration)
3. [Monitoring Platform Integration](#monitoring-platform-integration)
4. [Notification Systems](#notification-systems)
5. [Automation Tools](#automation-tools)
6. [API Integration](#api-integration)
7. [Database Integration](#database-integration)
8. [Third-Party Services](#third-party-services)
9. [Event-Driven Workflows](#event-driven-workflows)
10. [Security & Authentication](#security--authentication)
11. [Example Integrations](#example-integrations)

---

## Introduction

This guide demonstrates how to integrate the Synthex Apex Architecture CLI with external systems and workflows. Synthex provides multiple integration points:

- **CLI Interface**: Command-line execution for automation
- **Service APIs**: TypeScript/JavaScript APIs for programmatic access
- **Database**: Direct PostgreSQL access for reporting and analytics
- **Webhooks**: Event-driven integrations
- **Export APIs**: Data export in JSON/CSV formats

**Integration Patterns**:
- **Scheduled Jobs**: Cron-based automation
- **Event-Driven**: Webhook-triggered workflows
- **API-First**: RESTful service integration
- **Data Pipeline**: ETL workflows for analytics

---

## CI/CD Integration

### GitHub Actions

**Automated tenant deployment on push**:

```yaml
# .github/workflows/deploy-tenants.yml
name: Deploy Tenants

on:
  push:
    paths:
      - 'tenants/*.csv'
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build CLI
        run: npm run build

      - name: Deploy tenants
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SERVICE_ACCOUNT }}
        run: |
          npm run synthex -- batch tenants create --from-csv tenants/new-tenants.csv

      - name: Verify deployment
        run: npm run synthex -- health check

      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Tenant deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Tenant Deployment Complete*\n✓ All tenants deployed successfully"
                  }
                }
              ]
            }
```

**Run tests on pull request**:

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run CLI tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL_TEST }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_TEST }}
        run: |
          npm run synthex -- tenant tenants list
          npm run synthex -- health check
```

### GitLab CI/CD

**Pipeline configuration**:

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - node_modules/
    expire_in: 1 hour

test:
  stage: test
  image: node:18
  script:
    - npm test
    - npm run synthex -- health check
  dependencies:
    - build

deploy_production:
  stage: deploy
  image: node:18
  only:
    - main
  script:
    - npm run synthex -- batch tenants create --from-csv tenants/production.csv
    - npm run synthex -- health check
  dependencies:
    - build
  environment:
    name: production
```

### Jenkins

**Jenkins pipeline**:

```groovy
// Jenkinsfile
pipeline {
  agent any

  environment {
    SUPABASE_URL = credentials('supabase-url')
    SUPABASE_SERVICE_ROLE_KEY = credentials('supabase-service-role-key')
  }

  stages {
    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
        sh 'npm run synthex -- health check'
      }
    }

    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sh 'npm run synthex -- batch tenants create --from-csv tenants/new-tenants.csv'
        sh 'npm run synthex -- alerts check-now'
      }
    }
  }

  post {
    success {
      slackSend(
        color: 'good',
        message: "✅ Deployment successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
      )
    }
    failure {
      slackSend(
        color: 'danger',
        message: "❌ Deployment failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
      )
    }
  }
}
```

---

## Monitoring Platform Integration

### Datadog

**Send metrics to Datadog**:

```typescript
// src/integrations/datadog.ts
import { StatsD } from 'hot-shots';

const dogstatsd = new StatsD({
  host: process.env.DATADOG_AGENT_HOST || 'localhost',
  port: 8125,
  prefix: 'synthex.',
  globalTags: {
    env: process.env.NODE_ENV || 'development',
    service: 'synthex-cli',
  },
});

export async function trackCommandExecution(
  command: string,
  duration: number,
  success: boolean
) {
  // Increment command counter
  dogstatsd.increment('command.execution', {
    command,
    status: success ? 'success' : 'failure',
  });

  // Record execution time
  dogstatsd.timing('command.duration', duration, {
    command,
  });
}

export async function trackTenantCount(count: number) {
  dogstatsd.gauge('tenants.total', count);
}

export async function trackCredentialExpiry(daysUntilExpiry: number) {
  if (daysUntilExpiry <= 7) {
    dogstatsd.event({
      title: 'Credential Expiring Soon',
      text: `Credential expires in ${daysUntilExpiry} days`,
      alert_type: daysUntilExpiry <= 1 ? 'error' : 'warning',
    });
  }
}
```

**Usage in CLI**:

```typescript
// src/cli/commands/tenant/tenants.ts
import { trackCommandExecution } from '@/integrations/datadog';

async function createTenant(options: CreateTenantOptions) {
  const startTime = Date.now();
  let success = false;

  try {
    // Create tenant logic
    await tenantService.create(options);
    success = true;
  } catch (error) {
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    await trackCommandExecution('tenant.create', duration, success);
  }
}
```

### Prometheus

**Expose Prometheus metrics endpoint**:

```typescript
// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UsageAnalyticsService } from '@/cli/services/monitoring/usage-analytics';
import { HealthMonitorService } from '@/cli/services/monitoring/health-monitor';

export async function GET(req: NextRequest) {
  const analyticsService = new UsageAnalyticsService();
  const healthService = new HealthMonitorService();

  // Get metrics from last hour
  const oneHourAgo = new Date(Date.now() - 3600000);
  const report = await analyticsService.getReport(
    'workspace-id',
    oneHourAgo,
    new Date()
  );

  const healthReport = await healthService.runHealthChecks();

  // Format as Prometheus metrics
  const metrics = `
# HELP synthex_commands_total Total number of commands executed
# TYPE synthex_commands_total counter
synthex_commands_total{} ${report.totalCommands}

# HELP synthex_errors_total Total number of errors
# TYPE synthex_errors_total counter
synthex_errors_total{} ${report.totalErrors}

# HELP synthex_command_duration_seconds Command execution duration
# TYPE synthex_command_duration_seconds histogram
synthex_command_duration_seconds_sum{} ${report.performanceMetrics.avgExecutionTime / 1000}
synthex_command_duration_seconds_count{} ${report.totalCommands}

# HELP synthex_health_status System health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE synthex_health_status gauge
synthex_health_status{} ${
  healthReport.overallStatus === 'healthy' ? 1 :
  healthReport.overallStatus === 'degraded' ? 0.5 : 0
}
`;

  return new NextResponse(metrics, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

**Prometheus scrape configuration**:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'synthex'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3008']
    metrics_path: '/api/metrics'
```

### Grafana Dashboards

**Example dashboard JSON**:

```json
{
  "dashboard": {
    "title": "Synthex CLI Monitoring",
    "panels": [
      {
        "title": "Command Execution Rate",
        "targets": [
          {
            "expr": "rate(synthex_commands_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(synthex_errors_total[5m])"
          }
        ],
        "type": "graph",
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "type": "gt",
                "params": [0.05]
              },
              "query": {
                "params": ["A", "5m", "now"]
              }
            }
          ]
        }
      },
      {
        "title": "Command Duration (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, synthex_command_duration_seconds)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Health Status",
        "targets": [
          {
            "expr": "synthex_health_status"
          }
        ],
        "type": "singlestat"
      }
    ]
  }
}
```

---

## Notification Systems

### Slack Integration

**Webhook-based notifications**:

```typescript
// src/integrations/slack.ts
export interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.statusText}`);
  }
}

export async function sendCredentialExpiryAlert(
  webhookUrl: string,
  tenantId: string,
  service: string,
  daysUntilExpiry: number
): Promise<void> {
  const severity = daysUntilExpiry <= 1 ? '🚨' : daysUntilExpiry <= 7 ? '⚠️' : 'ℹ️';

  await sendSlackNotification(webhookUrl, {
    text: `${severity} Credential expiring for ${tenantId}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severity} Credential Expiry Alert`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Tenant:*\n${tenantId}` },
          { type: 'mrkdwn', text: `*Service:*\n${service}` },
          { type: 'mrkdwn', text: `*Days Until Expiry:*\n${daysUntilExpiry}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Rotate Credential' },
            url: `https://app.synthex.com/tenants/${tenantId}/credentials`,
            style: 'primary',
          },
        ],
      },
    ],
  });
}
```

### Email Notifications

**SendGrid integration**:

```typescript
// src/integrations/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendCredentialExpiryEmail(
  recipients: string[],
  tenantId: string,
  service: string,
  daysUntilExpiry: number
): Promise<void> {
  const msg = {
    to: recipients,
    from: 'alerts@synthex.com',
    subject: `[${daysUntilExpiry <= 1 ? 'CRITICAL' : 'WARNING'}] Credential Expiring - ${tenantId}`,
    html: `
      <h2>Credential Expiry Alert</h2>
      <p><strong>Tenant:</strong> ${tenantId}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Days Until Expiry:</strong> ${daysUntilExpiry}</p>
      <p>
        <a href="https://app.synthex.com/tenants/${tenantId}/credentials"
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Rotate Credential
        </a>
      </p>
    `,
  };

  await sgMail.send(msg);
}
```

### PagerDuty Integration

**Create incidents for critical alerts**:

```typescript
// src/integrations/pagerduty.ts
export async function createPagerDutyIncident(
  routingKey: string,
  summary: string,
  severity: 'critical' | 'error' | 'warning' | 'info',
  details: Record<string, any>
): Promise<void> {
  const event = {
    routing_key: routingKey,
    event_action: 'trigger',
    payload: {
      summary,
      severity,
      source: 'synthex-cli',
      custom_details: details,
    },
  };

  const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`PagerDuty incident creation failed: ${response.statusText}`);
  }
}

// Usage: Trigger incident for expired credential
export async function alertExpiredCredential(
  routingKey: string,
  tenantId: string,
  service: string
): Promise<void> {
  await createPagerDutyIncident(
    routingKey,
    `Expired credential for ${tenantId} (${service})`,
    'critical',
    {
      tenant_id: tenantId,
      service,
      action_required: 'Rotate credential immediately',
    }
  );
}
```

---

## Automation Tools

### Zapier Integration

**Webhook endpoint for Zapier**:

```typescript
// src/app/api/webhooks/zapier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/cli/services/tenant-management/tenant-service';

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Zapier sends data in this format:
  // {
  //   "trigger": "new_tenant",
  //   "data": { "tenant_id": "...", "name": "...", ... }
  // }

  const { trigger, data } = payload;

  if (trigger === 'new_tenant') {
    const tenantService = new TenantService();

    const tenant = await tenantService.create({
      workspaceId: data.workspace_id,
      tenantId: data.tenant_id,
      name: data.name,
      type: data.type,
      shopifyShop: data.shopify_shop,
      gmcMerchantId: data.gmc_merchant_id,
    });

    return NextResponse.json({
      success: true,
      tenant,
    });
  }

  return NextResponse.json({ error: 'Unknown trigger' }, { status: 400 });
}
```

**Zapier Zap example**:
```
Trigger: New Row in Google Sheets
   ↓
Action: Webhook POST to /api/webhooks/zapier
   ↓
Filter: Only if "status" column is "approved"
   ↓
Action: Send Slack notification
```

### Make (formerly Integromat)

**Make scenario**:

```json
{
  "name": "Tenant Provisioning",
  "flow": [
    {
      "module": "airtable:watchRecords",
      "filter": {
        "status": "pending_provisioning"
      }
    },
    {
      "module": "http:makeRequest",
      "url": "https://your-app.com/api/webhooks/make",
      "method": "POST",
      "body": {
        "tenant_id": "{{1.fields.tenant_id}}",
        "name": "{{1.fields.name}}",
        "type": "{{1.fields.type}}"
      }
    },
    {
      "module": "airtable:updateRecord",
      "recordId": "{{1.id}}",
      "fields": {
        "status": "provisioned",
        "provisioned_at": "{{now}}"
      }
    }
  ]
}
```

### n8n Workflows

**n8n workflow definition**:

```json
{
  "name": "Tenant Health Check",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{
            "field": "hours",
            "hoursInterval": 1
          }]
        }
      }
    },
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-app.com/api/health",
        "method": "GET"
      }
    },
    {
      "name": "IF Unhealthy",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [{
            "value1": "={{$json[\"overallStatus\"]}}",
            "operation": "equals",
            "value2": "unhealthy"
          }]
        }
      }
    },
    {
      "name": "Send Alert",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#alerts",
        "text": "🚨 Synthex health check failed!",
        "attachments": [{
          "color": "danger",
          "text": "{{$json[\"checks\"] | json}}"
        }]
      }
    }
  ]
}
```

---

## API Integration

### REST API Access

**Direct API calls to Synthex services**:

```typescript
// Example: External service calling Synthex API
import axios from 'axios';

const SYNTHEX_API_URL = 'https://your-app.com/api';
const SYNTHEX_API_KEY = process.env.SYNTHEX_API_KEY;

export async function createTenant(tenantData: {
  tenantId: string;
  name: string;
  type: string;
}) {
  const response = await axios.post(
    `${SYNTHEX_API_URL}/tenants`,
    tenantData,
    {
      headers: {
        'Authorization': `Bearer ${SYNTHEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function syncProducts(tenantId: string) {
  const response = await axios.post(
    `${SYNTHEX_API_URL}/shopify/sync`,
    { tenantId },
    {
      headers: {
        'Authorization': `Bearer ${SYNTHEX_API_KEY}`,
      },
    }
  );

  return response.data;
}
```

### GraphQL API (Optional)

**GraphQL schema for Synthex**:

```graphql
type Tenant {
  id: ID!
  tenantId: String!
  name: String!
  type: TenantType!
  status: TenantStatus!
  createdAt: DateTime!
}

enum TenantType {
  SHOPIFY
  GOOGLE_MERCHANT
  MIXED
}

enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

type Query {
  tenants(workspaceId: ID!): [Tenant!]!
  tenant(tenantId: String!): Tenant
  healthCheck: HealthReport!
}

type Mutation {
  createTenant(input: CreateTenantInput!): Tenant!
  updateTenant(tenantId: String!, input: UpdateTenantInput!): Tenant!
  deleteTenant(tenantId: String!): Boolean!
}
```

---

## Database Integration

### Direct Database Access

**Read-only analytics queries**:

```sql
-- Create read-only user for analytics
CREATE ROLE analytics_readonly LOGIN PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE postgres TO analytics_readonly;
GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Query tenant statistics
SELECT
  type,
  status,
  COUNT(*) as count
FROM tenants
WHERE workspace_id = 'workspace-id'
GROUP BY type, status;

-- Query credential expiry report
SELECT
  t.tenant_id,
  t.name,
  c.service,
  c.expires_at,
  EXTRACT(DAY FROM (c.expires_at - NOW())) as days_until_expiry
FROM tenants t
JOIN credentials c ON t.tenant_id = c.tenant_id
WHERE c.expires_at < NOW() + INTERVAL '30 days'
ORDER BY c.expires_at ASC;
```

### BI Tools Integration

**Metabase connection**:

```yaml
# metabase-database.yml
- name: Synthex Production
  engine: postgres
  details:
    host: db.your-supabase-project.supabase.co
    port: 5432
    dbname: postgres
    user: analytics_readonly
    password: ${ANALYTICS_DB_PASSWORD}
    ssl: true
    ssl-mode: require
```

**Tableau connection**:
```
Server: db.your-supabase-project.supabase.co
Port: 5432
Database: postgres
Username: analytics_readonly
Password: [secure-password]
SSL: Required
```

---

## Third-Party Services

### Shopify App Integration

**Shopify app webhook handler**:

```typescript
// src/app/api/webhooks/shopify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmac;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256');

  if (!hmac || !verifyShopifyWebhook(body, hmac)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Handle different webhook topics
  const topic = req.headers.get('x-shopify-topic');

  switch (topic) {
    case 'products/create':
      // Sync new product to Synthex
      await syncProductToSynthex(payload);
      break;

    case 'products/update':
      // Update product in Synthex
      await updateProductInSynthex(payload);
      break;

    case 'app/uninstalled':
      // Handle app uninstallation
      await handleAppUninstall(payload);
      break;
  }

  return NextResponse.json({ success: true });
}
```

### Google Pub/Sub Integration

**Subscribe to GMC feed status updates**:

```typescript
// src/integrations/google-pubsub.ts
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function subscribeToGMCUpdates() {
  const subscription = pubsub.subscription('gmc-feed-updates');

  subscription.on('message', async (message) => {
    const data = JSON.parse(message.data.toString());

    // Process GMC feed update
    console.log('GMC Feed Update:', data);

    if (data.status === 'error') {
      // Send alert for feed errors
      await sendGMCFeedErrorAlert(data);
    }

    // Acknowledge message
    message.ack();
  });

  subscription.on('error', (error) => {
    console.error('Pub/Sub subscription error:', error);
  });
}
```

---

## Event-Driven Workflows

### Webhook Server

**Centralized webhook handler**:

```typescript
// src/app/api/webhooks/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

// Register event handlers
eventBus.on('tenant.created', async (data) => {
  console.log('Tenant created:', data.tenantId);

  // Send welcome email
  await sendWelcomeEmail(data.email);

  // Create default settings
  await createDefaultSettings(data.tenantId);
});

eventBus.on('credential.expiring', async (data) => {
  console.log('Credential expiring:', data.tenantId);

  // Send expiry notification
  await sendExpiryNotification(data);

  // Create Jira ticket if <7 days
  if (data.daysUntilExpiry <= 7) {
    await createJiraTicket({
      summary: `Rotate credential for ${data.tenantId}`,
      description: `Credential for ${data.service} expires in ${data.daysUntilExpiry} days`,
      priority: 'High',
    });
  }
});

export async function POST(req: NextRequest) {
  const { event, data } = await req.json();

  // Emit event to bus
  eventBus.emit(event, data);

  return NextResponse.json({ success: true });
}
```

### Event Sourcing

**Event log for audit trail**:

```typescript
// src/lib/events/event-store.ts
import { createClient } from '@/lib/supabase/server';

export interface Event {
  id: string;
  eventType: string;
  aggregateId: string;
  data: Record<string, any>;
  metadata: {
    userId?: string;
    timestamp: string;
    source: string;
  };
}

export async function appendEvent(event: Omit<Event, 'id'>): Promise<void> {
  const supabase = await createClient();

  await supabase.from('events').insert({
    event_type: event.eventType,
    aggregate_id: event.aggregateId,
    data: event.data,
    metadata: event.metadata,
  });
}

export async function getEventsForAggregate(
  aggregateId: string
): Promise<Event[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('aggregate_id', aggregateId)
    .order('created_at', { ascending: true });

  return data || [];
}

// Usage: Log tenant creation event
await appendEvent({
  eventType: 'TenantCreated',
  aggregateId: tenantId,
  data: { name, type, market, region },
  metadata: {
    userId: session.user.id,
    timestamp: new Date().toISOString(),
    source: 'synthex-cli',
  },
});
```

---

## Security & Authentication

### API Key Management

**Generate and validate API keys**:

```typescript
// src/lib/auth/api-keys.ts
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function generateApiKey(
  userId: string,
  name: string,
  scopes: string[]
): Promise<string> {
  const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

  const supabase = await createClient();

  await supabase.from('api_keys').insert({
    user_id: userId,
    name,
    key_hash: hashedKey,
    scopes,
  });

  return apiKey;
}

export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; userId?: string; scopes?: string[] }> {
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

  const supabase = await createClient();

  const { data } = await supabase
    .from('api_keys')
    .select('user_id, scopes, revoked_at')
    .eq('key_hash', hashedKey)
    .single();

  if (!data || data.revoked_at) {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id, scopes: data.scopes };
}
```

### OAuth 2.0 Integration

**OAuth provider for third-party apps**:

```typescript
// src/app/api/oauth/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  // Verify client_id
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('oauth_clients')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (!client || !client.redirect_uris.includes(redirectUri)) {
    return NextResponse.json({ error: 'Invalid client or redirect URI' }, { status: 400 });
  }

  // Show authorization page
  return NextResponse.redirect(
    `/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
  );
}

// After user approves
export async function POST(req: NextRequest) {
  const { clientId, userId, scope } = await req.json();

  // Generate authorization code
  const code = crypto.randomBytes(32).toString('hex');

  const supabase = await createClient();
  await supabase.from('oauth_codes').insert({
    code,
    client_id: clientId,
    user_id: userId,
    scope,
    expires_at: new Date(Date.now() + 600000), // 10 minutes
  });

  return NextResponse.json({ code });
}
```

---

## Example Integrations

### Complete Example: Automated Tenant Onboarding

**Workflow**:
1. New customer fills form on website
2. Webhook triggers tenant creation
3. OAuth authentication email sent
4. Initial product sync after auth
5. Welcome email with dashboard link

```typescript
// src/workflows/tenant-onboarding.ts
import { TenantService } from '@/cli/services/tenant-management/tenant-service';
import { sendWelcomeEmail } from '@/integrations/sendgrid';
import { sendSlackNotification } from '@/integrations/slack';

export async function onboardNewTenant(data: {
  email: string;
  companyName: string;
  shopifyShop: string;
  plan: string;
}) {
  const tenantService = new TenantService();

  // Step 1: Create tenant
  const tenant = await tenantService.create({
    workspaceId: 'default-workspace',
    tenantId: `SHOP_${Date.now()}`,
    name: data.companyName,
    type: 'shopify',
    shopifyShop: data.shopifyShop,
  });

  // Step 2: Send authentication instructions
  await sendWelcomeEmail([data.email], {
    tenantId: tenant.tenantId,
    authLink: `https://app.synthex.com/auth?tenant=${tenant.tenantId}`,
  });

  // Step 3: Notify team
  await sendSlackNotification(process.env.SLACK_WEBHOOK_URL!, {
    text: `🎉 New tenant onboarded: ${data.companyName}`,
    blocks: [
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Company:*\n${data.companyName}` },
          { type: 'mrkdwn', text: `*Plan:*\n${data.plan}` },
          { type: 'mrkdwn', text: `*Shop:*\n${data.shopifyShop}` },
        ],
      },
    ],
  });

  // Step 4: Create onboarding checklist
  await createOnboardingChecklist(tenant.tenantId);

  return tenant;
}
```

---

**Next Steps**:
- Review [API Reference](SYNTHEX_API_REFERENCE.md) for detailed API documentation
- See [Best Practices Guide](SYNTHEX_BEST_PRACTICES.md) for integration patterns
- Check [Troubleshooting Guide](SYNTHEX_TROUBLESHOOTING.md) for common integration issues
