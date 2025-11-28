# SEO Leak Engine Guide - Technical SEO Mastery

**Purpose**: Audit, identify, and exploit SEO vulnerabilities
**Status**: Production-Ready
**Last Updated**: 2025-11-28

---

## Table of Contents

1. [Overview](#overview)
2. [Understanding Leak Signals](#understanding-leak-signals)
3. [Q*, P*, T* Scores](#q-p-t-scores)
4. [NavBoost Analysis](#navboost-analysis)
5. [E-E-A-T Framework](#e-e-a-t-framework)
6. [Gap Analysis Methodology](#gap-analysis-methodology)
7. [Audit Workflow](#audit-workflow)
8. [Interpreting Results](#interpreting-results)
9. [Action Items](#action-items)
10. [Examples](#examples)

---

## Overview

### What is the SEO Leak Engine?

The **SEO Leak Engine** is a comprehensive technical SEO system that:

1. **Identifies leak signals**: Gaps between your SEO performance and competitors
2. **Assesses quality**: Evaluates content, technical, and authority dimensions
3. **Finds opportunities**: Discovers keywords and gaps you can exploit
4. **Measures competitiveness**: Benchmarks you against specific competitors
5. **Prioritizes actions**: Recommends what to fix based on ROI

### Leak Signals Explained

A "leak" is any place where you're **losing potential organic traffic** because:

- You don't rank for keywords competitors do
- Your content is weaker than competitors'
- Your site has technical SEO issues
- Your authority/trust signals are weak
- Google's algorithm is favoring competitors

### Three Categories of Leaks

```
┌────────────────────────────────────────────────────────┐
│                    LEAK SIGNALS                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Q* LEAKS: Query Intelligence                          │
│  ├─ Keywords you DON'T rank for                        │
│  ├─ Keywords competitors dominate                      │
│  └─ Search volume × position gap = lost traffic        │
│                                                         │
│  P* LEAKS: Page/Performance Quality                    │
│  ├─ Core Web Vitals issues                            │
│  ├─ Mobile optimization gaps                           │
│  ├─ Security/SSL issues                               │
│  └─ Load time problems                                 │
│                                                         │
│  T* LEAKS: Trust & Authority                           │
│  ├─ Backlink gaps vs competitors                       │
│  ├─ E-E-A-T signals weak                              │
│  ├─ Brand mention volume                               │
│  └─ Citation/review profile weak                       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Understanding Leak Signals

### Signal Detection Framework

The SEO Leak Engine monitors **12 signal families**:

#### 1. Query Signals (Q*)
**What**: Keywords you rank for (or don't)

```
Rankings Snapshot:
┌─────────────────────────────────────────┐
│ Keyword              │ Position │ Traffic │
├─────────────────────────────────────────┤
│ "sales software"     │ #12      │ 150    │ ← Page 2!
│ "CRM for teams"      │ #8       │ 280    │ ← Good
│ "enterprise sales"   │ #23      │ 0      │ ← Not ranking
│ "sales automation"   │ #5       │ 420    │ ← Great
└─────────────────────────────────────────┘

Leak Analysis:
"sales software" (150 traffic):
  Your rank: #12 (page 2)
  Competitor rank: #3 (page 1)
  Traffic gap: ~300/month (competitor gets ~450)

  Fix: Improve content quality/technical to reach #3-5
  Potential gain: +300 organic traffic per month
```

#### 2. SERP Feature Signals
**What**: Featured snippets, PAA boxes, knowledge panels

```
Features You're Missing:
┌──────────────────────────────────────┐
│ Type: Featured Snippet               │
│ Keyword: "how to improve sales"      │
│ Current: Competitor X shows #1       │
│ Your rank: #7 (no featured snippet)  │
│ Traffic impact: ~80 clicks/month     │
│                                      │
│ Fix: Optimize for featured snippet   │
│ Format: List (top 3 tips)            │
│ Expected gain: +80 traffic          │
└──────────────────────────────────────┘
```

#### 3. Search Volume Signals
**What**: Keyword volume trending

```
Keyword Trends:
"sales software": 2,400 searches/month (stable)
"sales automation": 1,900 searches/month (up 15% YOY)
"revenue intelligence": 800 searches/month (up 40% YOY) ← EMERGING

Opportunity: "Revenue intelligence" is trending up 40%.
Competitors ranking for it are capturing growing demand.

Action: Create content targeting "revenue intelligence"
Timeline: 6-8 weeks
Expected gain: +200/month by month 4
```

#### 4. Click-Through Rate (CTR) Signals
**What**: How often people click your result vs competitor

```
CTR Analysis:
Keyword: "sales CRM"

Position #1: CTR 28% (not you)
Position #2: CTR 22% (you)
Position #3: CTR 18% (not you)

Your CTR vs expected for position #2:
Expected CTR for #2: 15-17%
Your actual CTR: 22%
Difference: +5-7%

Why: Your title/description is more compelling.

Implication: You're converting better than competitors at same position.
If you rank #1 (28% CTR), traffic would jump 27%.

Priority: Move to #1 for that keyword.
```

#### 5. Intent Matching Signals
**What**: Does content match what searcher actually wants?

```
Query: "best sales software"

Intent Detection:
- 60% Comparison intent (feature comparison articles)
- 25% Recommendation intent (best recommendations)
- 10% Tutorial intent (how to use features)
- 5% News intent (announcements/updates)

Current SERP (what Google shows):
Position #1-5: Mostly listicles/reviews (comparison intent)

Your content: Feature-focused (product intent)
Mismatch: -20% traffic due to intent gap

Fix: Refactor as "comparison" not "features"
Potential gain: +20% more clicks
```

---

## Q*, P*, T* Scores

### What are Q*, P*, T* Scores?

These are **proprietary ranking factors** (theorized based on Google's public statements):

```
┌─────────────────────────────────────────────────────────┐
│                    RANKING FACTORS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Q* = QUERY INTELLIGENCE                               │
│  "Does your page match what searcher wants?"           │
│                                                         │
│  P* = PAGE QUALITY                                     │
│  "Is your page technically sound and fast?"            │
│                                                         │
│  T* = TRUST & AUTHORITY                                │
│  "Should Google trust this source for this query?"     │
│                                                         │
│  Combined: These three determine your SERP position    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Q* Score (Query Intelligence)

**Measures**: How well your page answers the search query

**Scoring**:
- 90-100: Authoritative answer to query
- 70-89: Good match, some gaps
- 50-69: Partial match, missing elements
- 30-49: Weak match, mostly off-topic
- 0-29: Wrong topic for query

**What Affects Q\***:

```typescript
interface QueryIntelligenceFactors {
  // Content Quality
  content_depth: number;              // How thorough
  readability: number;                 // How clear (Flesch score)
  freshness: number;                   // How recent
  uniqueness: number;                  // Original vs copied

  // Intent Match
  intent_alignment: number;            // Does it match search intent
  people_also_ask_coverage: number;    // Answers related questions

  // Structure
  headers_quality: number;             // Clear H1, H2, H3
  lists_used: boolean;                 // Lists/comparisons
  featured_snippet_optimized: boolean; // Snippet-ready format

  // Entity Recognition
  named_entities: number;              // People, places, brands
  entity_relationships: number;        // Connections between entities

  // Signals
  word_count: number;                  // 2000+ typically better
  topical_authority: number;           // Expert on topic
  semantic_richness: number;           // Related concepts covered
}
```

**Improving Q* Score**:

```
Current State: Your article on "Sales Software"
Q* Score: 65 (good but not great)

Q* Gaps Identified:
├─ Content depth: 7/10 (missing features comparison)
├─ Intent alignment: 6/10 (too product-focused, not enough comparison)
├─ Featured snippet ready: No (not formatted for snippet)
├─ People also ask coverage: 4/10 (missing key questions)
├─ Word count: 1,800 (below 2,000 target)
├─ Semantic richness: 6/10 (missing related concepts)
└─ Uniqueness: 8/10 (good, mostly original)

Fix Priority:
1. Add comparison table (fixes intent + featured snippet)
2. Expand to 2,500+ words (add People Also Ask answers)
3. Include pricing discussion (people want to know cost)
4. Add alternative tools section (user demand)
5. Improve readability (shorter paragraphs, more lists)

Expected Improvement: 65 → 80 Q* score = +2-3 positions
Timeline: 2-3 hours of work
```

### P* Score (Page Quality)

**Measures**: Technical performance and user experience quality

**Scoring**:
- 90-100: Excellent (all Core Web Vitals green)
- 70-89: Good (mostly green, minor issues)
- 50-69: Fair (some yellow scores, slow loading)
- 30-49: Poor (red scores, frustrating to use)
- 0-29: Critical (broken functionality)

**What Affects P***:

```typescript
interface PageQualityFactors {
  // Core Web Vitals
  largest_contentful_paint: number;      // <2.5s = good
  first_input_delay: number;             // <100ms = good
  cumulative_layout_shift: number;       // <0.1 = good

  // Performance
  page_load_time: number;                // <3s = good
  server_response_time: number;          // <200ms = good

  // Mobile
  mobile_usability: number;              // Responsive design
  tap_target_spacing: number;            // Large enough buttons
  viewport_configured: boolean;          // Mobile viewport set

  // Security
  https_enabled: boolean;                // SSL/TLS required
  security_headers_present: boolean;     // CSP, X-Frame-Options

  // Accessibility
  color_contrast: number;                // 4.5:1 = WCAG AA
  alt_text_coverage: number;             // All images have alt
  heading_hierarchy: boolean;            // Proper H1-H6 structure

  // Freshness
  last_updated_date: string;             // Recent updates
  content_update_frequency: string;      // How often updated

  // Technical
  structured_data_valid: boolean;        // Schema.org markup
  canonicals_correct: boolean;           // No duplicate content
  robots_txt_configured: boolean;        // Crawl directives
}
```

**Improving P* Score**:

```
Current State: Your product page
P* Score: 72 (good)

P* Issues Identified:
├─ Largest Contentful Paint: 3.2s ⚠️ (target: <2.5s)
├─ First Input Delay: 180ms ⚠️ (target: <100ms)
├─ Cumulative Layout Shift: 0.15 ⚠️ (target: <0.1)
├─ Mobile Usability: 95/100 ✓
├─ HTTPS: Enabled ✓
├─ Alt Text Coverage: 70% ⚠️ (target: 100%)
├─ Structured Data: Present ✓
└─ Last Updated: 3 months ago

Quick Wins (1-2 hours):
1. Add missing alt text to 8 images
2. Update "Last Modified" date
3. Compress images (save 200KB)

Medium Effort (4-6 hours):
1. Defer non-critical JavaScript
2. Optimize CSS delivery
3. Implement lazy loading for images

Expected Improvement: 72 → 85 P* score = +1-2 positions
Timeline: 1 week
```

### T* Score (Trust & Authority)

**Measures**: Whether Google should trust this source

**Scoring**:
- 90-100: High authority (many backlinks, brand mentions)
- 70-89: Good authority (established, reputable sources)
- 50-69: Moderate authority (some backing, but not strong)
- 30-49: Low authority (minimal third-party endorsement)
- 0-29: New/unproven (few or no endorsements)

**What Affects T***:

```typescript
interface TrustAuthorityFactors {
  // Backlinks
  referring_domains: number;             // How many different sources link
  backlink_quality: number;              // Authority of linking sites
  anchor_text_relevance: number;         // Does anchor match topic
  backlink_growth_rate: number;          // Are backlinks growing

  // Brand Signals
  brand_searches: number;                // "Your brand name" searches
  brand_mentions: number;                // Brand mentioned online
  mention_growth: number;                // Growing brand awareness

  // Reputation
  review_score: number;                  // Ratings and reviews
  review_count: number;                  // How many reviews
  citation_consistency: number;          // Name, address, phone consistency

  // Authority
  author_expertise: number;              // Author credentials
  topical_authority: number;             // Known expert in field
  previous_publications: number;         // Track record

  // E-E-A-T (See below)
  expertise_signals: number;             // Clear expertise
  experience_signals: number;            // Real experience
  authoritativeness: number;             // Third-party endorsement
  trustworthiness: number;               // Transparent, accurate
}
```

**Improving T* Score**:

```
Current State: Your domain (2 years old, SaaS)
T* Score: 58 (moderate, needs growth)

T* Gaps:
├─ Referring domains: 45 (target: 100+ for authority)
├─ Brand searches: 200/month (niche, but growing)
├─ Brand mentions: 50/month (too low for awareness)
├─ Review score: 4.6/5.0 (good) ✓
├─ Review count: 23 (target: 50+)
├─ Author expertise: Medium (no published expertise signal)
└─ Topical authority: Medium (cover topic but not known as expert)

Strategy for T* Growth:
1. PR outreach: Place 5 articles in authority publications
   Impact: +10-15 quality backlinks
   Timeline: 8-12 weeks

2. Brand building: Increase visibility via
   - LinkedIn content (founder voice)
   - Industry speaking
   - Guest articles
   Impact: +100 brand mentions/month
   Timeline: Ongoing (6+ months to see effect)

3. Reputation management:
   - Encourage customer reviews (15 new reviews)
   - Get verified by G2/Capterra
   Impact: +30 reviews, verification badge
   Timeline: 4-6 weeks

4. Author expertise:
   - Have CEO publish expert article
   - Get author bio on industry sites
   Impact: Founder recognition
   Timeline: 2-3 weeks

Expected Improvement: 58 → 75 T* score = +2-3 positions
Timeline: 4-6 months
```

---

## NavBoost Analysis

### What is NavBoost?

**NavBoost** = Navigation Boosts (theory)

Google's system that **boosts pages that users click on more frequently** in search results.

```
How NavBoost Works:

1. User searches "sales software"
        ↓
2. Google shows SERP with results
        ↓
3. User clicks Result #3 (you) instead of #1-2
        ↓
4. User stays on your page (doesn't bounce back)
        ↓
5. Google records: "This user preferred #3 over #1"
        ↓
6. After enough users do this, Google boosts your ranking
        ↓
7. Your ranking improves for that keyword
```

### NavBoost Signals

```typescript
interface NavBoostSignals {
  // Click-Through Data
  click_through_rate: number;            // % who click your result
  position_specific_ctr: number;         // CTR vs expected for your position

  // Dwell Time
  time_on_page: number;                  // How long before returning to SERP
  scroll_depth: number;                  // How far down page they scroll

  // Return Behavior
  return_rate: number;                   // % who return to search
  pogo_sticking: boolean;                // Bounce back to SERP immediately

  // Long Click
  long_click: boolean;                   // Stayed away >30 minutes (satisfied)
  short_click: boolean;                  // Returned within 30s (not satisfied)

  // Re-engagement
  next_query: string | null;             // What they search next
  query_refinement: boolean;             // Modified their search

  // Device Behavior
  mobile_navboost: number;               // Mobile-specific CTR
  desktop_navboost: number;              // Desktop-specific CTR
}
```

### Exploiting NavBoost

```
Goal: Get more clicks on your SERP snippet to boost ranking

Current State: Your result for "sales software"
├─ Position: #8
├─ CTR: 3% (below 5% expected for position #8)
├─ Title: "Sales Software | [Your company]"
├─ Description: "Manage your sales process with our software..."

Problem: Your title/description aren't compelling enough.
Users see #1-7 first, many don't scroll to #8.

NavBoost Fix Strategy:

1. Improve Title for Click-Through
   Current: "Sales Software | [Your company]"
   New: "Sales Software That Closes More Deals (2025)"

   Psychology: Added specificity (2025), benefit (closes deals)
   Expected CTR improvement: 3% → 5-7%

2. Improve Meta Description
   Current: "Manage your sales process with our software..."
   New: "The #1 sales CRM for teams. Increase sales by 25-40%.
         Try free for 14 days. See why 5,000+ companies use us."

   Psychology: Social proof (5,000+ companies), specific benefit (25-40%)
   Expected CTR improvement: +2-3%

3. Add Schema Markup (Rich Snippet)
   Add: AggregateRating (4.6/5 from 23 reviews)
   Effect: Shows star ratings in SERP
   Expected CTR improvement: +10-15% (star ratings boost clicks)

4. Monitor & Iterate
   Test 2-3 variations every 2 weeks
   Track CTR changes
   Keep the best performers

Expected Result:
Position #8 with 7% CTR = ~50 clicks/month
Same position with new snippets + schema = ~75 clicks/month (+50%)
Better NavBoost signals = Ranking improvement over 8-12 weeks
After 12 weeks: Reach position #5-6 naturally
```

---

## E-E-A-T Framework

### The Four Pillars

**E-E-A-T** is Google's quality framework (from their Search Quality Raters Guidelines):

```
┌───────────────────────────────────────────────────────┐
│                      E-E-A-T                          │
├───────────────────────────────────────────────────────┤
│                                                       │
│  E = EXPERTISE (Original: "Experience")               │
│  "Does author have real experience?"                  │
│                                                       │
│  E = EXPERIENCE (New: Added in 2024)                  │
│  "Have they actually done what they're writing about?"│
│                                                       │
│  A = AUTHORITATIVENESS                               │
│  "Is this a trusted source in this field?"            │
│                                                       │
│  T = TRUSTWORTHINESS                                  │
│  "Is this accurate, transparent, and well-sourced?"   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Scoring E-E-A-T

**For Each Pillar: 0-100 Score**

#### E - Expertise (Experience)

```
Score Breakdown:

90-100: Expert level
├─ 15+ years in industry
├─ Published research/articles
├─ Speaking engagements
├─ Built relevant products
├─ Team credentials visible

70-89: Knowledgeable
├─ 5-15 years experience
├─ Some publications
├─ Practical experience
├─ Clear credentials

50-69: Informed
├─ 2-5 years experience
├─ Done the work they write about
├─ Basic credentials shown
├─ No major publications

30-49: Inexperienced
├─ Less than 2 years
├─ Limited real-world experience
├─ Credentials unclear

0-29: No expertise
├─ No relevant experience
├─ No credentials
├─ Just aggregating others' work
```

**Improving Expertise Score**:

```
Current: Author bio on article

Before:
"Written by John Smith, Content Manager at [Company]"
Score: 35 (no expertise signals)

After:
"Written by John Smith
15+ year sales industry veteran, previously Sales Director at Fortune 500.
Built sales systems for 50+ companies.
Published in: Harvard Business Review, Sales Hacker, Forbes.
Speaking: SalesConf 2024, Dreamforce, Modern Sales Pros.
Certifications: Salesforce Admin, HubSpot Academy"
Score: 92 (strong expertise signals)
```

#### E - Experience (Real-World)

```
What Google Wants to See:

"Have you actually done this?"

Examples:

Good:
✓ "I sold $10M in enterprise contracts. Here's what worked..."
✓ "Built and scaled 3 SaaS businesses to $1M+ ARR"
✓ "Managed 50+ salespeople across 5 continents"

Bad:
✗ "Most experts agree that..."
✗ "I read about sales best practices and..."
✗ "Here's what the research says..."
```

**Improving Experience Score**:

```
Article: "How to Build a Sales Pipeline"

Current: Generic advice based on research

Fix: Add personal experience sections

"Here's how I built my last sales pipeline:
- Month 1: Generated 200 leads via LinkedIn outreach
- Month 2: Converted to 25 meetings, 5 qualified deals
- Month 3: 2 deals closed ($50K total), 3 in pipeline

This generated $500K pipeline with 30% close rate.
Here's the exact process I used..."
```

#### A - Authoritativeness

```
What Google Looks For:

"Is this a trusted source?"

Signals:

✓ Website authority (Domain Authority 40+)
✓ Backlinks from authority sites
✓ Mentioned in Wikipedia
✓ Featured in major publications
✓ Industry recognition/awards
✓ Academic backing
✓ Brand reputation
```

**Improving Authoritativeness**:

```
Action Plan:

1. Earn Backlinks
   Goal: Get 10 backlinks from authority sites (DA 50+)
   Method: Outreach, expert commentary, original research
   Timeline: 8-12 weeks
   Impact: +20 authority score

2. Get Published
   Target: 3 articles in top industry publications
   Examples: HBR, Forbes, Inc, Entrepreneur
   Timeline: 12 weeks
   Impact: +15 authority score

3. Build Brand Recognition
   Goal: 500+ brand searches/month
   Method: LinkedIn thought leadership, speaking, content
   Timeline: 6 months
   Impact: +15 authority score

4. Earn Certifications
   Get relevant certifications (Salesforce, HubSpot, etc.)
   Display prominently
   Impact: +10 authority score
```

#### T - Trustworthiness

```
What Google Looks For:

"Can I trust this source?"

Signals:

✓ Citations and sources (links to data)
✓ Author credentials visible
✓ Updated regularly
✓ Clear about limitations
✓ Conflict of interest disclosure
✓ Transparent author/company info
✓ Positive reviews
✓ Security (HTTPS, trust badges)
```

**Improving Trustworthiness**:

```
Article: "Top 5 Sales Software"

Trust Issues:
✗ No author credentials
✗ No publication date visible
✗ No disclosure you sell alternative product
✗ No links to sources
✗ No reviews shown
✗ Outdated content

Fixes:

Author Section:
"Written by John Smith, former B2B sales director with 15 years experience.
Earned: Salesforce Admin, HubSpot Academy certifications.
Disclaimer: We sell competing product. We've tried to be objective anyway."

Source Attribution:
"According to G2 reviews (4.8/5 from 2,340 users)..."
"Capterra data shows average pricing of $99/seat/month..."

Freshness:
"Last updated: November 28, 2025"
"We update this quarterly as products change"

Objectivity:
"Limitations of this review: We only covered software we've tested personally.
Price/features change frequently. Always verify current information."

Trust Score Improvement: 45 → 85 (major gain)
```

### E-E-A-T Gap Analysis

```
Your Content Audit

Article: "How to Improve Sales Performance"

Current E-E-A-T Scores:
E (Expertise): 65 ────────────────────────── Goal: 85
E (Experience): 55 ──────────────────── Goal: 80
A (Authority): 48 ─────────────── Goal: 75
T (Trust): 72 ──────────────────────── Goal: 90

Overall E-E-A-T Score: 60 (Goal: 82)

Top 3 Improvements to Implement:

1. ADD EXPERIENCE (55 → 80)
   "Real-world examples from my 15 years selling"
   Effort: 2 hours writing
   Impact: +25 score

2. ADD AUTHORITATIVE SOURCES (48 → 75)
   Get 5 quotes from sales leaders
   Get 1 contribution from industry expert
   Effort: 3 hours outreach
   Impact: +27 score

3. IMPROVE TRANSPARENCY (72 → 90)
   Show author credentials
   Cite all data sources
   Add update date
   Effort: 1 hour
   Impact: +18 score
```

---

## Gap Analysis Methodology

### Finding Your Competitive Gaps

**Gap = Something competitors rank for, you don't (or rank poorly for)**

```
Gap Analysis Process:

1. Identify Competitors
   → Who you're really competing with in organic search

2. Export Their Keywords
   → 100-500 keywords they rank for

3. Compare Against Your Keywords
   → What do they have that you don't?

4. Prioritize Gaps
   → By search volume and difficulty

5. Create Content
   → Fill the gaps with better content

6. Track Improvement
   → Monitor ranking and traffic gains
```

### Types of Gaps

```
Gap Type 1: KEYWORD GAPS
├─ They rank, you don't
├─ Examples:
│  ├─ Competitor ranks for "sales software for SMBs"
│  └─ You don't have that keyword
├─ Fix: Create content for that keyword
└─ Gain: +200 traffic/month if #5 position

Gap Type 2: CONTENT GAPS
├─ Same topic, their version is better
├─ Examples:
│  ├─ You have 500-word blog on "sales tips"
│  └─ They have 3,000-word guide with visuals/tools
├─ Fix: Expand and improve your content
└─ Gain: +50-100 traffic/month (move from #8 to #5)

Gap Type 3: BACKLINK GAPS
├─ They have links you don't
├─ Examples:
│  ├─ They're linked by TechCrunch, Forbes, HBR
│  └─ You're linked by 5 blogs
├─ Fix: Earn links from same/similar sources
└─ Gain: +2-3 positions over 6 months

Gap Type 4: FEATURE GAPS
├─ SERP features they have, you don't
├─ Examples:
│  ├─ They have featured snippet
│  └─ You have regular listing
├─ Fix: Optimize for featured snippet format
└─ Gain: +50% CTR (featured snippet boost)

Gap Type 5: AUTHORITY GAPS
├─ They have stronger E-E-A-T
├─ Examples:
│  ├─ They wrote the original research
│  └─ You cited their research
├─ Fix: Build your own authority (original research, publishing)
└─ Gain: +3-5 positions (for competitive keywords)
```

### Gap Scoring

```typescript
interface CompetitorGap {
  gap_id: string;
  gap_type: 'keyword' | 'content' | 'backlink' | 'feature' | 'authority';

  // The Gap
  keyword: string;
  search_volume: number;              // Searches per month
  competitor_position: number;        // Where they rank
  your_position: number | null;       // Where you rank (if at all)

  // Opportunity Sizing
  traffic_potential: number;          // Organic traffic if you rank #5
  difficulty_score: number;           // 0-100 (100 = hardest)
  estimated_effort_hours: number;     // To implement fix

  // ROI Calculation
  effort_roi: number;                 // Traffic potential / effort hours
  time_to_rank: 'quick' | 'medium' | 'slow';  // Timeline

  // Priority
  priority_score: number;             // 0-100 (100 = highest priority)
}
```

### Priority Framework

```
Gap Priority = (Traffic Potential × 100) / (Difficulty × Effort)

Example:
Gap #1: "Sales software for teams"
├─ Traffic potential: 500/month
├─ Difficulty: 45
├─ Effort: 8 hours
└─ Priority: (500 × 100) / (45 × 8) = 138 ← HIGH PRIORITY

Gap #2: "Best sales CRM"
├─ Traffic potential: 200/month
├─ Difficulty: 75
├─ Effort: 20 hours
└─ Priority: (200 × 100) / (75 × 20) = 13 ← LOW PRIORITY

Action: Focus on Gap #1 first (better ROI)
```

---

## Audit Workflow

### Step 1: Setup Audit Job

```
POST /api/seo-leak/audit

Body: {
  "url": "https://yoursite.com",
  "audit_type": "full",  // full, technical, content, backlinks
  "founder_business_id": "xxx"
}

Response: {
  "audit_job_id": "job_123",
  "status": "pending",
  "expected_completion": "2 hours",
  "message": "Audit queued. Results will appear in your dashboard."
}
```

### Step 2: Audit Execution

```
Behind the scenes:

Job Status: RUNNING

1. Crawl Site
   └─ Discovered 45 pages

2. Fetch DataForSEO Data
   └─ Downloaded rankings for 2,000 keywords
   └─ Fetched competitor data
   └─ Got backlink analysis

3. Analyze Signals
   └─ Calculated Q*, P*, T* scores
   └─ Identified gaps vs 5 competitors
   └─ Detected technical issues

4. Generate Report
   └─ Creating audit report
   └─ Identifying top 20 quick wins
   └─ Prioritizing gaps by ROI

5. Store Results
   └─ Saving to database
   └─ Creating trend data

Completion: 95% - 30 minutes remaining
```

### Step 3: Review Results

```
GET /api/seo-leak/audit?audit_id=job_123

Response:

{
  "audit": {
    "id": "job_123",
    "domain": "yoursite.com",
    "completed_at": "2025-11-28T14:32:00Z",

    "overall_scores": {
      "q_star": 72,        // Query Intelligence
      "p_star": 81,        // Page Quality
      "t_star": 58,        // Trust & Authority
      "overall_seo": 70
    },

    "gaps_identified": [
      {
        "gap_id": "gap_001",
        "type": "keyword",
        "keyword": "sales software for teams",
        "search_volume": 480,
        "competitor_position": 3,
        "your_position": null,
        "traffic_potential": 450,
        "difficulty": 42,
        "effort_hours": 6,
        "priority_score": 87
      },
      // ... 19 more gaps
    ],

    "quick_wins": [
      {
        "issue": "Missing alt text on 12 product images",
        "impact": "SEO score +3, potential +50 traffic",
        "effort": "30 minutes",
        "priority": "high"
      },
      // ... more quick wins
    ],

    "technical_issues": [
      {
        "issue": "Page load time 4.2s (target: <2.5s)",
        "impact": "Losing 15% potential traffic",
        "fix": "Image optimization + CDN",
        "effort": "4 hours"
      },
      // ... more technical issues
    ],

    "content_opportunities": [
      {
        "topic": "Sales automation",
        "reason": "5 competitors rank for this, you don't",
        "search_volume": 2100,
        "recommended_format": "Comparison guide",
        "effort": "8-10 hours"
      },
      // ... more opportunities
    ]
  }
}
```

### Step 4: Action Planning

```
Based on audit results, create action plan:

PRIORITY 1: Quick Wins (Do This Week)
├─ Add alt text to images (30 min)
├─ Update last modified dates (15 min)
├─ Fix 3 broken internal links (20 min)
└─ Impact: +1 position on 5 keywords

PRIORITY 2: Content Improvements (Do This Month)
├─ Expand "Sales Tips" blog (2,000 → 3,500 words)
├─ Add featured snippet optimization
├─ Create "Sales Software Comparison" guide
└─ Impact: +2-3 positions, +300-500 traffic/month

PRIORITY 3: Technical Optimization (Do Next Month)
├─ Optimize images (reduce by 40%)
├─ Implement lazy loading
├─ Optimize JavaScript loading
└─ Impact: P* score 81 → 90, +1 position

PRIORITY 4: Authority Building (Long-term)
├─ Target 5 backlinks from DA 50+ sites
├─ Publish in 2 industry publications
├─ Build brand mentions (LinkedIn content)
└─ Impact: T* score 58 → 75, +2-3 positions over 6 months
```

---

## Interpreting Results

### Score Card

```
Your SEO Health Report

┌───────────────────────────────────────────┐
│ Overall SEO Score: 70/100                 │
│ Grade: B (Good, room for improvement)     │
└───────────────────────────────────────────┘

Query Intelligence (Q*): 72 ━━━━━━━━━━ 72%
  └─ You answer your keywords well
  └─ Good content depth
  ⚠ Missing 5 high-volume keywords

Page Quality (P*): 81 ━━━━━━━━━━━━━ 81%
  └─ Fast loading (3.1s)
  └─ Mobile-friendly
  ⚠ Core Web Vitals: CLS needs work

Trust & Authority (T*): 58 ━━━━━━ 58%
  └─ Moderate backlink profile
  ⚠ Need more brand awareness
  ⚠ Limited thought leadership

E-E-A-T Score: 65 ━━━━━━━ 65%
  └─ Good expertise shown
  └─ Limited original research
  ⚠ Authority could be stronger
```

### Traffic Impact

```
If You Implement Top 10 Gaps:

Current Organic Traffic: 5,200/month

Gap #1 (Sales software for teams): +450/month
Gap #2 (CRM comparison): +380/month
Gap #3 (Featured snippet optimization): +220/month
Gap #4-10: +580/month

Total Potential: +1,630/month (31% increase)

New projected traffic: 6,830/month

Investment:
├─ Quick wins: 1.5 hours
├─ Content creation: 40 hours
├─ Technical optimization: 12 hours
├─ Total: 53.5 hours (1.5 weeks full-time)

ROI:
├─ Additional traffic/year: 19,560 visits
├─ Cost per visit: $0.01 (minimal)
├─ Est. additional revenue: $5,000-15,000/year
└─ Effective ROI: 1000%+
```

---

## Action Items

### Checklist

```
Post-Audit Implementation

□ Q* Improvements (Query Intelligence)
  □ Identify 3-5 high-volume keywords you don't rank for
  □ Create/expand content for each
  □ Optimize for featured snippets
  □ Add People Also Ask answers
  □ Improve content formatting

□ P* Improvements (Page Quality)
  □ Run PageSpeed Insights
  □ Fix critical performance issues
  □ Add missing alt text
  □ Test Core Web Vitals
  □ Optimize images
  □ Implement lazy loading
  □ Update last modified dates

□ T* Improvements (Trust & Authority)
  □ Identify 5-10 link prospects
  □ Create linkable assets (guides, research, tools)
  □ Execute outreach campaign
  □ Monitor backlink growth
  □ Build brand mentions on LinkedIn

□ E-E-A-T Improvements
  □ Add detailed author bios
  □ Show real expertise (experience, credentials)
  □ Source all claims
  □ Disclose conflicts of interest
  □ Add update dates
  □ Get original research/data

□ Gap Closure
  □ Create content for top 10 keyword gaps
  □ Implement content gaps (expand weak content)
  □ Target backlink gaps
  □ Optimize for SERP features

□ Monitoring
  □ Set up rank tracking
  □ Monitor traffic weekly
  □ Track backlink growth
  □ Review CTR trends
  □ Analyze competitor changes
```

---

## Examples

### Example 1: Keyword Gap Discovery

```
Your Domain: salessoftware.com
Top Competitor: hubspot.com

HubSpot ranks for 2,500+ keywords
You rank for 800 keywords

Top 20 Keywords HubSpot Has That You Don't:

1. "CRM software" (14,400 searches) ← HubSpot #2
2. "Sales automation" (6,100 searches) ← HubSpot #1
3. "Customer relationship management" (4,400) ← HubSpot #3
4. "Lead management software" (3,200) ← HubSpot #4
5. "Contact management software" (2,800) ← HubSpot #5

... and 15 more

Action Plan:

Priority #1: "Sales automation"
├─ Search volume: 6,100/month
├─ Content idea: "Sales Automation Guide for Teams"
├─ Format: 3,500 word guide + comparison table
├─ Competition: Medium difficulty (HubSpot is #1, not impossible)
├─ Effort: 10 hours
├─ Potential: #5-7 position = 300-400 traffic/month

Priority #2: "Lead management software"
├─ Search volume: 3,200/month
├─ Content idea: "How to Choose Lead Management Software"
├─ Format: Comparison guide + features checklist
├─ Competition: Medium-high difficulty
├─ Effort: 12 hours
├─ Potential: #6-8 position = 150-200 traffic/month

Implementation Timeline:
Week 1: Research and outline both pieces
Week 2: Write "Sales automation" guide
Week 3: Write "Lead management" comparison
Week 4: Get backlinks, promote content
Month 2-3: Monitor rankings and iterate
```

### Example 2: Content Gap Analysis

```
Your Article vs Competitor Article

Topic: "7 Sales Best Practices"

YOUR VERSION:
├─ Length: 1,200 words
├─ Format: Listicle
├─ Structure: Intro + 7 short tips + conclusion
├─ Visuals: 3 stock images
├─ Data: No original data
├─ Tools: No tools provided
├─ Current ranking: #8 on target keyword
└─ Traffic: 25/month

COMPETITOR VERSION (Rank #2):
├─ Length: 4,200 words
├─ Format: Comprehensive guide
├─ Structure: Intro + 7 detailed sections + implementation guide
├─ Visuals: 15+ custom diagrams and charts
├─ Data: Original survey of 500 sales reps
├─ Tools: 3 tools provided, download templates
├─ Current ranking: #2
└─ Traffic: 300+/month

Gap Analysis:

What They Have That You Don't:
✗ Original research (they surveyed sales reps)
✗ Detailed explanations (4-5 paragraphs vs 1-2)
✗ Visual diagrams (not just stock photos)
✗ Actionable tools (templates, checklists)
✗ Implementation guide (how-to section)

Your Improvement Plan:

1. Expand to 3,500+ words (+2,300 words)
2. Add original data (survey 100+ sales reps)
3. Create custom diagrams for each tip
4. Add 3 downloadable templates
5. Add step-by-step implementation guide
6. Update introduction with new angle

Expected Result:
Content score: 65 → 92 (major improvement)
Position: #8 → #4-5 (after improvements gain traction)
Traffic: 25 → 250+/month (900%+ increase)

Implementation Timeline:
├─ Research & survey: 8 hours
├─ Writing expansion: 6 hours
├─ Create diagrams: 4 hours
├─ Create templates: 2 hours
├─ Edit & publish: 2 hours
└─ Total: 22 hours (1 week part-time)
```

---

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Next Review**: 2025-12-28

Ready to audit your SEO? Start with a full site audit to identify your biggest opportunities.
