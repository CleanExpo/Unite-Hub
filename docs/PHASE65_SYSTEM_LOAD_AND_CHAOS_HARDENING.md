# Phase 65: System Load and Chaos Hardening

**Status**: ✅ Complete
**Date**: 2025-11-23
**Priority**: High - Resilience testing and stability oversight

---

## Overview

Phase 65 introduces a comprehensive load testing and chaos engineering framework for Unite-Hub. The system simulates high-traffic scenarios and controlled fault injection to identify bottlenecks, test resilience, and ensure system stability under stress.

---

## Architecture

### Core Components

```
Stability Testing Framework
    ├── Load Test Engine (7 scenarios)
    ├── Chaos Test Engine (6 approved faults)
    ├── Load Report Service (heatmaps, scores)
    └── Founder Dashboard (oversight)
```

### Files Created

**Engine Layer** (`src/lib/testing/`):
- `loadTestEngine.ts` - High-traffic scenario simulation
- `chaosTestEngine.ts` - Controlled fault injection
- `loadReportService.ts` - Stability reports and scoring

**API Layer** (`src/app/api/testing/`):
- `load/route.ts` - Load test management
- `chaos/route.ts` - Chaos event management

**UI Layer** (`src/ui/components/`):
- `LoadTestCard.tsx` - Load test result display
- `ChaosTestCard.tsx` - Chaos event display
- `StabilityIndicator.tsx` - Score and health visualization

**Dashboard** (`src/app/founder/dashboard/`):
- `stability/page.tsx` - Founder stability console

---

## Load Test Engine

### Available Scenarios (7)

| Scenario | Users | RPS | Duration | Use Case |
|----------|-------|-----|----------|----------|
| `simulated_50_clients` | 50 | 100 | 5 min | Baseline capacity |
| `simulated_100_clients` | 100 | 200 | 5 min | Growth scenario |
| `burst_traffic` | 200 | 500 | 2 min | Traffic spike |
| `high_ai_usage` | 30 | 50 | 10 min | AI workload stress |
| `visual_job_flood` | 50 | 100 | 5 min | Image generation load |
| `massive_voice_trigger_batch` | 100 | 150 | 3 min | Voice processing |
| `cron_stress_test` | 20 | 30 | 10 min | Scheduled task overlap |

### Metrics Collected (9)

- `response_time_ms` - API response latency (min/max/avg/p50/p95/p99)
- `api_error_rate` - Failed requests percentage
- `db_query_time` - Database query latency
- `queue_depth` - Job queue backlog
- `token_usage_spike` - AI token consumption
- `storage_reads_writes` - I/O operations
- `server_cpu_load` - CPU utilization
- `model_latency` - AI model response time
- `bandwidth_usage` - Network throughput

### Safety Controls

- Never touches real client data
- Runs against shadow-mode replicas
- Auto-abort if errors > 5%
- Founder approval required for execution

---

## Chaos Test Engine

### Approved Faults (6)

| Fault | Description | Risk Level | Auto-Recovery |
|-------|-------------|------------|---------------|
| `ai_latency_spike` | AI model delays (200ms-5000ms) | Low | Yes |
| `delayed_queue_processing` | Queue processing lag | Medium | Yes |
| `db_slow_read` | Database read latency spikes | Medium | Yes |
| `api_throttling_simulation` | Rate limiting simulation | Low | Yes |
| `cron_overlap` | Concurrent cron execution | Medium | Yes |
| `dns_delay_simulation` | DNS resolution delays | Low | Yes |

### Blocked Faults (Never Execute)

- `data_deletion`
- `unauthorized_writes`
- `security_bypass_attempts`
- `production_data_corruption`
- `credential_exposure`

### Chaos Modes

| Mode | Multiplier | Description |
|------|------------|-------------|
| `safe` | 0.5x | Minimal impact, learning focus |
| `aggressive` | 1.0x | Standard fault injection |
| `extreme` | 2.0x | Maximum stress, manual intervention may be needed |

### Founder Controls

- **Kill Switch** - Immediately abort all chaos tests
- **Auto-Pause** - Trigger on high risk thresholds
- **Manual Trigger Only** - No automated chaos execution

---

## Stability Reports

### Scoring System

**Overall Score** (0-100):
- Performance Score × 0.40
- Reliability Score × 0.35
- Resilience Score × 0.25

**Grade Mapping**:
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: Below 60

### Heatmap Components

1. **Service Health** - Health score, response time, error rate per service
2. **Time Slots** - 24-hour performance distribution
3. **Geographic Regions** - Regional latency and availability

### Bottleneck Detection

Automatically identifies:
- Database query bottlenecks (p95 > 100ms)
- Queue depth issues (p95 > concurrent users)
- CPU load concerns (p95 > 70%)
- AI model latency (p95 > 3000ms)

