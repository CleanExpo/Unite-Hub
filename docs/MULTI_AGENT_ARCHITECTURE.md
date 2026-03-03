# Multi-Agent Architecture Specification

> **Version**: 1.0.0
> **Authority**: Project Standard
> **Locale**: en-AU (DD/MM/YYYY, AUD, AEST/AEDT)

This document defines the hierarchical multi-agent workflow architecture for AI-assisted development. All AI agents operating in projects derived from this starter must follow these protocols.

---

## 1. Overview

### 1.1 Purpose

This architecture enables structured, scalable AI agent collaboration with clear authority levels, communication protocols, and quality gates. It integrates with Linear for project management and ensures no work proceeds without proper tracking.

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Hierarchy** | Clear chain of command from Developer → PM → Orchestrator → Specialists |
| **Traceability** | Every task tracked in Linear with full audit trail |
| **Isolation** | Each specialist operates in isolated context to maximise focus |
| **Quality Gates** | No phase advances without verification |
| **Token Economy** | Sectional execution to prevent context overflow |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER                                │
│                    (Human Authority)                             │
│         Sets vision, approves plans, final decisions             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SENIOR PROJECT MANAGER                        │
│                    (Executive Level)                             │
│     Translates vision → plans, manages Linear, escalations       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                          │
│                    (Operational Command)                         │
│    Decomposes tasks, distributes work, synthesises results       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ SPECIALIST A  │   │ SPECIALIST B  │   │ SPECIALIST C  │   │ SPECIALIST D  │
│  Architecture │   │Implementation │   │   Testing     │   │ Documentation │
│    & Design   │   │   & Coding    │   │ & Validation  │   │   & Review    │
│  (Context 1)  │   │  (Context 2)  │   │  (Context 3)  │   │  (Context 4)  │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. Agent Roles and Responsibilities

### 2.1 Developer (Human Authority)

**Authority Level:** Ultimate
**Role:** Vision holder, final decision maker

**Responsibilities:**
- Define project vision and requirements
- Approve major architectural decisions
- Review and approve completed work
- Resolve escalations from PM
- Provide context and constraints

**Input Format:**
```markdown
## Developer Request
**Project:** [Name]
**Priority:** [Critical/High/Medium/Low]
**Type:** [Feature/Bug/Research/Refactor]
**Description:** [Clear description of desired outcome]
**Constraints:** [Time, resources, technical limitations]
**Success Criteria:** [Measurable outcomes]
```

---

### 2.2 Senior Project Manager

**Authority Level:** Executive
**Reports To:** Developer
**Manages:** Orchestrator Agent, Linear Integration

**Responsibilities:**
- Translate developer vision into actionable project plans
- Manage Linear board state (issues, epics, milestones)
- Monitor progress across all specialists
- Escalate blockers and decisions to Developer
- Ensure cross-agent communication integrity
- Timeline and resource management

**Required Actions:**
1. Create Linear issue for every new task within 5 minutes of receipt
2. Update Linear status on every agent state change
3. Daily summary report to Developer (if project active)
4. Weekly retrospective documentation

**Communication Protocol:**
```markdown
## PM Status Update
**Date:** [ISO 8601]
**Project:** [Name]
**Linear Issue:** [URL]
**Status:** [On Track/At Risk/Blocked]
**Completed:** [List]
**In Progress:** [List with % complete]
**Blockers:** [List with proposed solutions]
**Next Steps:** [Prioritised list]
**Developer Decision Needed:** [Yes/No - if yes, specify]
```

---

### 2.3 Orchestrator Agent

**Authority Level:** Operational Command
**Reports To:** Senior Project Manager
**Manages:** All Specialist Agents (A, B, C, D)

**Core Functions:**

#### Task Decomposition
- Break complex tasks into atomic, assignable units
- Identify dependencies between tasks
- Estimate complexity and time requirements
- Map tasks to appropriate specialists

#### Work Distribution
- Assign tasks based on specialist capability
- Balance workload across contexts
- Manage parallel execution opportunities
- Handle task reassignment when blocked

#### Results Synthesis
- Collect outputs from all specialists
- Resolve conflicts between outputs
- Merge parallel work streams
- Produce cohesive integrated output

#### Quality Control
- Define acceptance criteria per task
- Review specialist outputs against criteria
- Request revisions when standards not met
- Sign off on completed work

