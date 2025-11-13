# Email Sequences - Quick Start Guide

Get up and running with automated email sequences in Unite-Hub.

## Table of Contents

1. [Setup](#setup)
2. [Creating Your First Sequence](#creating-your-first-sequence)
3. [Using Templates](#using-templates)
4. [Editing Sequences](#editing-sequences)
5. [Analyzing Performance](#analyzing-performance)
6. [Best Practices](#best-practices)

## Setup

### 1. Seed Template Data

First, populate the database with pre-built templates:

```typescript
// Run this in Convex dashboard or via API
import { api } from "@/convex/_generated/api";

await convex.mutation(api.seedSequenceTemplates.seedTemplates, {});
```

### 2. Navigate to Sequences

Access the email sequences page:
```
/dashboard/emails/sequences
```

## Creating Your First Sequence

### Option 1: Generate with AI

1. Click **"Create Sequence"** button
2. Fill in the form:
   - **Name**: "SaaS Product Launch"
   - **Type**: Cold Outreach
   - **Goal**: "Book demo calls with qualified prospects"
   - **Custom Instructions**: Optional specific requirements

3. Click **"Generate with AI"**
4. AI will create a complete 5-step sequence

### Option 2: Use a Template

1. Click **"Templates"** button
2. Browse 12 pre-built templates
3. Select one that matches your use case
4. Click to create sequence from template
5. Customize the content as needed

## Using Templates

### Available Templates

**Cold Outreach:**
- SaaS Cold Outreach (5 steps)
- Partnership Outreach (5 steps)

**Lead Nurture:**
- Service Business Lead Nurture (7 steps)
- Event Follow-up (3 steps)

**Onboarding:**
- Trial to Paid Conversion (4 steps)
- Newsletter Welcome (4 steps)

**Re-engagement:**
- Cart Abandonment (3 steps)
- Customer Win-Back (3 steps)

**Custom:**
- Product Launch (5 steps)
- Webinar Promotion (5 steps)
- Referral Request (3 steps)
- Customer Upsell (4 steps)

### Customizing Templates

After selecting a template:

1. **Update Sequence Settings**
   - Change name if needed
   - Set your specific goal
   - Link to target persona

2. **Edit Individual Steps**
   - Click on any step to edit
   - Customize subject lines
   - Personalize email body
   - Adjust timing (day delays)

3. **Add Personalization**
   - Use merge tags: `{firstName}`, `{company}`, `{industry}`
   - Reference specific pain points
   - Include relevant case studies

## Editing Sequences

### Visual Builder

**List View:**
- See all steps at once
- Edit inline
- Drag to reorder (coming soon)

**Timeline View:**
- Visualize sequence flow
- See day delays
- Identify drop-off points

### Editing a Step

1. Click **Edit** icon on step card
2. Update fields:
   - Step name
   - Day delay
   - Subject line
   - Preheader text
   - Email body
   - CTA text and URL
   - CTA type (button, link, reply, calendar)

3. Click **Save**

### Regenerating with AI

Don't like a step? Let AI regenerate it:

1. Click **Sparkles** icon on step
2. Optionally provide improvement instructions
3. AI generates new version
4. Review and save or regenerate again

### A/B Testing Subject Lines

1. Click on a step
2. Open **Subject Line Tester**
3. Click **Generate More**
4. Review 5 variations with different approaches:
   - Curiosity-driven
   - Benefit-focused
   - Question-based
   - Personalization-heavy
   - Urgency/scarcity

5. Select best performer
6. Use in your sequence

## Analyzing Performance

### Overall Metrics

View sequence-level metrics:
- **Total Sent**: Number of emails sent
- **Open Rate**: % of emails opened
- **Click Rate**: % of links clicked
- **Reply Rate**: % of replies received
- **Conversion Rate**: % achieving goal

### Step-by-Step Analysis

See performance for each email:
- Which steps have highest opens
- Where recipients click
- Drop-off points
- Engagement trends

### AI Recommendations

Get AI-powered insights:
- **Subject Line Suggestions**: For low-performing steps
- **CTA Improvements**: For low click-through
- **Timing Adjustments**: Based on engagement patterns
- **Content Refinements**: To improve resonance

## Best Practices

### Subject Lines

**Do:**
- Keep 40-50 characters
- Use personalization: `{firstName}`, `{company}`
- Create curiosity
- Focus on benefit
- Test variations

**Don't:**
- Use ALL CAPS
- Add multiple exclamation marks!!!
- Use spam trigger words (FREE, GUARANTEED, $$$)
- Make it too long (>60 chars)
- Be misleading

### Email Body

**Do:**
- Start with personalized hook
- Focus on recipient benefit (not your product)
- Use conversational tone
- Keep it concise (under 200 words)
- Include single, clear CTA

**Don't:**
- Talk only about yourself
- Use jargon or corporate speak
- Include multiple CTAs
- Make it too long
- Forget to personalize

### Sequence Flow

**Do:**
- Provide value before asking
- Give time between emails (2-4 days typical)
- Build relationship progressively
- Use social proof strategically
- Permission-based breakup email

**Don't:**
- Send emails too close together
- Ask for too much too soon
- Ignore responses
- Keep sending after reply
- Be too pushy

### Personalization

**Do:**
- Research recipient/company
- Reference specific details
- Use merge tags: `{firstName}`, `{company}`, `{industry}`
- Tailor to persona pain points
- Show you understand their challenges

**Don't:**
- Use generic templates
- Forget to test merge tags
- Over-personalize (creepy)
- Make assumptions
- Use wrong information

### Timing

**Do:**
- Test send times
- Consider time zones
- Allow 2-4 days between emails
- Adjust based on engagement
- Give time to respond

**Don't:**
- Send on weekends (B2B)
- Send too early/late
- Rush the sequence
- Ignore timezone differences
- Be impatient

## Sequence Types Guide

### Cold Outreach (5 steps)
**When to use:** First contact with prospects who don't know you

**Flow:**
1. Introduction + value proposition
2. Resource/insight (no ask)
3. Case study/social proof
4. Permission-based breakup
5. Final value + leave door open

**Goal:** Book calls, start conversations

### Lead Nurture (7 steps)
**When to use:** Prospects showed interest but haven't committed

**Flow:**
1. Welcome + expectation setting
2-3. Educational content
4-5. Social proof + case studies
6. Product introduction
7. Clear next step with urgency

**Goal:** Build trust, demonstrate expertise, convert

### Onboarding (4 steps)
**When to use:** New customers or trial users

**Flow:**
1. Welcome + quick win
2. Key features walkthrough
3. Advanced tips
4. Support resources

**Goal:** Activate users, show value, reduce churn

### Re-engagement (3 steps)
**When to use:** Inactive customers or cart abandoners

**Flow:**
1. "We miss you" + tease value
2. What they're missing (new features)
3. Special offer/incentive

**Goal:** Bring back inactive users

## Common Scenarios

### Scenario 1: SaaS Product Launch

**Template:** SaaS Cold Outreach
**Customization:**
- Add product launch messaging
- Include beta tester testimonials
- Offer special launch pricing
- Create urgency with limited spots

### Scenario 2: E-commerce Store

**Template:** Cart Abandonment
**Customization:**
- Add product images
- Include customer reviews
- Offer discount code
- Show related products

### Scenario 3: Service Business

**Template:** Service Lead Nurture
**Customization:**
- Share client case studies
- Include industry expertise
- Offer free consultation
- Build authority with content

### Scenario 4: SaaS Free Trial

**Template:** Trial to Paid
**Customization:**
- Feature activation guidance
- Use case examples
- Pricing comparison
- Upgrade incentive

## Tips for Success

1. **Start with Templates**: Don't build from scratch
2. **Personalize Everything**: Generic doesn't work
3. **Test Subject Lines**: Use A/B tester
4. **Monitor Analytics**: Check metrics weekly
5. **Iterate Based on Data**: Optimize underperformers
6. **Keep It Human**: Write like you talk
7. **Provide Value First**: Before asking for anything
8. **Follow Up**: Persistence (with value) pays off
9. **Know When to Stop**: Don't be annoying
10. **Always Test**: What works changes over time

## Troubleshooting

### Low Open Rates
- Test different subject lines
- Check sender name/email
- Verify email deliverability
- Send at better times
- Improve targeting

### Low Click Rates
- Make CTA more prominent
- Improve value proposition
- Simplify the ask
- Test different CTAs
- Reduce friction

### Low Reply Rates
- Make it easier to reply
- Ask better questions
- Provide clear value
- Improve personalization
- Send to better qualified leads

### High Unsubscribe Rates
- Too many emails too fast
- Not relevant to audience
- Poor targeting
- Misleading subject lines
- No value provided

## Next Steps

1. **Create your first sequence** using a template
2. **Customize** with your brand voice and offerings
3. **Test** with small audience first
4. **Analyze** results and iterate
5. **Scale** what works

## Support

Need help? Check:
- Full documentation: `/docs/EMAIL_SEQUENCES_SPEC.md`
- Component docs: `/src/components/sequences/README.md`
- AI prompt templates: `/src/lib/claude/sequence-prompts.ts`

## Advanced Features (Coming Soon)

- Automated sending
- Contact import
- CRM integration
- Advanced branching logic
- Revenue tracking
- Predictive scoring