---

## API Endpoints

### Load Test API

**GET /api/testing/load**
- `action=status` - Current test status
- `action=scenarios` - Available scenarios
- `action=report` - Generate stability report

**POST /api/testing/load**
- `action=start` - Start load test
- `action=abort` - Abort current test
- `action=generate_report` - Generate report

### Chaos Test API

**GET /api/testing/chaos**
- `action=status` - Current event status
- `action=faults` - Available faults
- `action=modes` - Available modes

**POST /api/testing/chaos**
- `action=start` - Start chaos test
- `action=pause` - Pause current test
- `action=kill_switch` - Activate kill switch
- `action=reset_kill_switch` - Deactivate kill switch

---

## Dashboard Features

### Overview Tab
- Stability scores (overall, performance, reliability, resilience)
- Active bottlenecks with recommendations
- Test summary statistics
- System trends

### Service Health Tab
- Service health matrix
- Per-service metrics (health %, response time, error rate)
- Status indicators (healthy/degraded/critical)

### Load Tests Tab
- Load test cards with results
- Scenario, metrics, bottlenecks
- Rerun capability

### Chaos Tests Tab
- Chaos event cards with recovery status
- Fault type, mode, metrics
- Circuit breaker status

### Recommendations Tab
- Scaling recommendations
- Current vs recommended capacity
- Priority and cost impact

---

## Safety Constraints

### Shadow Mode Only
- All tests run against simulated data
- No production database writes
- No client impact

### Founder Approval Required
- Every test requires explicit approval
- Kill switch available at all times
- Auto-pause on risk thresholds

### No Production Disruption
- Isolated test environment
- Circuit breakers prevent cascading
- Automatic recovery mechanisms

### Rollback Available
- Test state can be reset
- No permanent changes
- Full audit trail

---

## Cron Jobs (Disabled by Default)

```javascript
// Weekly Load Test - Mondays 5 AM
{
  name: 'weekly_load_test',
  route: '/api/testing/load',
  schedule: '0 5 * * MON',
  enabled: false
}

// Weekly Chaos Test - Mondays 6 AM
{
  name: 'weekly_chaos_test',
  route: '/api/testing/chaos',
  schedule: '0 6 * * MON',
  enabled: false
}
```

---

## Usage Examples

### Run a Load Test

```typescript
const response = await fetch('/api/testing/load', {
  method: 'POST',
  body: JSON.stringify({
    action: 'start',
    workspaceId: 'xxx',
    scenario: 'simulated_50_clients'
  })
});
```

### Run a Chaos Test

```typescript
const response = await fetch('/api/testing/chaos', {
  method: 'POST',
  body: JSON.stringify({
    action: 'start',
    workspaceId: 'xxx',
    fault: 'ai_latency_spike',
    mode: 'safe',
    intensity: 50
  })
});
```

### Activate Kill Switch

```typescript
await fetch('/api/testing/chaos', {
  method: 'POST',
  body: JSON.stringify({
    action: 'kill_switch',
    workspaceId: 'xxx'
  })
});
```

---

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Response Time p95 | < 300ms | API response latency |
| Error Rate | < 2% | Failed requests |
| Recovery Time | < 30s | Time to recover from chaos |
| Resilience Score | > 75% | Chaos test success rate |
| Auto-Recovery | > 90% | Tests with automatic recovery |

---

## Integration Points

### With Phase 62 (Executive Brain)
- Triggers load tests on capacity concerns
- Receives bottleneck alerts
- Informs scaling decisions

### With Phase 63 (Governance)
- Reports test compliance
- Tracks safety violations
- Audits chaos events

### With Phase 64 (Evolution Engine)
- Provides performance signals
- Suggests stability improvements
- Tracks system trends

---

## Truth-Layer Compliance

✅ **No artificial load** - Only controlled simulations
✅ **Shadow mode only** - No production impact
✅ **Founder approval required** - Every test needs approval
✅ **Kill switch available** - Immediate abort capability
✅ **Full audit logging** - Complete test history
✅ **Auto-pause on risk** - Automatic safety triggers

---

## Testing

```bash
# Get available scenarios
curl "http://localhost:3008/api/testing/load?action=scenarios&workspaceId=test"

# Start load test
curl -X POST "http://localhost:3008/api/testing/load" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "workspaceId": "test", "scenario": "simulated_50_clients"}'

# Get available faults
curl "http://localhost:3008/api/testing/chaos?action=faults&workspaceId=test"

# Start chaos test
curl -X POST "http://localhost:3008/api/testing/chaos" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "workspaceId": "test", "fault": "ai_latency_spike", "mode": "safe"}'
```

---

**Phase 65 Complete** - System load and chaos hardening framework operational with comprehensive stability testing capabilities.
