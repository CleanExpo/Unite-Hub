# Unite-Hub / Synthex Help Center Structure

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Platform**: docs.synthex.com.au

---

## Help Center Architecture

```
Help Center (docs.synthex.com.au)
├── Getting Started
│   ├── Quick Start Guide
│   ├── Account Setup
│   ├── First Campaign
│   └── Mobile Access
├── Contacts & CRM
│   ├── Adding Contacts
│   ├── Managing Contacts
│   ├── Import/Export
│   ├── Segmentation
│   └── AI Scoring
├── Email Marketing
│   ├── Sending Emails
│   ├── Templates
│   ├── Campaigns
│   ├── Deliverability
│   └── Tracking
├── Drip Campaigns
│   ├── Creating Sequences
│   ├── Workflow Builder
│   ├── Triggers & Conditions
│   └── Best Practices
├── AI Features
│   ├── Lead Scoring
│   ├── Content Suggestions
│   ├── Predictive Insights
│   └── Understanding AI
├── Integrations
│   ├── Gmail
│   ├── Stripe
│   ├── Zapier
│   └── API
├── Account & Billing
│   ├── Subscription Plans
│   ├── Team Management
│   ├── Security Settings
│   └── Billing & Invoices
├── Troubleshooting
│   ├── Common Issues
│   ├── Error Messages
│   └── Contact Support
└── API Documentation
    ├── Authentication
    ├── Endpoints
    └── SDKs
```

---

## Category: Getting Started

### 1.1 Quick Start Guide
**URL**: /getting-started/quick-start

**Content**:
- Welcome to Synthex overview (2 paragraphs)
- 5-minute setup checklist with screenshots
- Video embed: "Getting Started in 5 Minutes" (2 min)
- Next steps with links to relevant articles

**Keywords**: getting started, setup, first steps, new user, beginner

### 1.2 Account Setup
**URL**: /getting-started/account-setup

**Content**:
- Google OAuth login explanation
- Profile completion walkthrough
- Business information setup
- Branding configuration (logo, colors)
- Email verification process

**Keywords**: account, profile, login, Google, setup

### 1.3 Your First Campaign
**URL**: /getting-started/first-campaign

**Content**:
- Step-by-step campaign creation (10 steps with screenshots)
- Choosing campaign type (one-time vs. drip)
- Template selection
- Recipient targeting
- Scheduling and sending
- Monitoring results

**Keywords**: first campaign, send email, campaign setup

### 1.4 Mobile Access
**URL**: /getting-started/mobile-access

**Content**:
- Responsive web app explanation
- Browser recommendations
- Adding to home screen (iOS/Android)
- Mobile-optimized features
- Known limitations

**Keywords**: mobile, phone, tablet, responsive, app

---

## Category: Contacts & CRM

### 2.1 Adding Contacts
**URL**: /contacts/adding-contacts

**Content**:
- Manual contact creation (form walkthrough)
- Required vs. optional fields
- Custom fields setup
- Adding from email integration
- Duplicate handling

**Keywords**: add contact, new contact, create contact

### 2.2 Managing Contacts
**URL**: /contacts/managing-contacts

**Content**:
- Contact list navigation
- Search and filter options
- Bulk actions (select, update, delete)
- Contact status management
- Activity logging

**Keywords**: manage contacts, edit contact, update contact, bulk actions

### 2.3 Import/Export
**URL**: /contacts/import-export

**Content**:
- CSV file format requirements
- Column mapping guide
- Import validation and error handling
- Deduplication during import
- Exporting contacts (CSV, JSON)
- GDPR/data portability

**Keywords**: import contacts, export data, CSV, upload, download

### 2.4 Segmentation
**URL**: /contacts/segmentation

**Content**:
- Understanding segments
- Creating filters (status, score, tags)
- Saving custom views
- Dynamic vs. static segments
- Using segments in campaigns

**Keywords**: segments, filters, lists, targeting, audience

### 2.5 AI Scoring
**URL**: /contacts/ai-scoring

**Content**:
- What is AI lead scoring?
- Score breakdown (0-100)
- Factors that influence scores
  - Email engagement (40%)
  - Sentiment (20%)
  - Intent signals (20%)
  - Job title (10%)
  - Pipeline progress (10%)
- How to use scores effectively
- Score refresh timing

