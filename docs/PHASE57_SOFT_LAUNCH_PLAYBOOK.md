# Phase 57: Soft Launch Playbook

**Generated**: 2025-11-23
**Status**: ✅ Complete
**Purpose**: Controlled rollout framework for first 1-5 clients

---

## Executive Summary

Phase 57 establishes the **Soft Launch Control System** - a comprehensive framework for safely onboarding the first 1-5 clients through Unite-Hub's 90-day activation program.

### Key Principles

1. **Controlled Capacity**: Maximum 5 clients during soft launch
2. **Founder Gates**: Manual approval checkpoints at critical milestones
3. **Kill Switches**: Per-client feature toggles for immediate intervention
4. **Truth Layer**: All dashboards show real data only, no projections
5. **Risk Monitoring**: Automated risk assessment with manual review

---

## Client Rollout States

| State | Description | Duration | Exit Criteria |
|-------|-------------|----------|---------------|
| `invited` | Client received access invite | 1-3 days | Accept invite |
| `trial_active` | 14-day guided trial period | 14 days | Complete trial, decide to activate |
| `activation_active` | 90-day activation program | 90 days | Complete milestones |
| `stabilized` | Self-sustaining client | Ongoing | N/A |
| `paused` | Temporarily stopped | Variable | Resume or churn |
| `churned` | Left platform | Terminal | N/A |

---

## Founder Gates

### Gate 1: Technical Ready
**Timing**: Before trial start
**Criteria**:
- [ ] Workspace created and configured
- [ ] Email integration connected (Gmail OAuth)
- [ ] AI services configured and tested
- [ ] First batch of contacts imported
- [ ] Feature flags set appropriately

### Gate 2: Strategy Ready
**Timing**: Days 1-3 of trial
**Criteria**:
- [ ] First strategy pack generated
- [ ] Founder reviewed strategy pack quality
- [ ] Client industry context captured
- [ ] Initial KPIs baselined

### Gate 3: Activation Program Started
**Timing**: Day 14 (end of trial)
**Criteria**:
- [ ] Trial review completed
- [ ] Client signed off on expectations
- [ ] 90-day timeline document shared
- [ ] First month milestones set

### Gate 4: First 7 Days Reviewed
**Timing**: Day 7 of trial
**Criteria**:
- [ ] Week 1 check-in call completed
- [ ] Any technical issues resolved
- [ ] Client feedback captured
- [ ] Adjustments made if needed

### Gate 5: Day 14 Checkpoint
**Timing**: Day 14 (trial end)
**Criteria**:
- [ ] Trial completion review done
- [ ] Go/no-go decision made
- [ ] If no-go, feedback documented
- [ ] If go, activation started

### Gate 6: Day 30 Checkpoint
**Timing**: Day 30 of activation
**Criteria**:
- [ ] Month 1 milestones reviewed
- [ ] Content approval rates checked
- [ ] Platform engagement assessed
- [ ] Next month focus defined

### Gate 7: Day 60 Checkpoint
**Timing**: Day 60 of activation
**Criteria**:
- [ ] Month 2 progress reviewed
- [ ] Momentum score trending
- [ ] Any course corrections made
- [ ] Pre-graduation planning started

### Gate 8: Day 90 Graduation
**Timing**: Day 90 of activation
**Criteria**:
- [ ] Full program completed
- [ ] Transformation metrics captured
- [ ] Client moved to stabilized state
- [ ] Success story documented (if client agrees)

---

## KPI Targets

### Time-to-Value Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Time to First Value | < 24 hours | First login to first useful action |
| Time to First Strategy Pack | < 72 hours | Account creation to first pack review |
| Time to First Visual | < 168 hours | Account creation to first generated image |
| Time to First Approved Task | < 336 hours | Account creation to first approved production item |

