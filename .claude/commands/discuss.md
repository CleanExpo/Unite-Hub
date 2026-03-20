# /discuss — Architecture Discussion (PLAN Mode)

> Structured architectural discussion that enumerates trade-offs, references ADR precedents,
> recommends an approach with confidence, and optionally records the decision.

## Usage

```
/discuss "should we use server actions or API routes for the Xero sync?"
/discuss "evaluate adding Redis for caching"
/discuss "how should we structure the social publishing pipeline?"
```

## Execution Protocol

### Step 1 — Switch to PLAN Mode

Activate PLAN mode (light governance — no execution-level checks on design discussions).

```
MODE: PLAN
Governance: Von Neumann + Shannon only
No execution gates. No lint. No type-check.
```

### Step 2 — Load Context

Read in order:
1. `.claude/memory/architectural-decisions.md` — check for precedents
2. `.claude/memory/CONSTITUTION.md` — check for constraints
3. `.claude/data/toolsheds.json` — understand current stack boundaries
4. `.claude/VAULT-INDEX.md` — find relevant agents/skills

### Step 3 — ADR Precedent Check

Search `.claude/memory/architectural-decisions.md` for related past decisions.

If found:
```
PRECEDENT FOUND: [{date}] {decision title}
Outcome: {what was decided}
Still applies: YES / NO ({reason if changed}
```

If not found: note "No prior ADR for this decision."

### Step 4 — Option Enumeration

Present 2–4 options. For each:

```
## Option {N}: {name}

Description: {what this approach is}

Pros:
- {advantage 1}
- {advantage 2}

Cons:
- {disadvantage 1}
- {disadvantage 2}

Risk: LOW / MEDIUM / HIGH
Reversibility: Easy (can change later) / Hard (significant rework) / Irreversible
Nexus fit: GOOD / NEUTRAL / POOR ({brief reason})
```

### Step 5 — Recommendation

```
## Recommendation: Option {N} — {name}

Confidence: {HIGH/MEDIUM/LOW}

Because:
{1–3 sentences of rationale specific to Nexus context}

Key constraint respected: {which CONSTITUTION or stack constraint this satisfies}
```

### Step 6 — Decision Record (if approved)

If the user approves the recommendation, append to `.claude/memory/architectural-decisions.md`:

```
[{DD/MM/YYYY}] DECISION: {title}
CONTEXT: {what prompted this}
DECISION: {what was decided}
REASON: {key rationale}
ALTERNATIVES REJECTED: {other options and why}
CONSEQUENCES: {what this enables/constrains}
STATUS: ACCEPTED
```

Print confirmation:
```
Decision recorded in architectural-decisions.md ✓
```

If the user does NOT approve: note outcome and do not write to ADR.

## Rules

- Never enforce execution-level checks in PLAN mode
- Never write to ADR without explicit user approval ("yes, record that" / "yes, that's the decision")
- Always check for precedents first — don't re-debate settled decisions
- Confidence levels:
  - HIGH: Clear winner, strong Nexus fit, low risk
  - MEDIUM: Trade-offs are real, context-dependent
  - LOW: Genuinely uncertain, recommend prototyping first

## Example Output Structure

```
PLAN MODE: Architecture Discussion
Topic: {topic}

Precedent check: {found/not found}

Options:
1. {name} — {one-line summary}
2. {name} — {one-line summary}
3. {name} — {one-line summary}

[full option analysis]

Recommendation: Option 2 — {name}
Confidence: HIGH

Approve to record decision in architectural-decisions.md? (yes/no)
```

## Locale

Australian English. Dates DD/MM/YYYY. AUD where pricing is relevant.
