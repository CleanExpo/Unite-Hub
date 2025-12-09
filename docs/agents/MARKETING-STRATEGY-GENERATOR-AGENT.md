# MARKETING STRATEGY GENERATOR AGENT SPECIFICATION

**Agent Name**: Marketing Strategy Generator Agent
**Agent Type**: Tier 3 - Questionnaire & Strategy Agent
**Priority**: P2 - Important
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `marketing_strategies` - Strategy documents (read/write)
- `marketing_personas` - Buyer personas (read/write)
- `email_intelligence` - Email analysis data (read-only)
- `media_files` (ai_analysis) - Media intelligence (read-only)
- `questionnaire_responses` - Questionnaire answers (read-only)
- `contacts` - Client information (read-only)
- `dynamic_questionnaires` - Client questionnaires (read-only)

### Agent Purpose
Compiles all intelligence sources (emails, calls, questionnaire responses) to generate comprehensive marketing strategies including buyer personas, brand positioning, content pillars, 90-day campaign calendars, KPIs, and risk mitigation.

---

## 2. CORE FUNCTIONS

### 2.1 generateStrategy()
**Purpose**: Generate comprehensive marketing strategy from all intelligence sources.

**Input**:
```typescript
interface GenerateStrategyRequest {
  contact_id: string;
  workspace_id: string;
  strategy_type?: 'full' | 'content_only' | 'campaign_only'; // Default: 'full'
  timeline_months?: number; // Default: 3
}
```

**Output**:
```typescript
interface GenerateStrategyResult {
  success: boolean;
  strategy_id: string;
  strategy: MarketingStrategy;
}

interface MarketingStrategy {
  strategy_title: string;
  executive_summary: string;
  objectives: string[];
  target_personas: Persona[];
  brand_positioning: BrandPositioning;
  content_pillars: ContentPillar[];
  campaign_calendar: CampaignCalendar;
  kpis: KPI[];
  budget_allocation: BudgetAllocation;
  risks_and_mitigation: Risk[];
  next_steps: string[];
}

interface Persona {
  persona_name: string;
  description: string;
  demographics: {
    age_range?: string;
    location?: string;
    income_range?: string;
    job_title?: string;
    industry?: string;
  };
  pain_points: string[];
  goals: string[];
  preferred_channels: string[];
  content_preferences: string[];
  buying_triggers: string[];
}

interface BrandPositioning {
  unique_value_proposition: string;
  key_differentiators: string[];
  brand_voice: string; // "Professional", "Casual", "Authoritative"
  brand_personality: string[]; // ["Innovative", "Trustworthy", "Approachable"]
  messaging_framework: {
    core_message: string;
    supporting_messages: string[];
  };
}

interface ContentPillar {
  name: string;
  description: string;
  themes: string[];
  content_types: string[]; // ["blog", "video", "infographic"]
  target_personas: string[];
  platforms: string[];
  percentage_allocation: number; // 0-100
}

interface CampaignCalendar {
  start_date: Date;
  end_date: Date;
  phases: CampaignPhase[];
  total_posts: number;
  platform_breakdown: Record<string, number>;
}

interface CampaignPhase {
  phase_name: string;
  start_date: Date;
  end_date: Date;
  objectives: string[];
  key_activities: string[];
  content_focus: string[];
}

interface KPI {
  metric_name: string;
  target_value: string;
  measurement_method: string;
  timeline: string; // "Weekly", "Monthly", "Quarterly"
  owner: string;
}

interface BudgetAllocation {
  total_budget?: string;
  allocation: {
    category: string; // "Content Creation", "Paid Ads", "Tools"
    percentage: number;
    estimated_amount?: string;
  }[];
}

interface Risk {
  risk: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}
```

**Business Logic**:
1. **Fetch all intelligence sources**:
   ```typescript
   const intelligence = {
     emails: await getEmailIntelligence(contact_id),
     media: await getMediaAnalysis(contact_id),
     questionnaires: await getQuestionnaireResponses(contact_id),
     contact: await getContactProfile(contact_id),
     gaps: await getKnowledgeGaps(contact_id),
   };
   ```

2. **Build comprehensive Claude prompt**:
   ```typescript
   const prompt = `Generate a comprehensive marketing strategy for this client.

CLIENT PROFILE:
- Name: ${contact.name}
- Company: ${contact.company}
- Industry: ${contact.industry}
- Current Status: ${contact.status}
- AI Score: ${contact.ai_score}

EXTRACTED INTELLIGENCE (from ${emailCount} emails, ${callCount} calls):

BUSINESS GOALS:
${intelligence.emails.flatMap(e => e.business_goals).map(g => `- ${g.text}`).join('\n')}

PAIN POINTS:
${intelligence.emails.flatMap(e => e.pain_points).map(p => `- ${p.text}`).join('\n')}

IDEAS DISCUSSED:
${intelligence.emails.flatMap(e => e.ideas).map(i => `- ${i.text} (${i.category})`).join('\n')}

REQUIREMENTS:
${intelligence.emails.flatMap(e => e.requirements).map(r => `- ${r.text}`).join('\n')}

