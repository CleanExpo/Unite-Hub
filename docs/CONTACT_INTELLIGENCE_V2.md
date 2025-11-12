# Contact Intelligence V2 - Enhanced AI Analysis

## What's New in V2

The contact intelligence system has been upgraded with powerful new capabilities:

###  Extended Thinking
- Uses Claude Opus 4 with **10,000 token thinking budget**
- Deeper analysis with internal reasoning
- More accurate intent detection
- Better pattern recognition

### 🎯 Composite Scoring
- Multi-factor scoring system
- Automatic hot lead identification (score >= 70)
- Weighted by role, intent, stage, and velocity
- Prioritizes high-value opportunities

### 📈 Engagement Velocity
- Tracks activity trends (-2 to +2 scale)
- Compares last 7 days vs 30 days
- Identifies warming up or cooling off contacts
- Helps prioritize timely follow-ups

### 💭 Sentiment Analysis
- Measures communication sentiment (-50 to +100)
- Detects enthusiasm, concerns, objections
- Tracks relationship health
- Identifies at-risk deals

### 🔗 Interaction Tracking
- Includes call logs, meetings, notes
- Comprehensive engagement history
- Full context for AI analysis
- Better next action recommendations

## New API Endpoints

### Get Hot Leads
```bash
GET /api/contacts/hot-leads?workspaceId=uuid&limit=10
```

Returns contacts with composite scores >= 70, ranked by priority.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "leads": [
    {
      "id": "uuid",
      "name": "Sarah Chen",
      "company": "TechCorp",
      "job_title": "VP Engineering",
      "ai_score": 88,
      "buying_intent": "high",
      "decision_stage": "decision",
      "role_type": "decision_maker",
      "engagement_velocity": 2,
      "sentiment_score": 92,
      "compositeScore": 98,
      "risk_signals": [],
      "opportunity_signals": [
        "Budget approved",
        "Multiple stakeholder meetings",
        "Technical requirements defined"
      ],
      "next_best_action": "Send pricing proposal and schedule executive alignment call"
    }
  ]
}
```

### Workspace Batch Analysis
```bash
PUT /api/contacts/analyze
Body: { "workspaceId": "uuid" }
```

Analyzes up to 10 contacts automatically (prioritizing recent activity).

**Response:**
```json
{
  "success": true,
  "analyzed": 10,
  "errors": 0,
  "message": "Successfully analyzed 10 contacts (0 errors)"
}
```

## Enhanced Analysis Fields

### New Contact Fields

```typescript
interface EnhancedContact {
  // Existing fields
  ai_score: number;                    // 0-100
  buying_intent: string;               // high/medium/low/unknown
  decision_stage: string;              // awareness/consideration/decision/unknown
  role_type: string;                   // decision_maker/influencer/end_user/unknown

  // NEW fields
  engagement_velocity: number;         // -2 to +2
  sentiment_score: number;             // -50 to +100
  risk_signals: string[];              // Array of concerns
  opportunity_signals: string[];       // Array of positive signals
  last_analysis_at: Date;              // Timestamp of last AI analysis
  ai_analysis: {
    analysis_date: string;
    next_best_action: string;
    engagement_score: number;
    // ... full analysis data
  };
}
```

## Composite Scoring Algorithm

```typescript
function calculateCompositeScore(contact): number {
  let score = contact.ai_score || 0;

  // Engagement velocity bonus
  if (contact.engagement_velocity > 0) {
    score += contact.engagement_velocity * 5;  // +5 or +10
  }

  // Role type bonus
  if (contact.role_type === "decision_maker") {
    score += 15;
  } else if (contact.role_type === "influencer") {
    score += 10;
  }

  // Buying intent bonus
  if (contact.buying_intent === "high") {
    score += 20;
  } else if (contact.buying_intent === "medium") {
    score += 10;
  }

  // Decision stage bonus
  if (contact.decision_stage === "decision") {
    score += 25;
  } else if (contact.decision_stage === "consideration") {
    score += 15;
  }

  return Math.min(score, 100);  // Cap at 100
}
```

## Usage Examples

### 1. Analyze Single Contact with Full Context

```typescript
import { analyzeContactIntelligence } from "@/lib/agents/contact-intelligence";

const analysis = await analyzeContactIntelligence(contactId, workspaceId);

console.log(`
  Engagement: ${analysis.engagement_score}/100
  Velocity: ${analysis.engagement_velocity > 0 ? '↑' : '↓'} ${analysis.engagement_velocity}
  Sentiment: ${analysis.sentiment_score}
  Intent: ${analysis.buying_intent}
  Stage: ${analysis.decision_stage}
  Role: ${analysis.role_type}

  Next Best Action:
  ${analysis.next_best_action}

  Opportunities:
  ${analysis.opportunity_signals.join('\n  - ')}

  Risks:
  ${analysis.risk_signals.join('\n  - ')}
`);
```

### 2. Get Daily Hot Leads Report

```typescript
import { getHotLeads } from "@/lib/agents/contact-intelligence";

async function generateDailyReport(workspaceId: string) {
  const hotLeads = await getHotLeads(workspaceId, 20);

  console.log(`🔥 ${hotLeads.length} Hot Leads Today`);
  console.log('=' .repeat(50));

  for (const lead of hotLeads) {
    console.log(`
${lead.name} (${lead.company})
Score: ${lead.compositeScore}/100
${lead.next_best_action}
---
    `);
  }
}
```

### 3. Automated Workspace Analysis

```typescript
import { analyzeWorkspaceContacts } from "@/lib/agents/contact-intelligence";