### Engagement Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Trial Completion Rate | > 80% | Clients completing 14-day trial |
| Day 30 Engagement Score | > 70 | Composite of logins, actions, approvals |
| Day 60 Momentum Score | > 75 | Trending engagement and output |
| Day 90 Transformation Score | > 80 | Overall success measurement |

### Activity Metrics

| KPI | Warning Threshold | Critical Threshold |
|-----|-------------------|-------------------|
| Days Since Last Activity | 3 days | 7 days |
| Logins Last 7 Days | < 3 | 0 |
| Content Approval Rate | < 50% | < 25% |

---

## Risk Assessment

### Automatic Risk Scoring

Risk scores are calculated based on:
- Momentum score (below 40 = +2 risk, below 60 = +1 risk)
- Days inactive (3+ days = +1 risk, 7+ days = +3 risk)
- No logins in past week = +2 risk
- Content generated but not approved = +1 risk
- Missing expected gates = +1 per gate

### Risk Levels

| Level | Score | Action Required |
|-------|-------|-----------------|
| Low | 0 | Normal monitoring |
| Medium | 1-2 | Review in weekly digest |
| High | 3-4 | Proactive outreach |
| Critical | 5+ | Immediate intervention |

### Risk Flags

Common flags that indicate attention needed:
- "Low momentum score"
- "Inactive for X days"
- "No logins in past week"
- "Content generated but not approved"
- "Missing gates: ..."

---

## Client Onboarding Checklist

### Pre-Onboarding (Before Invite)

- [ ] Confirm client is a good fit for soft launch
- [ ] Review client industry and business type
- [ ] Explain 90-day timeline and set expectations
- [ ] Prepare workspace with appropriate settings
- [ ] Generate first strategy pack draft
- [ ] Brief team on new client context

### Day 1: Welcome

- [ ] Send welcome email with login credentials
- [ ] Schedule onboarding call (30-60 minutes)
- [ ] Walk through platform interface
- [ ] Connect email integration (Gmail OAuth)
- [ ] Import initial contacts
- [ ] Review first strategy pack together

### Days 2-7: Foundation

- [ ] Client explores platform independently
- [ ] Generate first content pieces
- [ ] Review and approve initial outputs
- [ ] Capture any friction or questions
- [ ] Day 7: Week 1 check-in call

### Days 8-14: Trial Completion

- [ ] Client gains proficiency with core features
- [ ] Multiple content generation cycles
- [ ] Build approval habits
- [ ] Day 14: Trial completion review call
- [ ] Make activation decision

### Days 15-30: Activation Month 1

- [ ] Start 90-day activation program
- [ ] Set month 1 milestones
- [ ] Weekly production cycles begin
- [ ] Monitor momentum and engagement
- [ ] Day 30: Month 1 review

### Days 31-60: Activation Month 2

- [ ] Increase production cadence
- [ ] Refine strategies based on data
- [ ] Client becoming self-sufficient
- [ ] Monitor for plateau or drop-off
- [ ] Day 60: Month 2 review

### Days 61-90: Activation Month 3

- [ ] Full production velocity
- [ ] Minimal founder intervention needed
- [ ] Prepare graduation summary
- [ ] Document outcomes and learnings
- [ ] Day 90: Graduation review

---

## Communication Cadence

### Daily: Client Heartbeat

Automated monitoring of:
- Login activity
- Actions taken
- Content generated/approved
- Risk flag changes

### Weekly: Founder Digest

Report includes:
- All client status summary
- Risk flags requiring attention
- Upcoming checkpoints
- KPI trends

### Per-Client: Milestone Communications

| Milestone | Communication |
|-----------|---------------|
| Day 1 | Welcome + onboarding call |
| Day 7 | Week 1 check-in call |
| Day 14 | Trial review call |
| Day 30 | Month 1 review call |
| Day 60 | Month 2 review call |
| Day 90 | Graduation call |

---

## Kill Switch Protocol

### Per-Client Kill Switch

Each client has an individual kill switch that:
- Pauses all AI generation for that client
- Pauses production job execution
- Blocks new content creation
- Does NOT affect data access or login

