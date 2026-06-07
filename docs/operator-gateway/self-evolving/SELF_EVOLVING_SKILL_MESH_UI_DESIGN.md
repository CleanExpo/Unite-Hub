# Self-Evolving Skill Mesh UI Design

Status: founder UI design ready

## Founder panels

### Skill performance table
Columns: skill, current version, candidate version, latest score, pass threshold, promotion status, rollback availability, evidence link.

### Latest eval runs
Shows eval run id, skill id, model lane, graders used, score, status, evidence path, and safety invariants.

### Weak skills
Lists skills below threshold with failure reasons and recommended next eval action.

### Candidate improvements
Shows candidate prompts/model-lane changes that passed local threshold but still require promotion gates.

### Prompt version history
Shows current/candidate/rollback versions and immutable evidence.

### Rollback button/design
Design-only in this foundation. Button remains disabled unless named Board gate approves live prompt mutation.

### Promotion queue
Shows candidate_ready records separately from blocked_human_gate and blocked_below_threshold records.

### Board approval queue
Lists skills requiring Board/human approval before live use.

### Model comparison view
Design-ready comparison for Hermes local, Codex/ChatGPT plan lane, skill-exec, Claude Code Max pending, Cursor pending, open models pending. No backend API keys.

### Daily improvement recommendations
Shows next recommended skill, next evidence to collect, and next local eval to run.

## Current implemented UI foundation

The Command Centre includes a read-only Self-Evolving Skill Mesh panel showing:

- skills under evaluation.
- graders defined.
- prompt versions tracked.
- promotion candidates.
- blocked promotions.
- rollback paths.
- next skill to evaluate.
- external eval API called: no.
- live auto-promotion enabled: no.
