# Status Page

> Public status page with incident management, uptime tracking, and dependency monitoring for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `status-page`                                            |
| **Category**   | Communication & Reporting                                |
| **Complexity** | Medium                                                   |
| **Complements**| `health-check`, `notification-system`, `metrics-collector` |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies public status page patterns for NodeJS-Starter-V1: service status overview built on the existing deep health endpoint, incident timeline with severity levels, uptime percentage calculation, scheduled maintenance windows, subscriber notifications, and a Scientific Luxury status page UI component.

---

## When to Apply

### Positive Triggers

- Building a public-facing status page for service health
- Adding incident management with timeline and severity
- Calculating and displaying uptime percentages
- Scheduling maintenance windows with subscriber alerts
- Extending the existing `/api/health/deep` endpoint for public consumption

### Negative Triggers

- Internal health probes for Docker/Kubernetes (use `health-check` skill)
- Error categorisation and codes (use `error-taxonomy` skill)
- Metrics collection and aggregation (use `metrics-collector` skill)
- Alert dispatch across channels (use `notification-system` skill)

---

## Core Principles

### The Three Laws of Status Pages

1. **Honest by Default**: The status page reflects real dependency checks, not manually curated lies. If the deep health endpoint says degraded, the status page says degraded.
2. **Public Information Only**: Never expose internal error messages, stack traces, or infrastructure details. Show service name, status, and latency — nothing more.
3. **Communicate During Incidents**: Silence during outages erodes trust more than the outage itself. Every incident must have updates at regular intervals until resolution.

---

## Pattern 1: Service Status Model (Python)

### Status and Incident Types

```python
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ServiceStatus(str, Enum):
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    PARTIAL_OUTAGE = "partial_outage"
    MAJOR_OUTAGE = "major_outage"
    MAINTENANCE = "maintenance"


class IncidentSeverity(str, Enum):
    MINOR = "minor"          # Performance degradation
    MAJOR = "major"          # Partial functionality loss
    CRITICAL = "critical"    # Full service outage


class IncidentUpdate(BaseModel):
    status: str  # investigating, identified, monitoring, resolved
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Incident(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    status: str = "investigating"
    affected_services: list[str]
    updates: list[IncidentUpdate] = Field(default_factory=list)
    started_at: datetime
    resolved_at: datetime | None = None


class ServiceStatusEntry(BaseModel):
    name: str
    status: ServiceStatus
    latency_ms: float | None = None
    uptime_percent: float = 100.0
    description: str = ""
```

---

## Pattern 2: Status API Endpoint (FastAPI)

### Public Status Overview

```python
from fastapi import APIRouter

status_router = APIRouter(prefix="/api/status", tags=["status"])


@status_router.get("/")
async def get_status_overview():
    """Public status page data — no authentication required."""
    services = await check_all_services()
    active_incidents = await get_active_incidents()
    recent_incidents = await get_recent_incidents(days=7)

    overall = ServiceStatus.OPERATIONAL
    for svc in services:
        if svc.status == ServiceStatus.MAJOR_OUTAGE:
            overall = ServiceStatus.MAJOR_OUTAGE
            break
        if svc.status == ServiceStatus.DEGRADED:
            overall = ServiceStatus.DEGRADED

    return {
        "overall_status": overall.value,
        "services": [s.model_dump() for s in services],
        "active_incidents": [i.model_dump() for i in active_incidents],
        "recent_incidents": [i.model_dump() for i in recent_incidents],
        "last_updated": datetime.now().isoformat(),
    }


async def check_all_services() -> list[ServiceStatusEntry]:
    """Map deep health check results to public status entries."""
    # Reuse the existing deep health infrastructure
    from src.api.routes.health import deep_health_check

    health = await deep_health_check()
    entries = []

    for dep_name, dep_check in health["dependencies"].items():
        status_map = {
            "healthy": ServiceStatus.OPERATIONAL,
            "degraded": ServiceStatus.DEGRADED,
            "unhealthy": ServiceStatus.MAJOR_OUTAGE,
        }
        entries.append(ServiceStatusEntry(
            name=dep_name.replace("_", " ").title(),
            status=status_map.get(dep_check["status"], ServiceStatus.DEGRADED),
            latency_ms=dep_check.get("latency_ms"),
        ))

    return entries
```

