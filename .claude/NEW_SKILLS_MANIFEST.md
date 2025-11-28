# New Claude Code Skills - Complete Manifest

**Creation Date**: November 28, 2025
**Total Skills Created**: 6
**Total Lines of Code**: 3,915 lines
**Status**: Complete and ready for integration

---

## Executive Summary

Six comprehensive Claude Code skill files have been created under `.claude/skills/`, adding enterprise-grade capabilities for:
- Founder business operations
- Strategic decision-making
- Competitive intelligence
- Business health monitoring
- Multi-channel marketing
- Inbound lead intelligence

All skills follow the established Claude Code pattern with SKILL.md files, comprehensive documentation, real-world examples, and clear integration points.

---

## Created Skills

### 1. FOUNDER OS
**Location**: `D:\Unite-Hub\.claude\skills\founder-os\SKILL.md`
**Size**: 528 lines
**Key Words**: portfolio, vault, metrics, snapshots, HUMAN_GOVERNED

**What It Does**:
- Manages founder business portfolio (register, update, track ventures)
- Tracks business signals (revenue, growth, engagement, strategic)
- Securely stores credentials (encrypted vault with access logs)
- Generates AI-powered snapshots (daily, weekly, monthly)
- Provides decision support for business options

**Use It When**:
- Register a new business
- Track business health and metrics
- Store credentials securely
- Generate business snapshots
- Need strategic guidance (HUMAN_GOVERNED mode)

**Example Interaction**:
```
Founder: "Show me my business health"
Founder OS: [Monthly snapshot]
- Overall score: 74/100
- Financial health: 78/100 (revenue growing 12% MoM)
- Customer health: 72/100 (NPS 48, churn 2.1%)
- Product health: 68/100 (engagement down, bugs up)
- Team health: 58/100 (satisfaction declining)
- Focus this month: Fix product quality, address team satisfaction
```

---

### 2. AI PHILL
**Location**: `D:\Unite-Hub\.claude\skills\ai-phill\SKILL.md`
**Size**: 574 lines
**Key Words**: Socratic, advisor, risk assessment, HUMAN_GOVERNED

**What It Does**:
- Facilitates deep strategic thinking through Socratic dialogue
- Identifies blind spots in thinking
- Assesses risks and mitigation strategies
- Explores decision scenarios
- Checks values alignment
- Uses Extended Thinking for deep analysis (10,000 token budget)

**Use It When**:
- Facing critical decisions
- Need to challenge assumptions
- Want deep strategic thinking
- Exploring multiple options
- Assessing risks

**Example Interaction**:
```
Founder: "Should we raise Series A or bootstrap?"

AI Phill: "Let's explore this together. A few questions:

1. VISION & TIMING
   - What does success look like in 5 years?
   - How does raising capital change that timeline?

2. TRADE-OFFS
   - What do you gain with Series A? What do you lose?
   - Same for bootstrapping...

3. VALUES ALIGNMENT
   - How would each path affect your quality of life?
   - Which aligns with your core values?

Tell me what resonates and we'll dig deeper."
```

**Philosophy**: Better questions lead to better decisions. Founder decides.

---

### 3. SEO LEAK ENGINE
**Location**: `D:\Unite-Hub\.claude\skills\seo-leak\SKILL.md`
**Size**: 629 lines
**Key Words**: ranking signals, competitive, Q*, P*, T*, E-E-A-T

**What It Does**:
- Analyzes Google's ranking signals (Q*, P*, T* factors)
- Analyzes user behavior signals (NavBoost)
- Evaluates E-E-A-T (Expertise, Authoritativeness, Trustworthiness)
- Identifies ranking gaps vs. competitors
- Orchestrates comprehensive SEO audits
- Provides actionable SEO strategy

**Use It When**:
- Analyzing ranking difficulty for keywords
- Understanding why competitors rank higher
- Planning SEO strategy
- Auditing site technical SEO
- Assessing competitive landscape

**Example Interaction**:
```
Founder: "Can we rank for 'best project management software'?"

SEO Leak:
- Difficulty: 78/100 (VERY HARD)
- Ranking Requirement:
  * Q* (Query): Commercial intent - they want comparisons
  * P* (Page): 5,000+ words, 25+ tools reviewed
  * T* (Trust): 45k+ backlinks, 15-year domain authority
  * E-E-A-T: Staff writers, major publications, awards

- Your Gap:
  * Words: 2,100 (need +2,900)
  * Tools reviewed: 8 (need +17)
  * Backlinks: 1,200 (need +43,800)
  * Age: 2 years (disadvantage vs. 15-year domains)

- Recommendation: TARGET LONG-TAIL FIRST
  * "Best PM software for remote teams" (difficulty: 35)
  * Build authority with easier wins
  * After 12 months: revisit main keyword

Expected success rate:
- Main keyword: 20% without major authority building
- Long-tail strategy: 80% in 6-12 months
```

