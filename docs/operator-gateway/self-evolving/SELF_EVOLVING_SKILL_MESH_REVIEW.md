# Self-Evolving Skill Mesh Review

Status: local design complete
Decision: build_self_evolving_skill_mesh_engine
Reviewer: Phill McGurk / Founder / Board / Unite-Group Nexus product owner

## What the Self-Evolving Agents cookbook pattern teaches

The cookbook pattern is a closed-loop improvement system:

1. Start from a baseline skill/prompt.
2. Run the skill against a bounded task and capture output.
3. Collect feedback from a human reviewer or an LLM-as-judge.
4. Apply deterministic graders where possible.
5. Aggregate score and failure reasons.
6. Generate a prompt/model candidate without mutating live behavior.
7. Store the candidate as a versioned prompt.
8. Run local evals against evidence.
9. Promote only if thresholds and gates pass.
10. Roll back if regression appears.
11. Continue monitoring with audit/evidence.

The key lesson is that agent improvement must be evidence-led, versioned, reversible, and gate-controlled.

## Mapping to Unite-Group Nexus

| Cookbook element | Unite-Group Nexus mapping |
| --- | --- |
| baseline skill | registered specialised skill / Senior PM / Board / research / content / DevOps agent |
| output | local Mission Control job result, evidence packet, dashboard update, PR result |
| human feedback | Phill / Board review / CodeRabbit / explicit operator correction |
| LLM-as-judge | local operator-session judge lane only; no backend API keys or paid API calls in this foundation |
| deterministic graders | local scoring rules for citations, gates, validation, dashboard/evidence completeness |
| aggregate score | per-skill eval run score in local registry |
| prompt/model candidate | candidate prompt version tracked separately from live skill |
| versioned prompt | skill_prompt_version record with current/candidate/rollback |
| eval run | local eval result against stored evidence |
| promotion | blocked until threshold + human/Board gate + no regression |
| rollback | revert to previous prompt version, never delete evidence |
| monitoring | Agentic Nexus dashboard/evidence/audit feed |

## Current Mission Control support

Mission Control already supports:

- Operator Gateway and Command Centre UI.
- specialised skill mesh foundation.
- business mission router.
- sandbox job persistence, creation, and dry-run execution.
- controlled real-local execution foundation with dispatch disabled.
- evidence/audit/dashboard artifacts.
- Senior PM Autopilot local operating contract.
- visible model lanes with no API-key mode.

## Missing before this batch

- skill evolution registry.
- skill prompt version records.
- grader schema and grader library.
- eval run/status model.
- promotion and rollback gates.
- founder-only status API.
- Command Centre self-evolving panel.
- first local Senior PM Autopilot eval candidate.

## Safe implementation path

This batch implements only local/read-only foundations:

- static local TypeScript model and guarded API.
- local JSON schemas and JSONL registry.
- documentation and grader library.
- dashboard/status visibility.
- no live skill mutation.
- no production DB.
- no external eval services.
- no paid API eval calls.
- no stored model credentials.
- no browser automation or Computer Use.