QUESTIONNAIRE RESPONSES:
${formatQuestionnaireResponses(intelligence.questionnaires)}

KNOWLEDGE GAPS (still need to address):
${intelligence.gaps.map(g => `- ${g.category}: ${g.text}`).join('\n')}

DECISION READINESS: ${averageDecisionReadiness}/10
SENTIMENT: ${averageSentiment} (energy level: ${averageEnergy}/10)

GENERATE A COMPREHENSIVE MARKETING STRATEGY:

1. EXECUTIVE SUMMARY (2-3 paragraphs summarizing the entire strategy)

2. OBJECTIVES (3-5 SMART objectives based on client's stated goals)

3. TARGET PERSONAS (1-3 detailed buyer personas)
   - Demographics (age, location, income, job title)
   - Pain points (from extracted intelligence)
   - Goals (from extracted intelligence)
   - Preferred channels (Facebook, Instagram, LinkedIn, etc.)
   - Content preferences (video, blog, infographic)
   - Buying triggers (what makes them purchase)

4. BRAND POSITIONING
   - Unique Value Proposition (1 sentence)
   - Key Differentiators (3-5 points that set them apart)
   - Brand Voice (Professional/Casual/Authoritative)
   - Brand Personality (3-5 adjectives)
   - Messaging Framework (core message + 3 supporting messages)

5. CONTENT PILLARS (4-6 pillars)
   - Name and description
   - Themes covered
   - Content types (blog, video, social post)
   - Target personas
   - Platforms
   - Percentage allocation (must sum to 100%)

6. CAMPAIGN CALENDAR (${timeline_months} months)
   - Break into 3 phases (Awareness, Engagement, Conversion)
   - For each phase: objectives, key activities, content focus
   - Total posts and platform breakdown

7. KPIs (5-8 metrics)
   - Metric name
   - Target value (be specific: "increase by 50%", "reach 10,000")
   - How to measure
   - Timeline (weekly, monthly, quarterly)
   - Who owns it

8. BUDGET ALLOCATION (if budget discussed)
   - Total budget (if known)
   - Allocation by category: Content Creation, Paid Ads, Tools/Software, Design
   - Percentage and estimated amount for each

9. RISKS & MITIGATION (3-5 risks)
   - Risk description
   - Likelihood (low/medium/high)
   - Impact (low/medium/high)
   - Mitigation strategy

10. NEXT STEPS (5-7 immediate action items)

Return as JSON matching the MarketingStrategy interface.`;
   ```

3. **Call Claude API** (Extended Thinking for high-quality strategy):
   ```typescript
   const message = await anthropic.messages.create({
     model: 'claude-opus-4-5-20251101',
     max_tokens: 8192,
     temperature: 0.5,
     thinking: {
       type: 'enabled',
       budget_tokens: 7500, // High-quality strategic thinking
     },
     messages: [{ role: 'user', content: prompt }],
   });
   ```

4. **Parse and validate strategy**:
   ```typescript
   const strategy = JSON.parse(message.content[0].text);

   // Validation
   if (strategy.content_pillars.length < 4) {
     throw new Error('Strategy must have at least 4 content pillars');
   }

   const totalAllocation = strategy.content_pillars.reduce((sum, p) => sum + p.percentage_allocation, 0);
   if (Math.abs(totalAllocation - 100) > 1) {
     throw new Error('Content pillar allocation must sum to 100%');
   }
   ```

5. **Create strategy in database**:
   ```typescript
   const { data: strategyRecord, error } = await supabase
     .from('marketing_strategies')
     .insert({
       contact_id,
       workspace_id,
       strategy_title: strategy.strategy_title,
       objectives: strategy.objectives,
       content_pillars: strategy.content_pillars,
       target_platforms: extractPlatforms(strategy),
       posting_frequency: calculatePostingFrequency(strategy.campaign_calendar),
       is_active: true,
     })
     .select()
     .single();
   ```

6. **Create personas**:
   ```typescript
   const personaInserts = strategy.target_personas.map(persona => ({
     contact_id,
     workspace_id,
     persona_name: persona.persona_name,
     description: persona.description,
     demographics: persona.demographics,
     pain_points: persona.pain_points,
     goals: persona.goals,
     preferred_channels: persona.preferred_channels,
     is_active: true,
   }));

   await supabase.from('marketing_personas').insert(personaInserts);
   ```

7. **Return complete strategy**:
   ```typescript
   return {
     success: true,
     strategy_id: strategyRecord.id,
     strategy,
   };
   ```

**Performance**: < 30 seconds (Claude API call with Extended Thinking)

---

### 2.2 createPersona()
**Purpose**: Create individual buyer persona from intelligence.

**Input**:
```typescript
interface CreatePersonaRequest {
  contact_id: string;
  workspace_id: string;
  persona_data?: Partial<Persona>; // Optional seed data
}
```

**Output**:
```typescript
interface CreatePersonaResult {
  success: boolean;
  persona_id: string;
  persona: Persona;
}
```

**Business Logic**:
1. **Fetch intelligence**: Get email/media analysis
2. **Generate persona via Claude**:
   ```typescript
   const prompt = `Create a detailed buyer persona based on this intelligence.

PAIN POINTS MENTIONED:
${painPoints.join('\n')}

GOALS MENTIONED:
${goals.join('\n')}

DEMOGRAPHICS INFERRED:
${demographics}

Generate a complete persona including:
- Persona name (e.g., "Marketing Manager Mike")
- Description (2-3 sentences)
- Demographics (age range, location, job title, industry)
- Pain points (from intelligence)
- Goals (from intelligence)
- Preferred channels (Facebook, LinkedIn, etc.)
- Content preferences (video, blog, infographic)
- Buying triggers (what makes them purchase)`;
   ```
3. **Create persona record**: INSERT into marketing_personas
4. **Return persona**: Return created persona

---

### 2.3 updateStrategy()
**Purpose**: Update strategy with new intelligence.

**Input**:
```typescript
interface UpdateStrategyRequest {
  strategy_id: string;
  new_intelligence: {
    emails?: EmailIntelligence[];
    questionnaire_responses?: QuestionnaireResponse[];
  };
}
```

**Output**:
```typescript
interface UpdateStrategyResult {
  success: boolean;
  updated_fields: string[];
  strategy: MarketingStrategy;
}
```

**Business Logic**:
1. **Fetch existing strategy**: Get current strategy from database
2. **Identify changed intelligence**:
   ```typescript
   const changes = {
     new_goals: newIntelligence.business_goals.filter(g => !existsInStrategy(g)),
     new_pain_points: newIntelligence.pain_points.filter(p => !existsInStrategy(p)),
     budget_now_known: newIntelligence.questionnaire_responses.some(r => r.question_id === 'budget'),
   };
   ```
3. **Generate update via Claude**:
   ```typescript
   const prompt = `Update this marketing strategy based on new intelligence.

EXISTING STRATEGY:
${JSON.stringify(existingStrategy, null, 2)}

NEW INTELLIGENCE:
- New Goals: ${changes.new_goals.join(', ')}
- New Pain Points: ${changes.new_pain_points.join(', ')}
- Budget Now Known: ${budgetAmount}

Update the following sections:
1. Executive Summary (incorporate new insights)
2. Objectives (add/refine based on new goals)
3. Content Pillars (adjust based on new pain points)
4. Budget Allocation (if budget now known)

Return ONLY the updated fields as JSON.`;
   ```
4. **Merge updates**: Combine existing strategy with new data
5. **Update database**: Save updated strategy
6. **Return updated strategy**: Return modified strategy

---

### 2.4 exportStrategy()
**Purpose**: Export strategy as PDF/DOCX document.

**Input**:
```typescript
interface ExportStrategyRequest {
  strategy_id: string;
  format: 'pdf' | 'docx' | 'markdown';
  include_sections?: string[]; // Default: all
}
```

**Output**:
```typescript
interface ExportStrategyResult {
  success: boolean;
  file_url: string;
  file_size: number;
  format: string;
}
```

**Business Logic**:
1. **Fetch strategy**: Get complete strategy from database
2. **Generate document**:
   ```typescript
   const markdown = `
# ${strategy.strategy_title}

## Executive Summary
${strategy.executive_summary}

## Objectives
${strategy.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

## Target Personas
${strategy.target_personas.map(formatPersona).join('\n\n')}

## Brand Positioning
**Unique Value Proposition**: ${strategy.brand_positioning.unique_value_proposition}

**Key Differentiators**:
${strategy.brand_positioning.key_differentiators.map(d => `- ${d}`).join('\n')}

## Content Pillars
${strategy.content_pillars.map(formatPillar).join('\n\n')}

## Campaign Calendar
${formatCampaignCalendar(strategy.campaign_calendar)}

## KPIs
${strategy.kpis.map(formatKPI).join('\n')}

## Budget Allocation
${formatBudget(strategy.budget_allocation)}

## Risks & Mitigation
${strategy.risks_and_mitigation.map(formatRisk).join('\n\n')}

## Next Steps
${strategy.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
   `;
   ```
3. **Convert format**:
   - **PDF**: Use Puppeteer to render HTML → PDF
   - **DOCX**: Use docx library to create Word document
   - **Markdown**: Return as-is
4. **Upload to storage**: Save to Supabase Storage
5. **Return file URL**: Return download link

---

### 2.5 calculateContentPillars()
**Purpose**: Generate content pillars from intelligence.

**Input**:
```typescript
interface CalculateContentPillarsRequest {
  contact_id: string;
  num_pillars?: number; // Default: 5
}
```

**Output**:
```typescript
interface CalculateContentPillarsResult {
  success: boolean;
  pillars: ContentPillar[];
}
```

**Business Logic**:
1. **Fetch intelligence**: Get all ideas, goals, pain points
2. **Cluster by theme**:
   ```typescript
   const themes = {
     education: ideas.filter(i => i.category === 'educational'),
     product: ideas.filter(i => i.category === 'product'),
     industry: ideas.filter(i => i.category === 'industry_insights'),
     community: ideas.filter(i => i.category === 'community'),
   };
   ```
3. **Generate pillars via Claude**:
   ```typescript
   const prompt = `Create ${num_pillars} content pillars based on this intelligence.

THEMES IDENTIFIED:
${Object.entries(themes).map(([name, items]) => `${name}: ${items.length} ideas`).join('\n')}

CLIENT GOALS:
${goals.join('\n')}

CLIENT PAIN POINTS:
${painPoints.join('\n')}

For each content pillar, provide:
- Name (2-3 words, catchy)
- Description (1 sentence)
- Themes covered (3-5 specific topics)
- Content types (blog, video, infographic, podcast)
- Target personas (which personas care about this)
- Platforms (where to publish)
- Percentage allocation (must sum to 100%)

Ensure pillars:
1. Address client's pain points
2. Align with business goals
3. Are distinct (no overlap)
4. Cover diverse content types
5. Balance educational + promotional`;
   ```
4. **Validate allocation**: Ensure percentages sum to 100%
5. **Return pillars**: Return generated pillars

---

## 3. API ENDPOINTS

### POST /api/strategies/generate
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "strategy_type": "full",
  "timeline_months": 3
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "strategy": {
    "strategy_title": "Q4 2025 Brand Awareness Campaign",
    "executive_summary": "Comprehensive 3-month campaign...",
    "objectives": [
      "Increase brand awareness by 50% in target demographic",
      "Generate 500 qualified leads per month",
      "Achieve 10% engagement rate on social media"
    ],
    "target_personas": [
      {
        "persona_name": "Marketing Manager Mike",
        "description": "Mid-level marketing manager at B2B SaaS companies",
        "demographics": {
          "age_range": "30-45",
          "location": "Sydney, Melbourne, Brisbane",
          "income_range": "$80,000 - $120,000",
          "job_title": "Marketing Manager",
          "industry": "SaaS, Technology"
        },
        "pain_points": [
          "Struggling to prove ROI on marketing spend",
          "Limited budget but high growth targets",
          "Need to automate repetitive tasks"
        ],
        "goals": [
          "Increase lead quality",
          "Reduce cost per acquisition",
          "Scale marketing without scaling team"
        ],
        "preferred_channels": ["LinkedIn", "Email", "Webinars"],
        "content_preferences": ["Case studies", "Webinars", "ROI calculators"],
        "buying_triggers": ["Proven ROI", "Free trial", "Customer testimonials"]
      }
    ],
    "brand_positioning": {
      "unique_value_proposition": "AI-powered marketing automation that actually increases revenue, not just vanity metrics",
      "key_differentiators": [
        "AI intelligence extraction from emails and calls",
        "Automatic lead scoring based on actual engagement",
        "90-day content calendars generated in minutes",
        "Built for Australian businesses (AEST timezones, Spam Act compliance)"
      ],
      "brand_voice": "Professional but approachable",
      "brand_personality": ["Innovative", "Trustworthy", "Results-driven", "Customer-centric"],
      "messaging_framework": {
        "core_message": "Marketing automation that understands your customers as well as you do",
        "supporting_messages": [
          "Stop wasting time on manual data entry - let AI extract intelligence automatically",
          "Know exactly when leads are ready to buy with AI-powered decision readiness scoring",
          "Create personalized marketing strategies in minutes, not weeks"
        ]
      }
    },
    "content_pillars": [
      {
        "name": "AI Education",
        "description": "Demystify AI for marketing teams",
        "themes": ["How AI works", "AI vs traditional automation", "Getting started with AI"],
        "content_types": ["blog", "video", "infographic"],
        "target_personas": ["Marketing Manager Mike"],
        "platforms": ["LinkedIn", "Blog", "YouTube"],
        "percentage_allocation": 25
      },
      {
        "name": "Customer Success Stories",
        "description": "Real results from real customers",
        "themes": ["Case studies", "ROI examples", "Before/after comparisons"],
        "content_types": ["case_study", "video", "testimonial"],
        "target_personas": ["Marketing Manager Mike"],
        "platforms": ["LinkedIn", "Website", "Email"],
        "percentage_allocation": 20
      },
      {
        "name": "Marketing Best Practices",
        "description": "Actionable marketing tips and strategies",
        "themes": ["Email marketing", "Lead nurturing", "Campaign optimization"],
        "content_types": ["blog", "checklist", "template"],
        "target_personas": ["Marketing Manager Mike"],
        "platforms": ["LinkedIn", "Blog", "Email"],
        "percentage_allocation": 25
      },
      {
        "name": "Product Updates",
        "description": "New features and capabilities",
        "themes": ["Feature launches", "Product roadmap", "How-to guides"],
        "content_types": ["video", "article", "webinar"],
        "target_personas": ["Marketing Manager Mike"],
        "platforms": ["LinkedIn", "Email", "YouTube"],
        "percentage_allocation": 15
      },
      {
        "name": "Industry Insights",
        "description": "Trends and data in marketing automation",
        "themes": ["Industry reports", "Trend analysis", "Expert interviews"],
        "content_types": ["report", "infographic", "podcast"],
        "target_personas": ["Marketing Manager Mike"],
        "platforms": ["LinkedIn", "Blog", "Podcast"],
        "percentage_allocation": 15
      }
    ],
    "campaign_calendar": {
      "start_date": "2025-10-01T00:00:00+10:00",
      "end_date": "2025-12-31T23:59:59+10:00",
      "phases": [
        {
          "phase_name": "Phase 1: Awareness",
          "start_date": "2025-10-01T00:00:00+10:00",
          "end_date": "2025-10-31T23:59:59+10:00",
          "objectives": [
            "Increase brand visibility",
            "Grow social following by 30%",
            "Drive 10,000 website visits"
          ],
          "key_activities": [
            "Launch LinkedIn ad campaign",
            "Publish 12 blog posts (3/week)",
            "Host webinar on AI marketing",
            "Create 20 social posts"
          ],
          "content_focus": ["AI Education", "Industry Insights"]
        },
        {
          "phase_name": "Phase 2: Engagement",
          "start_date": "2025-11-01T00:00:00+10:00",
          "end_date": "2025-11-30T23:59:59+10:00",
          "objectives": [
            "Generate 300 qualified leads",
            "Achieve 15% email open rate",
            "Book 50 demo calls"
          ],
          "key_activities": [
            "Launch drip campaign for webinar attendees",
            "Publish 4 case studies",
            "Create interactive ROI calculator",
            "Run Facebook retargeting ads"
          ],
          "content_focus": ["Customer Success Stories", "Marketing Best Practices"]
        },
        {
          "phase_name": "Phase 3: Conversion",
          "start_date": "2025-12-01T00:00:00+10:00",
          "end_date": "2025-12-31T23:59:59+10:00",
          "objectives": [
            "Close 20 new customers",
            "Achieve 5% trial-to-paid conversion",
            "Generate $100,000 in new revenue"
          ],
          "key_activities": [
            "Free trial promotion (14 days → 30 days)",
            "Limited-time discount (20% off first 3 months)",
            "Customer testimonial video series",
            "Holiday promotion campaign"
          ],
          "content_focus": ["Product Updates", "Customer Success Stories"]
        }
      ],
      "total_posts": 90,
      "platform_breakdown": {
        "LinkedIn": 35,
        "Blog": 20,
        "Email": 15,
        "Facebook": 10,
        "YouTube": 10
      }
    },
    "kpis": [
      {
        "metric_name": "Brand Awareness",
        "target_value": "50% increase in social following",
        "measurement_method": "LinkedIn + Facebook follower count",
        "timeline": "Monthly",
        "owner": "Social Media Manager"
      },
      {
        "metric_name": "Website Traffic",
        "target_value": "25,000 total visits (10k → 25k)",
        "measurement_method": "Google Analytics",
        "timeline": "Monthly",
        "owner": "Marketing Manager"
      },
      {
        "metric_name": "Lead Generation",
        "target_value": "500 qualified leads per month",
        "measurement_method": "CRM lead count (score >= 60)",
        "timeline": "Monthly",
        "owner": "Marketing Manager"
      },
      {
        "metric_name": "Email Engagement",
        "target_value": "15% open rate, 3% click rate",
        "measurement_method": "Email platform analytics",
        "timeline": "Weekly",
        "owner": "Email Marketing Specialist"
      },
      {
        "metric_name": "Demo Bookings",
        "target_value": "50 demo calls per month",
        "measurement_method": "Calendar booking count",
        "timeline": "Weekly",
        "owner": "Sales Team"
      },
      {
        "metric_name": "Trial Conversion",
        "target_value": "5% trial-to-paid conversion",
        "measurement_method": "Subscription analytics",
        "timeline": "Monthly",
        "owner": "Product Manager"
      },
      {
        "metric_name": "Customer Acquisition",
        "target_value": "20 new customers in Q4",
        "measurement_method": "CRM customer count",
        "timeline": "Quarterly",
        "owner": "CEO"
      },
      {
        "metric_name": "Revenue",
        "target_value": "$100,000 new revenue",
        "measurement_method": "Subscription revenue tracking",
        "timeline": "Quarterly",
        "owner": "CEO"
      }
    ],
    "budget_allocation": {
      "total_budget": "$50,000",
      "allocation": [
        {
          "category": "Content Creation",
          "percentage": 30,
          "estimated_amount": "$15,000"
        },
        {
          "category": "Paid Advertising",
          "percentage": 40,
          "estimated_amount": "$20,000"
        },
        {
          "category": "Tools & Software",
          "percentage": 15,
          "estimated_amount": "$7,500"
        },
        {
          "category": "Design & Creative",
          "percentage": 10,
          "estimated_amount": "$5,000"
        },
        {
          "category": "Contingency",
          "percentage": 5,
          "estimated_amount": "$2,500"
        }
      ]
    },
    "risks_and_mitigation": [
      {
        "risk": "Budget constraints limit paid ad spend",
        "likelihood": "medium",
        "impact": "high",
        "mitigation": "Focus on organic content and leverage user-generated content. Build SEO-optimized blog content for long-term traffic. Allocate 20% of budget to high-ROI channels only (LinkedIn ads)."
      },
      {
        "risk": "Low engagement on social media posts",
        "likelihood": "medium",
        "impact": "medium",
        "mitigation": "A/B test post formats, times, and messaging. Use AI to analyze top-performing content and replicate patterns. Engage with comments within 1 hour to boost algorithm visibility."
      },
      {
        "risk": "Email deliverability issues",
        "likelihood": "low",
        "impact": "high",
        "mitigation": "Use multi-provider email service (SendGrid → Resend → Gmail SMTP). Warm up new domains gradually. Monitor bounce rates and clean list monthly."
      },
      {
        "risk": "Competitor launches similar AI feature",
        "likelihood": "high",
        "impact": "medium",
        "mitigation": "Emphasize unique differentiators (Australian compliance, decision readiness scoring). Build customer loyalty through exceptional onboarding. Double down on thought leadership content."
      },
      {
        "risk": "Content production falls behind schedule",
        "likelihood": "medium",
        "impact": "medium",
        "mitigation": "Use AI Content Generation Agent to automate blog drafts. Build 2-week content buffer. Repurpose high-performing content across multiple formats."
      }
    ],
    "next_steps": [
      "Approve marketing strategy and content pillars (Week 1)",
      "Set up LinkedIn ad campaign targeting Marketing Managers in Sydney/Melbourne (Week 1)",
      "Create 4-week content calendar using Content Calendar Agent (Week 1)",
      "Design webinar landing page and registration flow (Week 2)",
      "Record webinar presentation and promotional clips (Week 2)",
      "Launch Phase 1: Awareness campaign (Week 3)",
      "Weekly performance review and optimization (ongoing)"
    ]
  }
}
```

### GET /api/strategies/:strategy_id
**Response**:
```json
{
  "success": true,
  "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "strategy_title": "Q4 2025 Brand Awareness Campaign",
  "objectives": [...],
  "content_pillars": [...],
  "created_at": "2025-11-18T10:30:00+10:00"
}
```

### PUT /api/strategies/:strategy_id
**Request**:
```json
{
  "new_intelligence": {
    "questionnaire_responses": [
      { "question_id": "budget", "answer": "$75,000" }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "updated_fields": ["budget_allocation", "campaign_calendar.phases"],
  "strategy": { ... }
}
```

### POST /api/strategies/:strategy_id/export
**Request**:
```json
{
  "format": "pdf",
  "include_sections": ["executive_summary", "objectives", "content_pillars", "campaign_calendar"]
}
```

**Response**:
```json
{
  "success": true,
  "file_url": "https://storage.supabase.co/strategies/ee0e8400.pdf",
  "file_size": 1245678,
  "format": "pdf"
}
```

---

## 4. DATABASE SCHEMA

### marketing_strategies Table (EXISTING)
```sql
CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  strategy_title TEXT NOT NULL,
  objectives TEXT[],
  content_pillars JSONB DEFAULT '[]',
  target_platforms TEXT[],
  posting_frequency JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_contact_id ON marketing_strategies(contact_id);
CREATE INDEX idx_strategies_workspace_id ON marketing_strategies(workspace_id);
```

### marketing_personas Table (EXISTING)
```sql
CREATE TABLE IF NOT EXISTS marketing_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  persona_name TEXT NOT NULL,
  description TEXT,
  demographics JSONB DEFAULT '{}',
  pain_points TEXT[],
  goals TEXT[],
  preferred_channels TEXT[],

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Add New Column to marketing_strategies (MIGRATION NEEDED)
```sql
-- Add full strategy JSON for complete export
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS full_strategy JSONB DEFAULT '{}';

-- Add brand positioning
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS brand_positioning JSONB DEFAULT '{}';

-- Add budget allocation
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS budget_allocation JSONB DEFAULT '{}';

-- Add KPIs
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]';

-- Add risks
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]';
```

---

## 5. BUSINESS RULES

### Strategy Generation Rules
1. **Minimum Intelligence Required**:
   - At least 3 email exchanges OR 1 call recording
   - At least 2 business goals identified
   - At least 3 pain points identified
   - Contact status >= 'lead' (not just 'prospect')

2. **Content Pillar Allocation**:
   - Minimum 4 pillars, maximum 8
   - Each pillar: 10-40% allocation
   - Total allocation MUST = 100%
   - Educational content >= 50% (avoid over-promotion)

3. **Persona Requirements**:
   - Minimum 1 persona, maximum 5
   - Each persona must have at least 3 pain points
   - Each persona must have at least 2 preferred channels
   - Personas must be distinct (no >70% similarity)

4. **KPI Requirements**:
   - Minimum 5 KPIs, maximum 10
   - Must include: website traffic, lead generation, conversion rate
   - All KPIs must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
   - Each KPI must have an owner

5. **Campaign Calendar**:
   - Minimum 1 month, maximum 12 months
   - Break into 3 phases (Awareness, Engagement, Conversion)
   - Minimum 20 posts per month (5/week)
   - Platform distribution: LinkedIn >= 30% (B2B focus)

---

## 6. INTEGRATION POINTS

### 6.1 Email Intelligence Agent
**Dependency**: Consumes email analysis data
**Data Flow**: Email Intelligence → Marketing Strategy
**Integration**:
```typescript
const emailIntelligence = await fetch('/api/intelligence/analyze', {
  method: 'POST',
  body: JSON.stringify({ contact_id }),
});
```

### 6.2 Media Transcription Agent
**Dependency**: Consumes call transcripts and analysis
**Data Flow**: Media Analysis → Marketing Strategy
**Integration**:
```typescript
const mediaAnalysis = await supabase
  .from('media_files')
  .select('ai_analysis')
  .eq('contact_id', contact_id)
  .not('ai_analysis', 'is', null);
```

### 6.3 Knowledge Gap Analysis Agent
**Dependency**: Uses identified gaps to inform strategy
**Data Flow**: Knowledge Gaps → Strategy Objectives
**Integration**:
```typescript
const gaps = await fetch('/api/gaps/analyze', {
  method: 'GET',
  params: { contact_id },
});
```

### 6.4 Dynamic Questionnaire Generator Agent
**Dependency**: Uses questionnaire responses to fill gaps
**Data Flow**: Questionnaire Responses → Strategy Details (budget, timeline, metrics)
**Integration**:
```typescript
const responses = await supabase
  .from('questionnaire_responses')
  .select('*, dynamic_questionnaires!inner(*)')
  .eq('dynamic_questionnaires.contact_id', contact_id);
```

### 6.5 Content Calendar Agent (Downstream)
**Dependency**: Content Calendar Agent consumes this strategy
**Data Flow**: Marketing Strategy → Content Calendar Generation
**Integration**:
```typescript
const strategy = await fetch('/api/strategies/generate', {
  method: 'POST',
  body: JSON.stringify({ contact_id, workspace_id }),
});

// Content Calendar Agent uses strategy.content_pillars to generate posts
```

---

## 7. PERFORMANCE REQUIREMENTS

### Response Times
- **Generate Strategy**: < 30 seconds (Claude API with Extended Thinking)
- **Create Persona**: < 10 seconds
- **Update Strategy**: < 15 seconds
- **Export Strategy**: < 20 seconds (PDF generation)
- **Calculate Content Pillars**: < 8 seconds

### Throughput
- **Concurrent Strategy Generation**: 5 strategies at once
- **Strategies per Contact**: 1 active strategy at a time (archive old)
- **Personas per Contact**: Maximum 5 personas

### Resource Limits
- **Claude API Cost**: ~$0.15-0.30 per strategy (7500 thinking tokens + 8k output)
- **Database Storage**: ~50KB per strategy
- **PDF Export Size**: < 5MB per strategy document

---

## 8. TESTING STRATEGY

### Unit Tests
```typescript
describe('Marketing Strategy Generator Agent', () => {
  describe('generateStrategy()', () => {
    it('should generate strategy with all required sections', async () => {
      const result = await generateStrategy({
        contact_id: 'test-contact-id',
        workspace_id: 'test-workspace-id',
      });

      expect(result.success).toBe(true);
      expect(result.strategy.objectives).toHaveLength(>= 3);
      expect(result.strategy.content_pillars).toHaveLength(>= 4);
      expect(result.strategy.kpis).toHaveLength(>= 5);
    });

    it('should validate content pillar allocation sums to 100%', async () => {
      const result = await generateStrategy({ contact_id, workspace_id });
      const total = result.strategy.content_pillars.reduce((sum, p) => sum + p.percentage_allocation, 0);
      expect(total).toBeCloseTo(100, 1);
    });

    it('should throw error if insufficient intelligence', async () => {
      await expect(generateStrategy({ contact_id: 'new-prospect-id', workspace_id }))
        .rejects.toThrow('Insufficient intelligence');
    });
  });

  describe('createPersona()', () => {
    it('should create persona from intelligence', async () => {
      const result = await createPersona({ contact_id, workspace_id });
      expect(result.persona.pain_points).toHaveLength(>= 3);
      expect(result.persona.preferred_channels).toHaveLength(>= 2);
    });
  });

  describe('updateStrategy()', () => {
    it('should update strategy when budget is provided', async () => {
      const result = await updateStrategy({
        strategy_id: 'existing-strategy-id',
        new_intelligence: {
          questionnaire_responses: [
            { question_id: 'budget', answer: '$75,000' }
          ]
        }
      });

      expect(result.updated_fields).toContain('budget_allocation');
      expect(result.strategy.budget_allocation.total_budget).toBe('$75,000');
    });
  });
});
```

### Integration Tests
```typescript
describe('Strategy Generation Flow', () => {
  it('should generate complete strategy from email + questionnaire intelligence', async () => {
    // 1. Create contact
    const contact = await createContact({ name: 'Test Client', email: 'test@example.com' });

    // 2. Add email intelligence
    await addEmailIntelligence({ contact_id: contact.id, business_goals: ['Increase awareness by 50%'] });

    // 3. Add questionnaire responses
    await addQuestionnaireResponse({ contact_id: contact.id, question_id: 'budget', answer: '$50,000' });

    // 4. Generate strategy
    const strategy = await generateStrategy({ contact_id: contact.id, workspace_id });

    expect(strategy.success).toBe(true);
    expect(strategy.strategy.objectives).toContain('Increase brand awareness by 50%');
    expect(strategy.strategy.budget_allocation.total_budget).toBe('$50,000');
  });
});
```

---

## 9. ERROR CODES

| Code | Description |
|------|-------------|
| STRAT_001 | Contact not found |
| STRAT_002 | Insufficient intelligence (need >= 3 emails or 1 call) |
| STRAT_003 | Strategy generation failed (Claude API error) |
| STRAT_004 | Content pillar allocation invalid (doesn't sum to 100%) |
| STRAT_005 | Strategy not found |
| STRAT_006 | Export format not supported |
| STRAT_007 | Persona creation failed |
| STRAT_008 | Update failed - strategy already archived |

---

## 10. AUSTRALIAN COMPLIANCE

### Spam Act 2003
- **Unsubscribe Links**: All email recommendations in strategy include unsubscribe
- **Consent Verification**: Strategy includes consent tracking for contact lists
- **Business Identity**: Ensures client's ABN/ACN is displayed in email footers

### Timezones
- **Campaign Calendar**: All dates use AEST/AEDT (Australia/Sydney)
- **Best Posting Times**: Optimized for Australian business hours (9am-5pm AEST)
- **Content Calendar**: Schedules posts for 9am-12pm AEST (peak engagement)

### Local Market Considerations
- **Budget Recommendations**: Uses AUD ($) currency
- **Target Demographics**: Includes major Australian cities (Sydney, Melbourne, Brisbane, Perth)
- **Platform Preferences**: Prioritizes LinkedIn for B2B (strong Australian presence)

---

## 11. SECURITY

### Data Access
- **RLS Policies**: All queries scoped to workspace_id
- **User Permissions**: Only workspace members can view/edit strategies
- **API Authentication**: JWT token required for all endpoints

### Sensitive Data
- **Budget Information**: Encrypted at rest (Supabase encryption)
- **Competitor Analysis**: Not stored in plain text (use JSONB encryption if needed)
- **Internal Notes**: Separate from client-visible strategy document

### Audit Trail
```typescript
await supabase.from('audit_logs').insert({
  org_id,
  action: 'strategy.generated',
  resource: 'marketing_strategies',
  resource_id: strategy_id,
  agent: 'marketing-strategy-generator',
  status: 'success',
  details: {
    contact_id,
    strategy_type,
    timeline_months,
    ai_cost: 0.25,
  },
});
```

---

## 12. MONITORING & METRICS

### Performance Metrics
```typescript
interface StrategyMetrics {
  total_strategies_generated: number;
  average_generation_time: number; // Seconds
  claude_api_cost: number; // USD
  strategies_exported: number;
  export_formats: Record<string, number>; // { pdf: 10, docx: 5 }
}
```

### Quality Metrics
```typescript
interface QualityMetrics {
  average_objectives_count: number;
  average_pillars_count: number;
  average_kpis_count: number;
  strategies_with_budget: number;
  strategies_updated: number;
}
```

### Logging
```typescript
logger.info('Strategy generated', {
  strategy_id,
  contact_id,
  workspace_id,
  generation_time_ms: 28500,
  claude_tokens_used: 15000,
  objectives_count: 5,
  pillars_count: 5,
  kpis_count: 8,
});
```

### Alerts
- **Generation Time > 45s**: Alert ops team (Claude API slow)
- **Allocation Validation Failure**: Alert dev team (logic bug)
- **Export Failure Rate > 5%**: Alert ops team (storage issue)

---

## 13. FUTURE ENHANCEMENTS

### Phase 2
1. **Competitive Analysis**: Integrate web scraping to analyze competitor strategies
2. **Industry Benchmarks**: Compare strategy metrics to industry averages (e.g., "Your 15% email open rate is above industry average of 12%")
3. **AI Strategy Coach**: Weekly strategy review and optimization suggestions
4. **Multi-language Strategies**: Generate strategies in different languages for international markets

### Phase 3
1. **Strategy Templates**: Pre-built templates for common industries (SaaS, E-commerce, Agency)
2. **Collaborative Editing**: Multiple team members can edit strategy in real-time
3. **Version History**: Track changes to strategy over time with diff view
4. **ROI Prediction**: Use historical data to predict campaign ROI before launch

### Phase 4
1. **Strategy Marketplace**: Share anonymized successful strategies with community
2. **AI Strategy Critique**: Get AI feedback on user-created strategies
3. **Integration with Analytics**: Auto-update KPIs with live data from Google Analytics, Facebook Ads

---

**END OF MARKETING STRATEGY GENERATOR AGENT SPECIFICATION**
