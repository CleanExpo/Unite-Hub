# Spec Generation System

## Purpose

This document describes the automated specification generation system for Node.js Starter V1. It ensures every feature and project phase has documented requirements before implementation begins, following the **verification-first principle**.

---

## Core Principle

> **No implementation without specification**
>
> Every feature and project phase must have a spec.md document with ≥80% completeness before development starts.

---

## System Overview

### What Gets Spec.md?

| Type              | Location                        | Triggers                                                 | When                              |
| ----------------- | ------------------------------- | -------------------------------------------------------- | --------------------------------- |
| **Project Phase** | `docs/phases/phase-X-spec.md`   | Major architecture changes, new agents, system refactors | At phase start in PROGRESS.md     |
| **Feature**       | `docs/features/[name]/spec.md`  | New components, API endpoints, user-facing changes       | When feature work begins          |
| **Bug Fix**       | Inline in issue or feature spec | Complex fixes requiring requirements                     | If more than trivial logic change |
| **Refactor**      | Part of phase spec              | Internal only, no user impact                            | Documented in phase plan          |

### What Doesn't Need Spec.md?

- Typo fixes
- Simple formatting changes
- Documentation updates
- Direct copy-paste from specs

---

## Automatic Detection & Generation

### How It Works

The pre-response hook automatically detects when you start new work:

```
User Input
    ↓
Pre-Response Hook Activates
    ↓
Analyze Request
    ├─ Is this a Phase X mention? → Project Phase
    ├─ Is this a feature/component request? → Feature
    └─ Is this existing work? → Check for spec
    ↓
Check Spec Existence
    ├─ Spec found & complete → Load context, proceed
    ├─ Spec found & incomplete → Alert, ask to complete
    └─ Spec not found → Offer generation
    ↓
Offer Generation Methods
    ├─ Interview Mode: 6-phase Spec Builder interview
    ├─ Template Mode: Pre-filled template to complete
    └─ Skip: Not needed for this work
    ↓
Generate & Validate
    ├─ Save spec.md to correct location
    ├─ Validate ≥80% completeness
    └─ Notify user, ready to implement
```

### Trigger Examples

**Project Phase Trigger:**

```
User: "Start Phase 8: API Rate Limiting"
User: "Let's refactor the authentication system"
User: "Implement the new agent orchestrator"
```

**Feature Trigger:**

```
User: "Add dark mode toggle to settings"
User: "Create user profile component"
User: "Build the payments API endpoint"
```

**Existing Work Resume:**

```
User: "Continue with the OAuth implementation"
User: "Let's finish the checkout flow"
User: "Back to the admin dashboard"
```

---

## Spec Types

### 1. Project Phase Spec

**File**: `docs/phases/phase-X-spec.md`

**Scope**: Architectural changes affecting multiple systems

**6-Phase Structure**:

1. **Vision**: Problem, beneficiaries, success, why now
2. **Users**: Personas, user stories, pain points
3. **Technical**: Architecture, integrations, constraints
4. **Design**: Aesthetics, components, accessibility, Australian context
5. **Business**: Priority, scope, metrics, risks
6. **Implementation**: Build order, verification criteria

**Additional Sections**:

- Related Documentation
- Progress Tracking (linked to PROGRESS.md)
- Assumptions & Constraints
- Approval & Sign-Off

**Completeness**: 10-15 sections, ~2000-3000 words

**Creation Time**: 2-3 hours

**Created By**:

- Spec Builder Agent (interview mode - comprehensive)
- Template mode (manual - faster but needs guidance)

**Example**: `docs/phases/phase-2-spec.md`

---

### 2. Feature Spec

**File**: `docs/features/[feature-name]/spec.md`

**Scope**: Focused features, components, endpoints

**6-Phase Structure** (condensed):

1. **Vision**: Problem, beneficiaries, success, why now
2. **Users**: Personas (2-3), user stories (3-5)
3. **Technical**: Architecture, components, APIs, dependencies
4. **Design**: Components, Australian context, design system compliance
5. **Business**: Priority, scope, metrics
6. **Implementation**: Build order, test strategy, verification

**Additional Sections**:

- Related Documentation
- Status (Specification → Development → Testing → Ready → Complete)

**Completeness**: 8 sections, ~1000-1500 words

**Creation Time**: 30-60 minutes

**Created By**:

- Spec Builder Agent (quick interview - focused)
- Template mode (manual - fast)

**Example**: `docs/features/dark-mode-toggle/spec.md`

---

## Generation Methods

### Method 1: Automatic (Recommended)

**Trigger**: Pre-response hook detects new work

**Flow**:

```
System: "No spec found for this feature. Generate one?"
User: [Interview] [Template] [Skip]
     ↓
System: Generates spec.md automatically
Result: Ready to edit and implement
```

**Best for**: Quick iteration, getting started fast

**Advantages**:

- Automatic detection - nothing to remember
- Pre-populated with context
- Guided by system prompts

---

### Method 2: Spec Builder Interview

**Trigger**: User requests or system offers "Interview" mode

