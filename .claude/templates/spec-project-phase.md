---
spec_type: project
phase_type: Phase X
spec_version: 1.0.0
created_date: DD/MM/YYYY
australian_context: true
design_tokens_version: 1.0.0
---

# Phase X: [Phase Name] Specification

## 1. Vision (Spec Interview Phase 1 of 6)

### Problem Statement

[Describe the core problem this phase solves. What is broken, inefficient, or missing?]

### Beneficiaries

[Who benefits from solving this? Which users, teams, or systems?]

### Success Criteria

[What specific outcomes define success? List 3-5 measurable criteria.]

### Why Now

[What drives the urgency? Business drivers, technical debt, market opportunity?]

---

## 2. Users (Spec Interview Phase 2 of 6)

### Primary User Personas

1. **[Persona Name]**
   - Role: [Job title/function]
   - Technical level: [Beginner/Intermediate/Expert]
   - Pain point: [What frustrates them]
   - Goal: [What they want to accomplish]

2. **[Persona Name]**
   - Role: [Job title/function]
   - Technical level: [Beginner/Intermediate/Expert]
   - Pain point: [What frustrates them]
   - Goal: [What they want to accomplish]

### User Stories

- As a [persona], I want [capability] so that [benefit]
- As a [persona], I want [capability] so that [benefit]
- As a [persona], I want [capability] so that [benefit]

### Key Pain Points

- [Pain point 1 with context]
- [Pain point 2 with context]
- [Pain point 3 with context]

---

## 3. Technical Approach (Spec Interview Phase 3 of 6)

### Architecture Overview

[Describe the high-level design. Include system components, how they interact, and where this phase fits.]

### System Diagram

```
[ASCII diagram or reference to architecture document]
```

### Data Model

[Describe key database tables, schemas, or data structures created/modified in this phase.]

### Integration Points

