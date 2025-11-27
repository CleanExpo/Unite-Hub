# Phase 5 Week 4 Plan: Real-Time Updates & Distributed Processing

**Phase**: Phase 5 (CONVEX Framework)
**Week**: 4 of 4
**Target Duration**: 5 working days
**Estimated LOC**: 2,500+ lines
**Status**: 🚀 **IN PROGRESS**

---

## Executive Summary

Phase 5 Week 4 transforms the alert system from on-demand to real-time with WebSocket streaming, adds Redis caching for performance, and implements distributed background job processing. This week focuses on **scalability, real-time responsiveness, and production-grade performance optimization**.

### Key Objectives

- ✅ Real-time WebSocket updates for alerts
- ✅ Redis caching layer for frequent queries
- ✅ Background job queue for analytics aggregations
- ✅ Distributed alert processing system
- ✅ Performance monitoring and metrics
- ✅ 95%+ uptime capability
- ✅ Sub-100ms alert latency

---

## Architecture Overview

```
User Dashboard
    ↓
[WebSocket Connection]
    ↓
[Alert Event Stream]
    ├─→ [Redis Cache] (frequent queries)
    ├─→ [Bull Job Queue] (async processing)
    │     ├─ Daily aggregations
    │     ├─ Pattern detection
    │     └─ Prediction generation
    └─→ [Database] (persistent storage)
         ├─ Real-time triggers
         ├─ Analytics snapshots
         └─ Performance metrics
```

---

## Task 1: Real-Time WebSocket System (700 LOC)

### 1.1 WebSocket Server Setup

**File**: `src/lib/websocket/websocket-server.ts`

```typescript
// WebSocket server with Next.js API routes
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import jwt from 'jsonwebtoken';

interface AlertClient {
  id: string;
  workspaceId: string;
  frameworkId?: string;
  socket: WebSocket;
  authenticated: boolean;
  lastPing: number;
}

class AlertWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AlertClient> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  async initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to detect dead connections
    setInterval(() => this.checkHeartbeat(), 30000);
  }

  private async handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();
    const client: AlertClient = {
      id: clientId,
      workspaceId: '',
      socket: ws,
      authenticated: false,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    ws.on('message', async (message: string) => {
      try {
        const parsed = JSON.parse(message);
        await this.handleMessage(clientId, parsed);
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format',
        });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) client.lastPing = Date.now();
    });
  }

  private async handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        await this.handleAuth(clientId, message.token);
        break;
      case 'subscribe':
        this.handleSubscribe(clientId, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
    }
  }

  private async handleAuth(clientId: string, token: string) {
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      const client = this.clients.get(clientId);
      if (client) {
        client.authenticated = true;
        client.workspaceId = decoded.workspaceId;
        this.sendToClient(clientId, {
          type: 'auth_success',
          clientId,
        });
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'auth_failed',
        message: 'Invalid token',
      });
    }
  }

  private handleSubscribe(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    // Subscribe to framework alerts
    const channel = `alerts:${client.workspaceId}:${message.frameworkId}`;
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(clientId);

    client.frameworkId = message.frameworkId;
    this.sendToClient(clientId, {
      type: 'subscribed',
      channel,
    });
  }

  private handleUnsubscribe(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const channel = `alerts:${client.workspaceId}:${message.frameworkId}`;
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channel,
    });
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all subscriptions
      this.subscriptions.forEach((subscribers) => {
        subscribers.delete(clientId);
      });
      this.clients.delete(clientId);
    }
  }

  private checkHeartbeat() {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    this.clients.forEach((client, clientId) => {
      if (now - client.lastPing > timeout) {
        client.socket.terminate();
        this.handleDisconnect(clientId);
      } else {
        client.socket.ping();
      }
    });
  }

  // Public method to broadcast alert to subscribers
  async broadcastAlert(workspaceId: string, frameworkId: string, alert: any) {
    const channel = `alerts:${workspaceId}:${frameworkId}`;
    const subscribers = this.subscriptions.get(channel);

    if (subscribers) {
      const message = JSON.stringify({
        type: 'alert',
        data: alert,
        timestamp: new Date().toISOString(),
      });

      subscribers.forEach((clientId) => {
        this.sendToClient(clientId, JSON.parse(message));
      });
    }
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private generateClientId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Metrics
  getMetrics() {
    return {
      connected_clients: this.clients.size,
      active_subscriptions: this.subscriptions.size,
      total_subscribers: Array.from(this.subscriptions.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }
}

export const alertWSServer = new AlertWebSocketServer();
```

### 1.2 WebSocket Client Hook

