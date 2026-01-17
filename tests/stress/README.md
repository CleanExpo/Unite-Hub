# Unite-Hub Stress Test Suite

Comprehensive stress testing framework with **1000 tests** across 6 categories to validate production readiness.

## Test Categories

| Category | Tests | File | Description |
|----------|-------|------|-------------|
| **API Endpoint** | 200 | `api/api-stress.js` | CRUD, auth, rate limiting, timeouts |
| **Database** | 200 | `database/db-stress.js` | Connection pools, transactions, RLS, indexes |
| **Multi-Tenant** | 150 | `isolation/tenant-isolation.js` | Cross-tenant leaks, boundary violations |
| **AI Agents** | 150 | `agents/agent-stress.js` | Rate limits, queues, costs, memory |
| **WebSocket** | 100 | `websocket/ws-stress.js` | Connections, messages, reconnects |
| **Chaos Engineering** | 200 | `chaos/chaos-stress.js` | Network, failures, recovery |

## Quick Start

```bash
# Install k6 (if not installed)
# macOS: brew install k6
# Windows: choco install k6
# Linux: https://k6.io/docs/get-started/installation/

# Run all stress tests
pnpm test:stress

# Run smoke test (light load, 1 minute)
pnpm test:stress:smoke

# Run specific category
pnpm test:stress:api
pnpm test:stress:db
pnpm test:stress:isolation
pnpm test:stress:agents
pnpm test:stress:websocket
pnpm test:stress:chaos

# Full production stress test (all categories, ~70 minutes)
pnpm test:stress:full

# Generate JSON report
pnpm test:stress:report
```

## Environment Variables

```bash
# Required
BASE_URL=http://localhost:3008       # API base URL
WS_URL=ws://localhost:3008           # WebSocket URL

# Optional
AUTH_TOKEN=xxx                       # Pre-authenticated token
TEST_EMAIL=test@example.com          # Test user email
TEST_PASSWORD=xxx                    # Test user password
WORKSPACE_IDS=ws-1,ws-2,ws-3         # Comma-separated workspace IDs
MAX_VUS=1000                         # Maximum virtual users
ANTHROPIC_BUDGET_LIMIT=10.00         # AI budget limit ($)
```

## Test Scenarios

### API Stress Tests (200 tests)
- **CRUD at Scale**: Create/read/update operations under 50-1000 VUs
- **Authentication**: Login storms, token validation, expired tokens
- **Rate Limiting**: Burst detection, recovery, per-endpoint limits
- **Concurrent Workspaces**: Parallel multi-tenant operations
- **Timeout Handling**: Slow queries, retries, recovery
- **Error Consistency**: 4xx/5xx format validation

### Database Stress Tests (200 tests)
- **Connection Pool**: Saturation, burst, recovery
- **Long Transactions**: Large datasets, aggregations, batch inserts
- **RLS Performance**: Policy evaluation under load
- **Index Efficiency**: Primary key, compound, text search
- **Deadlock Detection**: Concurrent updates, cross-table
- **Backup Operations**: Read/write during backup window

### Multi-Tenant Isolation Tests (150 tests)
- **Cross-Tenant Leaks**: Direct access, updates, deletes
- **Boundary Violations**: Missing params, invalid IDs, manipulation
- **Concurrent Operations**: Parallel reads/writes across workspaces

### AI Agent Stress Tests (150 tests)
- **Rate Limit Handling**: Detection, recovery, retries
- **Queue Backpressure**: Depth monitoring, drain behavior
- **Concurrent Execution**: Parallel calls, cross-workspace
- **Memory Detection**: Large payloads, repeated requests
- **Budget Enforcement**: Tracking, limits, estimation

### WebSocket Stress Tests (100 tests)
- **Connection Scaling**: 50→500→1000 concurrent connections
- **Message Delivery**: Order, large payloads, burst
- **Reconnection Storm**: Rapid disconnect/reconnect cycles
- **Broadcast Performance**: Multi-workspace delivery latency

### Chaos Engineering Tests (200 tests)
- **Network Partition**: Latency injection, packet loss, intermittent
- **Service Degradation**: Slow responses, unavailable, partial failure
- **Memory Pressure**: Large payloads, concurrent, OOM simulation
- **Disk Exhaustion**: Write operations, batch writes, recovery
- **CPU Throttle**: Response times, computation, priority
- **Cascading Failures**: Dependent services, circuit breaker, isolation

## Performance Thresholds

| Metric | Target |
|--------|--------|
| API p95 response | < 500ms |
| API p99 response | < 1000ms |
| DB query p95 | < 200ms |
| WS connection p95 | < 500ms |
| WS message latency p95 | < 100ms |
| Error rate | < 5% |
| Isolation breaches | 0 |
| Agent completion rate | > 80% |
| Chaos recovery rate | > 90% |

## Output Files

```
tests/stress/results/
├── summary.json       # Test summary metrics
├── full-report.json   # Complete k6 output
└── results.json       # Raw metrics data
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Stress Tests
  run: |
    pnpm test:stress:smoke
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
```

## Interpreting Results

### Pass Criteria
- All thresholds green ✅
- Zero isolation breaches
- Error rate < 5%
- Recovery rate > 85%

### Warning Signs
- p99 latency > 2x p95
- Increasing error rate over time
- Memory/connection exhaustion
- Cascading failures detected

### Failure Indicators
- Isolation breach detected
- Error rate > 10%
- System unresponsive
- Data corruption detected

## Customization

Edit `config.js` to modify:
- Virtual user counts
- Duration stages
- Performance thresholds
- Test data generators
- Workspace configurations

## Related Documentation

- [k6 Documentation](https://k6.io/docs/)
- [Unite-Hub API Guide](../../src/app/api/API-GUIDE.md)
- [Production Checklist](../../PRODUCTION_CHECKLIST.md)
