# Unite-Hub Organization Architecture

**Version**: 1.0.0
**Date**: 2025-11-26
**Status**: Foundational Documentation

---

## Overview

This document synthesizes the organizational architecture, staff intelligence model, and role specifications for Unite-Hub Nexus.

The organization operates on a **hybrid human-AI governance framework** where:

1. **Humans make decisions** within clear boundaries and with clear expectations
2. **AI agents provide support** by understanding roles and flagging issues early
3. **Founder maintains control** through explicit approval gates and truth layer enforcement
4. **Fair, transparent standards** apply consistently across all roles

---

## Organizational Structure

```
┌─────────────────────────────────────────┐
│        Founder / CEO                    │
│  (Vision, AI Oversight, Truth Layer)    │
└────────────┬────────────────────────────┘
             │
             ├─→ Board/Advisors (strategic counsel)
             ├─→ Finance/Legal (compliance)
             └─→ Operations Manager
                    │
                    ├─→ Sales Rep(s)
                    ├─→ Admin/Brand Ops
                    ├─→ Field Technician(s)
                    └─→ Specialists (as organization grows)
```

---

## Role Hierarchy & Responsibilities

### Tier 1: Founder / CEO
**Reports To**: Board/trusted advisors
**Responsibilities**:
- Strategic direction and roadmap
- AI/automation policy and oversight
- Truth layer enforcement (all public claims)
- Final approval on major decisions
- Personnel decisions

**See**: [docs/ROLE_SPECIFICATIONS/founder_ceo.md](ROLE_SPECIFICATIONS/founder_ceo.md)

### Tier 2: Operations Manager
**Reports To**: Founder/CEO
**Responsibilities**:
- Day-to-day execution and team management
- Resource allocation and capacity planning
- Process enforcement and continuous improvement
- Team KPI tracking and development
- Operational incident resolution

**See**: [docs/ROLE_SPECIFICATIONS/operations_manager.md](ROLE_SPECIFICATIONS/operations_manager.md)

### Tier 3: Operational Staff

#### Sales Representative
**Reports To**: Operations Manager (Sales Lead)
**Responsibilities**:
- Pipeline management and new business development
- Discovery calls and qualification
- Proposal development and negotiation
- Revenue target achievement

**See**: [docs/ROLE_SPECIFICATIONS/sales_rep.md](ROLE_SPECIFICATIONS/sales_rep.md)

#### Admin / Brand & Operations Support
**Reports To**: Operations Manager
**Responsibilities**:
- Communication triage and SLA management
- Brand asset library management
- Calendar and scheduling
- Documentation and knowledge base

**See**: [docs/ROLE_SPECIFICATIONS/admin_brand_ops.md](ROLE_SPECIFICATIONS/admin_brand_ops.md)

#### Field Technician
**Reports To**: Operations Manager
**Responsibilities**:
- On-site safety checks and compliance
- Job documentation and quality
- Client communication and satisfaction
- Professional workmanship

**See**: [docs/ROLE_SPECIFICATIONS/technician_field.md](ROLE_SPECIFICATIONS/technician_field.md)

---

## Staff Intelligence Model

The **Staff Intelligence Model** provides the governance framework for all roles:

### Base Model (All Roles)
Every staff member is expected to:

**Duties**:
- Plan daily/weekly work
- Execute work to standard (using current SOPs)
- Provide timely updates
- Maintain respectful conduct
- Take ownership & accountability

**KPIs** (role-specific):
- Tasks Completed On Time
- Rework Rate
- Communication Responsiveness
- Initiative/Proactivity

**Behavioral Standards**:
- Respectful Conduct
- Ownership & Accountability
- Reliability
- Growth Mindset

**Compliance**:
- Confidentiality & Privacy
- Work Health & Safety (WHS)
- Ethical Conduct

**Disciplinary Process** (5 levels):
0. Coaching Conversation
1. Written Warning
2. Performance Improvement Plan
3. Final Warning
4. Termination

**See**: [docs/BASE_STAFF_INTELLIGENCE_MODEL.md](BASE_STAFF_INTELLIGENCE_MODEL.md)

### Role-Specific Extensions
Each role extends the base model with:
- Additional role-specific duties
- Additional role-specific KPIs
- Custom behavioral expectations
- Unique reporting structures

---

## Phase V1.1 Architecture

Phase V1.1 introduces the **Founders Autonomous Agency & Growth Layer** while maintaining human oversight:

### V1.1 Subphases (in order)

1. **v1_1_02: Brand Matrix** - Organize all brands, positioning, cross-linking rules
2. **v1_1_01: Founder Ops Hub** - Centralized task management for founder
3. **v1_1_03: Topic & Trend Discovery** - Data-driven topic identification
4. **v1_1_04: Multi-Channel Blueprint Builder** - Topic → multi-channel campaigns
5. **v1_1_06: Trial Refinement** - Improved 14-day trial experience
6. **v1_1_05: Loyalty & Referrals** - Customer incentive programs
7. **v1_1_07: Search Console Integration** - Analytics data consolidation
8. **v1_1_08: Desktop Agent Hooks** - Future extensibility

**See**: [docs/PHASE_V1_1_SPECIFICATION.md](PHASE_V1_1_SPECIFICATION.md)

---

## AI Integration (Phase 5 Onward)

Phase 5 introduces **specialized agents** that work within the Staff Intelligence framework:

- **Email Agent** - Process, analyze, and draft email responses
- **Content Agent** - Generate personalized marketing content
- **Research Agent** - Gather market intelligence and trends
- **Scheduling Agent** - Manage calendars and meetings
- **Analysis Agent** - Analyze KPIs and performance data
- **Coordination Agent** - Orchestrate multi-agent workflows