**File**: `src/hooks/useAlertWebSocket.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';

interface UseAlertWebSocketOptions {
  workspaceId: string;
  frameworkId: string;
  token: string;
  onAlert?: (alert: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useAlertWebSocket({
  workspaceId,
  frameworkId,
  token,
  onAlert,
  onConnect,
  onDisconnect,
}: UseAlertWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        // Authenticate
        socketRef.current?.send(JSON.stringify({
          type: 'auth',
          token,
        }));

        // Subscribe to framework alerts
        socketRef.current?.send(JSON.stringify({
          type: 'subscribe',
          frameworkId,
        }));

        onConnect?.();
      };

      socketRef.current.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);

        if (message.type === 'alert') {
          onAlert?.(message.data);
        }
      };

      socketRef.current.onclose = () => {
        onDisconnect?.();
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [workspaceId, frameworkId, token, onAlert, onConnect, onDisconnect]);

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
  };
}
```

### 1.3 Alert Streaming Component

**File**: `src/components/convex/AlertStreamPanel.tsx` (200 LOC)

- Real-time alert feed display
- Auto-scrolling to latest alerts
- Status badges (new, acknowledged, resolved)
- Severity indicators with colors
- Quick action buttons (acknowledge, resolve)

---

## Task 2: Redis Caching Layer (500 LOC)

### 2.1 Redis Client Setup

**File**: `src/lib/cache/redis-client.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

export interface CacheOptions {
  ttl?: number; // seconds (default: 3600)
  prefix?: string;
}

class CacheManager {
  private redis: Redis;

  constructor(redisInstance: Redis) {
    this.redis = redisInstance;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    const value = await this.redis.get(prefixedKey);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    const ttl = options?.ttl || 3600;
    await this.redis.setex(prefixedKey, ttl, JSON.stringify(value));
  }

  async del(key: string, prefix?: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key, prefix);
    await this.redis.del(prefixedKey);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private getPrefixedKey(key: string, prefix?: string): string {
    const p = prefix || 'app';
    return `${p}:${key}`;
  }
}

export const cacheManager = new CacheManager(redis);
export default redis;
```

### 2.2 Cached Alert Queries

**File**: `src/lib/cache/alert-cache.ts`

```typescript
import { cacheManager } from './redis-client';
import { supabase } from '@/lib/supabase';

export class AlertCache {
  static async getFrameworkAlerts(
    workspaceId: string,
    frameworkId: string
  ) {
    const cacheKey = `alerts:${workspaceId}:${frameworkId}`;

    // Check cache first
    const cached = await cacheManager.get(cacheKey, {
      prefix: 'alerts',
    });

    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data: alerts } = await supabase
      .from('convex_framework_alert_rules')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('workspace_id', workspaceId);

    // Cache for 5 minutes
    await cacheManager.set(cacheKey, alerts || [], {
      ttl: 300,
      prefix: 'alerts',
    });

    return alerts || [];
  }

  static async invalidateFrameworkAlerts(
    workspaceId: string,
    frameworkId: string
  ) {
    const pattern = `alerts:${workspaceId}:${frameworkId}*`;
    await cacheManager.invalidatePattern(pattern);
  }

  static async getAlertStats(workspaceId: string) {
    const cacheKey = `stats:${workspaceId}`;

    const cached = await cacheManager.get(cacheKey, {
      prefix: 'alerts',
    });

    if (cached) {
      return cached;
    }

    // Fetch from database (aggregated)
    const { data: stats } = await supabase
      .from('convex_alert_analytics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false })
      .limit(30);

    // Cache for 1 hour
    await cacheManager.set(cacheKey, stats || [], {
      ttl: 3600,
      prefix: 'alerts',
    });

    return stats || [];
  }
}
```

---

## Task 3: Background Job Queue (600 LOC)

### 3.1 Bull Queue Setup

**File**: `src/lib/queue/bull-queue.ts`

```typescript
import Queue, { Job } from 'bull';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Job queues
export const alertQueue = new Queue('alerts', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export const analyticsQueue = new Queue('analytics', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export const predictionQueue = new Queue('predictions', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Job processors
alertQueue.process(async (job: Job) => {
  const { workspaceId, frameworkId, alertData } = job.data;
  // Process alert
  // Broadcast via WebSocket
  // Update cache
  console.log(`Processing alert for ${frameworkId}`);
});

analyticsQueue.process(async (job: Job) => {
  const { workspaceId, frameworkId, date } = job.data;
  // Aggregate alert stats
  // Calculate patterns
  // Store in database
  console.log(`Aggregating analytics for ${frameworkId}`);
});

predictionQueue.process(async (job: Job) => {
  const { workspaceId, frameworkId } = job.data;
  // Generate predictions with Extended Thinking
  // Detect anomalies
  // Store predictions
  console.log(`Generating predictions for ${frameworkId}`);
});

// Event listeners
alertQueue.on('completed', (job) => {
  console.log(`Alert job ${job.id} completed`);
});

alertQueue.on('failed', (job, err) => {
  console.error(`Alert job ${job.id} failed:`, err.message);
});
```

