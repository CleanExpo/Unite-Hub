# AI INTELLIGENCE EXTRACTION AGENT SPECIFICATION

**Agent Name**: AI Intelligence Extraction Agent
**Agent Type**: Tier 1 - Input Processing Agent
**Priority**: P1 - Critical (Build First)
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `client_emails` - Email messages to analyze
- `media_files` - Video/audio transcripts to analyze
- `ai_media_analysis` - AI-generated insights from media
- `email_intelligence` - AI-generated insights from emails (new table)
- `contacts` - Update contact intelligence scores

### Agent Purpose
The AI Intelligence Extraction Agent is the **core intelligence layer** for the Client Intelligence System. It uses Claude AI (Anthropic) to analyze emails and transcripts, extracting structured business intelligence including ideas, goals, pain points, requirements, sentiment, and decision readiness. This agent transforms Duncan's 4 months of email history and client call recordings into actionable business insights that drive the mindmap, questionnaire, and strategy generation.

### Agent Responsibilities
1. **Email Analysis**: Extract intelligence from email content (body text, subject, threads)
2. **Transcript Analysis**: Extract intelligence from video/audio transcripts
3. **Business Goal Extraction**: Identify what the client wants to achieve
4. **Pain Point Detection**: Identify problems and frustrations expressed
5. **Idea Mining**: Extract product/service concepts mentioned
6. **Requirement Identification**: Extract specific needs, features, constraints
7. **Sentiment Analysis**: Determine emotional tone (excited, concerned, neutral, frustrated)
8. **Decision Readiness Scoring**: Calculate how ready the client is to move forward (1-10)
9. **Combined Intelligence**: Merge insights from multiple sources (emails + calls)

---

## 2. PURPOSE & SCOPE

### Core Responsibilities

#### IN SCOPE ✅
- Claude AI integration (claude-3-5-sonnet-20241022 for standard analysis)
- Email content analysis (subject, body, thread context)
- Transcript analysis (full text, speaker-separated content)
- Business intelligence extraction (ideas, goals, pain points, requirements)
- Sentiment analysis (positive, negative, neutral, mixed)
- Decision readiness scoring (1-10 scale)
- Entity extraction (people, companies, products, technologies)
- Question detection (what clarifications the client needs)
- Action item extraction (tasks, deadlines, commitments)
- Multi-source intelligence merging (combine email + call insights)
- Confidence scoring (how confident AI is in extracted intelligence)
- Incremental intelligence updates (analyze new content without re-analyzing old)

#### OUT OF SCOPE ❌
- Email sending or campaign management (handled by Email Agent)
- Mindmap generation (handled by Mindmap Auto-Generation Agent)
- Questionnaire creation (handled by Dynamic Questionnaire Generator Agent)
- Strategy formulation (handled by Marketing Strategy Generator Agent)
- Real-time conversation analysis (Phase 2)
- Emotion detection from voice tone (Phase 2)
- Image/document OCR and analysis (Phase 2)

### Integration Touchpoints
- **Email Integration Agent**: Receives raw email content for analysis
- **Media Transcription Agent**: Receives transcripts for analysis
- **Mindmap Auto-Generation Agent**: Provides extracted intelligence for mindmap nodes
- **Knowledge Gap Analysis Agent**: Provides current intelligence for gap detection
- **Dynamic Questionnaire Generator Agent**: Provides intelligence to generate contextual questions
- **Marketing Strategy Generator Agent**: Provides comprehensive intelligence for strategy
- **Contact Agent**: Updates contact ai_score based on decision readiness
- **Analytics Agent**: Provides intelligence metrics (total insights, sentiment trends)

---

## 3. DATABASE SCHEMA MAPPING

### email_intelligence Table (NEW - Create This)
```typescript
interface EmailIntelligence {
  id: string; // UUID
  email_id: string; // UUID - References client_emails.id
  contact_id?: string | null; // UUID - References contacts.id
  workspace_id: string; // UUID - References workspaces.id

  // Extracted Intelligence
  ideas: Idea[]; // Business ideas/concepts mentioned
  business_goals: BusinessGoal[]; // What client wants to achieve
  pain_points: PainPoint[]; // Problems/frustrations expressed
  requirements: Requirement[]; // Specific needs/features/constraints
  questions_asked: string[]; // Questions client asked
  decisions_made: string[]; // Decisions already made

  // Sentiment Analysis
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'; // Overall sentiment
  energy_level: number; // 1-10 (how excited/enthusiastic)
  decision_readiness: number; // 1-10 (how ready to move forward)

  // Entity Extraction
  entities: {
    people: string[]; // Names mentioned
    companies: string[]; // Companies mentioned
    products: string[]; // Products/services mentioned
    technologies: string[]; // Technologies mentioned
    locations: string[]; // Locations mentioned
  };

  // AI Metadata
  analyzed_at: Date; // TIMESTAMPTZ
  ai_model: string; // AI model used (e.g., "claude-3-5-sonnet-20241022")
  confidence_score: number; // 0.0-1.0 (overall confidence)
  processing_time_ms: number; // Processing time

  // Timestamps
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

interface Idea {
  text: string; // Idea description
  category: 'product' | 'service' | 'campaign' | 'feature' | 'other'; // Idea type
  priority: 'high' | 'medium' | 'low'; // Importance
  source_quote: string; // Original text from email
}

interface BusinessGoal {
  text: string; // Goal description
  category: 'revenue' | 'growth' | 'awareness' | 'engagement' | 'retention' | 'other';
  timeframe?: string | null; // When (e.g., "Q4 2025", "6 months")
  metric?: string | null; // Success metric (e.g., "50% increase in leads")
  source_quote: string; // Original text
}

interface PainPoint {
  text: string; // Pain point description
  severity: 'critical' | 'high' | 'medium' | 'low'; // How severe
  category: 'cost' | 'time' | 'quality' | 'complexity' | 'competition' | 'other';
  impact?: string | null; // Business impact
  source_quote: string; // Original text
}

interface Requirement {
  text: string; // Requirement description
  type: 'must-have' | 'nice-to-have' | 'constraint'; // Requirement type
  category: 'technical' | 'budget' | 'timeline' | 'team' | 'legal' | 'other';
  details?: string | null; // Additional details
  source_quote: string; // Original text
}

// Indexes:
// - idx_email_intelligence_email_id ON email_intelligence(email_id)
// - idx_email_intelligence_contact_id ON email_intelligence(contact_id)
// - idx_email_intelligence_workspace_id ON email_intelligence(workspace_id)
// - idx_email_intelligence_sentiment ON email_intelligence(sentiment)
// - idx_email_intelligence_decision_readiness ON email_intelligence(decision_readiness DESC)
```

