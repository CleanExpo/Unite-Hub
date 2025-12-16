# Decision Circuits v1.2.0 - Release Control & Canary Deployment

**Version**: 1.2.0
**Release Date**: 2025-12-15
**Status**: Production-ready autonomous canary rollout

---

## Overview

Decision Circuits v1.2.0 adds autonomous canary rollout, continuous validation, and automatic rollback capabilities. All releases follow a proven three-phase canary model with no manual intervention required.

**Key Changes**:
- ✅ Autonomous 3-phase canary rollout (10% → 50% → 100%)
- ✅ Continuous health validation at each phase
- ✅ Automatic rollback on health check failures
- ✅ Immutable circuit versions
- ✅ Complete release audit trail
- ✅ Zero manual intervention mode

---

## Canary Release Phases

### Phase 1: Canary 10% (24h minimum)
```
Traffic:    10% of requests
Duration:   ≥ 24 hours
Health:     All 3 checks must pass
Trigger:    Can progress after 24h with passing health
Rollback:   Automatic if any health check fails
```

### Phase 2: Canary 50% (24h minimum)
```
Traffic:    50% of requests
Duration:   ≥ 24 hours
Health:     All 3 checks must pass
Trigger:    Can progress after 24h with passing health
Rollback:   Automatic if any health check fails
```

### Phase 3: Full Release (100%)
```
Traffic:    100% of requests
Duration:   No minimum
Health:     All 3 checks must pass continuously
Rollback:   Automatic if health check fails
```

---

## Rollback Triggers

### DC_HEALTH_01: Success Rate Falls Below 92%
```
Condition:   Circuit success rate < 92% (24h window)
Action:      Rollback to previous version
Reason:      Circuit execution too unreliable
```

### DC_HEALTH_02: Recovery Cycles Exceed 2
```
Condition:   Max recovery cycles > 2
Action:      Freeze self-correction AND rollback
Reason:      Strategy thrashing indicates broken logic
```

### DC_HEALTH_03: Brand Violations Spike
```
Condition:   Violation rate > 2% (spike from 1% threshold)
Action:      Rollback and tighten constraints
Reason:      Compliance violation spike detected
```

---

## API Endpoints

### Get Release Status
```bash
GET /api/circuits/release?workspaceId=<id>
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "release_status": {
    "phase": "canary_10",
    "version": "v1_circuit_001_1702569600000",
    "traffic_percent": 10
  },
  "state": {
    "current_phase": "canary_10",
    "phase_started_at": "2025-12-15T10:00:00Z",
    "ready_for_next_phase": false,
    "health_checks_passing": true,
    "can_rollback": true
  }
}
```

### Get Release Report
```bash
GET /api/circuits/release?workspaceId=<id>&action=report
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "current_phase": "canary_50",
  "current_version_id": "v2_circuit_001_1702569600000",
  "previous_version_id": "v1_circuit_001_1702569600000",
  "timeline": [
    {
      "phase": "canary_10",
      "started_at": "2025-12-15T10:00:00Z",
      "duration_hours": 24.5
    }
  ],
  "recent_events": [
    {
      "event_type": "canary_started",
      "created_at": "2025-12-15T10:00:00Z",
      "details": { "traffic_percent": 10 }
    }
  ],
  "metrics": {
    "current_version_health": 0.96,
    "previous_version_health": 0.94,
    "can_rollback": true
  }
}
```

### Start Canary Rollout
```bash
POST /api/circuits/release?workspaceId=<id>&action=start_canary
{
  "circuit_id": "CX06_GENERATION_EXECUTION",
  "version_number": 2
}
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "rollout_status": {
    "success": true,
    "phase": "canary_10",
    "message": "Canary rollout started: 10% traffic to v2_circuit_001_1702569600000"
  },
  "version_id": "v2_circuit_001_1702569600000",
  "initial_traffic_percent": 10
}
```

### Progress to Next Phase
```bash
POST /api/circuits/release?workspaceId=<id>&action=progress_canary
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "progress_status": {
    "success": true,
    "new_phase": "canary_50",
    "message": "Progressed to canary_50: 50% traffic"
  }
}
```

### Evaluate Rollback Triggers
```bash
POST /api/circuits/release?workspaceId=<id>&action=evaluate_rollback
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "should_rollback": false,
  "trigger": null,
  "reason": null
}
```