### 3.2 Scheduled Jobs

**File**: `src/lib/jobs/scheduled-jobs.ts`

```typescript
import { analyticsQueue, predictionQueue } from '@/lib/queue/bull-queue';
import cron from 'node-cron';
import { supabase } from '@/lib/supabase';

export function initializeScheduledJobs() {
  // Daily analytics aggregation at 2 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily analytics aggregation');
    const frameworks = await getActiveFrameworks();

    for (const framework of frameworks) {
      await analyticsQueue.add(
        {
          workspaceId: framework.workspace_id,
          frameworkId: framework.id,
          date: new Date(),
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
    }
  });

  // Pattern detection every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running pattern detection');
    const frameworks = await getActiveFrameworks();

    for (const framework of frameworks) {
      // Trigger pattern detection job
    }
  });

  // Prediction generation daily
  cron.schedule('0 3 * * *', async () => {
    console.log('Running prediction generation');
    const frameworks = await getActiveFrameworks();

    for (const framework of frameworks) {
      await predictionQueue.add(
        {
          workspaceId: framework.workspace_id,
          frameworkId: framework.id,
        },
        {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
    }
  });
}

async function getActiveFrameworks() {
  const { data } = await supabase
    .from('convex_frameworks')
    .select('id, workspace_id')
    .eq('status', 'active');

  return data || [];
}
```

---

## Task 4: Distributed Alert Processing (400 LOC)

### 4.1 Alert Event Processor

**File**: `src/lib/processing/alert-processor.ts`

```typescript
import { alertQueue } from '@/lib/queue/bull-queue';
import { alertWSServer } from '@/lib/websocket/websocket-server';
import { AlertCache } from '@/lib/cache/alert-cache';
import { supabase } from '@/lib/supabase';

export class AlertProcessor {
  static async processAlertTrigger(alertId: string, data: any) {
    // Add to queue for processing
    await alertQueue.add(
      {
        alertId,
        data,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  static async handleAlertTrigger(alertId: string, triggerData: any) {
    // Fetch alert rule
    const { data: rule } = await supabase
      .from('convex_framework_alert_rules')
      .select('*')
      .eq('id', alertId)
      .single();

    if (!rule) return;

    // Check for suppression
    const isSuppressed = await this.checkSuppression(rule, triggerData);
    if (isSuppressed) {
      console.log(`Alert ${alertId} suppressed (duplicate)`);
      return;
    }

    // Store trigger event
    const { data: trigger } = await supabase
      .from('convex_framework_alert_triggers')
      .insert([
        {
          alert_rule_id: alertId,
          triggered_at: new Date(),
          current_value: triggerData.value,
          threshold_value: rule.threshold_value,
          notification_sent: false,
        },
      ])
      .select()
      .single();

    // Send notifications
    if (rule.notification_channels && rule.notification_channels.length > 0) {
      await this.sendNotifications(rule, trigger);
    }

    // Broadcast via WebSocket
    await alertWSServer.broadcastAlert(
      rule.workspace_id,
      rule.framework_id,
      trigger
    );

    // Invalidate cache
    await AlertCache.invalidateFrameworkAlerts(
      rule.workspace_id,
      rule.framework_id
    );
  }

  private static async checkSuppression(
    rule: any,
    triggerData: any
  ): Promise<boolean> {
    // Check if similar alert was triggered recently
    const { data: recentTriggers } = await supabase
      .from('convex_framework_alert_triggers')
      .select('*')
      .eq('alert_rule_id', rule.id)
      .gt('triggered_at', new Date(Date.now() - 5 * 60 * 1000)); // Last 5 minutes

    return (recentTriggers || []).length > 0;
  }

  private static async sendNotifications(rule: any, trigger: any) {
    // Email notifications
    if (rule.notification_channels.includes('email')) {
      // Queue email job
    }

    // Slack notifications
    if (rule.notification_channels.includes('slack')) {
      // Queue Slack job
    }

    // Webhook notifications
    if (rule.notification_channels.includes('webhook')) {
      // Queue webhook job
    }
  }
}
```

