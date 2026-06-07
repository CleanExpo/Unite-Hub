# Project Definition of Done Architecture

## Core principle

A task can be done. A brief can be done. A project is only done when its Definition of Done coverage is green.

## DoD schema

The project DoD schema defines:

- project_id
- project_name
- owner_role
- approver_role
- completion_threshold
- false_done_prevention_active
- requirements[]

Each requirement follows `project_requirement.schema.json` and contains the required fields: requirement_id, project_id, category, description, probe_type, probe_command_or_check, pass_condition, evidence_required, priority, owner_role, hard_gate, status.

## Requirement types

Supported categories include:

- capability_check
- surface_check
- route_check
- schema_check
- integration_check
- test_check
- deployment_check
- evidence_check
- business_readiness_check
- owner_approver_check

## Probe types

- file_exists: local file path exists.
- route_exists: Next.js route file exists.
- test_exists: local test file exists.
- dashboard_artifact_exists: dashboard/evidence artifact path exists.
- schema_exists: JSON schema or registry file exists.
- docs_artifact_exists: local document path exists.
- static_boolean: named non-destructive policy/status assertion from the local registry.

## Capability checks

Capability checks prove the project has the functional capability expected by the project owner, not merely a completed implementation note.

## Surface checks

Surface checks verify that Mission Control, dashboards, or founder UI surfaces expose the capability/status to the right audience.

## Route checks

Route checks verify local API endpoints exist and are safe by default: founder/session guarded, sanitized error handling, no external execution, no production DB requirements.

## Schema checks

Schema checks verify machine-readable DoD, requirement, coverage-result, registry, and related data contracts exist before automation relies on them.

## Integration checks

Integration checks are conservative. Existing approved infrastructure can be referenced, but external execution, new vendors, secrets, OP/1Password, Supabase, psql, production DB, and deployment remain hard-gated unless separately approved.

## Test checks

Test checks prove the local foundation cannot mark a project done when hard gates fail and can emit missing-work jobs for uncovered requirements.

## Deployment checks

Deployment checks are included in the DoD model but must not run deployments. In local batches they record that deployment did not occur and any future production deploy remains a Board gate.

## Evidence checks

Evidence checks require a path, command output, audit record, dashboard artifact, or status payload. Agent memory is not evidence.

## Business-readiness checks

Business-readiness requirements prevent a code-green project from being called business-complete before owner, offer, launch, operational, legal, revenue, or market-readiness criteria are satisfied.

## Owner / approver model

Every project declares owner_role and approver_role. Hard-gate completion requires Board/owner approval when the requirement calls for it. The coverage reconciler may recommend next work; it does not self-approve project completion.
