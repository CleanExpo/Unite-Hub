# Base Staff Intelligence Model

**Version**: 1.0.0
**Date**: 2025-11-26
**Applies To**: All roles under Unite-Hub Nexus
**Purpose**: Foundation intelligence layer for role-based duties, KPIs, behavioral expectations, and disciplinary processes

---

## Overview

The Staff Intelligence Model is a **hybrid human-AI governance framework** that:

1. **Defines clear expectations** for every role (duties, KPIs, behavioral standards)
2. **Enables AI agents** (Phase 5 onward) to understand what each role should be doing
3. **Supports fair performance management** through documented, consistent standards
4. **Maintains founder control** - all model changes require founder approval
5. **Respects human judgment** - thresholds are guides, not rules

The model is **not about surveillance**. It's about clarity, fairness, and alignment.

---

## Core Domains

### 1. Duties (What You Do)

Every role has a set of **duties** organized by category:

- **Core Operational**: Day-to-day responsibilities required to keep the business functioning
- **Communication & Collaboration**: How staff communicate with each other and clients
- **Strategic & Growth** (role-specific): How staff contribute to long-term goals
- **Compliance & Safety**: Legal, WHS, and security obligations

Each duty has:
- **Name & Description**: Clear statement of the responsibility
- **Frequency**: How often it's expected (daily, weekly, per-project, ongoing, etc.)
- **Expected Output**: What a completed duty looks like
- **Tools**: What systems are used to execute this duty
- **Success Criteria**: How we know it's done well

**Example Duty**:
```
ID: core_task_execution
Name: "Execute assigned work to standard"
Description: "Complete assigned tasks accurately, on time, and according to SOPs, templates, and checklists."
Frequency: daily
Expected Output: "Tasks completed in CRM with notes, attachments, and status updates."
Tools: ["CRM", "SOPLibrary", "Templates"]
Success Criteria:
  - Tasks closed with adequate notes and documentation
  - Low rework rate due to errors or missing information
  - Follows current SOP version
```

---

### 2. KPIs (How Well You Do It)

**Key Performance Indicators** measure output quality, volume, timeliness, and behavioral alignment.

Every KPI has:
- **Name & Description**: What is being measured
- **Metric Type**: percentage, count, time, currency, score, etc.
- **Target**: The ideal/expected value
- **Warning Threshold**: Early alert level
- **Critical Threshold**: Intervention required
- **Period**: How often it's assessed (daily, weekly, monthly, per-project, quarterly)
- **Weight**: Relative importance (0.0-1.0)
- **Data Source**: Where we get the numbers
- **Calculation Notes**: How the metric is computed

**Example KPI**:
```
ID: tasks_completed_on_time
Name: "Tasks Completed On Time"
Description: "Percentage of tasks completed on or before their due date."
Metric Type: percentage
Target: 90%
Warning Threshold: 80%
Critical Threshold: 70%
Period: monthly
Weight: 0.25
Data Source: CRM_tasks
Calculation Notes: "Count tasks assigned to user with status=Done and completed_at <= due_date."
```

**KPI Categories**:

#### Performance KPIs
- Tasks Completed On Time
- Rework Rate
- Output Quality Score
- Accuracy / Error Rate

#### Behavioral KPIs
- Communication Responsiveness
- Collaboration Quality
- Meeting/Deadline Adherence
- Initiative / Proactivity

#### Revenue KPIs (Sales/Agency Roles)
- Monthly New Revenue
- Pipeline Hygiene Score
- Deal Closure Rate

#### Safety/Compliance KPIs
- Safety Compliance Rate
- Incident Rate
- WHS Audit Score

---

### 3. Behavioral Expectations (How You Show Up)

Beyond duties and KPIs, the model defines **behavioral standards** that apply to all roles:

#### Standard: Respectful Conduct
- **Positive Indicators**:
  - Uses calm, professional language
  - Disagrees with ideas, not people
  - Listens before responding

- **Red Flags**:
  - Raised voice, aggressive tone, hostile language
  - Public criticism or humiliation
  - Passive-aggressive or undermining behavior

#### Standard: Ownership & Accountability
- **Positive Indicators**:
  - Flags problems early with options
  - Admits mistakes and focuses on fixes
  - Follows tasks through to resolution

- **Red Flags**:
  - Frequent blame-shifting
  - Ignoring issues hoping they disappear
  - Repeatedly dropping tasks without explanation

#### Standard: Reliability
- **Positive Indicators**:
  - Shows up on time
  - Delivers consistent quality
  - Follows through on commitments

- **Red Flags**:
  - Chronic lateness or absenteeism
  - Inconsistent quality
  - Breaking commitments without communication

#### Standard: Growth Mindset
- **Positive Indicators**:
  - Seeks feedback and acts on it
  - Learns from mistakes
  - Proactively upskills

- **Red Flags**:
  - Defensive about feedback
  - Repeats same mistakes
  - Stagnant skill development

---

### 4. Disciplinary Process (How We Address Issues)

The model defines a **5-level disciplinary framework** that is fair, proportionate, and documented:

#### Level 0: Coaching Conversation
**When**: First-time minor breach, isolation confusion about expectations
**How**: Private conversation, clarify expectations, document summary in HR notes
**Timeline**: Immediate

