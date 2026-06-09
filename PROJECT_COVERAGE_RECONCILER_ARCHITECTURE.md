# Project Coverage Reconciler Architecture

## Loading DoD specs

The local v0 foundation loads `project_dod_registry.jsonl`. Each line is one project DoD spec. The loader is read-only and deterministic.

## Running probes

The reconciler runs only safe local probes:

- file existence
- route file existence
- test file existence
- schema file existence
- dashboard/evidence artifact existence
- docs artifact existence
- named static boolean checks

No probe uses production DB, Supabase, psql, 1Password, secrets, browser automation, Computer Use, deployment, email, payments, claims, orders, public publishing, or external execution.

## Coverage computation

Coverage percentage is passed requirements divided by total requirements, rounded to a whole percent. Blocked and missing requirements are not passed. Failed hard gates are counted separately.

A project is complete only when:

1. false_done_prevention_active is true;
2. coverage percent is greater than or equal to completion_threshold;
3. failed_hard_gate_count is zero;
4. no P0 hard gate is missing/blocked/failed.

## Missing requirements to jobs

Every missing/blocked/failed requirement becomes a Senior PM next-action candidate. Ranking order:

1. hard gates first;
2. P0, P1, P2, P3 priority order;
3. lower coverage project first;
4. requirement_id for deterministic tie break.

## Senior PM gap ranking

Senior PM receives a `nextGeneratedJobs` queue with requirement id, project id, priority, title, next action, gate flag, and evidence requirement.

## Board gates

Hard-gate requirements emit `blockedByBoardGate: true` when missing or blocked. The reconciler does not cross the gate; it reports the missing Board decision/evidence.

## False done prevention

The project completion judge returns `not_done_failed_hard_gate`, `not_done_below_threshold`, `not_done_false_done_guard_disabled`, or `project_done_coverage_green`. Reports must never call the project done when the judge is not green.