**Keywords**: lead score, AI score, hot leads, warm leads, scoring

---

## Category: Email Marketing

### 3.1 Sending Emails
**URL**: /email/sending-emails

**Content**:
- Composing a new email
- Using personalization tags
- Attaching files
- Preview before sending
- Immediate vs. scheduled send
- Send confirmation

**Keywords**: send email, compose, write email, schedule email

### 3.2 Templates
**URL**: /email/templates

**Content**:
- Browsing template library
- Customizing templates
- Creating from scratch
- Saving as template
- Template best practices
- Mobile-responsive design tips

**Keywords**: email templates, design, customize, create template

### 3.3 Campaigns
**URL**: /email/campaigns

**Content**:
- Campaign types explained
- Creating a campaign (step-by-step)
- A/B testing setup
- Recipient selection
- Scheduling options
- Campaign analytics

**Keywords**: email campaign, newsletter, broadcast, bulk email

### 3.4 Deliverability
**URL**: /email/deliverability

**Content**:
- What affects deliverability
- Best practices checklist
- Avoiding spam filters
- Domain verification (SPF, DKIM, DMARC)
- Managing bounce rates
- List hygiene tips

**Keywords**: deliverability, spam, bounce, inbox placement

### 3.5 Tracking
**URL**: /email/tracking

**Content**:
- Open tracking explained
- Click tracking explained
- Reply detection
- Viewing email analytics
- Understanding metrics
- Privacy considerations

**Keywords**: email tracking, opens, clicks, analytics, metrics

---

## Category: Drip Campaigns

### 4.1 Creating Sequences
**URL**: /drip-campaigns/creating-sequences

**Content**:
- What is a drip campaign?
- Use cases (welcome series, nurture, re-engagement)
- Creating your first sequence
- Adding steps (email, wait, condition)
- Enrolling contacts
- Starting and pausing

**Keywords**: drip campaign, sequence, automation, welcome series

### 4.2 Workflow Builder
**URL**: /drip-campaigns/workflow-builder

**Content**:
- Visual builder overview
- Dragging and connecting nodes
- Step types explained
- Branching logic
- Time delays configuration
- Testing workflows

**Keywords**: workflow builder, automation builder, visual editor

### 4.3 Triggers & Conditions
**URL**: /drip-campaigns/triggers-conditions

**Content**:
- Enrollment triggers
  - Manual enrollment
  - New contact
  - Tag applied
  - Score threshold
- Conditional branching
  - If/else logic
  - Email opened/clicked
  - Tag conditions
- Exit conditions

**Keywords**: triggers, conditions, if then, branching, logic

### 4.4 Best Practices
**URL**: /drip-campaigns/best-practices

**Content**:
- Optimal email timing
- Personalization tips
- Common mistakes to avoid
- Example sequences (templates)
- Performance benchmarks
- Testing recommendations

**Keywords**: best practices, tips, examples, optimization

---

## Category: AI Features

### 5.1 Lead Scoring
**URL**: /ai/lead-scoring

**Content**:
- How our AI scores leads
- Score interpretation guide
- Hot leads dashboard
- Prioritizing outreach by score
- When scores update
- Improving low scores

**Keywords**: AI lead scoring, hot leads, prioritization

### 5.2 Content Suggestions
**URL**: /ai/content-suggestions

**Content**:
- AI-powered email suggestions
- Subject line recommendations
- Content personalization
- Enabling/disabling suggestions
- Providing feedback to AI

**Keywords**: AI content, suggestions, recommendations, smart compose

### 5.3 Predictive Insights
**URL**: /ai/predictive-insights

**Content**:
- What are predictive insights?
- Available predictions
- Interpreting confidence levels
- Acting on insights
- Insight accuracy over time

**Keywords**: predictive, insights, forecast, predictions

### 5.4 Understanding AI
**URL**: /ai/understanding-ai

**Content**:
- Our AI explained (Claude-powered)
- Privacy and data usage
- AI limitations
- Human oversight
- Feedback and improvement

**Keywords**: AI explained, machine learning, how AI works

---

## Category: Integrations

### 6.1 Gmail Integration
**URL**: /integrations/gmail

**Content**:
- Connecting Gmail account
- Permissions explained
- Syncing emails
- Sending from Gmail
- Troubleshooting connection issues
- Disconnecting Gmail