### ai_media_analysis Table (Read from media_files.ai_analysis JSONB)
```typescript
// This data is stored in media_files.ai_analysis JSONB field
interface AIMediaAnalysis {
  // Same structure as EmailIntelligence, but stored as JSONB
  ideas: Idea[];
  business_goals: BusinessGoal[];
  pain_points: PainPoint[];
  requirements: Requirement[];
  questions_asked: string[];
  decisions_made: string[];
  sentiment: string;
  energy_level: number;
  decision_readiness: number;
  entities: {
    people: string[];
    companies: string[];
    products: string[];
    technologies: string[];
    locations: string[];
  };
  summary: string; // AI-generated summary of the call/video
  key_points: string[]; // Main takeaways
  action_items: string[]; // Tasks mentioned
  topics: string[]; // Topics discussed
  analyzed_at: string; // ISO timestamp
  ai_model: string;
  confidence_score: number;
}
```

---

## 4. CORE FUNCTIONS

### 4.1 analyzeEmailContent()
**Purpose**: Analyze email content and extract business intelligence.

**Input**:
```typescript
interface AnalyzeEmailContentRequest {
  email_id: string; // UUID - client_emails.id
  contact_id?: string; // UUID - Optional contact link
  workspace_id: string; // UUID
  include_thread_context?: boolean; // Include previous emails in thread (default: true)
}
```

**Output**:
```typescript
interface AnalyzeEmailContentResult {
  success: boolean;
  email_intelligence_id: string; // UUID
  intelligence: EmailIntelligence; // Extracted intelligence
  processing_time_ms: number;
  cost_usd: number; // Claude API cost
  error?: string;
}
```

**Business Logic**:
1. **Fetch email**: Get client_emails record by email_id
2. **Fetch thread context** (if include_thread_context=true):
   - Get all emails with same provider_thread_id
   - Order by received_at ASC (oldest first)
   - Include max 5 previous emails for context
3. **Build Claude prompt**:
   ```typescript
   const prompt = `Analyze this email from a potential client and extract business intelligence.

   EMAIL SUBJECT: ${email.subject}

   EMAIL BODY:
   ${email.body_text}

   ${threadContext ? `PREVIOUS EMAILS IN THREAD:\n${threadContext}` : ''}

   EXTRACT THE FOLLOWING:

   1. BUSINESS IDEAS - What products/services/campaigns are mentioned?
      Format: { text, category, priority, source_quote }

   2. BUSINESS GOALS - What outcomes does the client want?
      Format: { text, category, timeframe, metric, source_quote }

   3. PAIN POINTS - What problems/frustrations are expressed?
      Format: { text, severity, category, impact, source_quote }

   4. REQUIREMENTS - What specific needs/features/constraints?
      Format: { text, type, category, details, source_quote }

   5. QUESTIONS ASKED - What clarification does the client need?
      Format: Array of strings

   6. DECISIONS MADE - What has the client already decided?
      Format: Array of strings

   7. ENTITIES - Extract names, companies, products, technologies
      Format: { people, companies, products, technologies, locations }

   8. SENTIMENT - Overall emotional tone (positive/negative/neutral/mixed)

   9. ENERGY LEVEL - How excited/enthusiastic? (1-10)

   10. DECISION READINESS - How ready to move forward? (1-10)
      - 1-3: Early exploration, many questions
      - 4-6: Interested, some concerns
      - 7-8: Seriously considering, ready soon
      - 9-10: Ready to commit, clear timeline

   Return as JSON matching the EmailIntelligence interface.`;
   ```
4. **Call Claude API**:
   ```typescript
   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

   const message = await anthropic.messages.create({
     model: 'claude-3-5-sonnet-20241022',
     max_tokens: 4096,
     temperature: 0.3, // Lower temperature for more consistent extraction
     messages: [{
       role: 'user',
       content: prompt,
     }],
   });

   const intelligenceJSON = extractJSON(message.content[0].text);
   ```
5. **Parse response**: Extract JSON from Claude's response
6. **Calculate confidence**: Estimate confidence based on response completeness
7. **Store intelligence**: INSERT into email_intelligence table
8. **Update contact**: If decision_readiness >= 8, update contact.ai_score
9. **Calculate cost**:
   - Input tokens: ~1000 tokens (email + prompt)
   - Output tokens: ~2000 tokens (intelligence JSON)
   - Cost: (1000 × $0.003/1k) + (2000 × $0.015/1k) = $0.033 per email
10. **Return result**: Return intelligence and cost

**Performance Requirements**:
- Analysis time: < 5 seconds per email
- Claude API latency: ~2-3 seconds
- Database insert: < 100ms

