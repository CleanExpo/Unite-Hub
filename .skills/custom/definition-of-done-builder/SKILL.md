---
id: definition-of-done-builder
name: definition-of-done-builder
type: Capability Uplift
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - what does done mean
  - define done
  - what needs to be true
  - when is it finished
  - what are the success criteria
  - build a definition of done
  - what criteria
  - acceptance criteria
description: ">"
---


# Definition of Done Builder

> **Purpose**: Transform vague outcome language into measurable, verifiable DoD criteria.
> Every criterion must be binary: either PROVEN or not. No "mostly done."

## When to Use

Use this skill when:

- A user asks what "done" means for a feature or project
- An outcome translation has been produced and needs formal criteria
- A milestone requires explicit acceptance criteria before work begins
- A completion claim needs to be verified against agreed criteria

Do NOT use this skill for:

- Tasks that already have a written spec with explicit acceptance criteria
- Simple bug fixes with obvious verification (e.g., "fix the 500 error")

## Inputs

- The outcome phrase or goal description
- (Optional) Current system state (what's already proven)
- (Optional) Scope constraints (e.g., "payments not in scope yet")

## Procedure

### Step 1: Categorise the goal

Map the goal to one or more of these production categories:

| Category        | Scope                                                         |
| --------------- | ------------------------------------------------------------- |
| Frontend        | Pages, components, auth flows, responsiveness, visual quality |
| Backend         | API endpoints, health checks, auth middleware, error handling |
| Data / Security | Database, migrations, backups, CORS, rate limiting, JWT       |
| Payments        | Provider mode, webhooks, test transactions, refund flow       |
| Integrations    | Third-party APIs, email, webhooks                             |
| Deployment      | CI/CD, SSL, DNS, rollback                                     |
| Business        | Support, legal, analytics, monitoring                         |
| Visual          | Design system compliance, screenshot proof                    |

### Step 2: Generate criteria per category

For each relevant category, write criteria as binary statements:

**Format:** `□ [Verb] [measurable condition] — Proof: [exact artifact]`

**Examples (good):**

- `□ Production URL responds with HTTP 200 — Proof: curl -I output`
- `□ Test suite passes with 0 failures — Proof: pytest/vitest output`
- `□ No rounded-lg classes in component — Proof: grep search output`

**Examples (bad — rejected):**

- `□ The UI looks nice` (not measurable)
- `□ Tests are passing` (no proof specified)
- `□ It works` (not binary)

### Step 3: Assign status to each criterion

For each criterion, assign status based on current evidence:

| Status    | Meaning                                   | Required                         |
| --------- | ----------------------------------------- | -------------------------------- |
| `PROVEN`  | Evidence exists and has been verified     | Proof artifact on file           |
| `UNKNOWN` | Not yet verified — could be true or false | Must verify before claiming done |
| `MISSING` | Confirmed absent or broken                | Must fix before claiming done    |

### Step 4: Identify proof artifact per UNKNOWN criterion

For every UNKNOWN item, specify:

```
UNKNOWN — requires: [exact command or action to verify]
```

Example:

```
UNKNOWN — requires: curl -I https://production-url.com
UNKNOWN — requires: Run pnpm test and capture full output
UNKNOWN — requires: Screenshot of production login flow
```

## Output Format

```
DEFINITION OF DONE
═══════════════════════════════════════════════════
Goal: [restated goal]
Scope: [categories included]

FRONTEND
─────────
□ [criterion] — PROVEN | Proof: [artifact]
□ [criterion] — UNKNOWN | requires: [action]
□ [criterion] — MISSING | Fix: [remediation]

BACKEND
─────────
□ [criterion] — PROVEN | Proof: [artifact]
...

[CONTINUE FOR EACH RELEVANT CATEGORY]

SUMMARY
─────────
PROVEN:  [N] criteria
UNKNOWN: [N] criteria — must verify
MISSING: [N] criteria — must fix

GATE: ALL criteria must be PROVEN before completion can be claimed.
═══════════════════════════════════════════════════
```

## Validation Gates

Before outputting the DoD:

- [ ] Every criterion is binary (pass/fail, not percentage)
- [ ] Every UNKNOWN has a specific verification action
- [ ] Every MISSING has a specific remediation
- [ ] Proof artifact is exact (not "run the tests" but "run `pnpm test` and capture output")

## Failure Modes

| Failure                         | Recovery                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| Goal is too vague to categorise | Ask: "What does success look like for a user?"              |
| Criteria are subjective         | Rewrite as binary observable outcomes                       |
| Proof artifact is vague         | Specify exact command, file path, or screenshot requirement |
| Too many criteria (> 30)        | Split into Phase 1 (critical) and Phase 2 (nice-to-have)    |

## Eval Examples

### Good Example

**Input:** "The auth flow is done"

**Output:**

```
DEFINITION OF DONE
═══════════════════════════════════════════════════
Goal: Authentication flow complete
Scope: Frontend, Backend, Security

FRONTEND
─────────
□ Login page renders without console errors — UNKNOWN | requires: Browser screenshot + console log
□ Login form submits and redirects to dashboard — UNKNOWN | requires: Playwright test run
□ Logout clears JWT cookie and redirects to login — UNKNOWN | requires: Browser network tab screenshot

BACKEND
─────────
□ POST /api/auth/login returns 200 with JWT — UNKNOWN | requires: curl -X POST output
□ Invalid credentials return 401 — UNKNOWN | requires: curl with wrong password output
□ Protected routes reject requests without JWT — UNKNOWN | requires: curl without Authorization header output

SECURITY
─────────
□ JWT secret is not the default value — UNKNOWN | requires: Check JWT_SECRET_KEY env var
□ Token expiry is set to <= 60 minutes — UNKNOWN | requires: Check JWT_EXPIRE_MINUTES env var
□ Rate limiting active on /api/auth/login — UNKNOWN | requires: 10 rapid requests + response log

SUMMARY
─────────
PROVEN:  0 criteria
UNKNOWN: 9 criteria — must verify
MISSING: 0 criteria

GATE: ALL criteria must be PROVEN before auth flow can be claimed complete.
═══════════════════════════════════════════════════
```

### Bad Example (rejected)

**Input:** "Is auth done?"
**Output:** "The auth looks complete, tests are passing."

**Reason rejected:** No criteria listed, no proof artifacts, vague summary.