**Task Assignment Format:**
```markdown
## Task Assignment
**Task ID:** [ORCH-XXX]
**Assigned To:** Specialist [A/B/C/D]
**Linear Issue:** [URL]
**Priority:** [1-5]
**Dependencies:** [List of Task IDs that must complete first]
**Estimated Effort:** [Hours]
**Deadline:** [ISO 8601]

### Objective
[Clear, specific outcome expected]

### Context
[Relevant background, constraints, related work]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Deliverables
1. [Specific output 1]
2. [Specific output 2]

### Handoff Instructions
[What to do when complete, who receives output]
```

---

### 2.4 Specialist Agents

#### Specialist A: Architecture and Design (Context 1)

**Domain:** System design, technical architecture, patterns, standards

**Responsibilities:**
- System architecture documentation
- API design and contracts
- Database schema design
- Design pattern selection
- Technical decision records (ADRs)
- Dependency management strategy
- Security architecture

**Output Artifacts:**
- Architecture Decision Records (ADRs)
- System diagrams (Mermaid/PlantUML)
- API specifications (OpenAPI/GraphQL schemas)
- Database ERDs
- Component interaction diagrams
- Technical specifications

**Quality Standards:**
- All designs must include rationale
- Must consider scalability, security, maintainability
- Must reference relevant patterns/standards
- Must identify risks and mitigations

---

#### Specialist B: Implementation and Coding (Context 2)

**Domain:** Code writing, feature implementation, refactoring

**Responsibilities:**
- Feature implementation
- Bug fixes
- Code refactoring
- Performance optimisation
- Integration development
- Build configuration

**Output Artifacts:**
- Production code
- Configuration files
- Build scripts
- Migration scripts
- Code comments and inline docs

**Quality Standards:**
- Follow established style guides
- Include error handling
- No hardcoded secrets/credentials
- DRY principle adherence
- SOLID principles where applicable
- Must compile/run without errors

---

#### Specialist C: Testing and Validation (Context 3)

**Domain:** Quality assurance, testing, validation

**Responsibilities:**
- Unit test creation
- Integration test creation
- E2E test scenarios
- Performance testing
- Security testing
- Test coverage analysis
- Regression testing

**Output Artifacts:**
- Test files (unit, integration, e2e)
- Test coverage reports
- Performance benchmarks
- Security scan results
- Bug reports with reproduction steps
- Test data fixtures

**Quality Standards:**
- Minimum 80% code coverage for new code
- All critical paths tested
- Edge cases documented and tested
- Tests must be deterministic
- Clear test naming conventions

---

#### Specialist D: Review and Documentation (Context 4)

**Domain:** Code review, documentation, knowledge management

**Responsibilities:**
- Code review and feedback
- Technical documentation
- API documentation
- User guides
- README maintenance
- Changelog updates
- Knowledge base articles

**Output Artifacts:**
- Code review comments
- Technical documentation
- API documentation
- User guides
- Changelogs
- Migration guides
- Runbooks

**Quality Standards:**
- Documentation must be accurate and current
- Examples for all public APIs
- Clear, concise writing
- Proper formatting and structure
- Version tracking on all docs

---

## 3. Communication Protocols

### 3.1 Message Types

| Type | Priority | Response Time | Use Case |
|------|----------|---------------|----------|
| CRITICAL | P1 | Immediate | Production down, security breach |
| URGENT | P2 | < 1 hour | Blocking issue, deadline risk |
| STANDARD | P3 | < 4 hours | Normal task communication |
| INFO | P4 | < 24 hours | Status updates, FYI |

### 3.2 Inter-Agent Communication Format

```markdown
## Agent Message
**From:** [Agent Role]
**To:** [Agent Role]
**Type:** [CRITICAL/URGENT/STANDARD/INFO]
**Subject:** [Brief description]
**Linear Issue:** [URL if applicable]
**Thread ID:** [For conversation continuity]

### Message
[Content]

### Action Required
- [ ] [Specific action needed]

### Deadline
[ISO 8601 if applicable]
```

### 3.3 Escalation Path

```
Specialist → Orchestrator → Senior PM → Developer
     ↑______________|           |
                                ↓
                    (Returns with decision)
```

**Escalation Triggers:**
- Blocker > 2 hours with no resolution path
- Scope change request
- Resource constraint
- Technical decision with significant impact
- Conflict between specialists
- Quality standards cannot be met

---

## 4. Workflow Processes

### 4.1 Standard Task Flow