**Project Reference**: `apps/web/app/api/health/deep/route.ts` — the existing deep health endpoint returns `DependencyCheck` objects with name, status, latency_ms, and error. The status page reuses this infrastructure but filters out internal error details.

### Uptime Calculation Endpoint

```python
@status_router.get("/uptime")
async def get_uptime(days: int = 90):
    """Return uptime percentages for each service over the specified period."""
    # Query health_check_log table for historical data
    results = await db.execute(
        text("""
            SELECT service_name,
                   COUNT(*) FILTER (WHERE status = 'healthy') * 100.0 / COUNT(*)
                       AS uptime_percent
            FROM health_check_log
            WHERE checked_at >= NOW() - INTERVAL ':days days'
            GROUP BY service_name
        """),
        {"days": days},
    )
    return {
        "period_days": days,
        "services": [
            {"name": row.service_name, "uptime_percent": round(row.uptime_percent, 3)}
            for row in results
        ],
    }
```

---

## Pattern 3: Incident Management API

### Create and Update Incidents

```python
@status_router.post("/incidents")
async def create_incident(
    incident: Incident,
    user: User = Depends(require_permission("status:manage")),
):
    """Create a new incident — requires status:manage permission."""
    await store_incident(incident)
    # Notify subscribers
    await enqueue_notification(
        NotificationEvent(
            event_type="incident.created",
            recipient_id="all_subscribers",
            channels=[NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
            priority=NotificationPriority.HIGH,
            subject=f"Incident: {incident.title}",
            body=incident.updates[0].message if incident.updates else "",
            data={"incident_id": incident.id, "severity": incident.severity.value},
        )
    )
    return {"id": incident.id, "status": "created"}


@status_router.post("/incidents/{incident_id}/updates")
async def add_incident_update(
    incident_id: str,
    update: IncidentUpdate,
    user: User = Depends(require_permission("status:manage")),
):
    """Add an update to an existing incident."""
    await store_incident_update(incident_id, update)
    if update.status == "resolved":
        await resolve_incident(incident_id)
    return {"status": "updated"}
```

**Complements**: `notification-system` skill — incident creation triggers multi-channel notifications to subscribers. `rbac-patterns` skill — only users with `status:manage` permission can create or update incidents.

---

## Pattern 4: Status Page UI (React)

### Scientific Luxury Status Component

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ServiceEntry {
  name: string;
  status: string;
  latencyMs: number | null;
  uptimePercent: number;
}

const STATUS_COLOURS: Record<string, string> = {
  operational: "#00FF88",    // Emerald
  degraded: "#FFB800",      // Amber
  partial_outage: "#FF4444", // Red
  major_outage: "#FF4444",   // Red
  maintenance: "#00F5FF",    // Cyan
};

function StatusIndicator({ status }: { status: string }) {
  const colour = STATUS_COLOURS[status] ?? "#FFB800";
  return (
    <div className="relative h-3 w-3">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: colour,
          animation: status === "operational" ? "none" : "pulse 2s ease-in-out infinite",
        }}
      />
      {status !== "operational" && (
        <div
          className="absolute inset-0 rounded-full opacity-40"
          style={{ backgroundColor: colour, animation: "ping 2s ease-in-out infinite" }}
        />
      )}
    </div>
  );
}

