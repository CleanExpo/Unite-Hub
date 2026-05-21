---
id: finished-audit
name: finished-audit
type: Capability Uplift
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - are we done
  - is this finished
  - audit completion
  - verify done
  - check if complete
  - is it ready
  - can we ship
  - can we close this
description: ">"
---


# Finished Audit Skill

> **Purpose**: Systematically verify that "finished" is actually true.
> No vague summaries. No optimistic assumptions. Evidence only.

## When to Use

Use this skill when:

- A developer or agent claims a task, feature, or project is complete
- Before merging a PR or closing a milestone
- Before claiming production readiness
- Whenever a completion claim is made without accompanying proof

## Banned Output Phrases

The following phrases indicate a false completion claim. Never output them:

| Banned Phrase              | Reason          |
| -------------------------- | --------------- |
| "Done!"                    | No evidence     |
| "That's complete."         | No evidence     |
| "Everything is working."   | No evidence     |
| "You're production ready." | No evidence     |
| "Finished."                | No evidence     |
| "It's ready."              | Subjective      |
| "Should be working."       | Unverified      |
| "Looks good."              | Subjective      |
| "Tests are passing."       | No output shown |

## Inputs

- The task, feature, or project description
- The Definition of Done criteria (from `definition-of-done-builder` or provided)
- Any proof artifacts already provided

## Procedure

### Step 1: Load or generate DoD

If no DoD exists: activate `definition-of-done-builder` first.
If DoD exists: use it as the audit checklist.

### Step 2: Verify each criterion

For each criterion in the DoD:

1. Check if proof artifact exists
2. If yes: classify as PROVEN (record the artifact)
3. If artifact is claimed but not shown: classify as CLAIMED (not accepted)
4. If no artifact: classify as UNKNOWN
5. If definitively absent: classify as MISSING

| Status  | Meaning                        | Accepted as proof? |
| ------- | ------------------------------ | ------------------ |
| PROVEN  | Evidence exists, verified      | Yes                |
| CLAIMED | Evidence claimed but not shown | No                 |
| UNKNOWN | Not verified either way        | No                 |
| MISSING | Confirmed absent or broken     | No                 |

### Step 3: Calculate completion

```
Completion % = (PROVEN count / total criteria count) × 100
```

### Step 4: Gate decision

```
If ALL criteria = PROVEN:
  → Output: COMPLETION APPROVED

If ANY criterion = UNKNOWN, CLAIMED, or MISSING:
  → Output: NOT COMPLETE
  → List every blocking criterion
  → Specify exact next action per blocker
```

## Output Format

### Not Complete

```
FINISHED AUDIT
═══════════════════════════════════════════════════
Task:        [task description]
Audit Date:  [DD/MM/YYYY]
Completion:  [N]% ([proven]/[total] criteria PROVEN)

STATUS: NOT COMPLETE

BLOCKING CRITERIA
─────────────────
[criterion] — Status: UNKNOWN
   Required: [exact action to verify]

[criterion] — Status: MISSING
   Required: [exact remediation]

[criterion] — Status: CLAIMED (evidence not shown)
   Required: [show exact output/screenshot]

NEXT ACTION
─────────────
[Single most important thing to do right now]
═══════════════════════════════════════════════════
```

### Completion Approved

```
FINISHED AUDIT
═══════════════════════════════════════════════════
Task:        [task description]
Audit Date:  [DD/MM/YYYY]
Completion:  100% ([N]/[N] criteria PROVEN)

STATUS: COMPLETION APPROVED

PROOF ARTIFACTS
─────────────────
[criterion] — Proof: [artifact description + path/output]
[criterion] — Proof: [artifact]
...

APPROVED FOR: [merge/deploy/close/ship — as appropriate]
═══════════════════════════════════════════════════
```

## Validation Gates

Before accepting a PROVEN status:

- [ ] The proof artifact is shown (not just claimed)
- [ ] The artifact is recent (matches the current state)
- [ ] The artifact is specific (not a generic screenshot)
- [ ] The artifact covers the specific criterion (not adjacent evidence)

## Failure Modes

| Failure                                    | Recovery                                     |
| ------------------------------------------ | -------------------------------------------- |
| No DoD exists                              | Activate `definition-of-done-builder` first  |
| Proof is a screenshot of wrong state       | Request updated screenshot                   |
| Proof is from a different environment      | Request production environment proof         |
| Developer argues criterion is "not needed" | Escalate to PM Agent — DoD is non-negotiable |

## Eval Examples

### Good Example

**Input:** "I've shipped the auth feature, it's done."

**Audit output:** NOT COMPLETE — 6/9 criteria PROVEN. 3 criteria UNKNOWN (no production URL proof, no rate limiting proof, JWT secret check missing).

### Bad Example (rejected)

**Input:** "The feature is complete."
**Output:** "Great! Looks like it's done." — REJECTED (no audit performed)