# Project DoD Diagnostic Assimilation

Reviewer: Phill McGurk — Founder / Board / Unite-Group Nexus product owner
Batch: build_project_definition_of_done_and_coverage_reconciler

## What the uploaded diagnostic says

The diagnostic, "Why Pi-CEO Keeps Saying Done When It Isn't", identifies a project-governance failure rather than a single coding bug. Hermes / Pi-CEO / Senior PM agents are accurately finishing the immediate brief, ticket, or batch, then over-extending that result into a whole-project completion claim.

The failure pattern is:

1. The current brief has acceptance criteria.
2. The agent completes those criteria.
3. The agent reports "done".
4. Remaining project-level capabilities are not reconciled against an independent completion spec.
5. The Board sees repeated green reports while missing surfaces, routes, tests, evidence, integrations, or business-readiness gates remain.

## Why brief-relative completion fails

Brief-relative completion is local to the task. It answers: "Did this batch pass?" It does not answer: "Is the project complete?"

A task can be done. A brief can be done. A PR can be green. But the project is only done when its authoritative Definition of Done coverage is green.

Without a machine-checkable Project DoD:

- missing capabilities are invisible if they were not in the latest brief;
- UI/API/test/schema/evidence gaps are discovered repeatedly rather than closed systematically;
- Senior PM next-action generation can optimize for the handed-in task rather than the largest uncovered project gap;
- Mission Control cannot distinguish local task success from project completion;
- agents can accidentally convert "the current ticket is done" into "the whole project is done".

## Mapping to Unite-Group Nexus

Unite-Group Nexus contains multiple overlapping execution layers: Mission Control, Pi-CEO, Senior PM Autopilot, Operator Gateway, skill mesh, Agentic Nexus local control plane, RestoreAssist, CARSI, Margot, Synthex, AI Guided SaaS, and future portfolio projects.

The correct control model is project-first:

- each project has a DoD spec;
- each DoD spec has checkable requirements;
- each requirement has probe type, pass condition, evidence, owner, priority, and gate status;
- coverage is computed independently of the current brief;
- missing work is emitted as ranked Senior PM jobs;
- hard gates block project-done even if most requirements pass.

## How this changes Senior PM behaviour

Senior PM no longer asks only "what did the current batch finish?" It must also ask:

1. Which project does this task belong to?
2. Which DoD requirements did it satisfy?
3. Which hard-gate requirements remain missing or blocked?
4. What is the coverage percentage?
5. What is the highest-value next uncovered requirement?
6. Is a Board decision required before the project can be green?

Senior PM final reports must separate:

- task done;
- brief done;
- project coverage status;
- project done yes/no.

## How this changes Mission Control

Mission Control becomes the visible completion authority. It must show:

- projects with DoD specs;
- coverage percentage per project;
- missing requirements;
- blocked requirements;
- next generated jobs;
- project done status;
- false-done prevention active banner.

A green task card is no longer enough to mark a project green. Project completion must flow through the Project DoD Coverage Reconciler.