// Run nightly to keep scores fresh
async function nightlyAnalysis() {
  const workspaces = await db.workspaces.list();

  for (const workspace of workspaces) {
    const results = await analyzeWorkspaceContacts(workspace.id);
    console.log(`Workspace ${workspace.name}: ${results.analyzed} analyzed, ${results.errors} errors`);

    // Wait 5 seconds between workspaces to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

### 4. Real-time Hot Lead Alerts

```typescript
import { getHotLeads, calculateCompositeScore } from "@/lib/agents/contact-intelligence";

async function checkForNewHotLeads(workspaceId: string) {
  const hotLeads = await getHotLeads(workspaceId);

  for (const lead of hotLeads) {
    // Check if this is a newly hot lead
    if (lead.last_analysis_at &&
        new Date(lead.last_analysis_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {

      // Send alert to sales team
      await sendSlackAlert({
        channel: '#sales-hot-leads',
        text: `🔥 New hot lead: ${lead.name} at ${lead.company}`,
        fields: [
          { title: 'Score', value: lead.compositeScore },
          { title: 'Intent', value: lead.buying_intent },
          { title: 'Next Action', value: lead.next_best_action }
        ]
      });
    }
  }
}
```

## Best Practices

### 1. Regular Analysis Schedule

```typescript
// Analyze high-priority contacts daily
await analyzeWorkspaceContacts(workspaceId);

// Review hot leads every morning
const hotLeads = await getHotLeads(workspaceId);
```

### 2. Monitor Velocity Changes

Contacts with negative velocity (-1 or -2) may need immediate attention:

```typescript
const contacts = await db.contacts.listByWorkspace(workspaceId);
const declining = contacts.filter(c => c.engagement_velocity < 0);

for (const contact of declining) {
  console.log(`⚠️  ${contact.name} is cooling off - last interaction: ${contact.last_interaction}`);
}
```

### 3. Prioritize by Composite Score

Focus your time on contacts with the highest composite scores:

```typescript
const hotLeads = await getHotLeads(workspaceId);

// Today's priorities
const urgent = hotLeads.filter(l => l.compositeScore >= 90);
const important = hotLeads.filter(l => l.compositeScore >= 80 && l.compositeScore < 90);
const review = hotLeads.filter(l => l.compositeScore >= 70 && l.compositeScore < 80);
```

### 4. Track Sentiment Trends

Monitor sentiment changes to catch issues early:

```typescript
const contact = await db.contacts.getById(contactId);

if (contact.sentiment_score < 0) {
  console.log(`⚠️  Negative sentiment detected with ${contact.name}`);
  console.log(`Risks: ${contact.risk_signals.join(', ')}`);
}
```

## Performance Considerations

### Extended Thinking Cost

- Each analysis uses **~16,000 tokens** (10K thinking + 6K output)
- Approximate cost: **$0.10-0.15 per contact** with Claude Opus 4
- Batch analysis processes 10 contacts = ~$1.00-1.50
- Plan your analysis budget accordingly

### Rate Limiting

The system includes built-in delays:
- 1 second between contacts in batch analysis
- Analyzes max 10 contacts per workspace batch
- Recommended: Run batch analysis during off-hours

### Caching Strategy

```typescript
// Only re-analyze if last analysis is old
const ANALYSIS_FRESHNESS = 24 * 60 * 60 * 1000; // 24 hours

async function analyzeIfStale(contactId: string, workspaceId: string) {
  const contact = await db.contacts.getById(contactId);

  if (!contact.last_analysis_at ||
      new Date(contact.last_analysis_at).getTime() < Date.now() - ANALYSIS_FRESHNESS) {
    return await analyzeContactIntelligence(contactId, workspaceId);
  }

  return contact.ai_analysis;
}
```

## Migration from V1

If you have existing contacts analyzed with V1:

1. **Scores are compatible** - V1 engagement_score maps to V2 ai_score
2. **New fields default to sensible values**:
   - `engagement_velocity`: 0 (neutral)
   - `sentiment_score`: 50 (neutral positive)
3. **Re-analyze to get full V2 benefits**:

```typescript
// Re-analyze all contacts to get velocity and sentiment
await analyzeWorkspaceContacts(workspaceId);
```

## Troubleshooting

### "Invalid JSON from Claude"

The system handles markdown-wrapped JSON automatically, but if you see this error:
- Check your ANTHROPIC_API_KEY is valid
- Verify contact has email history
- Check API quota limits

### Low Engagement Velocity Despite Activity

Engagement velocity compares 7-day vs 30-day activity:
- If contact has been consistently active, velocity may be 0 (stable)
- Velocity increases only when recent activity exceeds historical average

### Composite Score Lower Than Expected

Composite scoring is strict:
- Base score starts from ai_score (0-100)
- Bonuses require specific conditions (high intent, decision stage, etc.)
- Score >= 70 is truly a hot lead worth immediate attention

## Future Enhancements

Planned for V3:
- Predictive churn scoring
- Deal probability estimation
- Automated action triggers
- Integration with calendar for meeting analysis
- Email reply suggestion generation
- Competitive intelligence extraction