- [Internal system 1]: [What's integrated and why]
- [Internal system 2]: [What's integrated and why]
- [External service (if any)]: [What's integrated and why]

### Key Dependencies

- **Internal**: [Module/service dependencies]
- **External**: [Third-party libraries, services, APIs]
- **Infrastructure**: [Database, caching, infrastructure changes]

### Technical Constraints

- [Constraint 1 and its impact]
- [Constraint 2 and its impact]
- [Constraint 3 and its impact]

---

## 4. Design Requirements (Spec Interview Phase 4 of 6)

### Australian Context ✅ REQUIRED

- **Language**: en-AU (Australian English spelling)
- **Currency**: AUD (Australian Dollars)
- **Date Format**: DD/MM/YYYY (e.g., 15/01/2026)
- **Timezone**: Australia/Brisbane (primary), AEST/AEDT
- **Compliance**: Privacy Act 1988, WCAG 2.1 AA minimum
- **Accessibility**: All features WCAG 2.1 AA compliant

### Aesthetic Requirements (2025-2026) ✅ REQUIRED

- **Layout**: Bento grid system with clear card boundaries
- **Effects**: Glassmorphism (frosted glass) where appropriate
- **Icons**: NO Lucide icons - only AI-generated custom SVGs
- **Design Tokens**: MUST reference `.claude/data/design-tokens.json`
- **Whitespace**: Generous, breathing room for clarity
- **Typography**: Clean, modern, sans-serif primary (design tokens define specific fonts)
- **Colors**: Follow design token palette (no arbitrary colors)

### UI Components

[List specific components needed for this phase]

- [Component 1]: [Purpose and usage]
- [Component 2]: [Purpose and usage]
- [Component 3]: [Purpose and usage]

### Mobile Requirements

- [ ] Responsive design (mobile-first approach)
- [ ] Touch-friendly targets (≥48x48px)
- [ ] Performance budget: <3s load on 3G, <100ms interactions
- [ ] Landscape orientation support

### Accessibility (WCAG 2.1 AA)

- [ ] Color contrast ≥4.5:1 for text, ≥3:1 for large text
- [ ] Keyboard navigation fully functional
- [ ] Screen reader compatibility tested
- [ ] Focus indicators visible (≥2px width)
- [ ] No content hidden by default from screen readers

---

## 5. Business Context (Spec Interview Phase 5 of 6)

**Priority**: [🔴 High / 🟡 Medium / 🟢 Low]

**Scope Definition**

- MVP Scope: [What's included in MVP]
- Phase Scope: [What's specifically in this phase]
- Out of Scope: [What's explicitly NOT included]

**Success Metrics**

- [Metric 1]: Current state → Target state
- [Metric 2]: Current state → Target state
- [Metric 3]: Current state → Target state

**Business Impact**

- [Impact on revenue/efficiency/adoption]
- [Impact on technical debt]
- [Impact on user satisfaction]

**Risks & Mitigations**
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 3] | High/Med/Low | High/Med/Low | [Strategy] |

---

## 6. Implementation Plan (Spec Interview Phase 6 of 6)

### Build Order (Sequential Steps)

1. **Foundation** [Duration estimate]
   - [Foundation task 1]
   - [Foundation task 2]
   - Dependencies: [What needs to exist first]

2. **Core Implementation** [Duration estimate]
   - [Core task 1]
   - [Core task 2]
   - Dependencies: [What must complete before this]

3. **Integration** [Duration estimate]
   - [Integration task 1]
   - [Integration task 2]
   - Dependencies: [What must complete before this]

4. **Verification & Polish** [Duration estimate]
   - [Polish task 1]
   - [Polish task 2]
   - Dependencies: [What must complete before this]

### Parallelization Opportunities

[Identify what can be done concurrently to speed up delivery]

### Verification Criteria (All Required ✅)

- [ ] All unit tests pass (100% of new code)
- [ ] All integration tests pass
- [ ] E2E tests pass for critical user journeys
- [ ] Lighthouse score >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] WCAG 2.1 AA compliance verified (automated + manual)
- [ ] Australian context validated:
  - [ ] All dates in DD/MM/YYYY format
  - [ ] All currency in AUD
  - [ ] en-AU spelling throughout
  - [ ] Privacy Act 1988 compliance verified
- [ ] Design system compliance:
  - [ ] NO Lucide icons in final output
  - [ ] All design tokens from `.claude/data/design-tokens.json` used
  - [ ] Bento grid + glassmorphism aesthetic applied
  - [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Truth Finder verification (if content involved)
- [ ] Independent security scan passed (no vulnerabilities)
- [ ] Performance benchmarks met:
  - [ ] <3 second initial load
  - [ ] <100ms interaction latency
  - [ ] Mobile performance acceptable (Lighthouse >85)
- [ ] Code review completed by [reviewer(s)]
- [ ] Design review completed
- [ ] PM/Stakeholder sign-off

---

## 7. Related Documentation & Resources

### CLAUDE.md References

- [Section name]: `CLAUDE.md` line [X]
- [Section name]: `CLAUDE.md` line [X]

### Skills Required

- [Skill 1]: `.claude/skills/[skill].md`
- [Skill 2]: `.claude/skills/[skill].md`

### Agents Involved

- [Agent 1]: Responsible for [task]
- [Agent 2]: Responsible for [task]

### Hook Integration

List every `.claude/hooks/` entry that fires during this phase's implementation:

| Hook | Trigger Event | What It Enforces |
|------|--------------|------------------|
| `pre-tool-use` | Before any file write | Immutable file guard (CONSTITUTION, compass, design-tokens) |
| `post-tool-use` | After bash commands | Log capture for verification evidence |
| [custom-hook] | [condition] | [what it enforces for this phase] |

> Review `.claude/settings.json` hooks section to confirm which hooks are active. A hook that blocks a tool call will surface in the PostToolUse output — treat it as a hard gate, not a warning.

### Design Tokens

- Primary reference: `.claude/data/design-tokens.json`
- Version: 1.0.0

---

## 8. Progress Tracking

**PROGRESS.md Link**: [Phase X section in PROGRESS.md]

**Status**: Not Started | In Progress | Completed

**Start Date**: [DD/MM/YYYY]
**Target Completion**: [DD/MM/YYYY]

**Phase Progress**

```
[████░░░░░░] 40% Complete
- Foundation: 100%
- Core Implementation: 25%
- Integration: 0%
- Verification: 0%
```

---

## 9. Assumptions & Constraints

### Assumptions

- [Assumption 1 and its impact if wrong]
- [Assumption 2 and its impact if wrong]

### Technical Constraints

- [Constraint 1 with rationale]
- [Constraint 2 with rationale]

### Timeline Constraints

- [If any hard dates, what are they]

---

## 10. Approval & Sign-Off

| Role                | Name   | Date         | Status             |
| ------------------- | ------ | ------------ | ------------------ |
| Product Manager     | [Name] | [DD/MM/YYYY] | Approved / Pending |
| Tech Lead           | [Name] | [DD/MM/YYYY] | Approved / Pending |
| Design Lead         | [Name] | [DD/MM/YYYY] | Approved / Pending |
| Architecture Review | [Name] | [DD/MM/YYYY] | Approved / Pending |

---

**Document Version**: 1.0.0
**Last Updated**: [DD/MM/YYYY]
**Next Review**: [DD/MM/YYYY]
