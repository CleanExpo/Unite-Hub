# Guardian Phases Overview (G-Series)

> This document summarises the Guardian series of phases, from early guards through to telemetry, replay, and scenario simulation.

## Scope

Guardian is the infrastructure safety layer for Unite-Hub and Synthex. It focuses on:

- Observability and telemetry across agents, APIs, and background jobs;
- Governance and guardrails for high-risk operations;
- Replay and simulation primitives for diagnosing failures and modelling risk.

## Implemented Phases (High-Level)

- **G09–G12** – Core Guardian foundation (initial guardrails, basic dashboards, and wiring).
- **G17–G20** – Expanded Guardian coverage, including more surfaces and deeper metrics.
- **G21–G24** – Guardian maturity improvements, extending analytics and integrating with founder views.
- **G25** – *Telemetry Streams*
  - `guardian_telemetry_streams` and `guardian_telemetry_events` tables.
  - `/guardian/telemetry` founder page for stream registry and recent events.
  - `/api/guardian/telemetry` read-only API.
- **G26** – *Telemetry Warehouse*
  - Long-term storage in `guardian_warehouse_events`.
  - Hourly rollups: `guardian_warehouse_hourly_rollups`.
  - Daily rollups: `guardian_warehouse_daily_rollups`.
  - `/guardian/warehouse` founder page and `/api/guardian/warehouse` API.
- **G27** – *Replay Engine*
  - `guardian_replay_sessions` and `guardian_replay_events` tables.
  - `/guardian/replay` founder page for browsing replay sessions and event timelines.
  - `/api/guardian/replay` read-only API.
- **G28** – *Scenario Simulator*
  - `guardian_scenarios`, `guardian_scenario_runs`, `guardian_scenario_run_events` tables.
  - `/guardian/scenarios` founder page to inspect simulated outages, schema drift, agent failures, and more.
  - `/api/guardian/scenarios` read-only API.

## Phase G29 – Tenant Wiring Helper

Phase **G29** introduces a dedicated helper for Guardian tenant resolution:

- `src/lib/guardian/tenant.ts`
  - `getGuardianTenantContext()` returns a `tenantId` placeholder for now.
  - Future phases will:
    - Replace `TODO_Gxx_TENANT` constants in Guardian routes with calls to this helper.
    - Integrate with real auth/session context so that Guardian views are always scoped to the correct tenant.

## Next Steps (Future Hardening)

1. Replace inline `TODO_Gxx_TENANT` markers in Guardian API routes with `getGuardianTenantContext()`.
2. Connect Guardian tenant resolution to the authenticated founder/session identity.
3. Add feature flags and access controls for Guardian views (per-tenant permissions).
4. Extend Guardian to emit structured events into the Telemetry Warehouse for major product-level actions.