---

### 4. COGNITIVE TWIN
**Location**: `D:\Unite-Hub\.claude\skills\cognitive-twin\SKILL.md`
**Size**: 716 lines
**Key Words**: 13 domains, health monitoring, anomaly detection, trends

**What It Does**:
- Monitors 13 business domains continuously
- Scores each domain (0-100)
- Detects anomalies and alerts
- Generates periodic digests (daily, weekly, monthly)
- Simulates decision impacts
- Forecasts trends 90 days out

**The 13 Domains**:
1. Financial (25%) - Revenue, margins, burn, cash
2. Customer (20%) - NPS, CAC, retention, concentration
3. Product (18%) - PMF, execution, quality, engagement
4. Team (15%) - Growth, satisfaction, dependencies, skills
5. Market (10%) - Size, growth rate, competition, demand
6. Operations (5%) - Processes, costs, infrastructure, compliance
7-13. Sales, Marketing, Partnerships, Investor, Strategic, Leadership, Culture

**Use It When**:
- Want daily health check
- Need comprehensive monthly analysis
- Considering major decisions (simulate impact)
- Want early warning signals
- Need trend analysis

**Example Interaction**:
```
Founder: "How's my business doing?"

Cognitive Twin:
TODAY'S HEALTH: 74/100 (↓1 from yesterday)

RED FLAGS:
❌ Revenue tracking 5% below forecast
⚠️ 3 new critical bugs this week

GREEN FLAGS:
✅ Customer satisfaction up to 7.2/10
✅ Runway stable at 8.5 months

Key Metrics:
- MRR: $45,000 (↑12% MoM)
- Churn: 2.1% (stable)
- NPS: 48 (good trend)
- Team size: 8 (on track for 10 by Q2)

ACTION ITEM:
Debug the 3 critical bugs this week.
Don't let tech debt accumulate.
```

---

### 5. MULTI-CHANNEL
**Location**: `D:\Unite-Hub\.claude\skills\multi-channel\SKILL.md`
**Size**: 737 lines
**Key Words**: social inbox, 8 platforms, advertising, coordination

**What It Does**:
- Unifies social inbox from 8 platforms (YouTube, Instagram, TikTok, LinkedIn, Twitter, Facebook, Reddit, Pinterest)
- Manages advertising across Google, Meta, LinkedIn, TikTok
- Tracks keywords and audiences
- Coordinates messaging across platforms
- Provides real-time performance analytics
- Optimizes campaigns

**Platforms Managed**:
- **Social**: YouTube, Instagram, TikTok, LinkedIn, Twitter/X, Facebook, Reddit, Pinterest
- **Advertising**: Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, Amazon Ads

**Use It When**:
- Managing social media across multiple platforms
- Running advertising campaigns
- Coordinating marketing messages
- Tracking campaign performance
- Analyzing keywords and audiences

**Example Interaction**:
```
Founder: "Check my social inbox"

Multi-Channel:
UNIFIED INBOX: 24 unread

PRIORITY 1 (URGENT):
- Angry customer complaint (Instagram)
  "Your software crashed our workflow"
  Action: Urgent response needed
  Suggestion: "Hi [Name], we're sorry. Here's our support page..."

PRIORITY 2 (HIGH):
- Business inquiry (LinkedIn)
  "Interested in using your software for our team"
  Action: Schedule demo within 24h

PRIORITY 3 (MEDIUM):
- Product feedback (Twitter)
  "Would love if you added feature X"
  Suggested action: Add to feature request queue

---

CAMPAIGN PERFORMANCE (Last 30 days):
Total reach: 1.2M impressions
Total engagement: 3.8%
Total conversions: 480

By platform:
🥇 YouTube: 4.8% conversion rate (best)
🥈 Instagram: 3.2% conversion rate
🥉 TikTok: 5% engagement rate (viral potential)
📊 LinkedIn: 5:1 ROAS (best paid ROI)
⚠️ Pinterest: 0.008% conversion rate (consider pausing)

Recommendation: Double YouTube spend, shift Pinterest to awareness only
```

---

### 6. PRE-CLIENT IDENTITY
**Location**: `D:\Unite-Hub\.claude\skills\pre-client\SKILL.md`
**Size**: 731 lines
**Key Words**: inbound leads, buying signals, opportunity scoring, enrichment

**What It Does**:
- Analyzes incoming emails automatically
- Extracts sender company, role, background
- Clusters related messages into threads
- Detects buying signals (7 tiers)
- Identifies business problems
- Builds relationship timelines
- Enriches prospect data
- Surfaces high-potential opportunities

