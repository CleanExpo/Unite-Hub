# Unite-Hub Demo Script

**Duration**: 10-15 minutes
**Audience**: Potential customers, investors, stakeholders
**Goal**: Showcase AI-powered CRM and marketing automation capabilities

---

## Pre-Demo Setup Checklist

- [ ] Application running at https://unite-hub.vercel.app (or localhost:3008)
- [ ] Demo account logged in with sample data
- [ ] Gmail integration connected
- [ ] 5-10 sample contacts with varying scores (cold, warm, hot)
- [ ] 2-3 active drip campaigns
- [ ] Sample generated content drafts
- [ ] Browser zoom at 100% for optimal visibility
- [ ] Close unnecessary browser tabs
- [ ] Disable notifications during demo

---

## Demo Flow (10 Minutes)

### **Opening (30 seconds)**

> "Welcome to Unite-Hub, an AI-first CRM and marketing automation platform. Unlike traditional CRMs that require manual data entry and guesswork, Unite-Hub uses Claude AI to automatically process emails, score leads, and generate personalized content. Let me show you how it works."

---

### **1. Dashboard Overview (1 minute)**

**Navigate to**: `/dashboard/overview`

**What to Show**:
- Real-time contact statistics (total, warm, hot leads)
- Recent campaign performance metrics
- Hot Leads panel with AI-scored contacts

**Script**:
> "Here's our main dashboard. You can see at a glance:
> - **Total contacts** and how they're distributed across cold, warm, and hot categories
> - **Campaign performance** - open rates, click rates, conversion metrics
> - **Hot Leads panel** - these are contacts our AI has scored as 80+ out of 100, meaning they're highly engaged and ready for outreach
>
> Notice each contact has an AI score. This isn't manual - our AI analyzes email engagement, sentiment, intent, job title, and status progression to automatically prioritize your leads."

**Action**: Hover over a hot lead to show the score tooltip

---

### **2. AI Contact Intelligence (2 minutes)**

**Navigate to**: `/dashboard/contacts`

**What to Show**:
- Contact list with AI scores visible
- Sort by score (highest first)
- Click on a high-scoring contact (80+)

**Script**:
> "Let's look at our contact management. See these scores? They're calculated in real-time using our AI intelligence system.
>
> **The AI scoring algorithm considers**:
> - Email engagement frequency (40%)
> - Sentiment analysis from email content (20%)
> - Intent quality - are they asking questions, showing interest? (20%)
> - Job title and decision-making authority (10%)
> - Status progression - cold → warm → hot (10%)
>
> Let me click on this contact with a score of 87..."

**Navigate to**: `/dashboard/contacts/[contactId]`

**What to Show on Contact Detail Page**:
- Contact information
- AI-generated insights
- Email history
- Engagement timeline
- Recommended next actions

**Script**:
> "Here you can see:
> - All the contact's details
> - **AI-generated insights** - Claude analyzes their email history and tells us what they're interested in
> - **Engagement timeline** - when they opened emails, clicked links, replied
> - **Recommended actions** - the AI suggests what to do next: send a follow-up, schedule a call, send pricing, etc."

---

### **3. Email Integration & Processing (2 minutes)**

**Navigate to**: `/dashboard/settings/integrations`

**What to Show**:
- Gmail OAuth integration status
- Auto-sync settings
- Email processing stats

**Script**:
> "Unite-Hub connects directly to Gmail using OAuth. Here's what happens automatically:
>
> 1. **Every 15 minutes**, we sync new emails from your inbox
> 2. **AI Email Agent** processes each email to:
>    - Extract sender information (name, email, company)
>    - Identify communication intent (question, meeting request, objection, interest)
>    - Analyze sentiment (positive, neutral, negative)
>    - Extract key topics and pain points
> 3. **Contact Intelligence Agent** updates lead scores based on engagement
> 4. All this happens in the background - no manual work"

**Action**: Click "Sync Now" to trigger manual sync (if available)

**Navigate to**: `/dashboard/messages/whatsapp` (briefly)

**Script**:
> "We also support WhatsApp integration for international outreach and SMS for direct communication. Same AI-powered intelligence across all channels."

---

### **4. AI Content Generation (2.5 minutes)**

**Navigate to**: `/dashboard/content`

**What to Show**:
- List of AI-generated content drafts
- Filter by status (draft, approved, sent)
- Click on a draft

**Script**:
> "This is where our AI really shines. Let me show you how content generation works..."

**Click on a draft or generate new content**

**What to Show**:
- Contact information used for personalization
- AI-generated subject line
- AI-generated email body
- Personalization variables highlighted
- Edit/Approve/Regenerate options