**Key Principle**: Agents understand roles, duties, and KPIs so they can:
- Assign tasks to the right people
- Know what good performance looks like
- Flag issues early for human review
- Support (not replace) human managers

---

## Decision Rights Matrix

| Decision | Authority | Consultation | Approval | Review |
|----------|-----------|--------------|----------|--------|
| Day-to-day task assignment | Ops Manager | Staff input | - | Weekly |
| Process changes | Ops Manager | Affected staff | Founder | Monthly |
| Hiring/Firing | Ops Manager | Interview input | Founder (final) | Case-by-case |
| AI policy changes | - | Tech lead | Founder | Quarterly |
| Public claims/truth layer | - | Marketing | Founder (final) | Before publish |
| Budget allocation | Ops Manager | Department heads | Founder | Quarterly |
| Strategic direction | - | All staff input | Founder (final) | Quarterly |
| KPI targets | Ops Manager | Staff feedback | Founder approval | Annual |

---

## Communication & Accountability Flows

### Daily / Weekly
- **Staff → Ops Manager**: Status updates, blockers, accomplishments (daily standup or CRM notes)
- **Ops Manager → Staff**: Feedback, coaching, priority clarification
- **Ops Manager → Founder**: Weekly operational summary, escalations

### Monthly
- **All Staff → Performance Reviews**: Self-assessment against KPIs
- **Ops Manager → All Staff**: Feedback, progress vs targets
- **Founder → Ops Manager**: Strategic guidance, priority shifts

### Quarterly
- **All Org → Founder**: Strategic review, roadmap discussion
- **Founder → All Org**: Quarterly address, strategy update
- **Founder → Board**: Governance and oversight report

### As Needed
- **Escalations**: Issues requiring immediate founder attention
- **AI policy reviews**: Changes to automation or agent scope
- **Truth layer audits**: Spot checks of public claims

---

## Key Governance Principles

### 1. Clarity Over Ambiguity
- All expectations are written, not implied
- Role specifications are explicit and specific
- Success criteria are measurable and communicated

### 2. Fairness & Consistency
- Same standards apply to all staff in same role
- Performance management is transparent and documented
- Consequences are proportionate to issues

### 3. Founder Control
- Founder approves major policy and AI/automation changes
- Truth layer enforcement is non-delegable
- Final authority on strategic direction and personnel

### 4. AI Support, Not Replacement
- Agents support human managers, not replace them
- Founder makes final decisions on AI policy
- Safety constraints are auditable and enforced

### 5. Respect for Humans
- Staff are not surveilled but supported
- Development is prioritized over punishment
- Context matters in performance management

---

## KPI Philosophy

KPIs in this organization:

- **Measure what matters** - Revenue, quality, safety, and team health
- **Drive good behavior** - KPIs incentivize actions aligned with values
- **Support development** - KPIs identify where staff need support
- **Enable fair feedback** - Standards are documented, not subjective
- **Are reviewed regularly** - KPIs evolve with the business

KPIs are **NOT**:
- Surveillance tools
- Automatic triggers for discipline
- Immutable forever
- One-way judgment mechanisms

---

## Evolution & Change Management

The organization architecture is **not static**. It evolves as the business grows:

### Change Process for Model Updates
1. **Need Identification** - Ops Manager or Founder identifies change need
2. **Consultation** - Affected staff provide input
3. **Founder Approval** - Founder reviews and approves
4. **Documentation** - Models and specs are updated with version and date
5. **Communication** - All staff notified of changes with effective date
6. **Implementation** - New model takes effect

### Version Control
- Every change is dated and versioned
- Historical versions are archived in git
- Current version is canonical in docs/

---

## Success Metrics for the Organization

The organization succeeds when:

1. **Team Health**: Staff feel supported, treated fairly, and can articulate expectations
2. **KPI Achievement**: Teams consistently hit targets with high quality
3. **Autonomy**: Founder can focus on strategy, not day-to-day operations
4. **Innovation**: Staff feel safe proposing improvements and learning
5. **Retention**: High-performing staff stay and grow with the company
6. **Brand**: All public claims are truthful and substantiated
7. **Safety**: No avoidable incidents; WHS compliance is strong

---

## Related Documentation

- **Base Model**: [docs/BASE_STAFF_INTELLIGENCE_MODEL.md](BASE_STAFF_INTELLIGENCE_MODEL.md)
- **Phase V1.1 Spec**: [docs/PHASE_V1_1_SPECIFICATION.md](PHASE_V1_1_SPECIFICATION.md)
- **Role Specs**: [docs/ROLE_SPECIFICATIONS/](ROLE_SPECIFICATIONS/)
  - [Founder/CEO](ROLE_SPECIFICATIONS/founder_ceo.md)
  - [Operations Manager](ROLE_SPECIFICATIONS/operations_manager.md)
  - [Admin/Brand Ops](ROLE_SPECIFICATIONS/admin_brand_ops.md)
  - [Sales Rep](ROLE_SPECIFICATIONS/sales_rep.md)
  - [Field Technician](ROLE_SPECIFICATIONS/technician_field.md)
- **Phase 4 Executive Summary**: [docs/EXECUTION_ENGINE_OVERVIEW.md](EXECUTION_ENGINE_OVERVIEW.md) (to be created)

---

**Last Updated**: 2025-11-26
**Status**: Active
**Next Review**: 2026-02-26 (3 months)
**Maintained By**: Founder/CEO with support from Ops Manager
