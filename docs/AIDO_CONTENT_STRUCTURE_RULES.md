# AIDO Content Structure Rules - Algorithmic Immunity

**Critical Rules for AI Citation & Google 2026 Algorithm**

**Date**: 2025-11-25
**Priority**: P0 - MANDATORY FOR ALL CONTENT GENERATION

---

## RULE 1: H2/H3 = Direct Questions → Immediate Answers

### ❌ WRONG (Fluff Structure)
```markdown
## Google Ranking Timeline

When you're thinking about SEO, there are many factors to consider. First, we need to understand search engines. Google is the most popular search engine in the world and has a complex algorithm...
```

### ✅ CORRECT (Question → Answer Structure)
```markdown
## How long does it take to rank on Google?

Most new websites take 3-6 months to rank for competitive keywords, though low-competition terms can rank within weeks. Factors include domain authority, content quality (E-E-A-T), and backlink profile.
```

**Why This Works**:
- AI Overviews cite direct Q&A structures
- ChatGPT Search prefers immediate answers
- Perplexity indexes question-based headings
- Zero fluff = maximum AI source score

---

## RULE 2: Entity Verification (Prove You Are Real)

### Requirements for EVERY Content Asset

**1. Author Byline** (at top of content):
```markdown
**Written by**: [Author Name], [Credentials]
**Updated**: [Date]
**Verified by**: [Editor Name], [Position]
```

**2. Author Profile Section** (at bottom of content):
```markdown
## About the Author

![Author Photo](author-image.jpg)

**[Author Name]** is a [credentials] with [X years] of experience in [industry]. [Brief bio highlighting expertise].

- 🔗 LinkedIn: [profile-url]
- 🔗 Facebook: [profile-url]
- 📧 Email: [contact]

[Link to full About page]
```

**3. Business Credentials**:
- Professional licenses/certifications
- Industry memberships
- Awards/recognition
- Years in business
- Client testimonials count

**4. Schema.org Person Markup**:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Author Name",
  "jobTitle": "Position",
  "worksFor": {
    "@type": "Organization",
    "name": "Company Name"
  },
  "url": "https://company.com/about/author-name",
  "sameAs": [
    "https://linkedin.com/in/author",
    "https://facebook.com/author"
  ],
  "image": "https://company.com/images/author.jpg",
  "alumniOf": "University Name",
  "knowsAbout": ["Industry Topic 1", "Industry Topic 2"]
}
```

**Why This Works**:
- Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- AI systems verify author credibility before citing
- Entity linking (LinkedIn, Facebook) proves real humans
- Schema.org helps Google understand author expertise

---

## RULE 3: Speak Robot (Schema & Structured Data)

### Required Schema Types by Content Type

**Guide/Article**:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Content Title",
  "author": { "@type": "Person", "name": "Author Name" },
  "datePublished": "2025-11-25",
  "dateModified": "2025-11-25",
  "publisher": {
    "@type": "Organization",
    "name": "Company Name",
    "logo": { "@type": "ImageObject", "url": "logo.jpg" }
  },
  "mainEntityOfPage": "https://url.com/article"
}
```

**FAQ Content** (MANDATORY for Q&A sections):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long does it take to rank on Google?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most new websites take 3-6 months to rank..."
      }
    }
  ]
}
```

**HowTo Content**:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Install Stainless Steel Balustrades",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Measure the area",
      "text": "Use a tape measure to...",
      "image": "step1.jpg"
    }
  ]
}
```

**Service Pages**:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Balustrade Installation",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Company Name",
    "address": { "@type": "PostalAddress", "addressLocality": "Brisbane" }
  },
  "areaServed": "Brisbane, QLD"
}
```

**Why This Works**:
- AI systems parse Schema.org before natural language
- Structured data = guaranteed understanding
- FAQPage schema directly feeds AI Overviews
- HowTo schema appears in rich results

---

## RULE 4: Redefine Success (New KPIs)

### Traditional SEO KPIs (Still Important, But Less Weight)
- Organic clicks (30% weight)
- Keyword rankings (20% weight)
- Backlinks (20% weight)

### New AIDO KPIs (Higher Weight for 2026)
- **AI Citation Rate** (30% weight) - How often AI systems cite your content
- **Entity Mentions** (25% weight) - Brand mentioned in AI answers
- **Zero-Click Dominance** (25% weight) - Featured in AI Overviews, ChatGPT, Perplexity
- **Platform Presence** (20% weight) - Active on YouTube, LinkedIn, Facebook, Instagram, TikTok, Reddit

### Measuring AI Citation Rate

**Method 1: Manual Sampling**
```
1. Query 20 target keywords in ChatGPT Search
2. Count: How many times is client brand/domain cited?
3. Citation Rate = (Citations / 20) * 100%

