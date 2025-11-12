# Contact Intelligence System

Unite-Hub includes an AI-powered contact intelligence system that uses Claude Opus to analyze contact engagement patterns and provide actionable insights.

## Overview

The contact intelligence system analyzes email interactions, contact information, and engagement patterns to:
- Score contacts on engagement level (0-100)
- Assess buying intent (high/medium/low)
- Determine decision stage (awareness/consideration/decision)
- Identify role type (decision_maker/influencer/end_user)
- Flag risk and opportunity signals
- Recommend next best actions

## Setup

### 1. Get Anthropic API Key

Sign up at https://console.anthropic.com and get your API key.

### 2. Add to Environment

Add to your `.env.local`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## API Endpoints

### Analyze Single Contact

**POST** `/api/contacts/analyze`

Analyzes a single contact and updates their intelligence scores.

**Request:**
```json
{
  "contactId": "uuid-of-contact"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "engagement_score": 85,
    "buying_intent": "high",
    "decision_stage": "consideration",
    "role_type": "decision_maker",
    "next_best_action": "Schedule demo call to discuss specific requirements",
    "risk_signals": ["Long response times", "Budget concerns mentioned"],
    "opportunity_signals": ["Active engagement", "Multiple stakeholders involved"]
  }
}
```

### Batch Analyze Contacts

**PUT** `/api/contacts/analyze`

Analyzes multiple contacts in a workspace.

**Request:**
```json
{
  "workspaceId": "uuid-of-workspace",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "processed": 10,
  "results": [
    {
      "contactId": "uuid-1",
      "success": true,
      "analysis": { ... }
    },
    ...
  ]
}
```

## Implementation Details

### Agent File

`src/lib/agents/contact-intelligence.ts`

The main agent that:
1. Retrieves contact information and email history
2. Sends data to Claude Opus for analysis
3. Updates contact records with intelligence scores
4. Returns structured analysis

### Database Updates

The system updates the `contacts` table with:
- `ai_score`: Engagement score normalized to 0-1
- `tags`: Combined risk and opportunity signals

### Audit Logging

All intelligence analyses are logged to the `audit_logs` table with:
- Action: `contact.intelligence_analyzed`
- Agent: `contact-intelligence`
- Status: `success` or `failed`
- Details: Key metrics from the analysis

## Usage Examples

### Programmatic Usage

```typescript
import { analyzeContactIntelligence } from "@/lib/agents/contact-intelligence";

// Analyze a contact
const analysis = await analyzeContactIntelligence(contactId);

console.log(`Engagement: ${analysis.engagement_score}/100`);
console.log(`Intent: ${analysis.buying_intent}`);
console.log(`Next Action: ${analysis.next_best_action}`);
```

### API Usage

```bash
# Analyze single contact
curl -X POST http://localhost:3005/api/contacts/analyze \
  -H "Content-Type: application/json" \
  -d '{"contactId": "your-contact-id"}'

# Batch analyze workspace contacts
curl -X PUT http://localhost:3005/api/contacts/analyze \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "limit": 5}'
```

## Analysis Criteria

The AI analyzes:

1. **Email Engagement**
   - Response time
   - Email frequency
   - Content quality

2. **Job Title & Role**
   - Decision-making authority
   - Influence level
   - Department relevance

3. **Interaction Patterns**
   - Consistency of engagement
   - Topic of discussions
   - Question types

4. **Buying Signals**
   - Budget discussions
   - Timeline mentions
   - Technical questions
   - Stakeholder involvement

## Scoring System

### Engagement Score (0-100)
- **90-100**: Highly engaged, frequent meaningful interactions
- **70-89**: Good engagement, regular communication
- **50-69**: Moderate engagement, occasional responses
- **30-49**: Low engagement, minimal interaction
- **0-29**: Very low engagement or unresponsive

### Buying Intent
- **High**: Active evaluation, timeline discussions, budget approved
- **Medium**: Researching solutions, comparing options
- **Low**: General inquiry, early awareness stage

### Decision Stage
- **Awareness**: Learning about solutions
- **Consideration**: Evaluating specific options
- **Decision**: Ready to make purchasing decision

## Best Practices

1. **Regular Analysis**: Run batch analysis weekly to keep scores current
2. **Act on Insights**: Use next_best_action recommendations to guide outreach
3. **Monitor Trends**: Track how scores change over time
4. **Segment Contacts**: Group by buying intent and decision stage
5. **Prioritize High Scores**: Focus on contacts with engagement > 70

## Cost Considerations

- Each analysis uses Claude Opus (most capable model)
- Approximate cost: $0.015-$0.03 per contact analysis
- Batch processing recommended for cost efficiency
- Consider rate limiting for large workspaces

## Limitations

- Requires email history for accurate analysis
- AI scores are estimates, not guarantees
- Works best with 3+ email interactions
- English language optimized
- Requires valid Anthropic API key

## Troubleshooting

### "Anthropic API key not configured"
- Ensure `ANTHROPIC_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### "Contact not found"
- Verify the contact ID is correct
- Check that contact exists in database

### "Insufficient email history"
- Contact needs at least 1-2 emails for meaningful analysis
- System returns basic scores for new contacts

### Rate limiting
- Anthropic has rate limits based on your plan
- Implement delays between batch requests if needed
- Monitor API usage in Anthropic console

## Future Enhancements

Planned features:
- Predictive churn detection
- Automated outreach recommendations
- Sentiment analysis
- Competitor mention tracking
- Deal probability scoring
- Integration with CRM systems
