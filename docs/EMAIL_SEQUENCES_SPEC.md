# Email Sequences System - Complete Specification

## Overview

The Email Sequences system enables users to create, manage, and optimize multi-step email campaigns for cold outreach, lead nurturing, onboarding, and re-engagement.

## Features

### Core Functionality

1. **AI-Powered Sequence Generation**
   - Claude AI generates entire sequences based on business context
   - Persona-aware content personalization
   - Industry-specific templates
   - Goal-oriented messaging

2. **Visual Sequence Builder**
   - Drag-and-drop interface
   - Timeline view of sequence flow
   - Real-time preview
   - Step-by-step editing

3. **Pre-Built Templates**
   - 12 high-converting templates
   - Industry-specific (SaaS, E-commerce, Services)
   - Use case-specific (Cold outreach, Onboarding, Win-back)
   - Customizable starting points

4. **Advanced Analytics**
   - Step-by-step performance tracking
   - Open, click, reply, conversion rates
   - Drop-off analysis
   - AI-powered recommendations

5. **Personalization Engine**
   - Dynamic merge tags: {firstName}, {company}, {industry}
   - Persona-based customization
   - Context-aware content
   - Custom field mapping

6. **A/B Testing**
   - Subject line variations
   - Email body alternatives
   - CTA testing
   - Performance comparison

## Database Schema

### emailSequences
```typescript
{
  clientId: Id<"clients">,
  name: string,
  description?: string,
  sequenceType: "cold_outreach" | "lead_nurture" | "onboarding" | "re_engagement" | "custom",
  targetPersona?: Id<"personas">,
  goal: string,
  status: "draft" | "active" | "paused" | "archived",
  totalSteps: number,
  isTemplate: boolean,
  templateCategory?: string,
  tags: string[],
  metrics: {
    sent: number,
    delivered: number,
    opened: number,
    clicked: number,
    replied: number,
    converted: number,
  },
  createdAt: number,
  updatedAt: number,
}
```

### emailSequenceSteps
```typescript
{
  sequenceId: Id<"emailSequences">,
  stepNumber: number,
  stepName: string,
  dayDelay: number,
  subjectLine: string,
  preheaderText?: string,
  emailBody: string,
  emailBodyHtml?: string,
  cta: {
    text: string,
    url?: string,
    type: "button" | "link" | "reply" | "calendar",
  },
  aiGenerated: boolean,
  aiReasoning?: string,
  personalizationTags: string[],
  alternatives: Array<{
    subjectLine: string,
    emailBody: string,
    abTestWeight?: number,
  }>,
  conditionalLogic?: {
    condition: string,
    action: string,
  },
  metrics: {
    sent: number,
    delivered: number,
    opened: number,
    clicked: number,
    replied: number,
  },
  createdAt: number,
  updatedAt: number,
}
```

### emailSequenceContacts
```typescript
{
  sequenceId: Id<"emailSequences">,
  contactEmail: string,
  contactName?: string,
  currentStep: number,
  status: "active" | "paused" | "completed" | "unsubscribed" | "bounced",
  startedAt: number,
  lastEmailSentAt?: number,
  nextEmailScheduledAt?: number,
  completedAt?: number,
  interactionHistory: Array<{
    stepNumber: number,
    action: string,
    timestamp: number,
    metadata?: any,
  }>,
  personalizationData?: any,
  createdAt: number,
  updatedAt: number,
}
```

## Convex Functions

### Mutations

- `generateSequence(clientId, sequenceType, personaId?, name, goal, customInstructions?)` - Generate new sequence with AI
- `updateStep(stepId, data)` - Update step content
- `regenerateStep(stepId, instructions?)` - Regenerate step with AI
- `duplicateSequence(sequenceId, newName)` - Clone sequence
- `updateSequenceStatus(sequenceId, status)` - Activate/pause/archive
- `deleteSequence(sequenceId)` - Delete sequence and steps
- `createFromTemplate(templateId, clientId, customName?)` - Create from template