Target: 40%+ citation rate
```

**Method 2: Google Search Console (Zero-Click Analysis)**
```
1. Track impressions vs clicks ratio
2. High impressions, low clicks = appearing in AI Overviews
3. Monitor "People Also Ask" inclusion

Target: 50%+ zero-click impressions
```

**Method 3: Perplexity Pro API**
```javascript
// Query Perplexity for target keywords
const response = await perplexity.search(keyword);
const citations = response.citations.filter(c =>
  c.url.includes(clientDomain)
);
// Track citation frequency
```

---

## RULE 5: Be Everywhere (Omnichannel Entity Presence)

### Minimum Platform Requirements per Client

**Must-Have (Updated Weekly)**:
1. **Google Business Profile** - Weekly posts, photos, Q&A monitoring
2. **YouTube** - 1-2 videos per month (embed in content)
3. **LinkedIn** - 3-5 posts per week (company + personal profiles)
4. **Facebook** - Daily engagement, community building

**Should-Have (Updated Bi-Weekly)**:
5. **Instagram** - Stories, reels, project showcases
6. **TikTok** - Short-form educational content
7. **Reddit** - Participate in industry subreddits (no spam)

**Nice-to-Have (Monthly)**:
8. **Pinterest** - Visual content for design-heavy industries
9. **X (Twitter)** - Industry news, quick tips
10. **Industry Forums** - Active participation, expertise demonstration

### Content Distribution Strategy

**For Each Blog Post**:
1. Publish on website
2. LinkedIn article (same content, author byline)
3. YouTube script (video version)
4. Facebook long-form post (summary + link)
5. Instagram carousel (key points)
6. TikTok short (1 key tip)
7. Reddit discussion (value-first, link in comments)
8. Pinterest pin (infographic version)

**Why This Works**:
- Google's entity graph connects all platforms
- AI systems verify entities across multiple sources
- More platform mentions = higher trustworthiness
- Cross-platform consistency = authority signal

---

## IMPLEMENTATION: Content Generation AI Updates

### Update to `content-generation-ai.ts`

**New System Prompt Additions**:
```typescript
const AIDO_STRUCTURE_RULES = `
CRITICAL STRUCTURE RULES (NON-NEGOTIABLE):

1. H2/H3 HEADINGS = DIRECT QUESTIONS ONLY
   - Frame every H2/H3 as the exact question users ask
   - Answer immediately beneath the heading (first sentence)
   - NO fluff, NO preamble, NO "there are many factors"

   Example:
   ## How much does [service] cost in [location]?
   The average cost is $X-$Y depending on [factors]. Most projects...

2. ZERO FLUFF POLICY
   - First sentence = direct answer with numbers/facts
   - Second sentence = key context
   - Third sentence = important qualifier
   - NO: "When thinking about...", "First, we need to understand..."
   - YES: "Most projects take 3-6 months and cost $5k-15k."

3. ENTITY VERIFICATION REQUIRED
   - Author byline at top (name, credentials, date)
   - Author profile at bottom (photo, bio, social links)
   - Business credentials mentioned in first 200 words
   - Schema.org Person markup for author

4. SPEAK ROBOT (SCHEMA REQUIRED)
   - FAQPage schema for ALL Q&A sections
   - Article schema for guides
   - HowTo schema for instructional content
   - Service schema for service pages
   - LocalBusiness schema if location-specific

5. CONTENT LENGTH TARGETING
   - Minimum 2000 words for competitive topics
   - 10-15 H2 questions minimum
   - 3-5 H3 sub-questions per H2
   - Each answer: 100-200 words (factual density)
`;