```
1. Developer provides idea/requirement
         ↓
2. Senior PM creates Linear issue, assigns to Orchestrator
         ↓
3. Orchestrator decomposes into specialist tasks
         ↓
4. Parallel assignment to Specialists (where dependencies allow)
         ↓
5. Specialists execute and report completion
         ↓
6. Orchestrator synthesises results
         ↓
7. Senior PM reviews against requirements
         ↓
8. Developer approval (if significant)
         ↓
9. Close Linear issue with summary
```

### 4.2 Parallel Execution Timeline

```
Time →

Specialist A: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
              [Design]

Specialist B: ░░░░░░░░████████████████████░░░░░░░░░░░░░░░░░░░░░░
                      [Implement A's design]

Specialist C: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░████████
                                          [Test B's code]  [Retest]

Specialist D: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
                                                        [Document]

████ = Active work
░░░░ = Waiting/Available
```

### 4.3 Dependency Management

```yaml
task_dependencies:
  architecture_design:
    blocks: [implementation, api_docs]
    blocked_by: [requirements]

  implementation:
    blocks: [testing, code_review]
    blocked_by: [architecture_design]

  testing:
    blocks: [deployment]
    blocked_by: [implementation]

  documentation:
    blocks: [deployment]
    blocked_by: [implementation, testing]
```

---

## 5. Linear Integration Specification

### 5.1 Issue Structure

**Required Labels:**
- `agent:orchestrator`, `agent:specialist-a`, `agent:specialist-b`, `agent:specialist-c`, `agent:specialist-d`
- `status:pending`, `status:in-progress`, `status:blocked`, `status:review`, `status:done`
- `priority:p1` through `priority:p4`
- `type:feature`, `type:bug`, `type:docs`, `type:research`

**Required Fields:**
- Title: `[AGENT] Brief description`
- Description: Full context and acceptance criteria
- Assignee: Current responsible agent
- Due date: Expected completion
- Parent issue: Link to epic/parent task

### 5.2 Update Frequency

| Event | Linear Action |
|-------|---------------|
| Task assigned | Create issue, set status pending |
| Work started | Update status to in-progress |
| Blocker hit | Update status to blocked, add comment |
| Review needed | Update status to review |
| Complete | Update status to done, add summary |
| Scope change | Update description, notify stakeholders |

### 5.3 Comment Standards

```markdown
## Status Update - [ISO 8601 Timestamp]
**Agent:** [Role]
**Progress:** [X%]

### Completed
- Item 1
- Item 2

### In Progress
- Item 3 (estimated completion: [time])

### Blockers
- None / [Description + proposed solution]

### Next Steps
- Action item 1
- Action item 2
```

---

## 6. Quality Gates

### 6.1 Phase Gates

| Gate | Owner | Criteria |
|------|-------|----------|
| Design Complete | Specialist A + Orchestrator | ADR approved, diagrams complete, risks documented |
| Implementation Complete | Specialist B + Orchestrator | Code compiles, linting passes, basic functionality works |
| Testing Complete | Specialist C + Orchestrator | Coverage met, all tests pass, no critical bugs |
| Documentation Complete | Specialist D + Orchestrator | Docs accurate, reviewed, published |
| Integration Complete | Orchestrator | All outputs merged, system functional |
| Final Approval | Senior PM + Developer | Meets original requirements, ready for deployment |

### 6.2 Review Checklist

```markdown
## Quality Review Checklist
**Task ID:** [ID]
**Reviewer:** [Agent]
**Date:** [ISO 8601]

### Functional
- [ ] Meets acceptance criteria
- [ ] Handles edge cases
- [ ] Error handling appropriate

### Technical
- [ ] Follows architecture guidelines
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Code style compliant

### Documentation
- [ ] Code commented appropriately
- [ ] External docs updated
- [ ] Changelog updated

### Testing
- [ ] Unit tests included
- [ ] Integration tests included (if applicable)
- [ ] All tests passing

### Result
- [ ] APPROVED
- [ ] APPROVED WITH COMMENTS
- [ ] REVISIONS REQUIRED

### Comments
[Detailed feedback]
```

---

## 7. Context Management

### 7.1 Context Window Allocation

Each specialist operates in an isolated context to maximise focus and prevent cross-contamination:

| Specialist | Context Focus | Excluded |
|------------|---------------|----------|
| A | Architecture, design docs, ADRs | Implementation details |
| B | Code, configs, dependencies | Test code, user docs |
| C | Tests, fixtures, coverage | Production code writing |
| D | Documentation, reviews | Implementation |