#### Level 1: Written Warning
**When**: Repeated breaches after Level 0, pattern of minor behavior issues
**How**: Written notice outlining issues, meeting with staff, recorded acknowledgement
**Timeline**: 1-2 weeks

#### Level 2: Performance Improvement Plan (PIP)
**When**: Sustained underperformance, failure to respond to Level 1
**How**: Structured plan with clear targets, support, and review points (30/60/90 days)
**Timeline**: 30-90 days

#### Level 3: Final Warning
**When**: Serious incident or failure of PIP without improvement
**How**: Formal letter, meeting with clear expectations, final review before termination
**Timeline**: 1-2 weeks

#### Level 4: Termination
**When**: Gross misconduct or persistent failure after prior steps
**How**: HR/Legal review, termination letter, exit meeting, asset recovery
**Timeline**: Immediate to 1 week

---

### 5. Compliance Obligations

All staff must comply with:

#### Confidentiality & Privacy
- Protect client data and internal documents
- Don't share details outside authorized tools
- Follow data retention and deletion policies

#### Work Health & Safety (WHS)
- Use required PPE in field work
- Report hazards and incidents promptly
- Follow risk assessments and SWMS

#### Ethical Conduct
- Honest communication with clients and team
- No misrepresentation of capabilities or results
- Respect intellectual property and confidentiality

---

## Reporting Structure

Every role has a defined reporting structure:

- **Line Manager**: Daily management, task assignment, support
- **Performance Reviewer**: Monthly/quarterly performance reviews, KPI assessment
- **HR Escalation**: Behavioral issues, complaints, disciplinary escalation
- **Safety Escalation**: WHS incidents, hazard reports

**Default**:
- Most staff report to Operations Manager
- Operations Manager reports to Founder/CEO
- Founder/CEO has board/advisor for accountability

---

## Role Specifications

This base model is **extended by role-specific specifications** that add:
- Additional role-specific duties
- Additional role-specific KPIs
- Unique behavioral expectations
- Custom reporting structures

See `docs/ROLE_SPECIFICATIONS/` for:
- `founder_ceo.md` - Vision, AI orchestration, strategic execution
- `operations_manager.md` - Resource planning, SOP enforcement, team KPIs
- `admin_brand_ops.md` - Communication triage, brand asset management
- `sales_rep.md` - Pipeline management, discovery calls, revenue targets
- `technician_field.md` - Safety checks, job documentation, quality

---

## Integration with AI Agents (Phase 5)

Phase 5 agents (Email, Content, Research, Scheduling, Analysis, Coordination) will use the Staff Intelligence Model to:

1. **Understand what each role is responsible for** (duties)
2. **Know what good performance looks like** (KPIs)
3. **Respect behavioral standards** when delegating tasks
4. **Support performance management** by flagging KPI breaches early
5. **Enable fair, consistent feedback** based on documented standards

**Example**: The Coordination Agent, when assigning a task to a Sales Rep, knows:
- Sales Rep's primary duty is Pipeline Management
- Target KPI is Monthly New Revenue (target: $10K)
- This task contributes to the Pipeline Management duty
- If Sales Rep is below KPI threshold, Coordination Agent flags for Operations Manager review

---

## Updating the Model

The Staff Intelligence Model is **not static**. It evolves as the business grows:

### Change Process
1. **Proposed Change**: Operations Manager or Founder identifies need
2. **Consultation**: Relevant staff provide input on proposed change
3. **Founder Approval**: Founder reviews and approves
4. **Documentation Update**: Model documents are updated
5. **Communication**: All staff notified of changes
6. **Implementation**: New model takes effect with clear effective date

### Version Control
- Every change is versioned and dated
- Historical versions are archived in git
- Current version is canonical (docs/BASE_STAFF_INTELLIGENCE_MODEL.md)

---

## Key Principles

1. **Clarity**: Every expectation is written, not implied
2. **Fairness**: Same standards apply to all staff in the same role
3. **Transparency**: Staff can see their duties, KPIs, and expectations
4. **Proportionality**: Consequences match the seriousness of issues
5. **Development**: Model supports growth, not just punishment
6. **Respect for Humans**: AI agents support human managers, not replace them
7. **Founder Control**: All major changes require founder approval

---

## FAQ

**Q: Is this surveillance?**
A: No. The model defines expectations clearly so everyone knows what "good" looks like. Transparent expectations are fairer than ambiguous ones.

**Q: Do KPI thresholds automatically trigger discipline?**
A: No. Thresholds are guides for conversations, not automatic triggers. Context matters. A one-time miss is different from chronic underperformance.

**Q: Can staff push back on KPIs?**
A: Yes. KPIs should be realistic and fair. If a staff member believes a target is unachievable, they can raise it with their manager and the Operations Manager.

**Q: What if someone disagrees with the model?**
A: They can raise concerns with Operations Manager or Founder. Changes go through the formal change process.

**Q: How does this relate to AI agents?**
A: Agents use the model to understand roles and provide fair, consistent support. Agents flag issues early so humans can make decisions, not the other way around.

---

**Last Updated**: 2025-11-26
**Author**: Claude Code
**Status**: Ready for Implementation (Phase 5)
**Next Review**: 2026-02-26 (3 months)