**Method**:

```bash
# System routes to Spec Builder Agent
Spec Builder Agent
    ↓
6-Phase Interview Questions:
    1. Vision questions
    2. Users questions
    3. Technical questions
    4. Design questions (with Australian context)
    5. Business questions
    6. Implementation questions
    ↓
Auto-Generated spec.md
    ↓
Saved to correct location
    ↓
Ready to implement
```

**Flow Example**:

```
User: "Start Phase 10: Real-time Notifications"
    ↓
System: "This looks like a project phase. Interview or template?"
User: "Interview"
    ↓
Spec Builder: "What problem does Phase 10 solve?"
User: [responds]
Spec Builder: "Who are the primary beneficiaries?"
User: [responds]
... [continues through 6 phases] ...
    ↓
Result: Comprehensive Phase 10 spec
```

**Best for**:

- Complex, ambiguous requirements
- Large scope projects
- When you need to think through the design

**Advantages**:

- Comprehensive
- Guided thinking process
- Enforces completeness
- Australian context included

---

### Method 3: Template Mode

**Trigger**: User selects "Template" or copies template file

**Method**:

```bash
# Copy template to location
cp .claude/templates/spec-feature.md docs/features/[name]/spec.md

# OR system auto-generates pre-filled version
System: "Created docs/features/[name]/spec.md"

# User edits and completes
nano docs/features/[name]/spec.md
```

**Completion Checklist**:

- [ ] Replace all [placeholders]
- [ ] Add specific details (not generic)
- [ ] Include Australian context
- [ ] Reference design tokens
- [ ] Define verification criteria
- [ ] Validate ≥80% completeness

**Best for**:

- Quick features with clear requirements
- When you want to write specs yourself
- Fast iteration cycles

**Advantages**:

- Fastest creation
- Full control over content
- Can be done offline

---

## Spec Completeness Validation

### Automated Validation

When you resume work on an existing feature:

```
User: "Continue with dark mode implementation"
    ↓
System checks: docs/features/dark-mode-toggle/spec.md
    ↓
Validates completeness:
    ├─ Vision section (problem, beneficiaries, success)
    ├─ Users section (personas, stories)
    ├─ Technical section (architecture, components)
    ├─ Design section (Australian context, design system)
    ├─ Business section (priority, metrics)
    ├─ Implementation section (build steps, verification)
    ├─ Australian context (en-AU, DD/MM/YYYY, AUD, Privacy Act)
    └─ Design system (design tokens, NO Lucide icons)
    ↓
Score Calculation:
    ├─ Content completeness: 6/6 sections = 100%
    ├─ Australian context: 4/4 requirements = 100%
    ├─ Design system: 2/2 requirements = 100%
    └─ Overall: 100% ✅
    ↓
If ≥80%: Loads context → proceeds with implementation
If <80%: Shows completion checklist → asks to complete
```

### Manual Validation

Check your own spec completeness:

**Content Completeness**

- [ ] Vision: Clearly states problem, beneficiaries, success, why now
- [ ] Users: Has personas with context and pain points
- [ ] Technical: Describes architecture, components, dependencies
- [ ] Design: Specifies layout, components, Australian context
- [ ] Business: Defines priority, scope, metrics, risks
- [ ] Implementation: Lists specific build steps and verification criteria

**Australian Context**

- [ ] Language: en-AU (no "color" spelled as "color", use "colour")
- [ ] Date format: DD/MM/YYYY (not MM/DD/YYYY)
- [ ] Currency: AUD$ (if applicable)
- [ ] Timezone: Australia/Brisbane mentioned
- [ ] Compliance: Privacy Act 1988, WCAG 2.1 AA

**Design System**

- [ ] Design tokens referenced: `.claude/data/design-tokens.json`
- [ ] Lucide icons: Explicitly "NO Lucide icons, custom SVG only"
- [ ] Aesthetic: 2025-2026 style (bento grid, glassmorphism)
- [ ] Responsive: Mobile-first, responsive design noted

**Verification Standards**

- [ ] Tests specified: Unit, integration, E2E
- [ ] Lighthouse threshold: >90 mentioned
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Performance budget: <3s load, <100ms interactions

**Completeness Score** = (Completed items / Total items) × 100

**Minimum to proceed**: ≥80% (with all REQUIRED sections)

---

## Integration Points

### With PROGRESS.md

Project phase specs link to project tracking:

```markdown
# PROGRESS.md

## Phase X: [Name]

**Status**: Not Started | In Progress | Complete
**Spec**: [Phase X Spec](docs/phases/phase-X-spec.md)
**Progress**: [████░░░░░░] 40%

### Objectives

[Auto-pulled or summarized from spec]

### Verification Criteria

[From spec implementation plan]
```

### With Spec Builder Agent

Spec Builder supports three modes:

1. **Interview Mode**: Conducts 6-phase interview → generates spec
2. **Template Mode**: Pre-fills template → user completes
3. **Validation Mode**: Reviews existing spec → reports completeness

### With Git/GitHub

Reference specs in PRs:

