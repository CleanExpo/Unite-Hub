# M1 Agent Architecture - Production Deployment Guide

**Version**: v2.2.0 (Phase 9 - Production Hardening & Observability)
**Release**: m1-production-hardening-v9
**Status**: Production Ready ✅

---

## Overview

This guide provides comprehensive instructions for deploying the M1 Agent Architecture Control Layer to production environments. The M1 system is designed for safe, auditable agent orchestration with strict security controls and comprehensive observability.

### Core Principle

> **"Agents propose actions only; all execution authority is enforced externally by the CLI or host system"**

This means:
- ✅ Agents generate proposals via Claude API
- ✅ CLI explicitly approves/rejects each action
- ✅ Tools execute ONLY with explicit authorization
- ✅ No automatic execution, no silent approvals
- ✅ Full audit trail maintained

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Redis Configuration](#redis-configuration)
6. [API Deployment](#api-deployment)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security Hardening](#security-hardening)
9. [Troubleshooting & Runbooks](#troubleshooting--runbooks)
10. [Rollback Procedures](#rollback-procedures)

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                    M1 Agent Control Layer                │
├─────────────────────────────────────────────────────────┤
│  Phase 1: Foundation                                    │
│  - Tool Registry (allowlisting)                         │
│  - Policy Engine (validation)                           │
│  - Logging Infrastructure                              │
│                                                          │
│  Phase 2: Orchestration                                │
│  - OrchestratorAgent (Claude API reasoning)            │
│  - Proposal Generation                                 │
│                                                          │
│  Phase 3: CLI Execution                                │
│  - Command Line Interface                              │
│  - Approval Flow                                       │
│  - JWT Token Verification                              │
│                                                          │
│  Phase 4-7: Production Ready                           │
│  - Integration Testing (30+ tests)                     │
│  - Persistent Storage (Convex)                         │
│  - Monitoring & Metrics                                │
│  - Cost Tracking                                       │
│                                                          │
│  Phase 8-9: Production Hardening                       │
│  - Multi-tier Caching (Local + Redis)                 │
│  - Dashboard API (7 endpoints)                         │
│  - Performance Benchmarking (17 tests)                │
│  - Load Testing & Stress Tests                         │
└─────────────────────────────────────────────────────────┘
        ↓              ↓              ↓              ↓
    CLI Input    Policy Check   Tool Registry   Database
    (User)       (M1 Engine)      (Memory)      (Convex)
        ↓              ↓              ↓              ↓
    ┌───────────────────────────────────────────────────┐
    │     External Execution Authority Layer (CLI)      │
    │        (The only place where tools run)           │
    └───────────────────────────────────────────────────┘
```

### Data Flow

```
User Goal
    ↓
OrchestratorAgent (Claude API)
    ↓
Generates Proposal(s)
    ↓
Policy Engine Validation
    ├─ Tool Registry Check
    ├─ Approval Token Validation
    └─ Scope Authorization
    ↓
CLI Approval Flow
    ├─ Auto-approve (with pre-auth token)
    └─ Interactive approval (user prompt)
    ↓
Tool Execution (EXTERNAL to M1)
    ↓
Result Logging & Metrics
    ├─ Persistent Storage (Convex)
    ├─ Metrics Collection
    └─ Cost Tracking
```

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All 359 M1 tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] ESLint clean (`npm run lint`)
- [ ] Code coverage > 95% for M1 components
- [ ] Performance tests passing (latency SLOs met)
- [ ] Integration tests complete
- [ ] Security audit completed
- [ ] Documentation reviewed

### Infrastructure Readiness

- [ ] PostgreSQL database provisioned (Convex)
- [ ] Redis cluster configured (optional but recommended)
- [ ] Load balancer configured
- [ ] SSL/TLS certificates valid
- [ ] CDN configured (if applicable)
- [ ] Monitoring systems ready
- [ ] Logging aggregation configured
- [ ] Alerting rules defined

### Security Readiness

- [ ] JWT secret configured (use environment variables)
- [ ] API keys rotated
- [ ] CORS policies defined
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] WAF rules configured
- [ ] Security headers set

### Documentation Readiness

- [ ] Deployment runbook reviewed
- [ ] Troubleshooting guide prepared
- [ ] Incident response plan ready
- [ ] Rollback procedure tested
- [ ] Team trained on monitoring dashboard
- [ ] On-call rotation established
- [ ] Escalation procedures defined

---

## Environment Configuration

### Required Environment Variables

```bash
# M1 Agent Configuration
M1_JWT_SECRET="your-production-secret-key-here"
M1_JWT_ALGORITHM="HS256"
M1_APPROVAL_TOKEN_TTL_MINUTES="5"

# Claude API
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Convex Database
CONVEX_URL="https://your-convex-url.convex.site"
NEXT_PUBLIC_CONVEX_URL="https://your-convex-url.convex.site"

# Redis Configuration
REDIS_URL="redis://your-redis-host:6379"
REDIS_PASSWORD="your-redis-password"
REDIS_TLS="true"
REDIS_MAX_RETRIES="3"
REDIS_RETRY_DELAY_MS="100"

# Monitoring & Metrics
LOG_LEVEL="info"
METRICS_EXPORT_INTERVAL_MS="60000"
PROMETHEUS_METRICS_ENABLED="true"

# Cost Tracking
COST_TRACKING_ENABLED="true"
COST_ALERT_THRESHOLD="100.00"

# Feature Flags
ENABLE_REDIS_CACHING="true"
ENABLE_DISTRIBUTED_CACHE="true"
ENABLE_DASHBOARD_API="true"
```

### Configuration Precedence

1. **Environment variables** (highest priority)
2. **Configuration file** (e.g., `config.production.ts`)
3. **Defaults** (lowest priority)

### Secret Management

**Production**: Use a secret management service:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Doppler
- 1Password

**Never** commit secrets to version control.

```bash
# Example: Load from AWS Secrets Manager
export M1_JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id m1/jwt-secret \
  --query SecretString \
  --output text)
```

---

## Database Setup

### Convex Database

The M1 system uses Convex for persistent audit logs and agent run records.

#### Step 1: Create Convex Project

```bash
# Initialize Convex (if not already done)
npx convex init
```

#### Step 2: Deploy Schema

```bash
# Deploy the schema to Convex
npm run convex:deploy

# Verify tables are created
npx convex list-tables
```

#### Step 3: Verify Tables

Check that these tables exist:
- `agentRuns` - Agent execution records
- `agentToolCalls` - Tool call records
- `revokedTokens` - Revoked JWT tokens (for future use)

```bash
# Query table row count
npx convex query "SELECT COUNT(*) FROM agentRuns"
```

#### Step 4: Create Indexes

Indexes are defined in schema - verify they're created:

```bash
npx convex list-indexes
```

Expected indexes:
- `agentRuns.by_run_id` - Fast lookup by run ID
- `agentRuns.by_agent` - Query by agent name
- `agentRuns.by_created` - Time-ordered queries
- `agentToolCalls.by_run_id` - Tool calls per run
- `agentToolCalls.by_request_id` - Individual tool lookup

#### Step 5: Test Connection

```bash
npm run test:persistence
```

### Data Retention Policy

**Recommended retention**:
- Agent runs: 2 years (compliance)
- Tool calls: 2 years (audit trail)
- Revoked tokens: 30 days
- Metrics: 90 days (older data archived)

---

## Redis Configuration

### Redis Setup (Optional but Recommended)

Redis provides distributed caching, improving performance and enabling multi-instance deployments.

#### Step 1: Choose Deployment Model

**Option A: Managed Redis**
- AWS ElastiCache
- Azure Cache for Redis
- Google Cloud Memorystore
- Heroku Redis

**Option B: Self-Hosted**
- Docker Compose (development)
- Kubernetes StatefulSet (production)
- Standalone server

#### Step 2: Configuration

```bash
# Connection parameters
REDIS_URL="redis://redis-host:6379"
REDIS_PASSWORD="strong-password-here"
REDIS_DB="0"

# Timeout settings
REDIS_CONNECT_TIMEOUT_MS="5000"
REDIS_COMMAND_TIMEOUT_MS="3000"

# Retry policy
REDIS_MAX_RETRIES="3"
REDIS_RETRY_DELAY_MS="100"
REDIS_RETRY_DELAY_MAX_MS="1000"

# TLS/SSL
REDIS_TLS="true"
REDIS_TLS_REJECT_UNAUTHORIZED="true"
```

#### Step 3: Connection Test

```bash
npm run test:redis

# Expected output:
# ✓ Redis connection successful
# ✓ Ping response: PONG
# ✓ Set/Get operations working
```

#### Step 4: Memory Configuration

Configure Redis memory limits based on your workload:

```bash
# Redis configuration (redis.conf)
maxmemory 4gb
maxmemory-policy allkeys-lru  # Evict least recently used keys

# Monitor memory usage
INFO memory

# Expected output:
# used_memory_human: 2.5G
# used_memory_peak_human: 3.8G
```

#### Step 5: Persistence Configuration

For production, enable Redis persistence:

```bash
# RDB snapshots
save 900 1          # Save if 900 sec and 1 key changed
save 300 10         # Save if 300 sec and 10 keys changed
save 60 10000       # Save if 60 sec and 10000 keys changed

# AOF (Append-Only File)
appendonly yes
appendfsync everysec
```

#### Step 6: Monitoring

```bash
# Monitor Redis performance
redis-cli --stat

# Expected metrics:
# keys: Increment as cache is used
# used_memory: Should stabilize after warm-up
# hit_rate: Target > 95%
```

---

## API Deployment

### Docker Deployment

#### Step 1: Build Docker Image

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

#### Step 2: Build and Push

```bash
# Build image
docker build -t m1-agent:v2.2.0 .

# Tag for registry
docker tag m1-agent:v2.2.0 your-registry/m1-agent:v2.2.0

# Push to registry
docker push your-registry/m1-agent:v2.2.0
```

#### Step 3: Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m1-agent
  labels:
    app: m1-agent
    version: v2.2.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: m1-agent
  template:
    metadata:
      labels:
        app: m1-agent
    spec:
      containers:
      - name: m1-agent
        image: your-registry/m1-agent:v2.2.0
        ports:
        - containerPort: 3000
          name: http

        env:
        - name: NODE_ENV
          value: "production"
        - name: M1_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: jwt-secret
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: anthropic-api-key
        - name: CONVEX_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: convex-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: redis-url

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"

        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false

---
apiVersion: v1
kind: Service
metadata:
  name: m1-agent-service
spec:
  type: LoadBalancer
  selector:
    app: m1-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

Deploy:
```bash
kubectl apply -f deployment.yaml

# Verify deployment
kubectl get deployment m1-agent
kubectl get pods -l app=m1-agent
```

### Health Checks

Create a health check endpoint:

```typescript
// endpoints/health.ts
export async function GET(request: Request) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.2.0',
    checks: {
      database: 'ok',
      redis: 'ok',
      memory: 'ok'
    }
  };

  // Check database connectivity
  try {
    const result = await checkDatabase();
    health.checks.database = result ? 'ok' : 'degraded';
  } catch (error) {
    health.checks.database = 'failed';
    health.status = 'degraded';
  }

  // Check Redis connectivity
  try {
    const ping = await checkRedis();
    health.checks.redis = ping ? 'ok' : 'degraded';
  } catch (error) {
    health.checks.redis = 'failed';
    // Redis is optional, don't mark unhealthy
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = memPercent < 90 ? 'ok' : 'degraded';

  const status = health.status === 'healthy' ? 200 : 503;
  return new Response(JSON.stringify(health), { status });
}
```

---

## Monitoring & Observability

### Metrics Collection

M1 automatically collects metrics including:
- Agent run count and duration
- Tool execution count and duration
- Policy check results
- Cache hit/miss rates
- API latency
- Error rates
- Cost tracking

### Dashboard Access

Access the monitoring dashboard at:
```
https://your-m1-deployment.com/api/m1/dashboard
```

Endpoints:
- `/api/m1/dashboard` - Complete snapshot
- `/api/m1/dashboard/metrics` - Operations overview
- `/api/m1/dashboard/cache` - Cache performance
- `/api/m1/dashboard/policy` - Policy decisions
- `/api/m1/dashboard/costs` - Cost analysis
- `/api/m1/dashboard/health` - System health
- `/api/m1/dashboard/runs` - Agent run analytics

### Example Queries

```bash
# Get complete dashboard
curl https://your-m1-deployment.com/api/m1/dashboard

# Get cache metrics
curl https://your-m1-deployment.com/api/m1/dashboard/cache

# Get cost analysis
curl https://your-m1-deployment.com/api/m1/dashboard/costs
```

### Prometheus Integration

Export metrics in Prometheus format:

```bash
curl https://your-m1-deployment.com/api/m1/metrics/prometheus
```

### Alert Rules

Create alerts for:

```yaml
# Prometheus alert rules
groups:
- name: m1-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(m1_tool_execution_errors_total[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High error rate in M1 tool execution"

  - alert: HighPolicyCacheMissRate
    expr: rate(m1_policy_cache_misses[5m]) / rate(m1_policy_checks_total[5m]) > 0.5
    for: 5m
    annotations:
      summary: "High cache miss rate in policy engine"

  - alert: HighCostSpend
    expr: m1_total_cost > 1000
    for: 1h
    annotations:
      summary: "M1 cost spending exceeded $1000"

  - alert: RedisConnectionFailed
    expr: m1_redis_connected == 0
    for: 2m
    annotations:
      summary: "M1 Redis connection failed"
```

---

## Security Hardening

### API Security

#### Rate Limiting

```bash
# Configure rate limits
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=10000
```

#### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

#### Security Headers

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### Token Security

#### JWT Best Practices

- Use strong secret (minimum 32 characters)
- Set short expiration (5 minutes recommended)
- Implement token revocation list
- Rotate secrets quarterly

```bash
# Generate strong secret
openssl rand -base64 32

# Rotate secrets (for blue-green deployment)
# 1. Add new secret to config
# 2. Verify new secret works
# 3. Remove old secret from config
```

### Database Security

#### Convex Security

- Enable authentication
- Configure row-level security (if available)
- Limit API key scopes
- Enable audit logging

#### Redis Security

```bash
# Enable authentication
requirepass your-strong-password

# Disable dangerous commands in production
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""

# Enable ACLs (Redis 6+)
ACL SETUSER default on >your-password +@all
ACL SETUSER m1-app on >m1-app-password +get +set +del +exists -@all
```

### Audit Logging

M1 maintains a complete audit trail:

```bash
# View recent agent runs
curl https://your-m1-deployment.com/api/m1/dashboard/runs | jq '.recentRuns'

# Export audit logs
npx convex query "SELECT * FROM agentRuns ORDER BY createdAt DESC LIMIT 1000"
```

---

## Troubleshooting & Runbooks

### Runbook 1: High Error Rate Response

**Alert**: Error rate exceeds 10%

**Response Steps**:
1. Check recent deployment (was there a release?)
2. Review error logs: `kubectl logs -f deployment/m1-agent`
3. Check policy engine status: `curl /api/m1/dashboard/health`
4. Check database connectivity
5. If database down: escalate to database team
6. If recent deployment: consider rollback (see section below)
7. If persistent: page on-call architect

### Runbook 2: Cache Performance Degradation

**Alert**: Cache hit rate drops below 90%

**Response Steps**:
1. Check Redis connectivity: `redis-cli ping`
2. Check Redis memory: `redis-cli INFO memory`
3. If Redis memory full: increase size or configure eviction policy
4. Check cache statistics: `curl /api/m1/dashboard/cache`
5. Analyze recent activity for unusual patterns
6. If Redis offline: system falls back to local cache (performance impact but functional)

### Runbook 3: Policy Engine Performance Degradation

**Alert**: Policy check latency > 5ms

**Response Steps**:
1. Check policy cache hit rate: `curl /api/m1/dashboard/policy`
2. Check tool registry size
3. If many new tools: rebuild tool registry index
4. Check CPU usage: `kubectl top pod`
5. If CPU high: consider horizontal scaling (add more pods)

### Runbook 4: Database Connection Failures

**Alert**: Database connectivity failed

**Response Steps**:
1. Check Convex status page
2. Verify connection string: `echo $CONVEX_URL`
3. Check network connectivity: `nc -zv <convex-host> 443`
4. Review Convex logs for errors
5. If persistent: contact Convex support
6. Note: In-memory logging continues (persistence fails but operations continue)

### Runbook 5: Token Expiration Issues

**Alert**: Approval tokens being rejected

**Response Steps**:
1. Check JWT secret is configured: `echo $M1_JWT_SECRET`
2. Verify token expiration settings
3. Check system time synchronization (clock skew issues)
4. Review recent token generation in logs
5. If clock skew: restart server or sync system clock

---

## Rollback Procedures

### Pre-Rollback Checklist

- [ ] Decision approved by team lead
- [ ] Rollback procedure tested within last 30 days
- [ ] Previous version tested and verified working
- [ ] Incident documented in ticket
- [ ] Stakeholders notified

### Rollback Process

#### Step 1: Stop Current Deployment

```bash
# Scale down current deployment
kubectl set replicas deployment/m1-agent --replicas=0

# Verify pods are terminated
kubectl get pods -l app=m1-agent
```

#### Step 2: Restore Previous Version

```bash
# Update deployment image to previous version
kubectl set image deployment/m1-agent \
  m1-agent=your-registry/m1-agent:v2.1.0

# Scale back up
kubectl set replicas deployment/m1-agent --replicas=3

# Verify deployment
kubectl get deployment m1-agent
kubectl get pods -l app=m1-agent
```

#### Step 3: Verify Health

```bash
# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=m1-agent --timeout=300s

# Check health endpoint
curl https://your-m1-deployment.com/health

# Monitor metrics
watch 'curl https://your-m1-deployment.com/api/m1/dashboard/health'
```

#### Step 4: Post-Rollback

1. Verify no error spikes in logs
2. Confirm metrics returning to normal
3. Notify stakeholders of rollback
4. Schedule post-incident review
5. Document root cause and lessons learned

### Database Rollback

For database schema changes (rare):

```bash
# List available migrations
npm run convex:migrations

# Rollback to previous version
npm run convex:rollback v2.1.0

# Verify schema
npx convex list-tables
```

---

## Performance Targets

M1 is designed to meet these SLOs in production:

| Metric | Target | P95 | P99 |
|--------|--------|-----|-----|
| Policy check latency | < 1ms | < 5ms | < 10ms |
| Cache operation latency | < 0.1ms | < 1ms | < 2ms |
| Dashboard aggregation | < 10ms | < 50ms | < 100ms |
| Tool execution latency | < 100ms | < 500ms | < 1s |
| API response time | < 50ms | < 200ms | < 500ms |
| Error rate | < 0.1% | - | - |
| Cache hit rate | > 95% | - | - |

---

## Compliance & Audit

### Audit Trail

M1 maintains complete audit logs in Convex:
- All agent runs with goal and reasoning
- All tool executions with parameters and results
- All policy decisions with approval status
- All errors with context

Export for compliance:

```bash
# Export all agent runs for audit
npx convex export > m1-audit-logs.json

# Query specific time range
npx convex query "SELECT * FROM agentRuns WHERE createdAt > 1700000000000 AND createdAt < 1700086400000"
```

### Data Retention

- Agent run logs: 2 years minimum
- Policy decisions: 2 years minimum
- Tool call logs: 2 years minimum
- Metrics: 90 days (older data archived)

---

## Support & Documentation

- **Issues**: https://github.com/anthropics/claude-code/issues
- **Documentation**: [M1 Architecture Guide](./M1_ARCHITECTURE.md)
- **API Reference**: [Dashboard API](./API_REFERENCE.md)
- **Security**: [Security Policy](./SECURITY.md)

---

**Deployment Team**: Use this guide as your source of truth for production deployments.
**Questions**: Contact the M1 architecture team on Slack: #m1-architecture

---

*Last Updated: 2025-12-18*
*Version: 2.2.0 (m1-production-hardening-v9)*