const systemPrompt = `${BASE_SYSTEM_PROMPT}

${AIDO_STRUCTURE_RULES}

Target Scores:
- Authority Score: ${targetScores.authority} (expert depth, citations, credentials)
- Evergreen Score: ${targetScores.evergreen} (timeless value vs time-sensitivity)
- AI Source Score: ${targetScores.aiSource} (clarity, structure, factual density)

STRUCTURE EXAMPLE:

## How long does stainless steel balustrade installation take?

Most residential installations take 2-4 days for a standard project (10-15 metres), while commercial projects require 1-2 weeks. Installation time depends on site complexity, handrail configuration, and Australian Standard compliance requirements.

### What factors affect installation time?

Site preparation accounts for 40% of timeline variations. Concrete curing (24-48 hours), structural inspections, and weather conditions can extend timelines. Pre-fabricated systems install faster than custom on-site welding.

[Continue with 8-12 more H2 questions...]

## About the Author

**John Smith** is a licensed balustrade installer with 15 years of experience in Brisbane. Certified by the Australian Institute of Building, John has completed over 200 commercial and residential projects across Queensland.

- 🔗 LinkedIn: linkedin.com/in/johnsmith
- 🔗 Facebook: facebook.com/johnsmithbuilder
- 📧 Email: john@company.com

[Read more about John on our About page]
`;
```

### New Validation Rules

**Content Validation Before Saving**:
```typescript
export function validateAIDOStructure(content: ContentAsset): ValidationResult {
  const errors: string[] = [];

  // Rule 1: Check H2/H3 are questions
  const h2Headings = content.bodyMarkdown.match(/^## (.+)$/gm) || [];
  const questionHeadings = h2Headings.filter(h =>
    h.includes('?') ||
    h.toLowerCase().startsWith('## how') ||
    h.toLowerCase().startsWith('## what') ||
    h.toLowerCase().startsWith('## why') ||
    h.toLowerCase().startsWith('## when') ||
    h.toLowerCase().startsWith('## where')
  );

  if (questionHeadings.length < h2Headings.length * 0.8) {
    errors.push('Less than 80% of H2 headings are questions');
  }

  // Rule 2: Check for fluff phrases
  const fluffPhrases = [
    'there are many factors',
    'when thinking about',
    'first, we need to understand',
    'it\'s important to consider',
    'before we dive in'
  ];

  const hasFluff = fluffPhrases.some(phrase =>
    content.bodyMarkdown.toLowerCase().includes(phrase)
  );

  if (hasFluff) {
    errors.push('Content contains fluff phrases - remove immediately');
  }

  // Rule 3: Check for author byline
  const hasAuthorByline = content.bodyMarkdown.includes('**Written by**') ||
                          content.bodyMarkdown.includes('Author:');

  if (!hasAuthorByline) {
    errors.push('Missing author byline at top of content');
  }

  // Rule 4: Check for author profile section
  const hasAuthorProfile = content.bodyMarkdown.includes('## About the Author');

  if (!hasAuthorProfile) {
    errors.push('Missing author profile section at bottom');
  }

  // Rule 5: Check for Schema.org types
  if (!content.schemaTypes.includes('FAQPage') && content.qaBlocks.length > 0) {
    errors.push('Content has Q&A but missing FAQPage schema');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

### Updated AI Source Score Calculation

```typescript
export function calculateAISourceScore(content: ContentAsset): number {
  let score = 0.3; // Lower base score (stricter)

  // H2/H3 as questions (+0.25)
  const h2Headings = (content.bodyMarkdown.match(/^## (.+)$/gm) || []);
  const questionHeadings = h2Headings.filter(h =>
    h.includes('?') ||
    h.toLowerCase().includes('how') ||
    h.toLowerCase().includes('what') ||
    h.toLowerCase().includes('why')
  );
  const questionRatio = questionHeadings.length / Math.max(h2Headings.length, 1);
  score += questionRatio * 0.25;

  // Immediate answers (check first sentence after H2) (+0.20)
  const h2Sections = content.bodyMarkdown.split(/^## /gm).slice(1);
  let immediateAnswers = 0;
  h2Sections.forEach(section => {
    const firstSentence = section.split('\n')[1] || '';
    // Check if first sentence has numbers/facts
    if (/\d+/.test(firstSentence) && firstSentence.length < 300) {
      immediateAnswers++;
    }
  });
  score += (immediateAnswers / Math.max(h2Sections.length, 1)) * 0.20;

  // No fluff phrases (+0.15)
  const fluffPhrases = [
    'there are many factors',
    'when thinking about',
    'first, we need to understand',
    'it\'s important to consider'
  ];
  const hasFluff = fluffPhrases.some(phrase =>
    content.bodyMarkdown.toLowerCase().includes(phrase)
  );
  if (!hasFluff) score += 0.15;

  // Entity verification (+0.15)
  const hasAuthor = content.bodyMarkdown.includes('## About the Author');
  const hasByline = content.bodyMarkdown.includes('**Written by**');
  const hasSocial = content.bodyMarkdown.includes('LinkedIn:') ||
                    content.bodyMarkdown.includes('Facebook:');
  if (hasAuthor && hasByline && hasSocial) score += 0.15;

  // Schema.org coverage (+0.15)
  const hasRequiredSchemas =
    (content.schemaTypes.includes('FAQPage') && content.qaBlocks.length > 0) ||
    content.schemaTypes.includes('HowTo') ||
    content.schemaTypes.includes('Service');
  if (hasRequiredSchemas) score += 0.15;

  // Factual density (+0.10)
  const factualPatterns = [
    /\b\d+%\b/g,
    /\b\d+\s*(km|m|kg|g|hours|minutes|days|weeks|months|years)\b/gi,
    /\b\d{4}\b/g,
    /\$([\d,]+)/g,
  ];
  let factualStatements = 0;
  factualPatterns.forEach(pattern => {
    const matches = content.bodyMarkdown.match(pattern);
    if (matches) factualStatements += matches.length;
  });
  if (factualStatements >= 30) score += 0.10;
  else if (factualStatements >= 20) score += 0.07;
  else if (factualStatements >= 10) score += 0.05;

  return Math.min(score, 1.0);
}
```

---

## IMPLEMENTATION: Reality Events Schema

### New Reality Event Type: Platform Updates

```typescript
interface PlatformUpdateEvent extends RealityEvent {
  eventType: 'platform_update';
  sourceSystem: 'gmb' | 'youtube' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'reddit';
  normalizedPayload: {
    platform: string;
    updateType: 'post' | 'video' | 'comment' | 'review' | 'share';
    engagement: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
    };
    contentOpportunity: {
      score: number; // 0.0-1.0
      suggestedTopics: string[];
      relatedQuestions: string[]; // For H2 headings
    };
  };
}
```

### Omnichannel Presence Tracking

```sql
-- Add to migration 205 (new)
CREATE TABLE IF NOT EXISTS platform_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  update_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  engagement_metrics JSONB DEFAULT '{}',
  entity_verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_presence_client ON platform_presence(client_id);
CREATE INDEX idx_platform_presence_platform ON platform_presence(platform);
```

---

## QUICK REFERENCE: Content Checklist

### Before Publishing ANY Content:

- [ ] All H2/H3 headings are direct questions (80%+ compliance)
- [ ] First sentence after each H2 is direct answer with numbers/facts
- [ ] Zero fluff phrases detected
- [ ] Author byline at top (name, credentials, date)
- [ ] Author profile section at bottom (photo, bio, social links, email)
- [ ] Business credentials mentioned in first 200 words
- [ ] FAQPage schema for Q&A sections
- [ ] Article/HowTo/Service schema as appropriate
- [ ] Schema.org Person markup for author
- [ ] Minimum 10 H2 questions
- [ ] 2000+ words total
- [ ] Authority score ≥ 0.8
- [ ] Evergreen score ≥ 0.7
- [ ] AI Source score ≥ 0.8
- [ ] Distribution plan ready (8+ platforms)

---

## SUCCESS METRICS (New KPIs)

### Track Monthly per Client:

**AI Citation Rate**:
- Target: 40%+ (client cited in 40% of relevant AI answers)
- Measure: Manual sampling of 20 target keywords in ChatGPT, Perplexity, Gemini

**Entity Mentions**:
- Target: 50+ brand mentions per month in AI answers
- Measure: Brand monitoring across AI platforms

**Zero-Click Dominance**:
- Target: 50%+ impressions without clicks (appearing in AI Overviews)
- Measure: Google Search Console zero-click analysis

**Platform Presence Score**:
- Target: 8/10 platforms active with weekly updates
- Measure: Platform update tracking table

**Traditional SEO** (Still Important):
- Organic clicks: Target growth 10-20% MoM
- Keyword rankings: Monitor but don't obsess
- Backlinks: Quality over quantity

---

**Document Status**: Complete
**Last Updated**: 2025-11-25
**Priority**: P0 - MANDATORY FOR CONTENT GENERATION
**Next Action**: Update content-generation-ai.ts system prompts immediately