```markdown
## Specification

This PR implements the feature defined in:

- [Dark Mode Toggle Spec](../../docs/features/dark-mode-toggle/spec.md)

## Verification Checklist

All spec criteria verified:

- [x] All tests pass (100% coverage)
- [x] Lighthouse score: 95
- [x] WCAG 2.1 AA compliant
- [x] Australian context validated
- [x] Design system compliance verified
- [x] Code review passed
```

### With CI/CD

Specs validated during setup:

```bash
pnpm run verify  # Checks for spec.md completeness

pnpm run spec:validate  # Detailed validation report

# CI fails if critical spec.md is missing
if [ ! -f docs/features/$FEATURE/spec.md ]; then
    echo "ERROR: Feature spec not found"
    exit 1
fi
```

---

## Common Workflows

### Workflow 1: Adding a New Feature

```
1. User: "Let's add a print button to reports"
   ↓
2. System detects: feature request
   ↓
3. System: "Generate spec.md? [Interview/Template/Skip]"
   ↓
4. User: "Template"
   ↓
5. System creates: docs/features/print-reports/spec.md
   ↓
6. User edits template, completes all sections
   ↓
7. System validates: 92% complete ✅
   ↓
8. User: "Start implementing"
   ↓
9. Implementation with spec as guide
```

### Workflow 2: Starting a Project Phase

```
1. User: "Begin Phase 6: Multi-tenant Support"
   ↓
2. System detects: project phase
   ↓
3. System: "Phase 6 needs spec. Interview or template?"
   ↓
4. User: "Interview"
   ↓
5. Spec Builder Agent conducts 6-phase interview
   ↓
6. System creates: docs/phases/phase-6-spec.md
   ↓
7. Links spec in: PROGRESS.md Phase 6 section
   ↓
8. System validates: 98% complete ✅
   ↓
9. User: "Start Phase 6"
   ↓
10. Implementation follows spec plan
```

### Workflow 3: Completing Incomplete Spec

```
1. User: "Continue OAuth implementation"
   ↓
2. System finds: docs/features/auth-oauth/spec.md (70% complete)
   ↓
3. System: "Spec is 70% complete. Finish these: [list]"
   ↓
4. User edits spec, adds missing sections
   ↓
5. System validates: 88% complete ✅
   ↓
6. User: "Resume implementation"
   ↓
7. Uses updated spec as reference
```

---

## Best Practices

### DO ✅

- **Start with template or interview**: Don't write from scratch
- **Be specific**: Include concrete examples, not generic descriptions
- **Link to design tokens**: Reference names, not arbitrary colors
- **Include Australian context**: Every spec must have en-AU, DD/MM/YYYY, etc.
- **Verify before implementing**: Run completeness check
- **Update specs when requirements change**: Spec is source of truth
- **Reference specs in PRs**: Link to spec.md in PR description

### DON'T ❌

- **Skip spec generation**: It takes 30 minutes, saves hours of rework
- **Use vague language**: "Nice buttons" instead of "rounded buttons with shadow"
- **Forget Australian context**: Every spec must include en-AU, DD/MM/YYYY, AUD
- **Ignore design tokens**: Use token names, not arbitrary colors
- **Implement before validating**: Incomplete specs lead to rework
- **Archive specs**: Keep all specs for historical reference
- **Create custom templates**: Use project templates for consistency

---

## Troubleshooting

### Q: System keeps asking for spec.md, even for trivial fixes

**A**: For typos or formatting, use "Skip" option. System learns - future similar requests won't prompt. For logic changes, spec is required.

---

### Q: Requirements changed mid-implementation, now what?

**A**: Update spec.md first (it's source of truth), document changes with timestamp, then adjust implementation.

---

### Q: How do I make a spec private/not in git?

**A**: All specs are in git for historical reference. If truly sensitive, note in spec header and discuss with team.

---

### Q: Can I have multiple specs for one feature?

**A**: One primary spec per feature in `docs/features/[name]/spec.md`. If breaking into phases, create `phase-X-spec.md` for each major phase.

---

### Q: What if Spec Builder generates incomplete spec?

**A**: Review and add missing sections manually, then re-validate. Spec Builder focuses on thoroughness, but you're responsible for completeness.

---

### Q: How do I know if my feature is "large enough" for a phase?

**A**: Use project phase spec if:

- Affects multiple systems or teams
- Takes 2+ weeks of development
- Requires architectural changes
- Impacts core infrastructure

Otherwise use feature spec.

---

## Related Documentation

- **Templates**: `.claude/templates/README.md` - Template usage guide
- **CLAUDE.md**: Project architecture and quick start
- **PROGRESS.md**: Project phases and status tracking
- **Design Tokens**: `.claude/data/design-tokens.json` - Design system constants

---

## Support & Feedback

For issues or improvements to the spec system:

1. Check this guide for common questions
2. Review template examples
3. Consult with team architecture lead
4. Open GitHub issue with "spec:" prefix

---

**System Version**: 1.0.0
**Last Updated**: [DD/MM/YYYY]
**Created**: January 2026