### Queries

- `getSequences(clientId)` - Get all sequences for client
- `getSequenceWithSteps(sequenceId)` - Get sequence + all steps
- `getSequenceSteps(sequenceId)` - Get steps only
- `analyzeSequence(sequenceId)` - Get performance analysis
- `getTemplates(category?)` - Get pre-built templates

## API Routes

### POST /api/sequences/generate
Generate new email sequence using AI

**Request:**
```json
{
  "clientId": "k1234567890",
  "sequenceType": "cold_outreach",
  "personaId": "k0987654321",
  "name": "SaaS Product Launch",
  "goal": "Book demo calls with qualified prospects",
  "customInstructions": "Focus on enterprise clients"
}
```

**Response:**
```json
{
  "success": true,
  "sequenceId": "k1111111111",
  "message": "Sequence generated successfully"
}
```

### GET /api/sequences/[id]
Get sequence details with all steps

### PUT /api/sequences/[id]
Update sequence status or settings

### DELETE /api/sequences/[id]
Delete sequence

### GET /api/clients/[id]/sequences
Get all sequences for a client

## React Components

### SequenceList
Displays all sequences with metrics and actions

**Props:**
- `sequences: Sequence[]`
- `onSelect: (sequenceId) => void`
- `onStatusChange: (sequenceId, status) => void`
- `onDuplicate: (sequenceId) => void`
- `onDelete: (sequenceId) => void`
- `onAnalyze: (sequenceId) => void`

### SequenceBuilder
Visual builder for creating/editing sequences

**Props:**
- `sequence?: Sequence`
- `steps: Step[]`
- `onSave: (data) => void`
- `onAddStep: () => void`
- `onUpdateStep: (stepId, data) => void`
- `onRegenerateStep: (stepId) => void`
- `onDeleteStep: (stepId) => void`
- `isEditing?: boolean`

### EmailStepCard
Individual email step editor

**Props:**
- `step: Step`
- `stepNumber: number`
- `onUpdate: (data) => void`
- `onRegenerate: () => void`
- `onDelete: () => void`

### EmailPreview
Desktop/mobile email preview

**Props:**
- `step: Step`
- `senderName?: string`
- `senderEmail?: string`

### SequenceTimeline
Visual timeline of sequence flow

**Props:**
- `steps: Step[]`
- `onSelectStep: (stepId) => void`

### SequenceStats
Analytics and performance metrics

**Props:**
- `sequence: Sequence`
- `stepMetrics?: StepMetric[]`
- `recommendations?: Recommendation[]`

## AI Prompt Templates

### Cold Outreach (5 steps)
1. **Initial Contact** (Day 0) - Introduction with value proposition
2. **Value Addition** (Day 3) - Share resource or insight
3. **Social Proof** (Day 4) - Case study or results
4. **Direct Ask** (Day 5) - Permission-based breakup
5. **Final Value** (Day 7) - Leave door open with resource

### Lead Nurture (7 steps)
1. **Welcome** (Day 0) - Set expectations
2. **Education 1** (Day 2) - Address pain point #1
3. **Education 2** (Day 4) - Address pain point #2
4. **Social Proof** (Day 6) - Success stories
5. **Product Introduction** (Day 8) - Benefits overview
6. **Demo/Trial** (Day 10) - Clear CTA
7. **Urgency** (Day 12) - Time-sensitive offer

### Onboarding (4 steps)
1. **Welcome** (Day 0) - Quick win
2. **Features** (Day 2) - Key functionality
3. **Advanced Tips** (Day 5) - Power user tricks
4. **Support** (Day 7) - Resources and community

### Re-engagement (3 steps)
1. **We Miss You** (Day 0) - New value prop
2. **What's New** (Day 3) - Feature updates
3. **Special Offer** (Day 7) - Incentive to return

## Pre-Built Templates