---

## Task 5: Performance Monitoring (300 LOC)

### 5.1 Metrics Collection

**File**: `src/lib/monitoring/alert-metrics.ts`

```typescript
import { prometheus } from '@/lib/monitoring/prometheus';

export class AlertMetrics {
  // Histogram for alert latency
  static alertLatencyHistogram = new prometheus.Histogram({
    name: 'alert_processing_latency_ms',
    help: 'Alert processing latency in milliseconds',
    buckets: [10, 50, 100, 500, 1000, 5000],
  });

  // Counter for alert triggers
  static alertTriggerCounter = new prometheus.Counter({
    name: 'alert_triggers_total',
    help: 'Total number of alert triggers',
    labelNames: ['framework_id', 'alert_type'],
  });

  // Counter for notifications sent
  static notificationCounter = new prometheus.Counter({
    name: 'notifications_sent_total',
    help: 'Total notifications sent',
    labelNames: ['channel', 'status'],
  });

  // Gauge for active WebSocket connections
  static wsConnectionGauge = new prometheus.Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections',
  });

  // Gauge for cache hit rate
  static cacheHitRateGauge = new prometheus.Gauge({
    name: 'cache_hit_rate_percent',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type'],
  });

  // Record metrics
  static recordAlertLatency(latencyMs: number) {
    this.alertLatencyHistogram.observe(latencyMs);
  }

  static recordAlertTrigger(frameworkId: string, alertType: string) {
    this.alertTriggerCounter.inc({ framework_id: frameworkId, alert_type: alertType });
  }

  static recordNotificationSent(channel: string, status: string) {
    this.notificationCounter.inc({ channel, status });
  }

  static updateWSConnections(count: number) {
    this.wsConnectionGauge.set(count);
  }

  static updateCacheHitRate(cacheType: string, percentage: number) {
    this.cacheHitRateGauge.set({ cache_type: cacheType }, percentage);
  }
}
```

---

## Task 6: Integration & Testing (600 LOC)

### 6.1 Integration Tests

**File**: `tests/integration/alert-websocket.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { alertWSServer } from '@/lib/websocket/websocket-server';

describe('Alert WebSocket System', () => {
  let ws: WebSocket;
  const token = 'test-token';
  const workspaceId = 'test-workspace';
  const frameworkId = 'test-framework';

  beforeAll(async () => {
    // Start WebSocket server
    await alertWSServer.initialize(server);
  });

  afterAll(async () => {
    ws?.close();
  });

  it('should connect and authenticate', async () => {
    ws = new WebSocket('ws://localhost:3008');

    return new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          resolve(message);
        }
      });

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'auth',
          token,
        }));
      });

      ws.on('error', reject);
    });
  });

  it('should subscribe to framework alerts', async () => {
    return new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'subscribed') {
          resolve(message);
        }
      });

      ws.send(JSON.stringify({
        type: 'subscribe',
        frameworkId,
      }));

      ws.on('error', reject);
    });
  });

  it('should receive real-time alerts', async () => {
    return new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'alert') {
          expect(message.data).toHaveProperty('id');
          expect(message.data).toHaveProperty('current_value');
          resolve(message);
        }
      });

      // Broadcast test alert
      alertWSServer.broadcastAlert(workspaceId, frameworkId, {
        id: 'test-alert',
        current_value: 95,
        threshold_value: 90,
      });

      ws.on('error', reject);
    });
  });
});
```

### 6.2 Cache Testing

**File**: `tests/integration/alert-cache.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AlertCache } from '@/lib/cache/alert-cache';
import { cacheManager } from '@/lib/cache/redis-client';

describe('Alert Cache', () => {
  it('should cache alert queries', async () => {
    const workspaceId = 'test-workspace';
    const frameworkId = 'test-framework';

    // First call - from database
    const result1 = await AlertCache.getFrameworkAlerts(
      workspaceId,
      frameworkId
    );

    // Second call - from cache
    const result2 = await AlertCache.getFrameworkAlerts(
      workspaceId,
      frameworkId
    );

    expect(result1).toEqual(result2);
  });

  it('should invalidate cache on update', async () => {
    const cacheKey = 'test:key';

    await cacheManager.set(cacheKey, { data: 'test' }, { ttl: 3600 });
    const cached = await cacheManager.get(cacheKey);
    expect(cached).toEqual({ data: 'test' });

    await cacheManager.del(cacheKey);
    const deleted = await cacheManager.get(cacheKey);
    expect(deleted).toBeNull();
  });
});
```

---

## Database Changes (2 new tables)