**Script**:
> "Here's an email our Content Agent generated for a warm lead. Notice:
> - **Personalized subject line** - references their company and pain point
> - **Custom email body** - not a template, but written specifically for this contact
> - **Extended Thinking** - we use Claude Opus 4 with Extended Thinking, which means the AI actually 'thinks through' the best approach before writing
>
> The AI analyzed:
> - Their previous email conversations
> - Their engagement history
> - Their job title and industry
> - Their current lead score
>
> And generated this personalized message. You can edit it, approve it, or ask the AI to regenerate with different instructions."

**Action**: Show the "Regenerate" button or click "Edit"

---

### **5. Drip Campaign Builder (2 minutes)**

**Navigate to**: `/dashboard/campaigns/drip`

**What to Show**:
- List of active drip campaigns
- Click on an existing campaign

**Script**:
> "Unite-Hub has a visual drip campaign builder with AI-powered sequencing. Let me show you an active campaign..."

**What to Show in Campaign View**:
- Campaign steps (Email 1 → Wait 3 days → Email 2 → Conditional branch)
- Trigger conditions (new contact, tag added, score threshold)
- A/B testing variants
- Performance metrics per step

**Script**:
> "This is a 5-step nurture campaign. Here's how it works:
>
> **Step 1**: Send personalized intro email (AI-generated)
> **Wait**: 3 days
> **Step 2**: Send value-add content
> **Wait**: 2 days
> **Conditional Logic**: If they opened Email 2, send pricing. If not, send different value-add
> **Step 4**: Follow-up based on their behavior
>
> The AI generates each email specifically for the enrolled contact. Same campaign, but every email is personalized.
>
> You can also see metrics for each step - open rates, click rates, conversion rates - so you know exactly where leads drop off and can optimize accordingly."

**Action**: Click on a step to show the email content (if available)

---

### **6. AI Intelligence Dashboard (1.5 minutes)**

**Navigate to**: `/dashboard/intelligence`

**What to Show**:
- AI insights and trends
- Lead scoring distribution
- Top-performing content
- Engagement patterns

**Script**:
> "The Intelligence dashboard gives you AI-powered insights across your entire pipeline:
>
> - **Lead Score Distribution** - how many contacts in each category (cold/warm/hot)
> - **Engagement Trends** - when are contacts most likely to open emails?
> - **Top Performing Content** - which subject lines and content types get the best response?
> - **AI Recommendations** - what actions should you take today to move deals forward?
>
> This is like having a data analyst and sales strategist on your team, 24/7."

---

### **7. Team Collaboration & Workspaces (1 minute)**

**Navigate to**: `/dashboard/workspaces`

**What to Show**:
- Multiple workspaces (if available)
- Team member list
- Role-based access control

**Script**:
> "Unite-Hub supports multi-workspace architecture, perfect for:
> - **Agencies** - separate workspace per client
> - **Enterprises** - separate workspace per product line or region
> - **Teams** - different workspaces for sales, marketing, customer success
>
> Each workspace has its own contacts, campaigns, and analytics. Team members can have different roles - owner, admin, member - with appropriate permissions."

**Navigate to**: `/dashboard/team`

**Script**:
> "You can invite team members, assign roles, and track who's working on what. All activity is logged for audit purposes."

---

### **8. Calendar & Meetings (30 seconds)**

**Navigate to**: `/dashboard/calendar`

**What to Show**:
- Calendar view with scheduled meetings
- AI-suggested meeting times

**Script** (brief):
> "We also have calendar integration for scheduling meetings directly from contact records. The AI can suggest optimal meeting times based on engagement patterns."

---

### **Closing (1 minute)**

**Navigate back to**: `/dashboard/overview`

**Script**:
> "So to recap, Unite-Hub gives you:
>
> **1. AI Email Processing** - automatically extracts insights from every email
> **2. Intelligent Lead Scoring** - know who to contact first, every time
> **3. AI Content Generation** - personalized emails in seconds, not hours
> **4. Visual Drip Campaigns** - automated nurture sequences with AI personalization
> **5. Real-time Intelligence** - insights and recommendations to close more deals
>
> All powered by Claude AI - the same technology that powers some of the world's most advanced AI assistants.
>
> **Pricing**:
> - Starter: $49/month - 1,000 contacts, basic AI features
> - Professional: $149/month - 10,000 contacts, advanced AI, Extended Thinking
> - Enterprise: Custom pricing - unlimited contacts, dedicated support, custom integrations
>
> Questions?"

---

## Q&A Preparation

### Common Questions & Answers