**Buying Signal Tiers**:
- **Tier 1 (HIGHEST)**: Budget allocated, need by specific date, asking for demo
- **Tier 2 (HIGH)**: Asking about pricing, requesting comparison, mentioning problem
- **Tier 3 (MODERATE)**: Exploring options, asking for features
- **Tier 4 (LOW)**: Just curious, generic interest

**Use It When**:
- Analyzing incoming prospect emails
- Prioritizing leads for follow-up
- Building relationship timelines
- Detecting buying signals
- Understanding prospect buying stage

**Example Interaction**:
```
Email arrives from Sarah (sarah@techstartup.io):
"Looking for better project management solution"

PRE-CLIENT ANALYSIS:

SENDER PROFILE:
- Name: Sarah Chen
- Company: TechStartup Inc (32 people)
- Role: Operations Manager
- Location: San Francisco
- LinkedIn: linkedin.com/in/sarahchen

EMAIL ANALYSIS:
- Intent: Tool replacement
- Problem: Current PM tool inadequate
- Timeline: "Q1 2026 migration"
- Budget: Not mentioned (estimate: mid-market)
- Buying committee: Will grow (CTO will likely be involved)

OPPORTUNITY SCORE: 88/100
- Fit: 92/100 (perfect ICP match)
- Intent: 80/100 (genuine interest)
- Engagement: 90/100 (responsive)
- Timeline: 100/100 (Q1 is soon)

TIER: 1 (HIGHEST INTENT)
ACTION: Call within 2 hours
EXPECTED VALUE: $50k-100k/year

PREDICTED TIMELINE:
Day 1: Initial inquiry (today)
Day 2: CTO joins conversation
Day 5: Demo request expected
Week 3: Proposal phase
Q1 2026: Implementation begins

CONVERSION PROBABILITY: 65-75%
```

---

## File Structure Summary

All 6 skills follow this structure:

```
.claude/skills/
├── founder-os/
│   └── SKILL.md (528 lines)
├── ai-phill/
│   └── SKILL.md (574 lines)
├── seo-leak/
│   └── SKILL.md (629 lines)
├── cognitive-twin/
│   └── SKILL.md (716 lines)
├── multi-channel/
│   └── SKILL.md (737 lines)
├── pre-client/
│   └── SKILL.md (731 lines)
├── INDEX.md (discovery guide)
└── [existing 13 skills]

DOCUMENTATION:
├── .claude/SKILLS_CREATED_SUMMARY.md
└── .claude/NEW_SKILLS_MANIFEST.md (this file)
```

---

## SKILL.md Frontmatter Format

Every skill includes standardized frontmatter:

```yaml
---
name: skill-name
description: Manages X feature. Does Y and Z. Uses Extended Thinking for complex tasks.
---
```

This enables:
- Automatic discovery
- Metadata extraction
- Skill indexing
- Framework integration

---

## Common Features Across All Skills

### 1. HUMAN_GOVERNED Mode
Some skills explicitly note HUMAN_GOVERNED mode:
- **Founder OS**: Advisory only, founder decides
- **AI Phill**: Questions not directives, founder decides

This ensures AI doesn't make decisions unilaterally.

### 2. Real-World Examples
Every skill includes:
- Example interactions (conversations)
- Sample workflows
- Use case scenarios
- Estimated time requirements

### 3. Integration Points
Each skill documents:
- External APIs (LinkedIn, Crunchbase, Stripe, etc.)
- Internal systems (CRM, analytics, etc.)
- Other agents/skills
- Data sources

### 4. Version 1 Scope
Every skill clearly states:
- What's included in V1
- What's Post-V1 (future enhancements)
- Why certain features are deferred

### 5. Error Handling
Every skill includes guidance for:
- Common failure modes
- Recovery strategies
- Fallback options
- User notification

---

## Integration Checklist

To integrate these skills:

- [ ] Review each SKILL.md file
- [ ] Identify external API dependencies
- [ ] Set up integrations (LinkedIn, Crunchbase, DataForSEO, etc.)
- [ ] Configure periodic schedules (daily digests, monthly reviews)
- [ ] Set alert thresholds
- [ ] Connect to CRM system (if applicable)
- [ ] Test with sample data
- [ ] Create documentation for team
- [ ] Train team on usage
- [ ] Monitor initial usage

---

## Technology Stack Integration

These skills integrate with:

**APIs**:
- LinkedIn API (enrichment)
- Crunchbase API (company data)
- Google Ads API (ad performance)
- DataForSEO API (ranking data)
- Stripe API (payment data)
- Gmail API (email data)

**Systems**:
- Email systems (Gmail, Outlook)
- CRM (Salesforce, HubSpot)
- Analytics (Google Analytics)
- Social platforms (Instagram, TikTok, LinkedIn, etc.)
- Advertising platforms (Google Ads, Meta Ads)

**AI**:
- Claude Opus (Extended Thinking for deep analysis)
- Claude Sonnet (Standard operations)
- Claude Haiku (Quick tasks)