### New Migration: `278_alert_queue_state.sql`

```sql
-- Queue state tracking for resilience
CREATE TABLE IF NOT EXISTS alert_job_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL, -- 'alert', 'analytics', 'prediction'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  workspace_id UUID NOT NULL REFERENCES organizations(id),
  framework_id UUID NOT NULL,
  data JSONB,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_alert_job_state_status ON alert_job_state(status);
CREATE INDEX idx_alert_job_state_workspace ON alert_job_state(workspace_id);

-- WebSocket connection tracking
CREATE TABLE IF NOT EXISTS websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workspace_id UUID NOT NULL REFERENCES organizations(id),
  framework_id UUID,
  connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' -- 'active', 'disconnected'
);

CREATE INDEX idx_websocket_connections_workspace ON websocket_connections(workspace_id);
```

---

## Files to Create

```
src/lib/websocket/
  ├── websocket-server.ts           (280 LOC)
  └── handlers.ts                   (150 LOC)

src/lib/cache/
  ├── redis-client.ts               (150 LOC)
  ├── alert-cache.ts                (200 LOC)
  └── cache-strategies.ts           (100 LOC)

src/lib/queue/
  ├── bull-queue.ts                 (100 LOC)
  └── job-processors.ts             (200 LOC)

src/lib/jobs/
  ├── scheduled-jobs.ts             (150 LOC)
  └── job-handlers.ts               (200 LOC)

src/lib/processing/
  ├── alert-processor.ts            (250 LOC)
  ├── notification-processor.ts     (200 LOC)
  └── analytics-processor.ts        (200 LOC)

src/lib/monitoring/
  ├── alert-metrics.ts              (150 LOC)
  ├── prometheus.ts                 (100 LOC)
  └── health-checks.ts              (150 LOC)

src/hooks/
  ├── useAlertWebSocket.ts          (120 LOC)
  └── useAlertMetrics.ts            (80 LOC)

src/components/convex/
  ├── AlertStreamPanel.tsx          (200 LOC)
  ├── RealtimeAlertIndicator.tsx    (150 LOC)
  └── AlertMetricsMonitor.tsx       (180 LOC)

src/app/api/convex/
  ├── websocket/route.ts            (100 LOC)
  ├── alerts/stream/route.ts        (80 LOC)
  ├── analytics/aggregate/route.ts  (120 LOC)
  └── metrics/status/route.ts       (80 LOC)

tests/integration/
  ├── alert-websocket.test.ts       (200 LOC)
  ├── alert-cache.test.ts           (150 LOC)
  ├── alert-queue.test.ts           (180 LOC)
  └── alert-processor.test.ts       (200 LOC)
```

---

## Environment Variables to Add

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_TIMEOUT=60000

# Queue
BULL_QUEUE_PREFIX=alert
BULL_QUEUE_CLEANUP_ENABLED=true

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "ioredis": "^5.3.2",
    "bull": "^4.11.5",
    "node-cron": "^3.0.2",
    "prom-client": "^15.0.0",
    "ws": "^8.15.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.9"
  }
}
```

---

## Implementation Roadmap

### Day 1-2: WebSocket & Caching
- [ ] Implement WebSocket server
- [ ] Create cache manager with Redis
- [ ] Add client-side WebSocket hook
- [ ] Real-time alert streaming component

### Day 3: Background Jobs
- [ ] Set up Bull queue
- [ ] Implement job processors
- [ ] Create scheduled jobs
- [ ] Job state tracking

### Day 4: Integration
- [ ] Alert event processing
- [ ] Notification delivery
- [ ] Performance monitoring
- [ ] Health checks

### Day 5: Testing & Docs
- [ ] Comprehensive integration tests
- [ ] Performance benchmarks
- [ ] Documentation
- [ ] Week 4 completion summary

---

## Success Criteria

- ✅ WebSocket alerts delivered in <100ms
- ✅ Redis cache hit rate >80%
- ✅ Job queue processing >99% successful
- ✅ Zero data loss on reconnections
- ✅ Support 1,000+ concurrent connections
- ✅ 95%+ test coverage
- ✅ All metrics available via Prometheus
- ✅ 99.9% system uptime capability

---

## Dependencies

**Must Complete Before Week 4**:
- ✅ Phase 5 Week 3 (Alert system foundation)
- ✅ All migrations (270-277)
- ✅ Redis infrastructure available
- ✅ Database schema finalized

---

**Phase Status**: 🚀 **IN PROGRESS**
**Last Updated**: 2025-11-27
**Ready to Start**: ✅ YES