### 7.2 Context Handoff Protocol

When work passes between specialists:

```markdown
## Context Handoff
**From:** Specialist [X]
**To:** Specialist [Y]
**Task ID:** [ID]

### Summary of Completed Work
[Brief description]

### Key Decisions Made
1. Decision with rationale
2. Decision with rationale

### Files/Artifacts Created
- path/to/file1.ext
- path/to/file2.ext

### Assumptions
- Assumption 1
- Assumption 2

### Open Questions
- Question 1 (suggested answer)
- Question 2 (needs decision)

### Context for Next Phase
[Specific information the next specialist needs]
```

---

## 8. Conflict Resolution

### 8.1 Technical Disagreements

1. Specialists document their positions with rationale
2. Orchestrator reviews and attempts resolution
3. If unresolved, escalate to Senior PM
4. Senior PM may escalate to Developer for final decision
5. Decision documented in ADR

### 8.2 Priority Conflicts

1. Orchestrator assesses based on project goals
2. Senior PM arbitrates if needed
3. Developer has final authority

### 8.3 Resource Conflicts

1. Orchestrator redistributes work
2. Senior PM adjusts timelines if needed
3. Developer approves any deadline changes

---

## 9. Metrics and Reporting

### 9.1 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task completion rate | > 90% | Tasks done / assigned per sprint |
| Cycle time | < 48 hours | Assignment to completion |
| Blocker resolution | < 4 hours | Time blocked to unblocked |
| Rework rate | < 15% | Tasks requiring revision |
| Documentation coverage | 100% | Features with complete docs |
| Test coverage | > 80% | Code covered by tests |

### 9.2 Daily Report Format

```markdown
## Daily Status Report
**Date:** [ISO 8601]
**Project:** [Name]
**Reporting Agent:** Senior PM

### Summary
[1-2 sentence overview]

### Progress by Specialist
| Specialist | Tasks Active | Completed Today | Blocked |
|------------|--------------|-----------------|---------|
| A | X | Y | Z |
| B | X | Y | Z |
| C | X | Y | Z |
| D | X | Y | Z |

### Key Accomplishments
- Item 1
- Item 2

### Blockers & Risks
| Issue | Impact | Mitigation | Owner |
|-------|--------|------------|-------|
| | | | |

### Tomorrow's Focus
1. Priority item 1
2. Priority item 2

### Developer Attention Needed
- [ ] None
- [ ] [Specific item requiring decision]
```

---

## 10. Implementation Checklist

To adopt this architecture in your project:

- [ ] Add this document to your repository root as `docs/MULTI_AGENT_ARCHITECTURE.md`
- [ ] Reference this document in your `CLAUDE.md` / `GEMINI.md`
- [ ] Set up Linear with required labels and fields
- [ ] Create issue templates matching the formats above
- [ ] Establish communication channels for agents
- [ ] Create initial context documents for each specialist
- [ ] Define project-specific quality standards
- [ ] Set up metric tracking
- [ ] Run a pilot task through the full workflow
- [ ] Retrospective and refine

---

## Appendix A: Quick Reference Commands

For AI agents, use these trigger phrases:

```
@orchestrator decompose: [task description]
@specialist-a design: [component/feature]
@specialist-b implement: [feature/fix]
@specialist-c test: [component/feature]
@specialist-d document: [component/feature]
@pm status: [project name]
@pm escalate: [issue description]
```

---

## Appendix B: Integration with Existing Systems

This architecture integrates with the following project systems:

| System | Integration Point |
|--------|-------------------|
| **Genesis Hive Mind** | Orchestrator maps to GENESIS_DEV, specialists align with sectional execution |
| **Council of Logic** | Quality gates invoke council validation (Turing, Von Neumann, Bezier, Shannon) |
| **Beads** | All tasks sync to `.beads/` for persistence across sessions |
| **Linear** | Primary task tracking and visibility |
| **Claude Code Hooks** | SessionStart loads agent context, Stop verifies task completion |

---

## Appendix C: Australian Localisation

All communications must use:

- **Date Format**: DD/MM/YYYY (e.g., 30/01/2026)
- **Time Format**: H:MM am/pm AEST/AEDT
- **Currency**: AUD ($)
- **Spelling**: Australian English (colour, behaviour, optimisation, analyse, centre)
- **Tone**: Direct, professional, no unnecessary superlatives

---

**Document Version**: 1.0.0
**Last Updated**: 30/01/2026
**Authority**: Project Standard