---

## Usage Patterns

### Daily Operations
- **Cognitive Twin**: 5-min health check each morning
- **Pre-Client**: Check for inbound opportunities
- **Multi-Channel**: Monitor social inbox

### Weekly Planning
- **Founder OS**: Review metrics, adjust strategy
- **AI Phill**: Deep think through strategic decisions
- **Social Playbook**: Plan weekly content

### Monthly Strategy
- **Cognitive Twin**: Comprehensive monthly review
- **SEO Leak**: Update competitive landscape
- **Decision Moment**: Quarterly planning

### As-Needed
- **AI Phill**: When facing critical decisions
- **SEO Leak**: When planning keyword strategy
- **Pre-Client**: When new high-value email arrives

---

## Learning Path

### For Founders
1. Start with **Cognitive Twin** (daily operations)
2. Add **AI Phill** (for strategic decisions)
3. Add **Founder OS** (for portfolio management)
4. Add **Pre-Client** (for sales intelligence)

### For Marketing Teams
1. Start with **Multi-Channel** (social management)
2. Add **Social Playbook** (campaign planning)
3. Add **SEO Leak** (competitive analysis)
4. Add **Content Agent** (content generation)

### For Sales Teams
1. Start with **Pre-Client** (lead intelligence)
2. Add **Multi-Channel** (channel management)
3. Add **Email Agent** (inbox processing)
4. Add **Founder OS** (account intelligence)

### For Engineering Teams
1. Start with **Deployment Audit** (infrastructure)
2. Add **Backend** (API development)
3. Add **Frontend** (UI development)
4. Add **Docs** (documentation)

---

## Key Insights

### Why These 6 Skills?
These skills were created to fill specific gaps in founder operations:

1. **Founder OS** - Personal business operating system (missing)
2. **AI Phill** - Strategic thinking partner (missing)
3. **SEO Leak** - Competitive intelligence (missing)
4. **Cognitive Twin** - Continuous health monitoring (missing)
5. **Multi-Channel** - Unified marketing command center (missing)
6. **Pre-Client** - Inbound lead intelligence (missing)

### What They Enable
- Founders to focus on strategy, not operations
- Better decisions through Socratic dialogue
- Data-driven SEO strategy
- Early warning system for business problems
- Unified marketing across 8 platforms
- Never miss a qualified lead

### ROI Potential
- **Founder OS**: Save 5+ hours/month on admin
- **AI Phill**: Better decisions (hard to measure but critical)
- **SEO Leak**: Avoid wasted SEO spend (potential $10k+/month)
- **Cognitive Twin**: Early warning prevents crises
- **Multi-Channel**: Unified management saves 10+ hours/month
- **Pre-Client**: Never miss qualified leads (revenue impact)

---

## Next Steps

### Immediate (This Week)
1. Review all 6 SKILL.md files
2. Identify which are highest priority for your team
3. List external API dependencies
4. Create integration tickets

### Short-term (This Month)
1. Set up external API integrations
2. Configure periodic scheduling
3. Test with sample data
4. Train team on primary skill

### Medium-term (This Quarter)
1. Integrate all 6 skills
2. Configure custom thresholds
3. Connect to all data sources
4. Create team playbooks

### Long-term (This Year)
1. Optimize based on usage
2. Implement Post-V1 features
3. Extend with custom skills
4. Build skill combinations

---

## Support & Documentation

For each skill:
- **SKILL.md**: Complete documentation (this folder)
- **INDEX.md**: Quick reference and discovery
- **SKILLS_CREATED_SUMMARY.md**: Overview and statistics
- **NEW_SKILLS_MANIFEST.md**: This file (detailed guide)

---

## Quality Assurance

✅ All 6 skills include:
- ✓ Proper frontmatter (name, description)
- ✓ Overview section explaining purpose
- ✓ Core capabilities with detailed examples
- ✓ Command reference showing usage
- ✓ Integration points documented
- ✓ Version 1 scope clearly stated
- ✓ Real-world examples and scenarios
- ✓ Sample conversations showing interactions
- ✓ Key principles and philosophies
- ✓ Error handling guidance

✅ Total LOC: 3,915 lines of high-quality documentation

---

## Archive & References

All skill files are located in:
- **Primary**: `D:\Unite-Hub\.claude\skills\[skill-name]\SKILL.md`
- **Index**: `D:\Unite-Hub\.claude\skills\INDEX.md`
- **Summary**: `D:\Unite-Hub\.claude\SKILLS_CREATED_SUMMARY.md`
- **Manifest**: `D:\Unite-Hub\.claude\NEW_SKILLS_MANIFEST.md`

---

**Status**: Complete and ready for integration
**Last Updated**: November 28, 2025
**Created by**: Claude Code Agent

All skills follow the established Claude Code pattern and are ready for immediate use and integration into your development workflow.