export function StatusPage() {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [overall, setOverall] = useState("operational");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services);
        setOverall(data.overall_status);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] font-mono text-white/90">
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-16">
        {/* Overall Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 border-b border-white/[0.06] pb-6"
        >
          <StatusIndicator status={overall} />
          <h1 className="text-lg">
            {overall === "operational" ? "All Systems Operational" : "Service Disruption"}
          </h1>
        </motion.div>

        {/* Service List */}
        <div className="space-y-1">
          {services.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between border-b border-white/[0.03] py-3"
            >
              <div className="flex items-center gap-3">
                <StatusIndicator status={svc.status} />
                <span className="text-sm text-white/70">{svc.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                {svc.latencyMs !== null && <span>{svc.latencyMs}ms</span>}
                <span>{svc.uptimePercent.toFixed(2)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Design compliance**: OLED black background (`#050505`), spectral colours for status, single-pixel borders (`border-white/[0.06]`), `font-mono`, Framer Motion for entrance animations, breathing orbs for non-operational states.

---

## Pattern 5: Scheduled Maintenance Windows

### Maintenance Model and Display

```python
class MaintenanceWindow(BaseModel):
    id: str
    title: str
    description: str
    scheduled_start: datetime
    scheduled_end: datetime
    affected_services: list[str]
    status: str = "scheduled"  # scheduled, in_progress, completed


@status_router.get("/maintenance")
async def get_maintenance():
    """Return upcoming and active maintenance windows."""
    upcoming = await get_upcoming_maintenance()
    return {
        "upcoming": [m.model_dump() for m in upcoming],
        "timezone": "Australia/Sydney",
    }
```

**Rule**: Always display maintenance times in the user's timezone. For this project, default to `Australia/Sydney` (AEST/AEDT).

---

## Pattern 6: Health Check Logging for Uptime

### Periodic Health Snapshots

```python
async def log_health_snapshot() -> None:
    """Run periodically (e.g., every 60 seconds) to build uptime history."""
    services = await check_all_services()
    for svc in services:
        await db.execute(
            text("""
                INSERT INTO health_check_log (service_name, status, latency_ms, checked_at)
                VALUES (:name, :status, :latency, NOW())
            """),
            {"name": svc.name, "status": svc.status.value, "latency": svc.latency_ms},
        )
```

**Complements**: `cron-scheduler` skill — run `log_health_snapshot` every 60 seconds via the cron infrastructure. `metrics-collector` skill — feed latency data into the metrics system for dashboard visualisation.

### Database Table

```sql
CREATE TABLE health_check_log (
    id BIGSERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms REAL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_log_service_time
    ON health_check_log (service_name, checked_at DESC);
```

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Manually setting status | Disconnected from real health | Auto-derive from health endpoint |
| Exposing error messages publicly | Security risk, confuses users | Show status + latency only |
| No incident updates | Users assume no one is working on it | Regular updates every 30 minutes |
| Uptime from memory | Lost on restart, inaccurate | Database-backed health log |
| No maintenance windows | Surprise downtime erodes trust | Schedule and notify in advance |
| Single overall status | Hides partial outages | Per-service status with individual indicators |

---

## Checklist

Before merging status-page changes:

- [ ] `ServiceStatus` enum with operational, degraded, partial/major outage, maintenance
- [ ] `/api/status` public endpoint (no auth required) derived from deep health
- [ ] `Incident` model with severity, updates timeline, and resolution
- [ ] Incident management endpoints with `status:manage` permission
- [ ] Status page UI with Scientific Luxury design (OLED black, spectral colours)
- [ ] Uptime calculation from `health_check_log` table
- [ ] Scheduled maintenance windows with timezone-aware display
- [ ] Subscriber notifications on incident creation and updates

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Status Page Implementation

**Data Source**: [deep health endpoint / manual / hybrid]
**Public Endpoint**: [/api/status / custom]
**Incidents**: [managed / static]
**Uptime Tracking**: [database-backed / in-memory / external]
**Maintenance Windows**: [scheduled / ad-hoc]
**UI Design**: [Scientific Luxury / minimal / branded]
**Notifications**: [email + webhook / in-app / none]
```
