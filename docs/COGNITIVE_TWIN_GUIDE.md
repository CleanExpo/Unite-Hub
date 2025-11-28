# Cognitive Twin Guide - 13-Domain Health Scoring

**Purpose**: Monitor business health across 13 critical domains
**Status**: Production-Ready
**Last Updated**: 2025-11-28

---

## Table of Contents

1. [What is Cognitive Twin?](#what-is-cognitive-twin)
2. [The 13 Domains](#the-13-domains)
3. [Health Scoring Methodology](#health-scoring-methodology)
4. [Digest Types and Schedules](#digest-types-and-schedules)
5. [Decision Simulation Workflow](#decision-simulation-workflow)
6. [Interpreting Scores](#interpreting-scores)
7. [Taking Action](#taking-action)
8. [Examples](#examples)

---

## What is Cognitive Twin?

### Definition

**Cognitive Twin** is an AI-powered system that monitors the health of your business across 13 critical domains, provides insights into what's driving change, and helps you simulate decisions before making them.

Think of it as a **health monitoring system for your business** - like how a doctor monitors your physical health across multiple dimensions (heart, lungs, brain, etc.), Cognitive Twin monitors your business health across strategic dimensions (sales, product, team, finance, etc.).

### Why 13 Domains?

```
One score doesn't capture business health. Example:

Company A: "Our business is healthy!"
But really:
✓ Sales: Excellent (strong revenue)
✗ Product: Failing (high churn)
✗ Finance: Critical (3 months runway)
✓ Team: Strong (low attrition)

Cognitive Twin reveals the REAL picture by scoring all 13 domains.
```

### Key Capabilities

1. **Health Scoring**: 0-100 score per domain
2. **Momentum Detection**: Is each domain improving or declining?
3. **Risk Identification**: What could go wrong in each domain?
4. **Opportunity Discovery**: What could we capitalize on?
5. **Decision Simulation**: What if we hired? Raised prices? Pivoted?
6. **Digest Generation**: Automated summary of all domains

---

## The 13 Domains

### 1. Marketing

**Measures**: Brand awareness, demand generation, pipeline quality

**Key Metrics**:
- Brand mentions and search volume
- Website traffic and conversion rate
- Marketing-qualified leads (MQLs)
- CAC (Customer Acquisition Cost)
- CAC payback period

**Healthy Score (75+)**:
```
✓ Brand searches growing 20%+ YOY
✓ Website traffic up 15%+ YOY
✓ CAC payback < 12 months
✓ MQL volume consistent/growing
✓ Content performing well
```

**Risks (0-40)**:
```
⚠ CAC increasing while revenue flat
⚠ Website traffic declining
⚠ No brand awareness growth
⚠ Quality of leads declining
⚠ Marketing efficiency declining
```

**Action Items**:
- Audit marketing channels (which are ROI-positive?)
- Test new channels (LinkedIn, content, partnerships)
- Improve conversion funnel (landing page, sales enablement)
- Build brand awareness (thought leadership, PR)

---

### 2. Sales

**Measures**: Pipeline health, deal velocity, team productivity

**Key Metrics**:
- Sales pipeline (opportunities in stage)
- Win rate (% of deals that close)
- Average deal size
- Sales cycle length
- Sales team capacity

**Healthy Score (75+)**:
```
✓ Pipeline 3-5x quarterly revenue target
✓ Win rate stable/improving (35-50%)
✓ Deal size growing (better customers)
✓ Sales cycle consistent/shortening
✓ Team at 100% capacity
```

**Risks (0-40)**:
```
⚠ Pipeline depleting (< 2x target)
⚠ Win rate declining (losing more deals)
⚠ Sales cycle lengthening (slower closes)
⚠ Team under-capacity (not enough reps)
⚠ Top performers leaving
```

**Action Items**:
- Review lost deals (why did customers choose competitors?)
- Audit sales process (can we shorten cycle?)
- Improve qualification (focus on right-fit customers)
- Increase pipeline (get more qualified leads)
- Train team (improve win rate)

---

### 3. Delivery

**Measures**: Project delivery quality, client success, satisfaction

**Key Metrics**:
- Project on-time delivery rate
- Client satisfaction (NPS/CSAT)
- Implementation time to value
- Support ticket volume and resolution time
- Client expansion/upsell rate

**Healthy Score (75+)**:
```
✓ 95%+ of projects on-time
✓ NPS > 50 (promoters > detractors)
✓ Time-to-value < 30 days
✓ Support response < 4 hours
✓ 30%+ of customers expand
```

**Risks (0-40)**:
```
⚠ Projects slipping (missed deadlines)
⚠ NPS declining or < 30
⚠ Long implementation (> 60 days)
⚠ Support overloaded
⚠ No expansion happening
```

**Action Items**:
- Root cause analysis (why projects slip?)
- Improve delivery process (playbooks, checklists)
- Increase customer success (proactive check-ins, training)
- Reduce implementation time (pre-built templates, automation)
- Build expansion program (upsell motion)

---

### 4. Product

**Measures**: Product-market fit, feature adoption, technical health

**Key Metrics**:
- Feature adoption rate
- User engagement (DAU/MAU)
- Bug/stability metrics
- Technical debt level
- Product roadmap alignment

**Healthy Score (75+)**:
```
✓ 80%+ of users use core feature
✓ DAU/MAU ratio > 30% (daily engagement)
✓ Uptime > 99.5%
✓ Bug fix SLA met
✓ Tech debt under control
```

**Risks (0-40)**:
```
⚠ Low feature adoption (users not engaging)
⚠ Declining MAU (users leaving)
⚠ Frequent outages (< 99.5% uptime)
⚠ High bug rate
⚠ Tech debt overwhelming
```

**Action Items**:
- Improve onboarding (help users discover value faster)
- User research (why aren't people using features?)
- Reduce friction (improve UX for core flow)
- Stabilize platform (fix bugs, improve uptime)
- Address tech debt (allocate 20-30% sprint capacity)

---

### 5. Clients

**Measures**: Customer retention, expansion, satisfaction

**Key Metrics**:
- Monthly churn rate
- Customer lifetime value (LTV)
- Net revenue retention (NRR)
- Customer health scores
- Expansion revenue

**Healthy Score (75+)**:
```
✓ Monthly churn < 3%
✓ LTV > 3x CAC
✓ NRR > 120% (growth from existing)
✓ 80%+ customers healthy
✓ Expansion revenue growing
```

**Risks (0-40)**:
```
⚠ Churn > 5%
⚠ LTV approaching CAC
⚠ NRR < 100% (not growing)
⚠ Customers dissatisfied
⚠ No expansion happening
```

**Action Items**:
- Churn analysis (which customer segments churn most?)
- Improve value delivery (faster time-to-value)
- Increase engagement (regular check-ins, training)
- Build health program (proactive support, success stories)
- Create expansion motion (upsell, cross-sell)

---

### 6. Engineering

**Measures**: Development velocity, code quality, team capability

**Key Metrics**:
- Development velocity (features/sprint)
- Code quality (test coverage, bugs)
- Deployment frequency
- Incident response time
- Engineering hiring/retention

**Healthy Score (75+)**:
```
✓ Velocity stable/increasing
✓ Test coverage > 70%
✓ Deploy weekly+ (rapid iteration)
✓ Incident resolution < 2 hours
✓ Low attrition (90%+ team stable)
```

**Risks (0-40)**:
```
⚠ Velocity declining
⚠ Tech debt high (velocity hampered)
⚠ Frequent bugs (low coverage)
⚠ Deployment slow (monthly or less)
⚠ Top engineers leaving
```

**Action Items**:
- Reduce tech debt (carve out sprint time)
- Improve testing (increase coverage from X% to 70%+)
- Streamline deployment (CI/CD improvements)
- Mentorship program (help junior engineers grow)
- Competitive compensation (retain talent)

---

### 7. Finance

**Measures**: Profitability, cash flow, unit economics

**Key Metrics**:
- Monthly Recurring Revenue (MRR)
- Gross margin
- Cash runway
- CAC payback
- Burn rate

**Healthy Score (75+)**:
```
✓ MRR growing 10%+ MOM
✓ Gross margin > 70%
✓ Runway > 18 months
✓ CAC payback < 12 months
✓ Burn rate declining or stable
```

**Risks (0-40)**:
```
⚠ MRR flat/declining
⚠ Gross margin < 50%
⚠ Runway < 6 months (immediate action needed)
⚠ CAC payback > 18 months
⚠ Burn accelerating
```

**Action Items**:
- Unit economics audit (which customers are profitable?)
- Pricing optimization (increase ASP or reduce churn)
- Cost reduction (cloud optimization, process improvements)
- Fundraising (if runway < 12 months)
- Profitability roadmap (path to positive unit economics)

---

### 8. Founder

**Measures**: Your personal capacity, health, decision-making

**Key Metrics**:
- Decision-making pace and quality
- Time allocation (strategy vs ops)
- Personal satisfaction/burnout
- Health metrics (sleep, exercise)
- Focus/distraction level

**Healthy Score (75+)**:
```
✓ Making decisions quickly and confidently
✓ Spending 50%+ time on strategy
✓ Satisfied with direction
✓ Getting 7+ hours sleep
✓ Not experiencing burnout
```

**Risks (0-40)**:
```
⚠ Decisions slow or uncertain
⚠ Doing too much ops (< 30% strategy time)
⚠ Experiencing burnout
⚠ Sleeping < 6 hours
⚠ Losing focus/direction
```

**Action Items**:
- Delegation (hire ops person or COO)
- Board/advisor (outside perspective)
- Take time off (true break from work)
- Exercise/sleep (personal health)
- Strategic planning (quarterly offsite)

---

### 9. Operations

**Measures**: Process efficiency, bottlenecks, automation

**Key Metrics**:
- Process efficiency (time to execute)
- Automation level (% of manual tasks eliminated)
- Tool stack effectiveness
- Cross-team collaboration
- Decision-making speed

**Healthy Score (75+)**:
```
✓ Key processes optimized (< 50% waste)
✓ High automation (> 60% of tasks)
✓ Tool stack integrated (not manual work)
✓ Cross-team communication flowing
✓ Decisions made quickly (< 48 hours)
```

**Risks (0-40)**:
```
⚠ Bottlenecks causing delays
⚠ Low automation (manual, error-prone)
⚠ Tool sprawl (data not connected)
⚠ Siloed teams (poor collaboration)
⚠ Decisions slow (analysis paralysis)
```

**Action Items**:
- Process mapping (identify bottlenecks)
- Automation audit (what can be automated?)
- Tool consolidation (reduce number of tools)
- Workflow optimization (reduce handoffs)
- Documentation (playbooks for key processes)

---

### 10. Team

**Measures**: Team health, productivity, culture

**Key Metrics**:
- Headcount vs plan
- Team satisfaction (eNPS)
- Attrition rate
- Productivity metrics
- Growth trajectory

**Healthy Score (75+)**:
```
✓ Team at planned headcount
✓ eNPS > 30 (employees would recommend)
✓ Attrition < 15% annually
✓ Productivity on target
✓ Growing team strategically
```

**Risks (0-40)**:
```
⚠ Understaffed (missing key roles)
⚠ Low morale (eNPS < 0)
⚠ High attrition (> 25% annually)
⚠ Productivity declining
⚠ Hiring struggles
```

**Action Items**:
- Hiring plan (fill critical gaps)
- Compensation review (competitive vs market)
- Manager training (improve leadership)
- Culture building (team events, communication)
- Career development (growth paths, training)

---

### 11. Legal & Compliance

**Measures**: Risk exposure, regulatory compliance, contract health

**Key Metrics**:
- Compliance gaps
- Contract review status
- Litigation risk
- Insurance coverage
- Policy documentation

**Healthy Score (75+)**:
```
✓ All compliance requirements met
✓ Contracts reviewed by counsel
✓ No active litigation
✓ Insurance current and adequate
✓ Policies documented
```

**Risks (0-40)**:
```
⚠ Compliance gaps exist
⚠ Outdated contracts
⚠ Litigation risk/active case
⚠ Insurance gaps
⚠ No clear policies
```

**Action Items**:
- Legal audit (compliance review)
- Contract standardization (templates, automated review)
- Insurance review (adequate coverage)
- Policy documentation (employee handbook, security)
- Regulatory monitoring (stay compliant)

---

### 12. Partnerships

**Measures**: Strategic partnerships, integrations, ecosystem growth

**Key Metrics**:
- Number of active partnerships
- Partnership pipeline
- Integration health
- Co-marketing opportunities
- Revenue from partnerships

**Healthy Score (75+)**:
```
✓ 5+ active partnerships
✓ Pipeline of 3-5 potential partners
✓ Integrations working well
✓ Co-marketing generating leads
✓ Partnership revenue growing
```

**Risks (0-40)**:
```
⚠ No active partnerships
⚠ Integrations broken/outdated
⚠ Partner satisfaction declining
⚠ No ecosystem strategy
⚠ Missing out on growth
```

**Action Items**:
- Partnership strategy (identify ideal partners)
- Integration roadmap (which integrations matter most?)
- Partner enablement (make partners successful)
- Co-marketing (joint campaigns)
- Ecosystem building (create network effects)

---

### 13. Compliance (Security & Data)

**Measures**: Data security, privacy compliance, breach prevention

**Key Metrics**:
- Security audit score
- GDPR/CCPA compliance
- Incident response plan
- Employee training completion
- Vulnerability scanning frequency

**Healthy Score (75+)**:
```
✓ Security audit > 85/100
✓ GDPR/CCPA compliant
✓ Incident response plan in place
✓ 100% employee security training
✓ Weekly vulnerability scanning
```

**Risks (0-40)**:
```
⚠ Security gaps identified
⚠ Privacy compliance gaps
⚠ No incident response plan
⚠ Employee training lacking
⚠ No vulnerability management
```

**Action Items**:
- Security audit (identify gaps)
- Compliance remediation (fix gaps)
- Incident response plan (preparation)
- Employee training (security awareness)
- Vendor security (vet third-party tools)

---

## Health Scoring Methodology

### How Scores Are Calculated

```
Domain Health Score = Weighted Average of Key Metrics

Example: Sales Domain

Step 1: Gather Key Metrics
├─ Pipeline: $500K (3x quarterly target) = 100 points
├─ Win rate: 40% (in healthy range) = 85 points
├─ Sales cycle: 45 days (avg, improving) = 75 points
├─ Team capacity: 90% (below ideal) = 70 points
└─ Expansion: 25% of customers expand (target 30%) = 80 points

Step 2: Apply Weights
├─ Pipeline: 100 × 30% = 30 points (most important)
├─ Win rate: 85 × 25% = 21.25 points
├─ Sales cycle: 75 × 20% = 15 points
├─ Team: 70 × 15% = 10.5 points
└─ Expansion: 80 × 10% = 8 points

Step 3: Total Score
├─ Sum: 30 + 21.25 + 15 + 10.5 + 8 = 84.75
└─ Sales Domain Health Score: 85/100 (Good)

Interpretation:
85/100 = Sales domain is healthy.
Key strength: Strong pipeline
Key weakness: Below-target expansion rate
Recommendation: Focus on expansion motion
```

### Score Interpretation

```
90-100: EXCELLENT
├─ World-class in this domain
├─ Competitive advantage
├─ Keep doing what you're doing
└─ Leverage for growth

75-89: GOOD
├─ Healthy, no immediate action needed
├─ Some opportunities for improvement
├─ Monitor for changes
└─ Iterate to reach excellence

60-74: FAIR
├─ Acceptable, but needs attention
├─ Has gaps that should be addressed
├─ Create improvement plan
└─ Target next quarter to reach "Good"

40-59: POOR
├─ Needs immediate attention
├─ Could impact business
├─ High priority improvement plan
└─ Target 90 days to reach "Good"

0-39: CRITICAL
├─ Existential threat if not addressed
├─ Requires immediate action
├─ CEO should focus here
└─ Target 30 days for initial improvement
```

### Trend Analysis

```
Beyond the raw score, Cognitive Twin tracks MOMENTUM:

Momentum = Current Score - Previous Score (month ago)

Examples:

Score: 75 (Good)
Momentum: +5 (Improving) ✓ POSITIVE
Interpretation: On right trajectory

Score: 75 (Good)
Momentum: -8 (Declining) ⚠️ CAUTION
Interpretation: Warning sign - reversing course

Score: 75 (Good)
Momentum: 0 (Stable) ✓ NEUTRAL
Interpretation: Maintaining course

Velocity = Rate of Change

10-point drop in 3 months = -3.3 points/month
At this rate, will reach 0 in 22 months. ⚠️ Urgent
(Example: Churn domain declining)
```

---

## Digest Types and Schedules

### Daily Digest

**When**: 8 AM (your timezone)
**Length**: 5 minutes to read
**Content**:
- Key metric changes (red flags only)
- Critical risks identified
- Today's priorities

**Example**:
```
DAILY DIGEST - November 28, 2025

🚨 CRITICAL ALERTS
- Sales pipeline dropped 15% (below minimum)
- Finance: 2 large customers at churn risk

⚠️ IMPORTANT CHANGES
- Product: 2 bugs reported (team on it)
- Delivery: Project X slipped 3 days

✓ POSITIVE TRENDS
- Marketing: CAC down 8% (excellent)
- Team: 3 job offers accepted (hiring progress)

TODAY'S FOCUS
1. Qualify and fill pipeline gap
2. Call at-risk customers
3. Review product bugs

→ See full briefing for more details
```

### Weekly Digest

**When**: Monday 8 AM
**Length**: 15-20 minutes
**Content**:
- All 13 domain scores
- Key trends and momentum
- Top 3 risks
- Top 3 opportunities
- Recommendations

**Example**:
```
WEEKLY DIGEST - Week of Nov 24, 2025

┌─────────────────────────────────────────┐
│ DOMAIN HEALTH SUMMARY                   │
├──────────────────┬──────────────────────┤
│ Marketing        │ 76 ↑ +2 (Good)       │
│ Sales            │ 85 ↑ +3 (Good)       │
│ Delivery         │ 72 ↔ 0  (Fair)       │
│ Product          │ 68 ↓ -5 (Fair)       │
│ Clients          │ 79 ↓ -2 (Good)       │
│ Engineering      │ 81 ↑ +1 (Good)       │
│ Finance          │ 62 ↓ -3 (Fair)       │
│ Founder          │ 70 ↓ -4 (Fair)       │
│ Operations       │ 75 ↑ +2 (Good)       │
│ Team             │ 73 ↔ 0  (Fair)       │
│ Legal            │ 80 ↑ +0 (Good)       │
│ Partnerships     │ 55 ↓ -3 (Poor)       │
│ Compliance       │ 88 ↑ +1 (Good)       │
├──────────────────┼──────────────────────┤
│ OVERALL HEALTH   │ 74 (Fair)            │
└──────────────────┴──────────────────────┘

🔴 TOP 3 RISKS
1. Product domain declining (-5 in 2 weeks)
   └─ Bug reports up 30%, feature adoption down
   └─ Action: Emergency product review Monday

2. Partnership pipeline empty (score: 55)
   └─ No active partnerships, growth stalled
   └─ Action: Identify 5 target partners

3. Founder burnout watch (score: 70)
   └─ Working 70+ hours, decision quality declining
   └─ Action: Delegate ops work, take 3-day break

🟢 TOP 3 OPPORTUNITIES
1. Sales momentum (score up +3)
   └─ Pipeline growing, win rate improving
   └─ Action: Double down on what's working

2. Finance: Cost optimization opportunity
   └─ Cloud costs up 15%, other savings possible
   └─ Action: Audit infrastructure spending

3. Delivery: Client health strong
   └─ NPS at 58, expansion revenue +12%
   └─ Action: Document what's working, scale it

📋 WEEK AHEAD PRIORITIES
1. Monday: Product emergency review (2 hours)
2. Wednesday: Call 3 at-risk customers (1.5 hours)
3. Friday: Strategy session on partnerships (1.5 hour)
4. Owner action: Take 3-day break next week
```

### Monthly Digest

**When**: First Monday of month
**Length**: 30-45 minutes
**Content**:
- Comprehensive domain analysis
- Month-over-month trends
- Peer benchmarking (if available)
- Strategic recommendations
- Quarterly outlook

**Example**:
```
MONTHLY DIGEST - November 2025

OVERALL BUSINESS HEALTH: 74/100 (Fair)

4-Week Trend:
Nov 1: 71 → Nov 8: 73 → Nov 15: 74 → Nov 22: 72 → Nov 29: 74
Trend: Stable, slight bounce-back

Year-to-Date Trend:
Jan: 62 → Feb: 64 → ... → Nov: 74
Overall: +12 points improvement (strong progress)

DOMAIN DEEP DIVE

Marketing (Score: 76) ✓ GOOD
├─ Brand awareness: Growing +20% YOY
├─ Pipeline quality: Improving
├─ CAC trend: Declining (good)
└─ Recommendation: Invest in brand awareness (ROI is there)

Sales (Score: 85) ✓ GOOD
├─ Pipeline: $500K (3x target) - strong
├─ Win rate: 40% (stable)
├─ Expansion: 25% (below 30% target)
└─ Recommendation: Focus on expansion motion (quick win)

Product (Score: 68) ⚠️ FAIR
├─ Feature adoption: 70% (down from 80% last month)
├─ Bug reports: Up 30%
├─ Tech debt: Increasing
├─ Recommendation: Allocate 30% engineering to bug fixes + tech debt

Finance (Score: 62) ⚠️ FAIR
├─ Runway: 8 months (adequate, not ideal)
├─ Burn: Increasing (+$15K/month cloud costs)
├─ Gross margin: 72% (good)
├─ Recommendation: Optimize cloud costs immediately (+$10K possible)

Founder (Score: 70) ⚠️ FAIR
├─ Hours: 70+/week (burnout risk)
├─ Decision quality: Fair (slowing down)
├─ Satisfaction: Low (considering stepping back)
└─ Recommendation: Hire COO, delegate ops, take real break

[... all 13 domains ...]

COMPETITIVE POSITION
vs Your Cohort (Same-stage SaaS):
├─ Your sales: 85 (Cohort avg: 72) ✓ +13 above
├─ Your product: 68 (Cohort avg: 71) ✗ -3 below
├─ Your team: 73 (Cohort avg: 75) ✗ -2 below
└─ Overall: 74 (Cohort avg: 73) ✓ +1 above

Key insight: You're ahead in sales, but product and team are slightly behind.
Consider: Double down on sales strength, improve product quality.

STRATEGIC RECOMMENDATIONS

Priority 1: Address Product Domain
├─ Root cause: Too much feature work, not enough stability
├─ Action: Dedicate next sprint 100% to bugs + tech debt
├─ Timeline: 2-3 weeks
└─ Expected outcome: Product score return to 75+

Priority 2: Optimize Finance
├─ Root cause: Cloud cost explosion
├─ Action: Infrastructure audit + optimization
├─ Timeline: 1-2 weeks
└─ Expected outcome: Finance score improve to 72+

Priority 3: Support Founder Health
├─ Root cause: Too many balls in air
├─ Action: Hire COO or operations lead
├─ Timeline: 6-8 weeks hiring
└─ Expected outcome: Founder score improve to 85+

QUARTERLY OUTLOOK
If you implement above:
├─ Q4 2025: Overall health improve to 78-80
├─ Q1 2026: Could reach 82-85 (good health)
└─ By Q2 2026: Positioned for strong growth or fundraising
```

### Quarterly Digest

**When**: First day of quarter
**Length**: 60-90 minutes (deep strategic session)
**Content**:
- Annual trends
- Peer comparison
- Strategic pivot decisions
- Resource allocation
- Long-term planning

**Example**:
```
QUARTERLY DIGEST - Q4 2025

[Comprehensive analysis of all 13 domains over 3 months]
[Competitive benchmarking]
[Strategic recommendations for next quarter]
[Resource allocation]
[Hiring/budget decisions]
[Annual goal progress]
[Long-term positioning]
```

---

## Decision Simulation Workflow

### How Decision Simulation Works

```
Scenario: "Should we raise Series A or bootstrap another year?"

Step 1: Define Your Options
├─ Option A: Raise Series A ($5M)
├─ Option B: Bootstrap and stay independent
└─ Option C: Bridge round ($1.5M) then bootstrap

Step 2: Cognitive Twin Models Impact
For each option, simulates effect on all 13 domains:

Option A Impact Forecast:
├─ Sales: +15 (hire sales team)
├─ Product: +8 (hire engineers)
├─ Founder: -5 (board, less autonomy)
├─ Finance: +25 (capital available)
├─ Team: +10 (can hire aggressively)
└─ ... (all 13 domains)

Option B Impact Forecast:
├─ Sales: +2 (slow hiring)
├─ Product: +3 (limited hiring)
├─ Founder: +10 (stay independent)
├─ Finance: -5 (cash pressure)
├─ Team: +0 (flat hiring)
└─ ... (all 13 domains)

Option C Impact Forecast:
├─ Sales: +8 (modest hiring)
├─ Product: +5 (selective hiring)
├─ Founder: +5 (some autonomy)
├─ Finance: +15 (less pressure than bootstrap)
├─ Team: +5 (moderate hiring)
└─ ... (all 13 domains)

Step 3: Forecast Outcomes
For each option, 12-month projection:

Option A (Raise Series A):
├─ Sales health: 90 (excellent)
├─ Product health: 78 (good)
├─ Finance health: 88 (good, less pressure)
├─ Founder health: 65 (challenging with board)
├─ Overall health: 82 (very good)
└─ Runway: Unlimited (but growth expectations high)

Option B (Bootstrap):
├─ Sales health: 75 (good, but slow)
├─ Product health: 70 (fair, limited investment)
├─ Finance health: 62 (fair, cash pressure)
├─ Founder health: 85 (great, independent)
├─ Overall health: 73 (fair)
└─ Runway: 14 months (enough)

Option C (Bridge):
├─ Sales health: 85 (good)
├─ Product health: 75 (good)
├─ Finance health: 80 (good)
├─ Founder health: 80 (independent + resources)
├─ Overall health: 80 (good)
└─ Runway: 20 months (ample)

Step 4: Risk Analysis
What could go wrong with each?

Option A Risks:
- Board pressure to hit aggressive targets
- Dilution (45-50% at current valuation)
- Pressure to raise again if targets missed
- IPO path (10 years to exit)

Option B Risks:
- Cash runs out in 12 months
- Competitors get 12-month head start
- Slow hiring limits growth
- May need capital at worse terms later

Option C Risks:
- Bridge dilution (15-20% for $1.5M)
- Still need Series A in 18 months
- Bridge terms can be onerous

Step 5: Recommendation
Based on modeling:
→ Option C (Bridge) has best risk-adjusted return

Why:
✓ Maintains founder autonomy (Founder score 80 vs 65 for Series A)
✓ Reduces cash pressure vs bootstrap (Finance 80 vs 62)
✓ Keeps options open (can do Series A later from strength)
✓ Splits the difference (fast growth without giving up control)
```

### Running Your Own Simulation

```
Ask Cognitive Twin:

"What if we hired 5 engineers this quarter?"

Cognitive Twin Response:

Impact on Each Domain:

Product: 70 → 78 (+8)
├─ Reasoning: 40% more engineering capacity
├─ Expected: Feature velocity up 30%
└─ Timeline: Results visible in 8 weeks

Engineering: 81 → 75 (-6)
├─ Reasoning: Onboarding 5 new people is disruptive
├─ Expected: Velocity dips first 4 weeks, then accelerates
└─ Timeline: Back to 85+ in 12 weeks

Finance: 62 → 55 (-7)
├─ Reasoning: $300K additional annual cost
├─ Expected: Runway reduces from 8 months to 6 months
└─ Timeline: Must increase revenue or raise capital sooner

Team: 73 → 70 (-3)
├─ Reasoning: New people, culture integration needed
├─ Expected: Culture slightly diluted but manageable
└─ Timeline: Team cohesion restored in 8 weeks

Overall Health: 74 → 73 (slight decline initially)
├─ Reasoning: Finance impact outweighs product gains short-term
├─ Timeline: Improve back to 76+ after 12 weeks

Financial Impact:
├─ Hiring cost: $300K/year ($25K/month)
├─ Expected revenue lift: +$400K/year (from faster product)
├─ Net: +$100K/year positive

Recommendation:
✓ Hire 5 engineers
✓ Increase sales efforts simultaneously (to offset runway risk)
✓ Plan Series A or revenue growth to address finance domain
✓ Timeline: Hire over next 2 months, expect gains in 8-12 weeks
```

---

## Interpreting Scores

### What Does a Score Really Mean?

```
Domain Score: 75/100 (Good)

But what does that REALLY mean?

NOT:
✗ You're doing 75% of something
✗ Your business is 75% healthy
✗ You have 75% of what you need

ACTUALLY:
✓ In this domain, you're performing at a good level
✓ No immediate action needed
✓ Some opportunities for improvement
✓ You're in the top 50% of similar companies
✓ This domain supports your business health
```

### Comparing Across Domains

```
Why domains have different scores:

Your Scores:
├─ Sales: 85 (best)
├─ Finance: 62 (worst)
└─ Difference: 23 points

What this means:
✓ You're great at sales (strong pipeline, good team)
✗ You're struggling with finance (high burn, limited runway)

This is normal! Most businesses excel in 1-2 areas.

The goal: Raise areas under 70 to at least 75

Current state: 3 domains under 70 (Finance, Product, Founder)
Improvement plan: Address these 3 priority areas
Timeline: 90 days to get all above 70
Stretch goal: Get all above 75 by Q1 2026
```

### Red Flags to Watch

```
Domain Score Declining?

Normal: 1-2 point fluctuation month to month
Caution: 3-5 point drop → Investigate
Warning: 5+ point drop → Takes action
Critical: 10+ point drop → Emergency meeting

Examples:

Sales declining 2 points (78→76)
├─ Investigate: What changed? (market? team? process?)
├─ Timeline: Understand within 1-2 weeks

Finance declining 10 points (75→65)
├─ Action: Emergency meeting today
├─ Timeline: Root cause analysis within 24 hours
├─ Response: Implement mitigation within 48 hours
```

---

## Taking Action

### Action Planning Based on Scores

```
Domain: Product (Score 68, declining)

Step 1: Understand the Problem
├─ Why is the score declining?
├─ What metric drove it down?
├─ What changed in the last month?
└─ Is it temporary or structural?

Step 2: Root Cause Analysis
├─ Feature adoption down → Why? (hard to use? doesn't solve problem?)
├─ Bug reports up → Why? (quality issues? new complexity?)
├─ Tech debt increasing → Why? (shipping too fast? no refactoring time?)
└─ Talk to: Product team, engineering, customers

Step 3: Create 30-Day Improvement Plan

Week 1: Diagnosis
├─ Survey users (why adoption low?)
├─ Triage bugs (which block users?)
├─ Estimate tech debt (impact on velocity?)

Week 2: Quick Wins
├─ Fix top 3 bugs (remove obvious problems)
├─ Improve onboarding (help users discover value)
├─ Plan tech debt work (next sprint)

Week 3: Execution
├─ Deploy bug fixes
├─ Launch improved onboarding
├─ Start tech debt sprint

Week 4: Measure & Iterate
├─ Has adoption improved?
├─ Are bugs declining?
├─ Is velocity recovering?
└─ Adjust plan if needed

Expected Outcome:
├─ Product score: 68 → 75 (1-month target)
├─ Feature adoption: 70% → 78%
├─ Bug reports: Down 30%
├─ Tech debt: Being paid down
```

### Sample 90-Day Improvement Plan

```
Overall Goal: Improve from 74 (Fair) to 80+ (Good)

Strategy: Fix 3 Critical Domains

DOMAIN 1: Finance (Score 62 → 70+)
├─ Owner: CFO
├─ Action: Optimize cloud costs
│  ├─ Week 1-2: Cost audit (find savings)
│  ├─ Week 3-4: Implement optimizations
│  └─ Expected: Save $10K/month
├─ Action: Improve gross margin
│  ├─ Week 5-8: Pricing analysis
│  ├─ Week 9-12: Run pilot, rollout
│  └─ Expected: +3% margin improvement
└─ Target: Finance score 70+ (reduces financial pressure)

DOMAIN 2: Product (Score 68 → 75+)
├─ Owner: CPO
├─ Action: Bug fix sprint
│  ├─ Week 1-3: 100% engineering on stability
│  ├─ Week 4-8: Ongoing maintenance + features
│  └─ Expected: Bug reports -50%
├─ Action: Improve onboarding
│  ├─ Week 1-6: Design + test new flow
│  ├─ Week 7-12: Deploy + measure
│  └─ Expected: Adoption 70% → 80%
└─ Target: Product score 75+ (support growth)

DOMAIN 3: Founder Health (Score 70 → 80+)
├─ Owner: You
├─ Action: Delegate operations
│  ├─ Week 1-4: Hire COO or Ops lead
│  ├─ Week 5-8: Onboard and document
│  ├─ Week 9-12: Transition responsibilities
│  └─ Expected: 70+ hour weeks → 50 hour weeks
├─ Action: Take 1 week fully off
│  ├─ Week 6: Full week off (not checking email)
│  └─ Expected: Improved decision quality
└─ Target: Founder score 80+ (decision quality improves)

WEEKLY TRACKING

Week 1:
├─ Finance: Started cost audit
├─ Product: Started bug triage
├─ Founder: Posted for COO role
└─ Overall: Still 74 (too early for change)

Week 4:
├─ Finance: Cost savings identified ($8K/month)
├─ Product: 15 bugs triaged, 5 fixed
├─ Founder: 10 COO applications received
└─ Overall: 75 (slight improvement)

Week 8:
├─ Finance: $10K/month savings implemented
├─ Product: Feature adoption improved to 75%
├─ Founder: COO hired, onboarding
└─ Overall: 77 (on track)

Week 12:
├─ Finance: 74 (goal: 70+ ✓)
├─ Product: 76 (goal: 75+ ✓)
├─ Founder: 82 (goal: 80+ ✓)
└─ Overall: 79 (goal: 80+ almost there!)

Post 90-Day Result:
├─ Overall health: 74 → 79 (+5 points)
├─ 3 critical domains improved
├─ Set up for 80+ in next month
└─ Positioned for next growth phase
```

---

## Examples

### Example 1: Using Cognitive Twin for Hiring Decision

```
Scenario: Should we hire a VP Sales?

Current State:
├─ Sales domain: 85 (good)
├─ Revenue: $120K MRR
├─ Sales team: 2 AEs
├─ Founder doing: Sales strategy + some deals
├─ Founder hours: 70+ per week

Option A: Hire VP Sales ($150K/year + equity)
Option B: Hire Individual Contributor AE ($100K + commission)
Option C: Keep status quo (founder + 2 AEs)

Cognitive Twin Simulation:

OPTION A: VP Sales
├─ Sales domain: 85 → 92 (+7)
│  └─ Reasoning: Professional sales process, faster scaling
├─ Founder domain: 70 → 78 (+8)
│  └─ Reasoning: Founder delegates sales, focuses on strategy
├─ Finance domain: 62 → 58 (-4)
│  └─ Reasoning: Additional $150K cost with some dilution
└─ Overall: 74 → 80 (+6)

OPTION B: AE
├─ Sales domain: 85 → 87 (+2)
│  └─ Reasoning: One more rep, but no process improvement
├─ Founder domain: 70 → 72 (+2)
│  └─ Reasoning: Small reduction in founder sales work
├─ Finance domain: 62 → 60 (-2)
│  └─ Reasoning: Additional $100K cost, lower impact than VP
└─ Overall: 74 → 76 (+2)

OPTION C: Status Quo
├─ Sales domain: 85 → 82 (-3)
│  └─ Reasoning: Slower growth as company scales
├─ Founder domain: 70 → 65 (-5)
│  └─ Reasoning: Founder increasingly overloaded
├─ Finance domain: 62 → 64 (+2)
│  └─ Reasoning: No additional costs
└─ Overall: 74 → 73 (-1, declining)

Recommendation:
✓ OPTION A (Hire VP Sales)

Why:
• Best overall impact on health (+6)
• Solves founder burnout (priority #1)
• Enables scaling (3-5x sales team)
• Finance impact manageable (can be offset by revenue growth)

Financial Model:
├─ Investment: $150K/year
├─ Expected pipeline improvement: $400K (2 additional deals)
├─ Expected MRR gain: $30K in 6 months
├─ Payback: 5 months (excellent ROI)

Timeline:
├─ Start recruiting: Immediately
├─ Hire by: 6-8 weeks
├─ Onboard: 2 months
├─ Results visible: 4-6 months
```

### Example 2: Quarterly Strategic Review

```
Review Date: December 1, 2025
Last Quarter: Q3
Current Scores vs Start of Q3:

┌─────────────────────────────────────────┐
│ DOMAIN           │ Start Q3 │ End Q3 │ Δ │
├──────────────────┼──────────┼────────┼───┤
│ Marketing        │ 72       │ 76     │+4 │
│ Sales            │ 82       │ 85     │+3 │
│ Delivery         │ 68       │ 72     │+4 │
│ Product          │ 70       │ 68     │-2 │
│ Clients          │ 80       │ 79     │-1 │
│ Engineering      │ 78       │ 81     │+3 │
│ Finance          │ 65       │ 62     │-3 │
│ Founder          │ 75       │ 70     │-5 │
│ Operations       │ 72       │ 75     │+3 │
│ Team             │ 70       │ 73     │+3 │
│ Legal            │ 82       │ 80     │-2 │
│ Partnerships     │ 52       │ 55     │+3 │
│ Compliance       │ 85       │ 88     │+3 │
├──────────────────┼──────────┼────────┼───┤
│ OVERALL          │ 72       │ 74     │+2 │
└─────────────────────────────────────────┘

Key Insights:

WINS (Positive Trends):
✓ Sales accelerated (+3)
  → Pipeline strengthening, team cohesion improving
  → Maintain momentum into Q4

✓ Delivery improved (+4)
  → Customer implementations speeding up
  → Client satisfaction likely improving
  → Leverage this for expansion revenue

✓ Operations & Compliance improved
  → Foundation strengthening
  → Less firefighting, more strategic work

⚠ CONCERNS (Negative Trends):
✗ Founder health declining (-5)
  → Burnout risk
  → Decision quality may suffer
  → ACTION: Hire COO or operations lead

✗ Finance declining (-3)
  → Burn increasing
  → Runway pressure
  → ACTION: Cost optimization + revenue acceleration

✗ Product flat/declining (-2)
  → Not keeping pace with sales
  → Risk: Sales team will hit ceiling
  → ACTION: Allocate more engineering

Q4 PLAN

Focus Area #1: Support Founder Health
├─ Owner: You
├─ Action: Hire COO or Ops Lead
├─ Timeline: Hiring next 2 weeks
├─ Target: Founder score 70 → 78 by year-end
└─ Expected outcome: Better decisions, less stress

Focus Area #2: Optimize Finance
├─ Owner: CFO
├─ Action: Cost audit + pricing optimization
├─ Timeline: Decisions made by Dec 15
├─ Target: Finance score 62 → 68
└─ Expected outcome: Improved runway, unit economics

Focus Area #3: Strengthen Product for Sales
├─ Owner: CPO
├─ Action: Allocate 50% engineering to product robustness
├─ Timeline: Sprint starting next week
├─ Target: Product score 68 → 75
└─ Expected outcome: Engineering velocity + quality

2026 Vision:

If we execute the Q4 plan:
├─ Overall health: 74 → 78-80 (good → very good)
├─ All domains above 70 (currently 2 below)
├─ Positioned for strong 2026 (growth or fundraising)
├─ Founder happy and healthy
├─ Product stable and ready to scale
└─ Finance healthier and less pressured

Ambitious but achievable!
```

---

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Next Review**: 2025-12-28

Ready to monitor your business health? Create your first Cognitive Twin digest today.