**Error Codes**:
- `AI_INTEL_001`: Email not found
- `AI_INTEL_002`: Claude API error
- `AI_INTEL_003`: Failed to parse Claude response (invalid JSON)
- `AI_INTEL_004`: Intelligence storage failed

---

### 4.2 analyzeTranscription()
**Purpose**: Analyze video/audio transcript and extract business intelligence.

**Input**:
```typescript
interface AnalyzeTranscriptionRequest {
  media_file_id: string; // UUID - media_files.id
  analyze_by_speaker?: boolean; // Analyze each speaker separately (default: true)
  workspace_id: string; // UUID
}
```

**Output**:
```typescript
interface AnalyzeTranscriptionResult {
  success: boolean;
  media_file_id: string; // UUID
  intelligence: AIMediaAnalysis; // Extracted intelligence
  speaker_insights?: { [speaker_id: string]: AIMediaAnalysis }; // Per-speaker analysis
  processing_time_ms: number;
  cost_usd: number; // Claude API cost
  error?: string;
}
```

**Business Logic**:
1. **Fetch media file**: Get media_files record
2. **Verify transcript exists**: Check media_files.transcript is not null
3. **Extract full text**: Get transcript.full_text
4. **Build Claude prompt** (similar to email analysis):
   ```typescript
   const prompt = `Analyze this transcript from a client call and extract business intelligence.

   TRANSCRIPT:
   ${transcript.full_text}

   ${speakers ? `SPEAKERS:\n${speakerBreakdown}` : ''}

   EXTRACT THE FOLLOWING:
   [Same categories as email analysis, plus:]

   11. SUMMARY - Generate a concise 2-3 sentence summary of the call

   12. KEY POINTS - List 5-7 main takeaways from the conversation

   13. ACTION ITEMS - What tasks/commitments were mentioned?

   14. TOPICS - What topics were discussed? (marketing, budget, timeline, etc.)

   Return as JSON matching the AIMediaAnalysis interface.`;
   ```
5. **Call Claude API**: Same as email analysis
6. **If analyze_by_speaker=true**: Analyze each speaker's content separately
   - Group transcript segments by speaker
   - Run separate Claude analysis for each speaker
   - Identify client vs. team member based on content
7. **Store intelligence**: UPDATE media_files.ai_analysis JSONB field
8. **Update media_files**: Set ai_analyzed_at=NOW(), status='completed'
9. **Calculate cost**:
   - Input tokens: ~5000 tokens (60-minute transcript = ~9000 words)
   - Output tokens: ~3000 tokens (detailed intelligence)
   - Cost: (5000 × $0.003/1k) + (3000 × $0.015/1k) = $0.06 per call
10. **Return result**: Return intelligence and cost

**Performance Requirements**:
- Analysis time: < 10 seconds per transcript
- Claude API latency: ~5-7 seconds (longer content)
- Database update: < 100ms

**Error Codes**:
- `AI_INTEL_005`: Media file not found
- `AI_INTEL_006`: Transcript not available (not yet transcribed)
- `AI_INTEL_007`: Claude API error
- `AI_INTEL_008`: Intelligence storage failed

---

### 4.3 analyzeCombined()
**Purpose**: Analyze ALL intelligence for a contact (emails + calls) and generate comprehensive insights.

**Input**:
```typescript
interface AnalyzeCombinedRequest {
  contact_id: string; // UUID
  workspace_id: string; // UUID
  date_from?: Date; // Analyze content after this date
  date_to?: Date; // Analyze content before this date
}
```

**Output**:
```typescript
interface AnalyzeCombinedResult {
  success: boolean;
  contact_id: string; // UUID
  comprehensive_intelligence: ComprehensiveIntelligence;
  total_sources_analyzed: number; // Total emails + calls analyzed
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}

interface ComprehensiveIntelligence {
  // Aggregated Intelligence
  all_ideas: Idea[]; // All unique ideas (de-duplicated)
  all_goals: BusinessGoal[]; // All goals (prioritized)
  all_pain_points: PainPoint[]; // All pain points (ranked by severity)
  all_requirements: Requirement[]; // All requirements (must-haves first)

  // Evolution Analysis
  sentiment_trend: {
    start_sentiment: string; // Sentiment from first email
    current_sentiment: string; // Sentiment from latest email
    trend: 'improving' | 'declining' | 'stable';
  };

  decision_readiness_trend: {
    start_score: number; // First email decision readiness
    current_score: number; // Latest email decision readiness
    trend: 'increasing' | 'decreasing' | 'stable';
    progression_rate: number; // Change per month
  };

  // Overall Summary
  executive_summary: string; // 3-5 sentence summary of entire relationship
  relationship_stage: 'discovery' | 'consideration' | 'decision' | 'negotiation';
  recommended_next_steps: string[]; // What to do next
  knowledge_gaps: string[]; // What we still don't know

  // Metadata
  total_emails_analyzed: number;
  total_calls_analyzed: number;
  date_range: { start: Date; end: Date };
  analyzed_at: Date;
}
```

**Business Logic**:
1. **Fetch all email intelligence**: SELECT * FROM email_intelligence WHERE contact_id = ?
2. **Fetch all media intelligence**: SELECT * FROM media_files WHERE project_id IN (SELECT id FROM projects WHERE client_contact_id = ?)
3. **Aggregate intelligence**:
   - Merge all ideas (de-duplicate by text similarity)
   - Merge all goals (prioritize by timeframe and mentions)
   - Merge all pain points (rank by severity and frequency)
   - Merge all requirements (categorize must-have vs nice-to-have)
4. **Analyze trends**:
   - Compare first vs. latest sentiment
   - Calculate decision readiness progression
   - Identify relationship stage