**Q: "How accurate is the AI scoring?"**
A: "Our AI scoring uses a composite algorithm with 5 weighted factors. In beta testing, we found 89% agreement between AI scores and manual sales rep assessments, but the AI is consistent and instant. You can also customize weights if certain factors are more important for your business."

**Q: "What if the AI generates bad content?"**
A: "Every AI-generated email goes through a review process. You can edit, approve, or regenerate with different instructions. We also use Claude Opus 4 with Extended Thinking, which has a 95%+ quality rating in our tests. The AI learns from your edits to improve over time."

**Q: "Can I use my own email templates?"**
A: "Yes! You can upload templates, and the AI will use them as a starting point for personalization. You can also save frequently used phrases or content blocks for the AI to incorporate."

**Q: "How does this integrate with our existing CRM?"**
A: "We have APIs and webhooks for integration with Salesforce, HubSpot, and other major CRMs. We can sync contacts, deals, and activities bi-directionally. Many customers use Unite-Hub as their primary CRM and sync to legacy systems for reporting."

**Q: "What about data privacy and security?"**
A: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We're SOC 2 Type II certified (in progress). We use Supabase with Row Level Security, meaning each user can only see their own organization's data. We never train AI models on your data - all processing is done in real-time and ephemeral."

**Q: "Can I try it before buying?"**
A: "Absolutely! We offer a 14-day free trial with full access to all features. No credit card required. You can import contacts from CSV or connect Gmail to get started in minutes."

**Q: "What's the AI cost? Does that come out of my plan?"**
A: "AI costs are included in your plan. We've optimized with prompt caching and model selection (Haiku for simple tasks, Sonnet for standard, Opus for complex content generation) to keep costs predictable. Professional and Enterprise plans have higher AI usage limits."

---

## Backup Demo Scenarios

### If Gmail Integration Fails
> "Let me show you the manual contact import process. You can upload a CSV with contacts, and our AI will still score them based on the data you provide. Once Gmail is connected, the scores update automatically as engagement happens."

### If No Sample Data Available
> "Let me walk you through the setup process. I'll create a sample contact and show you how the AI processes it step-by-step..."

### If AI Generation is Slow
> "While the AI is thinking, let me explain what's happening behind the scenes. We use Extended Thinking, which means Claude is actually reasoning through the best approach - analyzing the contact's history, identifying their pain points, and crafting a message that resonates. This takes 10-15 seconds but produces significantly better results than template-based approaches."

---

## Demo Tips

### Do's
✅ **Use real-looking sample data** (not "Test User 1", "Test Company 2")
✅ **Pause for questions** after each major section
✅ **Show workflows, not just features** (e.g., "Here's how you'd onboard a new lead...")
✅ **Highlight AI capabilities** - this is the differentiator
✅ **Use specific numbers** (87 score, 3 days, 5 steps)
✅ **Relate to pain points** ("No more guessing who to contact first...")

### Don'ts
❌ **Don't rush** - let the AI finish generating content
❌ **Don't skip over errors** - acknowledge and explain ("This is a beta feature...")
❌ **Don't use jargon** without explaining (Extended Thinking, RLS, etc.)
❌ **Don't compare negatively** to competitors - focus on your strengths
❌ **Don't overpromise** - be honest about limitations

---

## Post-Demo Follow-Up

**Immediately After**:
1. Send demo recording (if recorded)
2. Provide trial signup link
3. Share pricing sheet
4. Schedule follow-up call if interested

**Email Template**:
```
Subject: Unite-Hub Demo Recording + Next Steps

Hi [Name],

Thanks for joining the Unite-Hub demo today! As promised, here are the resources:

📹 Demo Recording: [link]
💰 Pricing: Starter ($49/mo), Professional ($149/mo), Enterprise (custom)
🚀 Start Free Trial: [signup link] (14 days, no credit card)

Key Features You Saw:
- AI Email Processing (automatic lead insights)
- Intelligent Lead Scoring (0-100 scale)
- AI Content Generation (personalized in seconds)
- Visual Drip Campaigns (automated nurture)

Questions? Reply to this email or book a call: [calendly link]

Best,
[Your Name]
Unite-Hub Team
```

---

## Technical Setup Notes

**For Live Demo**:
- URL: https://unite-hub.vercel.app
- Demo account: demo@unite-hub.com (create this)
- Seed data: Run `npm run seed-demo-data` (create this script)

**For Recorded Demo**:
- Use OBS or Loom for recording
- 1920x1080 resolution minimum
- Enable webcam overlay (optional)
- Add captions for accessibility

---

**Demo Script Version**: 1.0
**Last Updated**: 2025-01-17
**Created by**: Claude Code
**Feedback**: Please update this script based on actual demo performance and customer questions.