### Execute Rollback
```bash
POST /api/circuits/release?workspaceId=<id>&action=execute_rollback
{
  "trigger": {
    "metric": "DC_HEALTH_01",
    "condition": "below_threshold",
    "action": "rollback_to_previous_circuit_version"
  }
}
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "rollback_status": {
    "success": true,
    "message": "Automatic rollback executed: DC_HEALTH_01 - Success rate below threshold",
    "rollback_event_id": "rollback_1702569600000_abc123"
  }
}
```

### Monitor Canary Release
```bash
POST /api/circuits/release?workspaceId=<id>&action=monitor
```

Runs continuous monitoring, checks for rollback triggers, and auto-progresses phases.

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "monitoring_result": {
    "status": "healthy",
    "actions_taken": ["Progressed to canary_50: 50% traffic"],
    "current_phase": "canary_50"
  }
}
```

---

## Release Workflow

### Day 1: Start Canary (10%)
```bash
# 1. Create new version
POST /api/circuits/release?action=start_canary
{
  "circuit_id": "CX06",
  "version_number": 2
}

# 2. Monitor health
GET /api/circuits/health?action=production_health
```

### Day 2: Check Progress (after 24h)
```bash
# 1. Get status
GET /api/circuits/release?action=status

# 2. If healthy, progress
POST /api/circuits/release?action=progress_canary
# Result: Moves to 50% traffic
```

### Day 3: Check Again (after 48h)
```bash
# 1. Get status
GET /api/circuits/release?action=status

# 2. If healthy, full release
POST /api/circuits/release?action=progress_canary
# Result: Moves to 100% traffic
```

### Automatic Response
```bash
# Every 1 hour (background job):
POST /api/circuits/release?action=monitor
# Automatically:
# - Checks health
# - Executes rollback if needed
# - Progresses phases if ready
```

---

## Automatic Rollback Scenario

### Example: Canary Rollback

**Timeline**:
1. **10:00 AM** - Start canary with v2 (10% traffic)
2. **10:15 AM** - Health check passes
3. **11:00 AM** - Brand violation spike detected
4. **11:02 AM** - Automatic rollback triggered
5. **11:02 AM** - Reverted to v1 (100% traffic)
6. **11:03 AM** - Alert sent to team
7. **Event logged** - `circuit_rollback_events` table

**System Response**:
```json
{
  "status": "rolled_back",
  "actions_taken": [
    "Automatic rollback executed: DC_HEALTH_03 - violation spike detected"
  ],
  "current_phase": "canary_10",
  "reverted_to_version": "v1_circuit_001_1702569600000"
}
```

---

## Circuit Versioning

### Immutable Versions
- ✅ Versions never change once created
- ✅ Rollback always restores previous version exactly
- ✅ Version history is permanent
- ❌ Cannot edit versions
- ❌ Cannot reuse version numbers

### Version ID Format
```
v<version_number>_<circuit_id>_<timestamp>

Example:
v2_CX06_GENERATION_EXECUTION_1702569600000
```

### Active vs. Canary
```
is_active=true, is_canary=false  → Fully released (100% traffic)
is_active=true, is_canary=true   → Canary in progress (10%-50%)
is_active=false                  → Previous version (rollback target)
```

---

## Database Schema

### circuit_versions
```sql
version_id          TEXT UNIQUE  -- v2_CX06_1702569600000
circuit_id          TEXT         -- CX06_GENERATION_EXECUTION
version_number      INT          -- 2
released_at         TIMESTAMP    -- When released
is_active           BOOLEAN      -- Currently in use
is_canary           BOOLEAN      -- Is canary
canary_phase        TEXT         -- canary_10, canary_50, full_release
traffic_percent     INT          -- 10, 50, or 100
health_score        FLOAT        -- Computed from health checks
rollback_available  BOOLEAN      -- Can rollback to this
```

### circuit_release_state
```sql
workspace_id              UUID      -- Multi-tenant
current_phase             TEXT      -- Current canary phase
current_version_id        TEXT      -- Active version
previous_version_id       TEXT      -- Rollback target
phase_started_at          TIMESTAMP -- When phase began
min_phase_duration_hours  INT       -- 24 hours
ready_for_next_phase      BOOLEAN   -- Can progress
health_checks_passing     BOOLEAN   -- All 3 checks pass
can_rollback              BOOLEAN   -- Can rollback
```

### circuit_release_events
```sql
event_type          TEXT      -- canary_started, canary_progressed, etc.
version_id          TEXT      -- Which version
phase               TEXT      -- Which phase
traffic_percent     INT       -- 10, 50, 100
details             JSONB     -- Extra context
created_at          TIMESTAMP -- When happened
```

### circuit_rollback_events
```sql
rollback_id         TEXT      -- Unique rollback ID
from_version_id     TEXT      -- What we rolled back from
to_version_id       TEXT      -- What we rolled back to
trigger             TEXT      -- Which health check triggered it
reason              TEXT      -- Why (e.g., "Success rate 88%")
executed_at         TIMESTAMP -- When executed
success             BOOLEAN   -- Did rollback succeed
```

---

## Monitoring & Alerting

### Key Metrics

```
Phase Duration:
  - Min: 24 hours
  - Can progress after 24h if health passes
  - No max duration

