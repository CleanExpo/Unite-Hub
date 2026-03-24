---
id: outcome-translator
name: outcome-translator
type: flexible
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - finished
  - ready
  - launch it
  - make it work
  - production ready
  - ready for clients
  - ship it
  - done
  - go live
  - just make it work
  - it's ready
  - we're done
  - release it
description: ">"
---


# Outcome Translator Skill

> **Purpose**: Non-technical founders speak in outcomes. Engineers speak in tasks.
> This skill bridges the gap — translating every outcome phrase into a provable engineering plan.
>
> **Locale**: en-AU — colour, behaviour, optimisation, organised, licence (noun).

---

## When to Invoke

Invoke this skill BEFORE any action when the user's message contains:

- Completion claims: "finished", "done", "complete", "ready"
- Launch instructions: "launch it", "ship it", "go live", "release it", "deploy"
- Goal statements: "make it work", "just fix it", "get it working"
- Readiness claims: "production ready", "ready for clients", "ready to sell"

**Never assume the claim is true.** Always translate and verify first.

---

## Output Format

Always produce the full structured output below. Do not skip any section.

```
OUTCOME TRANSLATION
═══════════════════════════════════════════════════════════════
Outcome:          [Exact phrase the user said]
Interpreted As:   [Engineering definition — be specific]

DEFINITION OF DONE
───────────────────────────────────────────────────────────────
□ [Criterion 1 — measurable, specific]
□ [Criterion 2]
□ [Criterion N]

CURRENT STATE AUDIT
───────────────────────────────────────────────────────────────
Proven:
  ✓ [Confirmed working item — state the evidence]
  ✓ [Another confirmed item]

Unknown:
  ? [Item that cannot be verified without action — state what action is needed]
  ? [Another unknown]

Missing:
  ✗ [Item confirmed absent or broken — state what is missing]
  ✗ [Another missing item]

GATED PLAN
───────────────────────────────────────────────────────────────
Phase 1: [Phase Title]
  Priority: [CRITICAL / HIGH / MEDIUM]
  Steps:
    1. [Specific action]
    2. [Specific action]
  Gate: [Command or artifact that proves this phase is complete]
  Rollback: [How to undo if this phase fails]

Phase 2: [Phase Title]
  Priority: [CRITICAL / HIGH / MEDIUM]
  Steps:
    1. [Specific action]
  Gate: [Proof of completion]
  Rollback: [Undo path]

[Repeat for all phases]

PROOF REQUIRED
───────────────────────────────────────────────────────────────
Before claiming completion, the following artifacts must exist:

□ [Artifact 1 — e.g. "curl -I output showing HTTP 200 for production URL"]
□ [Artifact 2 — e.g. "screenshot of successful login with production credentials"]
□ [Artifact 3 — e.g. "provider dashboard showing live transaction"]
□ [Artifact N]

COMPLETION GATE
───────────────────────────────────────────────────────────────
Status:   [NOT COMPLETE / COMPLETE]
Blocking: [List every criterion that is Unknown or Missing]

NEXT ACTION
───────────────────────────────────────────────────────────────
[Single most important action to take RIGHT NOW]
[Exact command or step — no ambiguity]
═══════════════════════════════════════════════════════════════
```

---

## Outcome Definitions Reference

Use these definitions when interpreting outcome language. Adapt to the project's actual stack.

### "Finished" / "Done" / "Complete"

Requires ALL of the following:

- Production URL live and returning HTTP 200
- Auth flows working (register, login, logout, protected routes)
- All linked assets loading without 404
- Backend health check passing
- No unhandled errors in production logs
- SSL valid
- Environment variables are production values (not dev defaults)

### "Ready" / "Production Ready"

Same as "Finished" plus:

- CI/CD pipeline green
- Monitoring configured (error tracking, uptime)
- Rollback path documented
- Database backups configured

### "Launch it" / "Ship it" / "Go live"

Same as "Production Ready" plus:

- Deployment executed to production environment
- DNS confirmed pointing to production
- First user journey end-to-end verified post-deploy

### "Make it work" / "Just fix it"

Requires:

- Root cause identified (not just symptoms suppressed)
- Fix applied and tested
- Regression check: nothing else broken
- Evidence of working state (test output, screenshot, or log)

### "Ready for clients" / "Ready to sell"

Same as "Production Ready" plus:

- At least one real user account created and verified
- Payment flow tested in live mode (if applicable)
- Support contact reachable
- Legal pages published (privacy policy, terms of service)
- Email delivery confirmed (not in spam)

---

## Gap Analysis Rules

**Proven** = you have evidence. Name the evidence. Examples:

- "CI pipeline green — last run [date]"
- "Backend health check returns 200 — confirmed by curl output in session"
- "Database migrations applied — confirmed by Alembic history"

**Unknown** = you could verify it but haven't yet. State exactly what action would verify it. Examples:

- "Production URL response — requires: curl -I https://production-url.com"
- "Email delivery — requires: send test email to external Gmail address"
- "Payment webhook — requires: check provider dashboard for delivery"

**Missing** = confirmed absent. State what is missing. Examples:

- "Production JWT secret — still set to default value 'your-secret-key-change-in-production'"
- "Monitoring — no error tracking service configured"
- "SSL certificate — domain not pointing to production server yet"

---

## Completion Prohibition

This skill enforces a hard prohibition on false completion claims.

Do NOT output any of these phrases unless ALL criteria are Proven:

- "Done!"
- "You're production ready."
- "Everything is working."
- "That's complete."
- "Looks good to go."

If ANY criterion is Unknown or Missing, output:

```
STATUS: NOT COMPLETE
[N] criteria require action before this can be claimed as complete.
Next required action: [specific step]
```

---

## Integration Points

- **Rule**: `.claude/rules/human-outcome-translation.md` — always-on trigger
- **CLI Control Plane**: outcome translation triggers AUDIT mode
- **Blueprint First**: if a build plan is generated, invoke `.skills/custom/blueprint-first/SKILL.md` before code generation
- **Verification**: always invoke `.skills/custom/verify/SKILL.md` (or equivalent) after execution

---

## Example Invocation

**User**: "We're production ready, launch it"

**Skill invoked**: outcome-translator

**Output**:

```
OUTCOME TRANSLATION
═══════════════════════════════════════════════════════════════
Outcome:          "We're production ready, launch it"
Interpreted As:   Claim that all production criteria are met; instruction to deploy to production

DEFINITION OF DONE
───────────────────────────────────────────────────────────────
□ Production URL responds HTTP 200
□ Auth flow verified (register → login → dashboard)
□ Backend health check passing
□ SSL certificate valid
□ No dev environment variables in production
□ CI/CD pipeline green
□ Monitoring active
□ Rollback path documented

CURRENT STATE AUDIT
───────────────────────────────────────────────────────────────
Proven:
  ✓ CI pipeline green — confirmed by last run log

Unknown:
  ? Production URL — requires: curl -I https://your-production-url.com
  ? Auth flow — requires: manual test with production credentials
  ? SSL certificate — requires: ssl-checker.io or browser inspection
  ? Monitoring — requires: confirm Sentry/equivalent is configured

Missing:
  ✗ Rollback plan — no documented rollback procedure found
  ✗ Production env vars — JWT_SECRET_KEY still at default value

GATED PLAN
───────────────────────────────────────────────────────────────
Phase 1: Resolve Missing Items [CRITICAL]
  Steps:
    1. Rotate JWT_SECRET_KEY in production environment
    2. Document rollback procedure in runbook
  Gate: grep JWT_SECRET_KEY .env.production confirms non-default value

Phase 2: Verify Unknown Items [CRITICAL]
  Steps:
    1. curl -I https://your-production-url.com
    2. Test auth flow manually
    3. Confirm SSL validity
    4. Confirm monitoring is receiving events
  Gate: All four return expected results

Phase 3: Deploy [HIGH]
  Steps:
    1. Trigger production deployment via CI/CD
    2. Verify post-deploy health check
  Gate: Health endpoint returns 200 post-deploy
  Rollback: git revert + re-deploy or platform rollback

PROOF REQUIRED
───────────────────────────────────────────────────────────────
□ curl -I output showing HTTP 200
□ Screenshot of successful login on production
□ SSL validity confirmation
□ Monitoring dashboard showing active tracking

COMPLETION GATE
───────────────────────────────────────────────────────────────
Status:   NOT COMPLETE
Blocking: 2 Missing items, 4 Unknown items must be resolved

NEXT ACTION
───────────────────────────────────────────────────────────────
Rotate JWT_SECRET_KEY in production environment — this is a security blocker.
Command: Set JWT_SECRET_KEY to a new 64-character random string in your hosting platform's env config.
═══════════════════════════════════════════════════════════════
```