# Non-Coder Build Guide — Idea to Production

> Universal reference for solo founders using Claude Code to build SaaS applications.
> Use this to understand what phase you're in, what specialist role is working, and what your job is at each step.

---

## How to Use This Guide

1. **Before starting a feature**: Read the phase descriptions to understand what's involved
2. **When giving instructions**: Use the `/build` command — it structures your requirements so Claude builds what you actually want
3. **When Claude says "done"**: Check the VERIFICATION CHECKLIST it provides against what you see in the browser
4. **When something feels wrong**: Find the relevant phase below and check "Common Pitfalls"

---

## The 10 Phases of Building a Feature

### Phase 1: Idea & Requirements

**Real-team specialist:** Product Manager
**What Claude does:** Asks clarifying questions, echoes back your requirement to confirm understanding
**What you do:** Describe WHAT you want, WHO uses it, and WHAT they should see

**Use the `/build` command.** It gives Claude a structured template instead of free-text.

| Term | Plain English |
|------|---------------|
| Requirements | A written description of what the feature should do |
| User story | "As a [role], I want [thing] so that [reason]" |
| Acceptance criteria | How you'll know it's done — what you can see and click |
| Scope | The boundary of what's included (and what's NOT) |

**Common pitfalls:**
- Describing HOW to build it instead of WHAT it should do (let Claude choose the how)
- Forgetting to say who uses the feature (admin? student? public visitor?)
- Not specifying what the user should SEE when it works

---

### Phase 2: Architecture

**Real-team specialist:** Software Architect / Tech Lead
**What Claude does:** Decides which files to create, which patterns to follow, how data flows
**What you do:** Nothing — this is Claude's domain. Review the plan if one is presented.

| Term | Plain English |
|------|---------------|
| Architecture | The structure of how parts of the app connect to each other |
| Frontend | What runs in the browser — the pages, buttons, forms you see |
| Backend | What runs on the server — the logic, data processing, security |
| API | The bridge between frontend and backend — how they talk to each other |
| Database | Where all the data is permanently stored (users, courses, orders) |
| Monorepo | One repository containing multiple apps (e.g. `apps/web/` + `apps/backend/`) |

**Common pitfalls:**
- Asking Claude to "just make it work" without context about what exists
- Not knowing which folder to look in (see Architecture Routing in your CLAUDE.md)

---

### Phase 3–10

See the full guide: `docs/NON_CODER_BUILD_GUIDE.md` in the NodeJS-Starter-V1 template repo for all phases.
This is the same document — phases 3-10 cover Database, Backend API, Frontend Pages, Integration & Wiring, Testing, Design & Polish, Deployment, and Maintenance.

---

## Quick Reference: Your Job vs Claude's Job

| Your Job | Claude's Job |
|----------|-------------|
| Describe WHAT you want | Decide HOW to build it |
| Say WHO uses it | Choose which files and patterns |
| Say what they SHOULD SEE | Write the code |
| Say what to AVOID | Run the tests |
| Confirm the checklist | Produce the verification checklist |
| Say "looks good" or describe what's wrong | Fix what's wrong |