5. **Build comprehensive prompt**:
   ```typescript
   const prompt = `Analyze this client's complete communication history and generate comprehensive insights.

   TOTAL COMMUNICATIONS:
   - ${emailCount} emails over ${daySpan} days
   - ${callCount} calls (${totalCallMinutes} minutes)

   AGGREGATED INTELLIGENCE:
   Ideas: ${JSON.stringify(allIdeas)}
   Goals: ${JSON.stringify(allGoals)}
   Pain Points: ${JSON.stringify(allPainPoints)}
   Requirements: ${JSON.stringify(allRequirements)}

   SENTIMENT TREND:
   First email: ${firstSentiment} (${firstDate})
   Latest email: ${latestSentiment} (${latestDate})

   DECISION READINESS TREND:
   First: ${firstReadiness}/10
   Latest: ${latestReadiness}/10

   GENERATE:
   1. Executive Summary (3-5 sentences covering entire relationship)
   2. Relationship Stage (discovery/consideration/decision/negotiation)
   3. Recommended Next Steps (3-5 actionable recommendations)
   4. Knowledge Gaps (what we still don't know about their business)

   Return as JSON.`;
   ```
6. **Call Claude API**: Use claude-3-5-sonnet-20241022
7. **Parse response**: Extract comprehensive intelligence
8. **Update contact**: Set ai_score based on decision_readiness_trend.current_score
9. **Return result**: Return comprehensive intelligence

**Performance Requirements**:
- Analysis time: < 15 seconds (even for 100+ emails)
- Claude API call: ~10 seconds
- Aggregation: ~3 seconds

**Error Codes**:
- `AI_INTEL_009`: Contact not found
- `AI_INTEL_010`: No intelligence data available (no emails or calls)
- `AI_INTEL_011`: Claude API error
- `AI_INTEL_012`: Failed to generate comprehensive intelligence

---

### 4.4 extractBusinessGoals()
**Purpose**: Extract ONLY business goals from content (focused extraction).

**Input**:
```typescript
interface ExtractBusinessGoalsRequest {
  content: string; // Email body or transcript text
  context?: string; // Optional context (previous emails, etc.)
}
```

**Output**:
```typescript
interface ExtractBusinessGoalsResult {
  success: boolean;
  goals: BusinessGoal[];
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}
```

**Business Logic**:
1. **Build focused prompt**:
   ```typescript
   const prompt = `Extract ONLY business goals from this content.

   CONTENT:
   ${content}

   EXTRACT BUSINESS GOALS:
   - What does the client want to achieve?
   - What outcomes are they looking for?
   - What metrics/KPIs do they care about?
   - When do they want to achieve this?

   For each goal, identify:
   - Category (revenue, growth, awareness, engagement, retention, other)
   - Timeframe (if mentioned)
   - Metric (if mentioned)
   - Source quote (exact text)

   Return as JSON array of BusinessGoal objects.`;
   ```
2. **Call Claude API**: Use claude-3-5-sonnet-20241022
3. **Parse response**: Extract goals array
4. **Return goals**: Return business goals

**Use Case**: Used by other agents for focused extraction without full intelligence analysis

**Performance Requirements**:
- Extraction time: < 3 seconds
- Cost: ~$0.01 per extraction

**Error Codes**:
- `AI_INTEL_013`: No goals found in content
- `AI_INTEL_014`: Extraction failed

---

### 4.5 extractPainPoints()
**Purpose**: Extract ONLY pain points from content.

**Input**: Same as `extractBusinessGoals()`

**Output**:
```typescript
interface ExtractPainPointsResult {
  success: boolean;
  pain_points: PainPoint[];
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}
```

**Business Logic**: Same pattern as `extractBusinessGoals()`, focused on pain points

---

### 4.6 extractIdeas()
**Purpose**: Extract ONLY ideas from content.

**Input**: Same as `extractBusinessGoals()`

**Output**:
```typescript
interface ExtractIdeasResult {
  success: boolean;
  ideas: Idea[];
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}
```

**Business Logic**: Same pattern, focused on ideas

---

### 4.7 extractRequirements()
**Purpose**: Extract ONLY requirements from content.

**Input**: Same as `extractBusinessGoals()`

**Output**:
```typescript
interface ExtractRequirementsResult {
  success: boolean;
  requirements: Requirement[];
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}
```

**Business Logic**: Same pattern, focused on requirements

---

### 4.8 analyzeSentiment()
**Purpose**: Analyze sentiment of content (positive, negative, neutral, mixed).

**Input**:
```typescript
interface AnalyzeSentimentRequest {
  content: string; // Email or transcript text
}
```

**Output**:
```typescript
interface AnalyzeSentimentResult {
  success: boolean;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  energy_level: number; // 1-10
  confidence: number; // 0.0-1.0
  reasoning: string; // Why this sentiment was detected
  processing_time_ms: number;
  cost_usd: number;
  error?: string;
}
```

**Business Logic**:
1. **Build sentiment prompt**:
   ```typescript
   const prompt = `Analyze the sentiment of this content.

   CONTENT:
   ${content}

   DETERMINE:
   1. Sentiment (positive/negative/neutral/mixed)
   2. Energy Level (1-10, how excited/enthusiastic)
   3. Reasoning (explain why you detected this sentiment)

   SENTIMENT DEFINITIONS:
   - Positive: Optimistic, excited, happy, eager
   - Negative: Frustrated, concerned, disappointed, angry
   - Neutral: Matter-of-fact, informational, no strong emotion
   - Mixed: Both positive and negative emotions present

   Return as JSON: { sentiment, energy_level, reasoning }`;
   ```
2. **Call Claude API**: Use claude-3-5-sonnet-20241022
3. **Parse response**: Extract sentiment data
4. **Return sentiment**: Return analysis

**Performance Requirements**:
- Analysis time: < 2 seconds
- Cost: ~$0.005 per analysis

**Error Codes**:
- `AI_INTEL_015`: Sentiment analysis failed
- `AI_INTEL_016`: Invalid sentiment value

---

### 4.9 calculateDecisionReadiness()
**Purpose**: Calculate how ready the client is to move forward (1-10 scale).

**Input**:
```typescript
interface CalculateDecisionReadinessRequest {
  intelligence: EmailIntelligence | AIMediaAnalysis; // Extracted intelligence
}
```

**Output**:
```typescript
interface CalculateDecisionReadinessResult {
  success: boolean;
  decision_readiness: number; // 1-10
  factors: {
    goals_clarity: number; // How clear are goals? (1-10)
    budget_discussed: boolean; // Budget mentioned?
    timeline_defined: boolean; // Timeline mentioned?
    decision_makers_involved: boolean; // Right people involved?
    concerns_addressed: boolean; // Pain points acknowledged?
    next_steps_defined: boolean; // Next steps discussed?
  };
  reasoning: string; // Why this score
  error?: string;
}
```

**Business Logic**:
1. **Analyze intelligence factors**:
   - Goals clarity: Are goals specific and measurable?
   - Budget: Has budget been discussed?
   - Timeline: Is there a timeframe mentioned?
   - Decision makers: Are the right people involved?
   - Concerns: Have pain points been acknowledged?
   - Next steps: Are next steps defined?
2. **Calculate score**:
   ```typescript
   let score = 5; // Baseline

   if (goalsClarity >= 8) score += 2;
   if (budgetDiscussed) score += 1;
   if (timelineDefined) score += 1;
   if (decisionMakersInvolved) score += 1;
   if (concernsAddressed) score += 0.5;
   if (nextStepsDefined) score += 0.5;

   // Cap at 10
   score = Math.min(score, 10);
   ```
3. **Return score**: Return decision readiness with factors

**Decision Readiness Scale**:
- **1-3**: Early exploration, many questions, no budget/timeline
- **4-6**: Interested, some concerns, exploring options
- **7-8**: Seriously considering, budget discussed, timeline defined
- **9-10**: Ready to commit, clear next steps, decision imminent

**Performance Requirements**:
- Calculation time: < 100ms (no AI call, just logic)

**Error Codes**:
- `AI_INTEL_017`: Insufficient data to calculate readiness

---

### 4.10 mergeNewIntelligence()
**Purpose**: Merge new intelligence with existing intelligence (incremental updates).

**Input**:
```typescript
interface MergeNewIntelligenceRequest {
  contact_id: string; // UUID
  new_intelligence: EmailIntelligence | AIMediaAnalysis; // New intelligence to merge
  workspace_id: string; // UUID
}
```

**Output**:
```typescript
interface MergeNewIntelligenceResult {
  success: boolean;
  merged_intelligence: ComprehensiveIntelligence;
  items_added: {
    ideas: number;
    goals: number;
    pain_points: number;
    requirements: number;
  };
  error?: string;
}
```

**Business Logic**:
1. **Fetch existing comprehensive intelligence**: Get previous analyzeCombined() result
2. **De-duplicate new items**:
   - Compare new ideas with existing ideas (text similarity > 80% = duplicate)
   - Compare new goals with existing goals
   - Compare new pain points with existing pain points
3. **Merge intelligently**:
   - Add new unique items
   - Update priorities if mentioned multiple times
   - Track sentiment trend
   - Update decision readiness trend
4. **Store merged intelligence**: Update comprehensive intelligence cache
5. **Return merge result**: Return merged data with counts

**De-duplication Logic**:
```typescript
function isDuplicate(newItem: Idea, existingItems: Idea[]): boolean {
  return existingItems.some(existing => {
    const similarity = calculateTextSimilarity(newItem.text, existing.text);
    return similarity > 0.8; // 80% similar = duplicate
  });
}

function calculateTextSimilarity(text1: string, text2: string): number {
  // Use Levenshtein distance or similar algorithm
  // Return 0.0-1.0 (0 = completely different, 1 = identical)
}
```

**Performance Requirements**:
- Merge time: < 1 second (even with 100+ existing items)

**Error Codes**:
- `AI_INTEL_018`: Contact not found
- `AI_INTEL_019`: Merge failed

---

## 5. API ENDPOINTS

### POST /api/intelligence/analyze-email
**Description**: Analyze email and extract intelligence.

**Request**:
```json
{
  "email_id": "550e8400-e29b-41d4-a716-446655440000",
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "include_thread_context": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "email_intelligence_id": "880e8400-e29b-41d4-a716-446655440000",
  "intelligence": {
    "ideas": [
      {
        "text": "Q4 marketing campaign focused on product launch",
        "category": "campaign",
        "priority": "high",
        "source_quote": "We're looking at a Q4 launch for this new campaign."
      }
    ],
    "business_goals": [
      {
        "text": "Increase brand awareness by 50% in Q4",
        "category": "awareness",
        "timeframe": "Q4 2025",
        "metric": "50% increase",
        "source_quote": "We want to see at least 50% more awareness by end of Q4."
      }
    ],
    "pain_points": [
      {
        "text": "Current marketing agency not delivering results",
        "severity": "high",
        "category": "quality",
        "impact": "Missing growth targets",
        "source_quote": "We're just not seeing the results we expected from our current agency."
      }
    ],
    "requirements": [
      {
        "text": "Budget cap of $50,000 for Q4 campaign",
        "type": "constraint",
        "category": "budget",
        "details": "Hard cap, cannot exceed",
        "source_quote": "Our maximum budget is $50k for this quarter."
      }
    ],
    "questions_asked": [
      "What's your experience with similar campaigns?",
      "Can you provide case studies?",
      "What's the typical timeline for setup?"
    ],
    "decisions_made": [
      "Moving away from current agency",
      "Committed to Q4 launch timeline",
      "Approved initial concept"
    ],
    "sentiment": "positive",
    "energy_level": 7,
    "decision_readiness": 7,
    "entities": {
      "people": ["Duncan Smith", "Sarah Johnson"],
      "companies": ["TechCorp Australia"],
      "products": ["Q4 Marketing Campaign"],
      "technologies": ["Instagram", "LinkedIn"],
      "locations": ["Sydney", "Melbourne"]
    }
  },
  "processing_time_ms": 4250,
  "cost_usd": 0.033
}
```

---

### POST /api/intelligence/analyze-transcript
**Description**: Analyze video/audio transcript and extract intelligence.

**Request**:
```json
{
  "media_file_id": "990e8400-e29b-41d4-a716-446655440000",
  "analyze_by_speaker": true,
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "media_file_id": "990e8400-e29b-41d4-a716-446655440000",
  "intelligence": {
    "ideas": [...],
    "business_goals": [...],
    "pain_points": [...],
    "requirements": [...],
    "summary": "Client discussed Q4 marketing campaign focused on product launch. Budget of $50k was confirmed. Timeline is tight but achievable. Client expressed concerns about current agency performance.",
    "key_points": [
      "Q4 product launch campaign confirmed",
      "Budget approved: $50,000",
      "Timeline: Start in 2 weeks",
      "Pain point: Current agency underperforming",
      "Decision maker: Duncan (CEO) + Sarah (CMO)"
    ],
    "action_items": [
      "Send proposal by Friday",
      "Schedule follow-up call next Tuesday",
      "Provide case studies from similar campaigns"
    ],
    "topics": ["marketing strategy", "budget", "timeline", "team structure"],
    "sentiment": "positive",
    "energy_level": 8,
    "decision_readiness": 8
  },
  "speaker_insights": {
    "SPEAKER_00 (Duncan - Client)": {
      "sentiment": "positive",
      "energy_level": 8,
      "decision_readiness": 9,
      "key_concerns": ["Timeline constraints", "Agency reliability"]
    },
    "SPEAKER_01 (John - Account Manager)": {
      "sentiment": "positive",
      "energy_level": 7,
      "proposed_solutions": ["2-week kick-off", "Weekly check-ins", "Dedicated account manager"]
    }
  },
  "processing_time_ms": 8750,
  "cost_usd": 0.06
}
```

---

### POST /api/intelligence/analyze-combined
**Description**: Generate comprehensive intelligence for contact (all emails + calls).

**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "date_from": "2024-07-01T00:00:00Z",
  "date_to": "2025-11-18T00:00:00Z"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "comprehensive_intelligence": {
    "all_ideas": [15 unique ideas],
    "all_goals": [8 goals prioritized],
    "all_pain_points": [12 pain points ranked],
    "all_requirements": [20 requirements categorized],
    "sentiment_trend": {
      "start_sentiment": "neutral",
      "current_sentiment": "positive",
      "trend": "improving"
    },
    "decision_readiness_trend": {
      "start_score": 3,
      "current_score": 8,
      "trend": "increasing",
      "progression_rate": 1.25
    },
    "executive_summary": "Duncan from TechCorp has been exploring marketing solutions for Q4 product launch. Over 4 months, he's evolved from early exploration to being ready to commit. Budget approved ($50k), timeline defined (2 weeks), and decision makers aligned. Main concern is agency reliability based on past experience.",
    "relationship_stage": "decision",
    "recommended_next_steps": [
      "Send comprehensive proposal including case studies",
      "Schedule strategy workshop to finalize campaign details",
      "Provide detailed timeline with milestones",
      "Introduce dedicated account manager",
      "Prepare contract for review"
    ],
    "knowledge_gaps": [
      "Team size and structure",
      "Internal marketing capabilities",
      "Previous campaign performance metrics",
      "Competitor activities",
      "Long-term marketing roadmap beyond Q4"
    ],
    "total_emails_analyzed": 47,
    "total_calls_analyzed": 3,
    "date_range": {
      "start": "2024-07-15T00:00:00Z",
      "end": "2025-11-18T00:00:00Z"
    }
  },
  "total_sources_analyzed": 50,
  "processing_time_ms": 12350,
  "cost_usd": 0.08
}
```

---

### POST /api/intelligence/extract/goals
**Description**: Extract ONLY business goals from content.

**Request**:
```json
{
  "content": "We want to increase brand awareness by 50% in Q4 and generate 200 qualified leads per month."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "goals": [
    {
      "text": "Increase brand awareness by 50% in Q4",
      "category": "awareness",
      "timeframe": "Q4",
      "metric": "50% increase",
      "source_quote": "increase brand awareness by 50% in Q4"
    },
    {
      "text": "Generate 200 qualified leads per month",
      "category": "growth",
      "timeframe": "monthly",
      "metric": "200 leads/month",
      "source_quote": "generate 200 qualified leads per month"
    }
  ],
  "processing_time_ms": 2150,
  "cost_usd": 0.01
}
```

---

### POST /api/intelligence/sentiment
**Description**: Analyze sentiment of content.

**Request**:
```json
{
  "content": "I'm really excited about this opportunity! The proposal looks fantastic and the timeline works perfectly for us."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "sentiment": "positive",
  "energy_level": 9,
  "confidence": 0.95,
  "reasoning": "Strong positive language ('really excited', 'fantastic', 'perfectly') indicates high enthusiasm and satisfaction. No negative concerns or hesitations expressed.",
  "processing_time_ms": 1850,
  "cost_usd": 0.005
}
```

---

## 6. INTEGRATION POINTS

### Inputs (What This Agent Receives)

1. **From Email Integration Agent**:
   - New email content (client_emails records)
   - Email thread context
   - Trigger: New email arrived

2. **From Media Transcription Agent**:
   - Completed transcripts (media_files.transcript)
   - Speaker-separated content
   - Trigger: Transcription completed

3. **From Workflow Agent**:
   - Automatic analysis triggers on new content
   - Scheduled re-analysis (weekly comprehensive intelligence update)

### Outputs (What This Agent Provides)

1. **To Mindmap Auto-Generation Agent**:
   - Extracted ideas (nodes for "Ideas" branch)
   - Business goals (nodes for "Goals" branch)
   - Pain points (nodes for "Problems" branch)
   - Requirements (nodes for "Requirements" branch)
   - Knowledge gaps (nodes for "Gaps" branch)

2. **To Knowledge Gap Analysis Agent**:
   - Current comprehensive intelligence
   - Identified knowledge gaps
   - Confidence scores per category

3. **To Dynamic Questionnaire Generator Agent**:
   - Knowledge gaps (what to ask about)
   - Existing intelligence (context for questions)
   - Contact history (reference specific things client mentioned)

4. **To Marketing Strategy Generator Agent**:
   - Comprehensive intelligence (all ideas, goals, pain points, requirements)
   - Relationship stage (discovery/consideration/decision/negotiation)
   - Recommended next steps

5. **To Contact Agent**:
   - Updated ai_score (based on decision_readiness)
   - Sentiment trend (for engagement scoring)
   - Last intelligence update timestamp

6. **To Analytics Agent**:
   - Intelligence metrics (total insights extracted, sentiment distribution)
   - Decision readiness trends over time
   - Knowledge gap trends

---

## 7. BUSINESS RULES

### Intelligence Extraction Rules

1. **Always Extract Source Quotes**:
   - EVERY extracted item (idea, goal, pain point, requirement) MUST include original text
   - Enables traceability and verification
   - Example: "Our budget is $50k" → source_quote: "Our maximum budget is $50k for this quarter"

2. **De-duplication Logic**:
   - Text similarity > 80% = duplicate
   - Keep item with more details
   - Increment mention count for duplicate items

3. **Priority Assignment**:
   - Mentioned multiple times → priority: high
   - Mentioned with urgency words ("urgent", "ASAP", "critical") → priority: high
   - Mentioned once → priority: medium
   - Vague or uncertain → priority: low

4. **Confidence Scoring**:
   - Explicit statements → confidence: 0.9-1.0
   - Implied or inferred → confidence: 0.6-0.8
   - Speculative or uncertain → confidence: 0.3-0.5

### Sentiment Analysis Rules

1. **Mixed Sentiment Detection**:
   - If both positive and negative emotions present → sentiment: mixed
   - Example: "I'm excited about the opportunity BUT concerned about the timeline"

2. **Energy Level Calibration**:
   - Exclamation marks, caps, superlatives → high energy (7-10)
   - Neutral, factual language → medium energy (4-6)
   - Concerns, hesitations, questions → low energy (1-3)

3. **Decision Readiness Factors**:
   - Budget discussed + Timeline defined + Next steps clear = 8-10
   - Interested + Some questions = 5-7
   - Early exploration + Many questions = 1-4

### Cost Management Rules

1. **Batch Processing**:
   - Analyze multiple emails in single Claude call (reduce API calls)
   - Max 10 emails per batch to stay under token limits

2. **Incremental Updates**:
   - Only analyze NEW content (don't re-analyze old emails/calls)
   - Use mergeNewIntelligence() for updates

3. **Caching Strategy**:
   - Cache comprehensive intelligence for 24 hours
   - Only re-run analyzeCombined() if new content added

---

## 8. PERFORMANCE REQUIREMENTS

### Response Time Targets

| Function | Target | Maximum | Notes |
|----------|--------|---------|-------|
| analyzeEmailContent() | < 5s | 10s | Single email analysis |
| analyzeTranscription() | < 10s | 20s | 60-minute transcript |
| analyzeCombined() | < 15s | 30s | 100+ emails + calls |
| extractBusinessGoals() | < 3s | 5s | Focused extraction |
| analyzeSentiment() | < 2s | 5s | Quick sentiment check |
| calculateDecisionReadiness() | < 100ms | 500ms | No AI call, just logic |
| mergeNewIntelligence() | < 1s | 3s | De-duplication + merge |

### Scalability Targets

1. **Concurrent Analysis**:
   - Support 20 simultaneous Claude API calls
   - Queue overflow jobs for background processing
   - Max queue depth: 100 pending analyses

2. **Batch Processing**:
   - Analyze 100 emails per hour
   - Analyze 20 transcripts per hour
   - Total daily capacity: 2,400 emails + 480 transcripts

3. **Cost Efficiency**:
   - Email analysis: $0.033 per email
   - Transcript analysis: $0.06 per 60-minute call
   - Daily budget: $100 (processes 3,000 emails or 1,667 calls)

### Database Indexes (Critical for Performance)

**email_intelligence**:
- `idx_email_intelligence_email_id` ON `email_id` (link to email)
- `idx_email_intelligence_contact_id` ON `contact_id` (get all intelligence for contact)
- `idx_email_intelligence_workspace_id` ON `workspace_id` (workspace filtering)
- `idx_email_intelligence_decision_readiness` ON `decision_readiness DESC` (find hot leads)

---

## 9. TESTING STRATEGY

### Unit Tests

**Test File**: `tests/agents/ai-intelligence-extraction.test.ts`

```typescript
describe('AI Intelligence Extraction Agent', () => {
  describe('analyzeEmailContent()', () => {
    it('should extract intelligence from email', async () => {
      const email = await createTestEmail({
        subject: 'Q4 Marketing Campaign',
        body_text: 'We want to increase brand awareness by 50% in Q4. Our budget is $50k.',
      });

      const result = await analyzeEmailContent({
        email_id: email.id,
        workspace_id: TEST_WORKSPACE_ID,
      });

      expect(result.success).toBe(true);
      expect(result.intelligence.business_goals.length).toBeGreaterThan(0);
      expect(result.intelligence.business_goals[0].text).toContain('50%');
      expect(result.intelligence.requirements.length).toBeGreaterThan(0);
      expect(result.intelligence.requirements[0].text).toContain('$50k');
    });
  });

  describe('analyzeSentiment()', () => {
    it('should detect positive sentiment', async () => {
      const result = await analyzeSentiment({
        content: "I'm really excited about this opportunity! The proposal looks fantastic.",
      });

      expect(result.success).toBe(true);
      expect(result.sentiment).toBe('positive');
      expect(result.energy_level).toBeGreaterThan(7);
    });

    it('should detect mixed sentiment', async () => {
      const result = await analyzeSentiment({
        content: "I'm excited about the opportunity BUT concerned about the timeline.",
      });

      expect(result.sentiment).toBe('mixed');
    });
  });

  describe('calculateDecisionReadiness()', () => {
    it('should calculate high readiness for committed client', async () => {
      const intelligence = {
        business_goals: [{ text: 'Launch in Q4', timeframe: 'Q4' }],
        requirements: [{ text: 'Budget: $50k', category: 'budget' }],
        questions_asked: [],
        decisions_made: ['Approved budget', 'Confirmed timeline'],
      };

      const result = await calculateDecisionReadiness({ intelligence });

      expect(result.decision_readiness).toBeGreaterThanOrEqual(8);
    });
  });
});
```

---

## 10. ERROR CODES

| Error Code | Description | HTTP Status | Retry? |
|-----------|-------------|-------------|--------|
| AI_INTEL_001 | Email not found | 404 | No |
| AI_INTEL_002 | Claude API error | 500 | Yes |
| AI_INTEL_003 | Failed to parse Claude response | 500 | Yes |
| AI_INTEL_004 | Intelligence storage failed | 500 | Yes |
| AI_INTEL_005 | Media file not found | 404 | No |
| AI_INTEL_006 | Transcript not available | 404 | No |
| AI_INTEL_007 | Claude API error | 500 | Yes |
| AI_INTEL_008 | Intelligence storage failed | 500 | Yes |
| AI_INTEL_009 | Contact not found | 404 | No |
| AI_INTEL_010 | No intelligence data available | 404 | No |
| AI_INTEL_011 | Claude API error | 500 | Yes |
| AI_INTEL_012 | Failed to generate comprehensive intelligence | 500 | Yes |
| AI_INTEL_013 | No goals found in content | 404 | No |
| AI_INTEL_014 | Extraction failed | 500 | Yes |
| AI_INTEL_015 | Sentiment analysis failed | 500 | Yes |
| AI_INTEL_016 | Invalid sentiment value | 400 | No |
| AI_INTEL_017 | Insufficient data to calculate readiness | 400 | No |
| AI_INTEL_018 | Contact not found | 404 | No |
| AI_INTEL_019 | Merge failed | 500 | Yes |

---

## 11. AUSTRALIAN COMPLIANCE

### Timezone Handling (AEST/AEDT)

1. **Analysis Timestamps**:
   - Store analyzed_at in UTC
   - Display in AEST/AEDT in dashboard
   - Example: "Analyzed 18 Nov 2025, 3:30 PM AEDT"

---

## 12. SECURITY

### Row Level Security (RLS) Policies

**email_intelligence** (RLS Enabled):
```sql
CREATE POLICY "Users can view email intelligence in their workspace"
  ON email_intelligence
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );
```

### API Key Security

1. **Anthropic API Key**:
   - Store in environment variable `ANTHROPIC_API_KEY`
   - NEVER log or expose in error messages
   - Rotate every 90 days

---

## 13. MONITORING & METRICS

### Prometheus Metrics

```typescript
const intelligenceExtracted = new Counter({
  name: 'intelligence_extracted_total',
  help: 'Total intelligence items extracted',
  labelNames: ['type', 'workspace_id'], // type: idea, goal, pain_point, requirement
});

const analysisD uration = new Histogram({
  name: 'intelligence_analysis_duration_ms',
  help: 'Intelligence analysis duration',
  labelNames: ['type'], // type: email, transcript, combined
  buckets: [1000, 3000, 5000, 10000, 15000, 30000],
});
```

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 (Q2 2026)

1. **Real-time Analysis**: Analyze emails/calls as they arrive (< 10 seconds)
2. **Emotion Detection**: Detect emotions from voice tone in calls
3. **Multi-language Support**: Analyze non-English content

### Phase 3 (Q3-Q4 2026)

1. **Predictive Intelligence**: Predict client needs before they ask
2. **Competitive Intelligence**: Extract competitor mentions and analysis
3. **Risk Detection**: Flag at-risk relationships early

---

## AGENT METADATA

**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Status**: Active Development
**Owner**: Client Intelligence Team
**Dependencies**: Email Integration Agent, Media Transcription Agent, Contact Agent
**Related Docs**:
- `supabase/migrations/038_core_saas_tables.sql` - client_emails schema
- `supabase/migrations/029_media_files.sql` - media_files schema

---

**END OF AI INTELLIGENCE EXTRACTION AGENT SPECIFICATION**