### When to Use Kill Switch

- Client explicitly requests pause
- Critical risk flags unresolved
- Billing or contractual issues
- Technical issues affecting client data
- Client behavior violating terms

### Kill Switch Process

1. Log reason for activation in notes
2. Notify client immediately
3. Schedule resolution call
4. Keep kill switch active until resolved
5. Document resolution and reactivate

---

## Founder Dashboard: `/founder/dashboard/soft-launch`

### Overview Tab

- Soft Launch Tracker widget
- Capacity usage (X/5 clients)
- State distribution
- Risk distribution
- Average momentum score

### Readiness Tab

- System readiness checks
- Database connection
- Auth system
- Email service
- AI service
- Feature flags
- Truth layer

### KPIs Tab

- All KPI targets displayed
- Current performance vs targets
- Trend indicators

### Checklist Tab

- Interactive onboarding checklist
- Pre-onboarding items
- Trial period items
- Activation items

---

## Truth Layer Compliance

### Dashboard Requirements

- Show only real, measured data
- No projections or forecasts
- No "potential" or "estimated" metrics
- All AI content marked as draft until approved
- Clear labeling of data sources

### Client Communication Requirements

- No guaranteed results language
- Realistic 90-day timeline emphasized
- Effort required clearly stated
- Success defined as engagement, not outcomes
- GST-inclusive pricing in Australia

### Required Disclosures per Client

1. "Results take time - typically 90+ days for meaningful traction"
2. "AI content requires your approval before use"
3. "Your engagement determines your momentum score"
4. "We measure activity and effort, not business outcomes"

---

## Files Created (Phase 57)

### Services

1. `src/lib/launch/controlledRolloutService.ts` - Core rollout management

### UI Components

2. `src/ui/components/SoftLaunchTracker.tsx` - Client monitoring widget

### Pages

3. `src/app/founder/dashboard/soft-launch/page.tsx` - Founder dashboard

### Documentation

4. `docs/PHASE57_SOFT_LAUNCH_PLAYBOOK.md` - This playbook

---

## Launch Readiness Checklist

### Technical Readiness

- [x] Database migrations applied (119-121)
- [x] Auth system functional
- [x] Email service configured
- [x] AI providers configured
- [x] Feature flags system active
- [x] Truth layer audit system active

### Operational Readiness

- [ ] Founder trained on soft-launch dashboard
- [ ] Client communication templates ready
- [ ] Onboarding call script prepared
- [ ] Support escalation path defined
- [ ] Weekly review process established

### Content Readiness

- [ ] First strategy pack templates refined
- [ ] Training modules seeded
- [ ] Production recipes tested
- [ ] Email templates reviewed

### Safety Readiness

- [x] Kill switches available per client
- [x] Risk monitoring automated
- [x] Truth layer compliance verified
- [x] No fake testimonials or case studies

---

## Post-Launch Monitoring

### Daily Checks

- Review client heartbeat data
- Check for risk flag changes
- Respond to any critical flags

### Weekly Reviews

- Generate founder digest
- Review all client states
- Plan upcoming checkpoints
- Adjust strategies as needed

### Monthly Analysis

- Aggregate KPI performance
- Identify patterns across clients
- Update playbook based on learnings
- Refine onboarding process

---

## Conclusion

Phase 57 provides the complete framework for Unite-Hub's soft launch. With controlled capacity (5 clients), founder gates at critical milestones, per-client kill switches, and comprehensive monitoring, the platform can safely onboard its first clients while maintaining truth-layer principles.

**Next Steps**:
1. Complete operational readiness items
2. Prepare first client invite
3. Execute Day 1 onboarding
4. Monitor and iterate based on feedback

**Remember**: Real marketing results take time - typically 90+ days for meaningful traction. This soft launch is about learning and refining, not proving instant results.

---

*Playbook generated by Phase 57 Soft Launch Control System*
