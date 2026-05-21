---
id: evidence-verifier
name: evidence-verifier
type: Capability Uplift
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - verify the proof
  - check the evidence
  - is there proof
  - show me the artifacts
  - validate the evidence
  - confirm the proof
  - check artifacts
description: ">"
---


# Evidence Verifier Skill

> **Purpose**: Ensure that claimed proof artifacts are real, accessible, and relevant.
> Phantom evidence is evidence that is claimed but does not exist.

## When to Use

Use this skill when:

- A sub-agent or specialist claims to have proof of completion
- A proof artifact is referenced by path or URL but not shown
- A completion claim is made without supporting evidence
- You need to audit a list of claimed artifacts before accepting a milestone

## Evidence Classification

| Class    | Definition                                       | Accepted?         |
| -------- | ------------------------------------------------ | ----------------- |
| VERIFIED | Artifact shown, accessible, relevant, and recent | Yes               |
| CLAIMED  | Artifact referenced but not shown                | No                |
| PHANTOM  | Artifact claimed to exist but cannot be found    | No                |
| STALE    | Artifact exists but is from an outdated state    | No (without note) |

## Procedure

### Step 1: Enumerate claimed artifacts

List every artifact that has been claimed as proof:

- File paths (e.g., `reports/gap-analysis.md`)
- URLs (e.g., `https://production-url.com`)
- Test output (e.g., "all 47 tests passing")
- Screenshots (e.g., "screenshot of dashboard")

### Step 2: Verify each artifact

For each claimed artifact:

**If it's a file path:**

- Check the file exists using the Read tool or `ls`
- Check it contains relevant content (not empty, not placeholder)
- Check it was modified recently (matches claimed work)

**If it's a URL:**

- Fetch the URL and verify the response code
- Verify the content matches the claim

**If it's tool output (test results, curl, etc.):**

- The output must be shown verbatim in the evidence
- Claimed results without shown output = CLAIMED (not VERIFIED)

**If it's a screenshot:**

- The screenshot must be viewable and show the claimed state
- A description of a screenshot is not a screenshot

### Step 3: Classify and report

Assign VERIFIED, CLAIMED, PHANTOM, or STALE to each artifact.

## Output Format

```
EVIDENCE VERIFICATION REPORT
═══════════════════════════════════════════════════
Verified: [N] / [total] artifacts

ARTIFACT 1: [description]
  Type:   [file | URL | test output | screenshot]
  Claim:  [what was claimed]
  Status: VERIFIED | CLAIMED | PHANTOM | STALE
  Notes:  [what was found / what is missing]

ARTIFACT 2: [description]
  ...

VERDICT
─────────────────
If all VERIFIED:  → ACCEPT evidence
If any not VERIFIED: → REJECT — list what is needed:
  □ [artifact 1]: [exact action to produce real evidence]
  □ [artifact 2]: [exact action]
═══════════════════════════════════════════════════
```

## Validation Gates

Before marking any artifact VERIFIED:

- [ ] The artifact is shown (not referenced)
- [ ] The artifact is from the correct environment (production != localhost)
- [ ] The artifact covers the specific claim (not adjacent evidence)
- [ ] The artifact is not a placeholder or generic example

## Failure Modes

| Failure                                     | Recovery                                              |
| ------------------------------------------- | ----------------------------------------------------- |
| Artifact is a description, not the artifact | Request the actual file/output/screenshot             |
| File exists but is empty                    | Mark PHANTOM — empty files are not evidence           |
| URL returns 404                             | Mark PHANTOM — request correct URL                    |
| Test output shows failures                  | Do not reclassify as VERIFIED — failures are failures |
| Screenshot is blurry or cropped             | Request full clear screenshot                         |

## Eval Examples

### Good — VERIFIED

**Claim:** "All tests pass"
**Evidence shown:** Full vitest output with 47 tests, 0 failures, coverage 82%
**Classification:** VERIFIED

### Bad — CLAIMED (rejected)

**Claim:** "All tests pass"
**Evidence shown:** "I ran the tests and they all passed."
**Classification:** CLAIMED — test output not shown