**Keywords**: Gmail, Google, email integration, connect email

### 6.2 Stripe Integration
**URL**: /integrations/stripe

**Content**:
- Connecting Stripe account
- Payment processing setup
- Subscription management
- Invoice customization
- Stripe dashboard access

**Keywords**: Stripe, payments, billing, subscriptions

### 6.3 Zapier Integration
**URL**: /integrations/zapier

**Content**:
- Available Zapier triggers
- Available Zapier actions
- Setting up a Zap
- Example automations
- Troubleshooting

**Keywords**: Zapier, automation, integration, connect apps

### 6.4 API Access
**URL**: /integrations/api

**Content**:
- API overview
- Getting API keys
- Authentication
- Rate limits by tier
- Link to full API docs

**Keywords**: API, developer, integration, custom

---

## Category: Account & Billing

### 7.1 Subscription Plans
**URL**: /account/subscription-plans

**Content**:
- Plan comparison table
- Upgrading your plan
- Downgrading your plan
- Annual vs. monthly billing
- Enterprise options

**Keywords**: plans, pricing, upgrade, subscription, tiers

### 7.2 Team Management
**URL**: /account/team-management

**Content**:
- Inviting team members
- Role definitions (Admin, Staff, Client)
- Changing roles
- Removing team members
- Permission details

**Keywords**: team, users, invite, roles, permissions

### 7.3 Security Settings
**URL**: /account/security

**Content**:
- Session management
- Active sessions view
- Revoking access
- API key management
- Audit log access
- Security best practices

**Keywords**: security, sessions, API keys, audit log

### 7.4 Billing & Invoices
**URL**: /account/billing

**Content**:
- Viewing current subscription
- Updating payment method
- Accessing invoices
- Understanding charges
- Cancellation process
- Refund policy

**Keywords**: billing, invoice, payment, cancel, refund

---

## Category: Troubleshooting

### 8.1 Common Issues
**URL**: /troubleshooting/common-issues

**Content**:
- Login problems
- Email not sending
- Contacts not importing
- Sync issues
- Slow performance
- Browser compatibility

**Keywords**: troubleshooting, problems, issues, help, fix

### 8.2 Error Messages
**URL**: /troubleshooting/error-messages

**Content**:
- Error code reference table
- Step-by-step resolution for each error
- When to contact support

**Keywords**: error, error code, error message

### 8.3 Contact Support
**URL**: /troubleshooting/contact-support

**Content**:
- Support channels by tier
- Response time expectations
- How to submit a ticket
- What to include in ticket
- Escalation process
- Live chat hours

**Keywords**: support, help, contact, ticket, chat

---

## Search Optimization

### High-Volume Queries (optimize these pages)
1. "how to import contacts" → /contacts/import-export
2. "email not sending" → /troubleshooting/common-issues
3. "lead scoring" → /ai/lead-scoring
4. "connect gmail" → /integrations/gmail
5. "create campaign" → /email/campaigns
6. "upgrade plan" → /account/subscription-plans
7. "reset password" → /account/security
8. "drip campaign setup" → /drip-campaigns/creating-sequences

### Search Synonyms
| User searches | Redirect to |
|---------------|-------------|
| "customers" | contacts |
| "leads" | contacts |
| "newsletter" | campaigns |
| "autoresponder" | drip campaigns |
| "price", "cost" | subscription plans |
| "login issue" | common issues |

---

## Content Guidelines

### Article Structure
1. **Title**: Clear, action-oriented (50 chars max)
2. **Summary**: 1-2 sentences (150 chars)
3. **Prerequisites**: What user needs before starting
4. **Steps**: Numbered, with screenshots
5. **Tips**: Pro tips in callout boxes
6. **Related Articles**: 3-5 links at bottom

### Writing Style
- Second person ("you")
- Present tense
- Active voice
- Short sentences (< 20 words)
- No jargon without explanation

### Media Requirements
- Screenshots: 1200px wide, annotated
- GIFs: < 5 seconds, looping
- Videos: 2-5 minutes, embedded

---

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Review analytics | Weekly |
| Update screenshots | Monthly |
| Check broken links | Monthly |
| Review search queries | Bi-weekly |
| User feedback review | Weekly |
| Full content audit | Quarterly |

---

*Last Updated: 2025-11-30*
*Help Center Platform: Intercom / HelpScout / Custom*
