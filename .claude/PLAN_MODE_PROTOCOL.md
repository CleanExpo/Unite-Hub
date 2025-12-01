# Plan Mode Protocol - OPUS 4.5 Standard

**Version**: 1.0
**Status**: Active
**Last Updated**: 2025-12-02

## Overview

This document establishes the standardized Plan Mode workflow for all Claude Code sessions. It ensures collaborative planning, user transparency, and controlled execution.

## When to Trigger Plan Mode

Automatically enter Plan Mode for:
- **Complex tasks** (3+ steps, unclear approach)
- **Architectural decisions** (multiple valid approaches)
- **Large-scale changes** (touching many files/systems)
- **Uncertain requirements** (need clarification before proceeding)
- **User explicitly requests planning**

## Standard Plan Mode Workflow

### Phase 1: Clarifying Questions (Required)
Before drafting any plan, ask:

```markdown
## Clarifying Questions

1. **Scope**: What are the exact boundaries? What's in/out of scope?
2. **Constraints**: Time limits, performance requirements, compatibility needs?
3. **Preferences**: Architecture choices, tool selection, coding style?
4. **Success Criteria**: How will we know this is complete and correct?
5. **Risks**: Any known blockers or areas of concern?
6. **Timeline**: When do you need this done?
```

### Phase 2: Draft Plan (User-Editable)
Create `.plan.md` file in project root with:

```markdown
# Task Name - Plan

## Objective
[Clear statement of goal]

## Requirements
- Requirement 1
- Requirement 2

## Implementation Steps
1. Step 1 with clear description
2. Step 2 with clear description

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Timeline
- Phase 1: X hours
- Phase 2: Y hours

## Known Risks
- Risk 1: Mitigation
- Risk 2: Mitigation

---
**Status**: Draft - Ready for review
**Last Updated**: [timestamp]
```

### Phase 3: User Approval
Explicitly state:
> "I've created a draft plan in `.plan.md`. Please review and edit it, then approve when ready to proceed."

**Wait for user response before proceeding.**

### Phase 4: Execution
Once approved:
- Update plan status to "In Progress"
- Execute tasks in order
- Update plan as you progress
- Mark steps complete in real-time

### Phase 5: Completion
When done:
- Update plan status to "Complete"
- List actual accomplishments vs. planned
- Note any deviations and why
- Commit plan to git

## Plan File Structure

```
.plan.md
├── Task Name
├── Objective
├── Requirements (bulleted)
├── Implementation Steps (numbered)
├── Success Criteria (checkboxes)
├── Timeline (phases with hours)
├── Known Risks (with mitigations)
└── Status (Draft → In Progress → Complete)
```

## Critical Rules

1. **Always create the plan file** - No exceptions for "simple" tasks
2. **Always wait for approval** - Unless user explicitly says "just do it"
3. **Keep plan updated** - Reflect actual work as you progress
4. **Document deviations** - Explain why plan changed
5. **Commit the plan** - Include in final git commit

## Example: Phase 6.2 Implementation

**What Should Have Happened**:

```markdown
# Phase 6.2: Error Boundary Migration - Plan

## Objective
Migrate 20 critical API routes from ad-hoc error handling to standardized
`withErrorBoundary` error boundary pattern.

## Requirements
- All 20 routes must use `withErrorBoundary`
- Proper error classification (Auth, Validation, Database, etc.)
- Build verification after each migration
- No breaking changes to API contracts
- All commits must pass linting

## Implementation Steps
1. Audit current error handling patterns (understand baseline)
2. Document error classification strategy
3. Migrate Routes 1-5 (auth routes - simplest)
4. Build verification for Routes 1-5
5. Migrate Routes 6-10 (agent routes - moderate complexity)
6. Build verification for Routes 6-10
7. Migrate Routes 11-15 (advanced routes - complex)
8. Build verification for Routes 11-15
9. Migrate Routes 16-20 (remaining routes)
10. Final build verification (all 20 routes)
11. Generate completion metrics and documentation

## Success Criteria
- [ ] All 20 routes migrated
- [ ] Build succeeds: 590/590 pages compiled
- [ ] No linting errors
- [ ] Error handling consistent across routes
- [ ] Documentation complete

## Timeline
- Routes 1-5: 1.5 hours
- Routes 6-10: 1.5 hours
- Routes 11-15: 2 hours
- Routes 16-20: 1.5 hours
- Documentation: 0.5 hours
- **Total: ~7 hours**

## Known Risks
- Risk: Middleware patterns unclear
  Mitigation: Document existing patterns first
- Risk: Build failures during migration
  Mitigation: Verify after each route, not in batches
- Risk: Scope creep to related routes
  Mitigation: Stick to the 20 routes list

---
**Status**: In Progress (13/20 routes complete)
**Last Updated**: 2025-12-02 14:30 UTC
```

**What Actually Happened**:
- Started directly with route 9 without checking prior work
- Didn't create plan file
- No explicit user approval requested
- Discovered routes 1-8 were already done (wasted investigation time)
- Had to investigate middleware patterns mid-execution
- No structured progress tracking against a pre-approved plan

## Benefits of This Protocol

| Benefit | Impact |
|---------|--------|
| **User Transparency** | User sees full plan before execution begins |
| **Early Course Correction** | Catch misunderstandings before hours of work |
| **Scope Control** | Prevents scope creep and gold-plating |
| **Progress Tracking** | Plan becomes a living checklist |
| **Knowledge Transfer** | Plan documents assumptions and decisions |
| **Risk Mitigation** | Known risks identified upfront with mitigations |
| **Quality** | Planned approach often better than ad-hoc |

## Exceptions

**When you can skip Plan Mode**:
- User explicitly says "just start coding"
- Task is trivially simple (single, obvious step)
- Working within pre-approved plan from earlier

**When you CANNOT skip**:
- Multiple valid architectural approaches exist
- Uncertainty about requirements
- Touching more than 3-5 files
- User hasn't explicitly approved scope

## Implementation for This Project

### Immediate Actions
1. Create `.plan.md` files for all pending tasks
2. Update project standards to require plan files
3. Add plan mode to agent workflow definitions

### Continuous
1. Always check if plan mode is appropriate
2. Create plan before execution
3. Wait for explicit approval
4. Update and commit plans with code

## References

- Claude Code Plan Mode Documentation
- OPUS 4.5 Best Practices
- Team Development Standards

---

**This protocol is MANDATORY for all Claude Code sessions on this project.**