Rollback Frequency:
  - Target: < 1 rollback per 100 releases
  - > 5 rollbacks per 10 releases = investigate

Health Check Status:
  - All 3 must pass to progress
  - Any fail triggers rollback
  - Automatic escalation on repeated failures
```

### Alert Conditions

| Condition | Action |
|-----------|--------|
| Phase > 48h without progression | Notify team |
| Rollback triggered | Page on-call |
| Rollback fails | Critical alert |
| Version < 90% health | Block progression |

---

## Best Practices

### ✅ Do

- Wait full 24h before progressing (even if health passes earlier)
- Monitor closely during canary phases
- Have rollback plan ready
- Test version in staging first
- Run monitoring continuously
- Review release events after full release

### ❌ Don't

- Skip canary phases
- Manually override health checks
- Create multiple versions rapidly
- Ignore rollback triggers
- Disable automatic monitoring
- Reuse version numbers

---

## Troubleshooting

### "Cannot progress: Health checks failing"

**Cause**: DC_HEALTH_01, DC_HEALTH_02, or DC_HEALTH_03 failing

**Fix**:
1. Check `GET /api/circuits/health?action=production_health`
2. Identify failing check
3. Fix underlying issue
4. Monitor for 2+ hours
5. Try progress again

### "Automatic rollback triggered"

**Cause**: Health check fell below threshold

**Response**:
1. Reverted to previous version (automatic)
2. Review rollback event in `circuit_rollback_events`
3. Investigate root cause
4. Fix and create new version
5. Start new canary

### "Cannot find previous version for rollback"

**Cause**: No previous version exists (first release)

**Fix**:
- Cannot rollback on first release
- Freeze current version
- Escalate to admin
- Manual intervention required

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Canary Release

on:
  workflow_dispatch:

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - name: Start Canary (10%)
        run: |
          curl -X POST "$API_URL/circuits/release?action=start_canary" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{"circuit_id": "CX06", "version_number": 2}'

      - name: Monitor for 24h
        run: |
          for i in {1..24}; do
            curl -X POST "$API_URL/circuits/release?action=monitor"
            sleep 3600
          done

      - name: Progress to 50%
        run: |
          curl -X POST "$API_URL/circuits/release?action=progress_canary"

      - name: Monitor for 24h
        run: |
          for i in {1..24}; do
            curl -X POST "$API_URL/circuits/release?action=monitor"
            sleep 3600
          done

      - name: Full Release (100%)
        run: |
          curl -X POST "$API_URL/circuits/release?action=progress_canary"
```

---

## Dashboard Queries

### Release Timeline
```sql
SELECT * FROM circuit_release_timeline
WHERE workspace_id = 'workspace-123'
ORDER BY created_at DESC;
```

### Active Rollbacks
```sql
SELECT * FROM circuit_active_rollbacks
WHERE workspace_id = 'workspace-123'
AND status = 'active';
```

### Release History
```sql
SELECT
  version_id,
  event_type,
  phase,
  traffic_percent,
  created_at
FROM circuit_release_events
WHERE workspace_id = 'workspace-123'
ORDER BY created_at DESC;
```

---

## FAQ

**Q: Can I skip canary phases?**
A: No. All releases follow 10% → 50% → 100% automatically.

**Q: What happens if health checks fail during canary?**
A: Automatic rollback to previous version, no human intervention needed.

**Q: Can I rollback manually?**
A: Yes, via `POST /api/circuits/release?action=execute_rollback`, but automatic is preferred.

**Q: How long does full release take?**
A: Minimum 48 hours (24h per phase) if all health checks pass.

**Q: What if there's no previous version?**
A: Escalate to admin, requires manual intervention.

**Q: Can I have multiple versions in canary?**
A: No, only one version can be active (either canary or released).

---

## Support

See [DECISION-CIRCUITS-ENFORCEMENT.md](DECISION-CIRCUITS-ENFORCEMENT.md) for enforcement details.

File issues at: GitHub Issues with tag `decision-circuits-release-control`
