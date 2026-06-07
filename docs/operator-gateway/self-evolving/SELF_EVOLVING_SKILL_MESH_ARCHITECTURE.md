# Self-Evolving Skill Mesh Architecture

Status: local foundation architecture ready

## Skill versioning model

Each skill has:

- `skill_id` — stable canonical identifier.
- `current_version` — version currently used by live/local skill behavior.
- `candidate_version` — proposed improvement under evaluation.
- `rollback_available` — true only when a known-good prior version exists.
- `evidence_path` — local evidence backing the candidate.
- `production_gate_required` — true for every live prompt/skill promotion.

## Prompt versioning model

Prompt versions are immutable records:

- current prompt remains active.
- candidate prompt is stored separately.
- candidate cannot become live through the local foundation.
- rollback version is recorded before any later promotion.
- prompt records must include source evidence and eval result.

## Eval run model

Eval runs are local records with:

- eval_run_id.
- skill_id.
- candidate_version.
- model_lane.
- input evidence paths.
- graders used.
- score and failure reasons.
- promotion recommendation.
- safety invariants.

## Grader model

Graders are local templates with:

- deterministic checks where possible.
- optional LLM-as-judge stub metadata.
- 0..1 scoring range.
- pass threshold.
- failure reasons.
- safe automated use rules.
- human review triggers.

## LLM-as-judge model

LLM-as-judge is design-ready only in this foundation:

- allowed only through operator-session lanes.
- no OpenAI/Anthropic/Cursor API keys.
- no paid API eval calls.
- no web-session scraping.
- output must be stored as evidence before promotion.

## Human feedback model

Human feedback is a first-class gate for:

- Board strategy/risk changes.
- security/gate exceptions.
- public content.
- client communications.
- live skill/prompt mutation.

## Promotion gate

Promotion requires:

1. latest_score >= pass_threshold.
2. deterministic graders pass.
3. LLM-as-judge/human feedback passes when required.
4. no safety invariant failure.
5. rollback version available.
6. named Board approval for production/live prompt mutation.

## Rollback gate

Rollback is allowed only to a previously known-good version. Rollback must create evidence and audit records. No rollback path may discard prior eval evidence.

## Dashboard model

Dashboard shows:

- Self-Evolving Skill Mesh status.
- skills under evaluation.
- graders defined.
- promotion candidates.
- blocked promotions.
- next recommended skill to evaluate.
- no production auto-promotion.

## Board approval model

Board approval is required before any candidate prompt becomes live. The local foundation can recommend promotion but cannot execute promotion.