1. **SaaS Cold Outreach** - B2B software sales
2. **E-commerce Cart Recovery** - Abandoned cart sequence
3. **Service Lead Nurture** - Professional services
4. **Product Launch** - New product introduction
5. **Event Promotion** - Webinar/event registration
6. **Customer Retention** - Prevent churn
7. **Partner Outreach** - B2B partnerships
8. **Referral Request** - Customer referrals
9. **Upsell Sequence** - Upgrade existing customers
10. **Win-Back Campaign** - Re-engage churned customers
11. **Newsletter Welcome** - New subscriber onboarding
12. **Trial Conversion** - Free to paid conversion

## Personalization Tags

### Available Tags
- `{firstName}` - Contact first name
- `{lastName}` - Contact last name
- `{fullName}` - Full name
- `{email}` - Email address
- `{company}` - Company name
- `{industry}` - Industry
- `{title}` - Job title
- `{location}` - Location
- `{customField1}` - Custom field 1
- `{customField2}` - Custom field 2

### Usage Example
```
Hi {firstName},

I noticed that {company} is in the {industry} space.
We've helped similar companies achieve [result].

Would you be open to a quick call?

Best,
{senderName}
```

## Metrics & Analytics

### Overall Metrics
- **Total Sent** - Number of emails sent
- **Delivery Rate** - % successfully delivered
- **Open Rate** - % of opened emails
- **Click Rate** - % of clicked links
- **Reply Rate** - % of replies
- **Conversion Rate** - % achieving goal

### Step Metrics
- Per-step performance tracking
- Drop-off analysis
- Engagement trends
- Best/worst performing steps

### AI Recommendations
- Subject line optimization suggestions
- CTA improvements
- Timing adjustments
- Content refinements

## Tier Limits

### Starter Tier
- 3 active sequences max
- Basic templates only
- Standard personalization
- Basic analytics

### Professional Tier
- Unlimited sequences
- All premium templates
- Advanced personalization
- Full analytics + AI recommendations
- A/B testing
- Custom templates

## Best Practices

### Subject Lines
- Keep 40-50 characters
- Use curiosity + benefit
- Avoid spam triggers (FREE, !!!, $$$)
- Personalize when appropriate
- Test variations

### Email Body
- Start with personalized hook
- Focus on recipient benefit
- Single, clear message
- Conversational tone
- Strong, specific CTA

### Timing
- Don't rush - give time to respond
- 2-4 day delays typical
- Longer for higher-value offers
- Consider business days
- Test optimal timing

### Sequence Flow
- Provide value before asking
- Build relationship progressively
- Use social proof strategically
- Permission-based breakup
- Leave door open

## Integration Points

### Personas
- Link sequences to target personas
- Persona-aware content generation
- Pain point addressing
- Goal alignment

### Marketing Strategy
- Use strategy messaging framework
- Align with content pillars
- Consistent brand voice
- Strategic positioning

### Hooks Library
- Pull subject lines from hooks
- Reuse proven copy
- Track performance
- Build library

### DALL-E
- Generate email graphics
- Visual content for sequences
- Brand-aligned imagery
- Platform-optimized

## Future Enhancements

1. **Email Scheduling**
   - Auto-send on schedule
   - Contact import
   - Trigger-based sending

2. **Advanced Conditions**
   - Branching logic
   - If/then rules
   - Behavior-based paths

3. **Integration**
   - Gmail/Outlook integration
   - CRM sync
   - Zapier webhooks

4. **Automation**
   - Auto-add to sequences
   - Smart delays
   - Auto-pause on reply

5. **Enhanced Analytics**
   - Revenue tracking
   - Attribution modeling
   - Cohort analysis
   - Predictive scoring

## Technical Notes

### Performance
- Sequences cached client-side
- Lazy load steps
- Optimize large sequences
- Real-time metrics updates

### Security
- Sequence ownership validation
- Rate limiting on sends
- Unsubscribe compliance
- Data encryption

### Scalability
- Batch operations for contacts
- Queue management
- Distributed processing
- Monitoring & alerts
