# KNOWLEDGE GAP ANALYSIS AGENT SPECIFICATION

**Agent Name**: Knowledge Gap Analysis Agent
**Agent Type**: Tier 2 - Knowledge Structuring Agent
**Priority**: P2 - Important
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `email_intelligence` - Email analysis data (read-only)
- `media_files` (ai_analysis) - Media analysis data (read-only)
- `mindmap_nodes` - Gap nodes in mindmap (read/write)

### Agent Purpose
Analyzes comprehensive client intelligence to identify what information is missing, prioritizes gaps by importance, and provides strategies for filling gaps through targeted questions or research.

### Agent Responsibilities
1. **Gap Detection**: Identify missing critical information (budget, timeline, team, metrics)
2. **Gap Prioritization**: Rank gaps by business impact (critical, high, medium, low)
3. **Gap Categorization**: Organize gaps by type (technical, budget, timeline, team, legal)
4. **Resolution Tracking**: Track which gaps have been filled over time
5. **Gap Trends**: Analyze gap patterns across multiple clients

---

## 2. CORE FUNCTIONS

### 2.1 analyzeGaps()
**Purpose**: Analyze comprehensive intelligence and identify knowledge gaps.

**Input**:
```typescript
interface AnalyzeGapsRequest {
  contact_id: string;
  workspace_id: string;
}
```

**Output**:
```typescript
interface AnalyzeGapsResult {
  success: boolean;
  gaps: Gap[];
  gap_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

interface Gap {
  id: string;
  category: 'target_audience' | 'budget' | 'timeline' | 'technical_requirements' |
             'brand_positioning' | 'competitive_landscape' | 'success_metrics' |
             'team_resources';
  text: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  suggested_questions: string[];
  business_impact: string;
}
```

**Business Logic**:
1. **Fetch comprehensive intelligence**: Get all intelligence for contact
2. **Check required categories**: Iterate through required business information categories
3. **Detect missing information**:
   ```typescript
   const requiredInfo = {
     budget: { keywords: ['budget', '$', 'cost', 'price'], importance: 'critical' },
     timeline: { keywords: ['timeline', 'deadline', 'launch', 'Q1', 'Q2'], importance: 'critical' },
     target_audience: { keywords: ['audience', 'demographic', 'customer'], importance: 'high' },
     success_metrics: { keywords: ['metric', 'KPI', 'measure', 'goal'], importance: 'high' },
   };

   const gaps = [];
   Object.entries(requiredInfo).forEach(([category, config]) => {
     const hasInfo = checkIfIntelligenceContains(intelligence, config.keywords);
     if (!hasInfo) {
       gaps.push({
         category,
         text: `${category.replace('_', ' ')} not discussed`,
         importance: config.importance,
         reasoning: `No mention of ${category} found in communications`,
       });
     }
   });
   ```
4. **Generate suggested questions**: For each gap, suggest 3-5 questions to ask
5. **Return gaps**: Return prioritized gaps

**Performance**: < 2 seconds

---

### 2.2 prioritizeGaps()
**Purpose**: Rank gaps by business importance.

**Input**: `Gap[]`

**Output**: `PrioritizedGap[]` with scoring

**Business Logic**:
```typescript
function calculateGapPriority(gap: Gap, context: IntelligenceContext): number {
  let score = 0;

  // Critical categories
  if (['budget', 'timeline', 'decision_makers'].includes(gap.category)) score += 40;

  // High importance
  if (['target_audience', 'success_metrics'].includes(gap.category)) score += 30;

  // Decision readiness impact
  if (context.decision_readiness >= 7 && gap.category === 'budget') score += 20;

  // Relationship stage
  if (context.relationship_stage === 'decision' && gap.importance === 'critical') score += 10;

  return score; // 0-100
}
```

**Performance**: < 100ms

---

### 2.3 categorizeGaps()
**Purpose**: Organize gaps by category.

**Output**:
```typescript
interface GapsByCategory {
  technical: Gap[];
  budget: Gap[];
  timeline: Gap[];
  team: Gap[];
  legal: Gap[];
  strategic: Gap[];
}
```

---

### 2.4 markGapResolved()
**Purpose**: Mark a gap as resolved when new intelligence fills it.

**Input**:
```typescript
interface MarkGapResolvedRequest {
  gap_id: string;
  resolution: string; // How it was resolved
  resolved_by: 'email' | 'call' | 'questionnaire' | 'research';
}
```

**Business Logic**:
1. **Update gap node**: Set mindmap_nodes.status = 'completed'
2. **Add resolution metadata**: Store how gap was resolved
3. **Trigger mindmap update**: Update visualization

---

## 3. API ENDPOINTS

### GET /api/gaps/analyze/:contact_id
**Response**:
```json
{
  "success": true,
  "gaps": [
    {
      "category": "budget",
      "text": "Budget not discussed",
      "importance": "critical",
      "reasoning": "Budget information is essential for proposal creation",
      "suggested_questions": [
        "What budget have you allocated for this project?",
        "Is there a budget range you're working within?",
        "What's your maximum investment for this initiative?"
      ],
      "business_impact": "Cannot create accurate proposal without budget constraints"
    }
  ],
  "gap_summary": {
    "critical": 2,
    "high": 3,
    "medium": 4,
    "low": 1,
    "total": 10
  }
}
```

---

## 4. BUSINESS RULES

### Gap Importance Tiers
- **Critical**: Budget, Timeline, Decision Makers (blocks progress)
- **High**: Target Audience, Success Metrics, Technical Requirements (needed for strategy)
- **Medium**: Team Resources, Competitive Landscape (helpful but not blocking)
- **Low**: Other nice-to-have information

### Gap Resolution Criteria
Gap is resolved when:
1. Intelligence data contains at least 2 mentions of the category
2. Confidence score >= 0.7
3. Source quotes available

---

## 5. ERROR CODES

| Code | Description |
|------|-------------|
| GAP_001 | Contact not found |
| GAP_002 | No intelligence available |
| GAP_003 | Gap analysis failed |

---

## 6. FUTURE ENHANCEMENTS

### Phase 2
1. **Predictive Gap Detection**: Predict what information will be needed based on project type
2. **Gap Trend Analysis**: Identify common gaps across multiple clients
3. **Auto-Research**: Automatically research gaps using web search (company info, industry data)

---

**END OF KNOWLEDGE GAP ANALYSIS AGENT SPECIFICATION**
