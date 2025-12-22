# M1 Agent Architecture - Quick Reference Guide

**For Operators & DevOps Teams**

---

## System Overview

**Status**: ✅ Production Ready
**Version**: v2.0.0
**Components**: 100+
**Tests**: 1,222 (all passing)

---

## Key Endpoints

```bash
# Health & Status
GET  /health                    # Overall system health
GET  /health/database          # Database connectivity
GET  /health/cache             # Cache status
GET  /health/rate-limit        # Rate limiter status

# Metrics
GET  /metrics                  # Prometheus metrics (port 9090)

# Agent Control
POST /api/m1/agent-run         # Start agent execution
GET  /api/m1/agent-run/{id}    # Get run status
```

---

## Environment Variables (Critical)

```bash
# Must be set before deployment
M1_JWT_SECRET                  # JWT signing secret (min 32 chars)
NEXT_PUBLIC_CONVEX_URL         # Convex database URL
CONVEX_DEPLOYMENT              # Convex deployment ID
ANTHROPIC_API_KEY              # Claude API key

# Optional (defaults provided)
M1_LOG_LEVEL=info              # Logging level
M1_CACHE_MAX_SIZE=10000        # Cache size
M1_GLOBAL_RATE_LIMIT=10000     # Global request limit
NODE_ENV=production            # Environment mode
```

---

## Deployment Quick Start

```bash
# 1. Verify tests pass
npm run m1:test:all

# 2. Configure environment
cp .env.production.example .env.production
# Edit with actual values

# 3. Build & Deploy
npm run build
NODE_ENV=production node .next/server.js

# 4. Verify
curl http://localhost:8080/health
```

---

## Monitoring Dashboard Queries

```prometheus
# Request success rate
rate(m1_agent_runs_completed_total[5m]) / rate(m1_agent_runs_total[5m])

# P99 latency
histogram_quantile(0.99, rate(m1_tool_execution_duration_ms[5m]))

# Cache hit rate
rate(m1_cache_hits_total[5m]) / (rate(m1_cache_hits_total[5m]) + rate(m1_cache_misses_total[5m]))

# Rate limit violations
rate(m1_rate_limit_exceeded_total[5m])

# Active connections
m1_active_connections
```

---

## Performance Tuning

**High Traffic (50,000+ req/min)**:
```bash
M1_GLOBAL_RATE_LIMIT=50000
M1_CACHE_MAX_SIZE=100000
M1_RATE_LIMIT_COOLDOWN_MS=10000
NODE_OPTIONS="--max-old-space-size=4096"
```

**Low Latency (< 50ms P99)**:
```bash
M1_CACHE_TTL_SECONDS=7200
M1_L1_CACHE_SIZE=5000
M1_RATE_LIMIT_BASE=5000
```

**High Availability**:
```bash
M1_RATE_LIMIT_RECOVERY_MULTIPLIER=1.2
M1_JWT_EXPIRATION_MINUTES=15
CONVEX_DEPLOYMENT=multi-region-deployment
```

---

## Troubleshooting Flowchart

```
Issue: High Memory Usage
  → Check: M1_CACHE_MAX_SIZE
  → Action: Reduce cache sizes
  → Verify: curl http://localhost:8080/health/memory

Issue: Rate Limiting Too Strict
  → Check: /metrics | grep rate_limit
  → Action: Increase M1_GLOBAL_RATE_LIMIT
  → Verify: Test with load generation

Issue: Low Cache Hit Rate
  → Check: /metrics | grep cache
  → Action: Increase M1_CACHE_MAX_SIZE or M1_CACHE_TTL_SECONDS
  → Verify: Hit rate > 80%

Issue: API Latency High
  → Check: histogram_quantile(0.99, ...) in Prometheus
  → Action: Check cache configuration, increase resources
  → Verify: P99 < 100ms

Issue: Database Connectivity Failed
  → Check: curl http://localhost:8080/health/database
  → Action: Verify NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOYMENT
  → Verify: Database is accessible
```

---

## Rollback Command

```bash
# If deployment fails:
git revert HEAD
npm run build
NODE_ENV=production node .next/server.js
curl http://localhost:8080/health  # Verify
```

---

## Shutdown Procedure

```bash
# Graceful shutdown
kill -SIGTERM <process_id>

# Component cleanup order:
# 1. Stop accepting new requests
# 2. Drain in-flight requests (30s timeout)
# 3. Flush pending metrics to monitoring
# 4. Close database connections
# 5. Clean up cache and rate limiter state
# 6. Shut down

# All components have shutdown() methods:
multiLevelRateLimiter.shutdown()
quotaManager.shutdown()
adaptiveRateLimiter.shutdown()
fairQueue.shutdown()
```

---

## Metrics Reference

| Metric | Description | Alert if |
|--------|-------------|----------|
| `m1_agent_runs_total` | Total runs | N/A |
| `m1_agent_run_duration_ms` | Run latency | P99 > 100ms |
| `m1_tool_executions_total` | Total executions | N/A |
| `m1_tool_execution_errors_total` | Failed executions | error_rate > 5% |
| `m1_policy_checks_total` | Policy evaluations | N/A |
| `m1_policy_denied_total` | Denied requests | denied_rate > 1% |
| `m1_rate_limit_exceeded_total` | Violations | > 100/min |
| `m1_cache_hits_total` | Cache hits | hit_rate < 80% |
| `m1_cache_misses_total` | Cache misses | N/A |
| `m1_active_connections` | Current connections | > 1000 |

---

## Common Tasks

**Update rate limit**:
```bash
# Edit .env.production
M1_GLOBAL_RATE_LIMIT=20000
# Restart service
systemctl restart m1-agent-architecture
```

**Increase cache size**:
```bash
M1_CACHE_MAX_SIZE=50000
M1_CACHE_TTL_SECONDS=7200
# Requires restart
```

**Enable debug logging**:
```bash
M1_LOG_LEVEL=debug
DEBUG=m1:*
# Restart service
```

**Clear cache manually**:
```bash
# Via API (if endpoint available)
curl -X POST http://localhost:3000/api/m1/cache/clear
# Or restart service to reset in-memory cache
```

---

## Support Contacts

- **Technical Issues**: DevOps team Slack channel
- **Security Concerns**: security@company.com
- **Performance Issues**: Check metrics dashboard first
- **Database Issues**: Database administrator
- **API Issues**: Backend team

---

## Useful Links

- Status Dashboard: https://monitoring.company.com/m1
- Logs: https://logs.company.com/m1
- Metrics: http://localhost:9090 (local)
- Documentation: See README.md
- Runbooks: See docs/ directory

---

**Last Updated**: December 22, 2025
**Version**: v2.0.0
**Status**: ✅ PRODUCTION READY
