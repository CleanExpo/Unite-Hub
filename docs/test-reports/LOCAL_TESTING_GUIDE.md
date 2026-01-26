# Local Testing Guide

Complete guide for testing all Unite-Hub CRM features locally before deployment.

## Overview

This guide covers testing:
- Email ingestion and processing
- Auto-reply generation
- Claude AI integration
- DALL-E image generation
- Stripe billing and webhooks
- End-to-end workflows
- Mock data setup

---

## Prerequisites

Before testing, ensure:
- [ ] All environment variables configured (see `ENVIRONMENT_VARIABLES_GUIDE.md`)
- [ ] Dependencies installed: `npm install`
- [ ] Convex running: `npx convex dev`
- [ ] Development server running: `npm run dev`

---

## Part 1: Test Email Ingestion

### 1.1: Start Required Services

Open 3 terminal windows:

**Terminal 1: Next.js Dev Server**
```bash
npm run dev
```

**Terminal 2: Convex Dev**
```bash
npx convex dev
```

**Terminal 3: Email Agent (Manual Trigger)**
```bash
npm run email-agent
```

### 1.2: Connect Gmail Integration

1. Navigate to: `http://localhost:3008/dashboard/settings`
2. Find "Email Integrations" section
3. Click "Connect Gmail"
4. Follow OAuth flow (sign in with your monitoring email)
5. Grant permissions
6. Verify "Connected" status appears

### 1.3: Send Test Email

From any external email account, send an email to your monitoring address (e.g., contact@unite-group.in):

**Subject:** Partnership Opportunity - Marketing Collaboration

**Body:**
```
Hi Unite Group,

I'm Duncan from XYZ Company, and I'm very interested in exploring
a partnership opportunity with your team.

We're looking for a marketing agency to help us with:
- Social media campaigns
- Content strategy
- Brand positioning

I'd love to schedule a call to discuss how we can work together.
What's your availability next week?

Best regards,
Duncan Smith
CEO, XYZ Company
duncan@example.com
```

### 1.4: Trigger Email Sync

**Option A: Automatic Sync**
- Wait 2-5 minutes for automatic sync (if configured)

**Option B: Manual Sync**
```bash
curl -X POST http://localhost:3008/api/integrations/gmail/sync
```

**Option C: Run Email Agent**
```bash
npm run email-agent
```

### 1.5: Verify Email Processing

1. Check terminal output:
   ```
   📧 Email Agent Started
   Organization: k57akqzf14r07d9q3pbf9kebvn7v7929
   Workspace: kh72b1cng9h88691sx4x7krt2h7v7deh

   🔍 Fetching unprocessed emails...
   Found 1 unprocessed emails

   📨 Processing: "Partnership Opportunity - Marketing Collaboration"
      From: duncan@example.com
      🔗 Looking up contact...
      ➕ Creating new contact...
      ✅ New contact created
      🧠 Analyzing content...
      Intents: partnership, meeting
      Sentiment: positive
      💾 Updating email status...
      📊 Updating contact score...
      📝 Adding interaction note...
      ✅ Email processed successfully
   ```

2. Check Convex dashboard:
   - Navigate to: https://dashboard.convex.dev
   - Select your project
   - Go to "Data" tab
   - Check tables:
     - `emailThreads`: Should have 1 new record
     - `clients`: Should have 1 new client (Duncan)
     - `clientEmails`: Should have Duncan's email linked

3. Check application UI:
   - Navigate to: `http://localhost:3008/dashboard/contacts`
   - You should see Duncan Smith as a new contact
   - Click on Duncan to view details
   - Verify email thread is visible
   - Check AI analysis shows:
     - Intents: partnership, meeting
     - Sentiment: positive
     - AI Score: 65 (boosted from 50 due to positive sentiment)

---

## Part 2: Test Auto-Reply Generation

### 2.1: Configure Auto-Reply

Ensure auto-reply is enabled in settings or run manually:

```bash
# Manual trigger (if auto-reply script exists)
node scripts/generate-auto-reply.mjs
```

Or use API endpoint:
```bash
curl -X POST http://localhost:3008/api/emails/auto-reply \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "your-email-thread-id",
    "clientId": "your-client-id"
  }'
```

### 2.2: Verify Auto-Reply

1. Check Duncan's inbox (duncan@example.com)
2. You should receive an auto-reply within a few minutes:

**Subject:** Re: Partnership Opportunity - Marketing Collaboration

**Body:**
```
Hi Duncan,

Thank you for reaching out about a partnership opportunity!

To better understand how we can help you, could you share more details about:

1. What are your primary marketing goals for the next 6-12 months?
2. What is your target audience and current reach?
3. What has been your experience with marketing agencies in the past?
4. What is your estimated budget range for marketing services?

Looking forward to learning more about XYZ Company and exploring how we can
work together!

Best regards,
Unite Group Team
```

### 2.3: Verify in Application

1. Navigate to Duncan's contact page
2. Check "Auto Replies" section
3. Verify:
   - Auto-reply sent status: ✅
   - Questions generated listed
   - Sent timestamp recorded
   - Awaiting response: Yes

---

## Part 3: Test Claude AI Integration

### 3.1: Test Content Generation Agent

Run content generation for high-value contacts:

```bash
npm run content-agent
```

Expected output:
```
📝 Content Generation Agent Started
Organization: k57akqzf14r07d9q3pbf9kebvn7v7929
Workspace: kh72b1cng9h88691sx4x7krt2h7v7deh

🔍 Identifying target contacts for content generation...
Found 1 target contacts for content generation

✍️  Generating content for: Duncan Smith (XYZ Company)
   AI Score: 65/100
   Status: prospect
   📧 Loading interaction history...
   📋 Content type: followup
   🤖 Calling Claude API for content generation...
   💾 Storing draft content...
   ✅ Content generated and stored
   Preview: Hi Duncan,

   Thank you for your interest in partnering with Unite Group...
```

### 3.2: Test Persona Generation

Create a test persona:

```bash
curl -X POST http://localhost:3008/api/personas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "emailThreadIds": ["email-id-1", "email-id-2"]
  }'
```

Or use UI:
1. Navigate to Duncan's contact page
2. Click "Generate Persona"
3. Wait for Claude to analyze emails
4. Review generated persona

Expected persona:
```json
{
  "personaName": "Tech-Savvy SMB CEO",
  "demographics": {
    "ageRange": "35-45",
    "occupation": "CEO/Founder"
  },
  "psychographics": {
    "values": ["Innovation", "Growth", "Efficiency"],
    "interests": ["Marketing Technology", "Business Growth", "Digital Strategy"]
  },
  "painPoints": [
    "Limited marketing resources",
    "Unclear brand positioning",
    "Need for professional guidance"
  ],
  "goals": [
    "Increase brand visibility",
    "Generate more leads",
    "Establish thought leadership"
  ]
}
```

### 3.3: Test Strategy Generation

Generate marketing strategy:

```bash
curl -X POST http://localhost:3008/api/strategies/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "personaId": "your-persona-id"
  }'
```

Or use UI:
1. Go to Duncan's profile
2. Click "Generate Strategy"
3. Wait for Claude analysis
4. Review generated strategy

Verify strategy includes:
- Executive summary
- Market analysis
- Target audience
- Unique selling proposition
- Marketing channels (3-5 recommended)
- Content pillars
- Success metrics

### 3.4: Test Mind Map Expansion

Test mind map auto-expansion:

1. Navigate to: `http://localhost:3008/dashboard/contacts/[duncan-id]`
2. View "Mind Map" tab
3. Mind map should automatically expand with:
   - Root: "XYZ Company"
   - Branches:
     - Products/Services
     - Audience (derived from email)
     - Challenges ("Need marketing help")
     - Opportunities ("Partnership with Unite Group")

---

## Part 4: Test DALL-E Image Generation

### 4.1: Test Image Generation API

```bash
curl -X POST http://localhost:3008/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "prompt": "Modern social media post for a tech company, featuring clean design, blue and white colors, professional",
    "platform": "instagram",
    "size": "1024x1024",
    "quality": "standard"
  }'
```

Expected response:
```json
{
  "success": true,
  "imageId": "abc123",
  "imageUrl": "https://oaidalleapi...blob.core.windows.net/...",
  "revisedPrompt": "A modern, sleek social media post...",
  "estimatedCost": 0.04
}
```

### 4.2: Test Through UI

1. Navigate to: `http://localhost:3008/dashboard/content`
2. Select Duncan's client
3. Click "Generate Image"
4. Configure:
   - **Type**: Social Post
   - **Platform**: Instagram
   - **Prompt**: "Marketing agency promotional image, vibrant colors, professional"
5. Click "Generate"
6. Wait 10-30 seconds
7. Image should appear in preview
8. Verify:
   - Image loads correctly
   - Download button works
   - Image saved to database
   - Cost tracked in usage

### 4.3: Test Cost Tracking

Check usage tracking:

```bash
curl http://localhost:3008/api/usage/images?orgId=your-org-id
```

Expected response:
```json
{
  "used": 1,
  "limit": 5,
  "resetDate": "2025-12-01T00:00:00Z",
  "costThisMonth": 0.04
}
```

---

## Part 5: Test Stripe Billing

### 5.1: Start Stripe CLI Webhook Forwarding

In a new terminal:

```bash
stripe listen --forward-to localhost:3008/api/webhooks/stripe
```

Keep this running during tests. Note the webhook secret:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 5.2: Test Checkout Flow

1. Navigate to: `http://localhost:3008/pricing`
2. Click "Get Started" on Starter plan ($249 AUD)
3. You'll be redirected to Stripe Checkout
4. Use test card:
   - **Card number**: 4242 4242 4242 4242
   - **Expiry**: Any future date (e.g., 12/34)
   - **CVC**: Any 3 digits (e.g., 123)
   - **ZIP**: Any 5 digits (e.g., 12345)
   - **Email**: test@example.com
5. Click "Subscribe"
6. You should be redirected back to dashboard

### 5.3: Verify Webhook Events

Check Stripe CLI terminal. You should see:
```
<- checkout.session.completed [evt_xxxxx]
<- customer.created [evt_xxxxx]
<- customer.subscription.created [evt_xxxxx]
<- invoice.created [evt_xxxxx]
<- invoice.paid [evt_xxxxx]
-> webhook responded with status 200
```

### 5.4: Verify in Application

1. Check Convex dashboard:
   - `subscriptions` table should have new record:
     ```json
     {
       "orgId": "...",
       "planTier": "starter",
       "status": "active",
       "stripeCustomerId": "cus_xxxxx",
       "stripeSubscriptionId": "sub_xxxxx"
     }
     ```

2. Check application UI:
   - Navigate to settings
   - Verify plan shows "Starter - $249 AUD/month"
   - Status: Active
   - Next billing date displayed

### 5.5: Test Subscription Cancellation

1. In settings, click "Cancel Subscription"
2. Confirm cancellation
3. Check Stripe CLI for webhook:
   ```
   <- customer.subscription.updated [evt_xxxxx]
   -> webhook responded with status 200
   ```
4. Verify in UI:
   - Status: "Active until [end date]"
   - Shows when access ends

### 5.6: Test Payment Failure

Use Stripe test card for failure:

1. Update payment method in Customer Portal
2. Use card: `4000 0000 0000 0002` (always declines)
3. Trigger a test payment:
   ```bash
   stripe trigger invoice.payment_failed
   ```
4. Verify webhook received
5. Check UI shows payment failure notice

---

## Part 6: Test Webhooks with Stripe CLI

### 6.1: Test Individual Webhook Events

Trigger specific events:

**Subscription Created:**
```bash
stripe trigger customer.subscription.created
```

**Payment Succeeded:**
```bash
stripe trigger invoice.paid
```

**Payment Failed:**
```bash
stripe trigger invoice.payment_failed
```

**Subscription Deleted:**
```bash
stripe trigger customer.subscription.deleted
```

### 6.2: Verify Event Handling

For each event, verify:
1. Webhook endpoint returns 200 status
2. Database updated correctly
3. User receives notification (if configured)
4. Audit log created

Check audit logs:
```bash
curl http://localhost:3008/api/audit-logs?resource=subscription
```

---

## Part 7: Test Full Workflow (End-to-End)

### 7.1: Duncan Onboarding Scenario

Simulate complete onboarding:

**Step 1: Duncan Signs Up**
1. Navigate to: `http://localhost:3008/auth/signup`
2. Create account: duncan@example.com
3. Select Starter plan
4. Complete Stripe checkout (test card)

**Step 2: Duncan Sends Email Inquiry**
From duncan@example.com, send email to contact@unite-group.in:
```
Subject: Marketing Help Needed

Hi, I need help with marketing for my tech startup.
Can you help with social media and content strategy?

Duncan
```

**Step 3: Auto-Reply Sent**
- Verify Duncan receives auto-reply with questions
- Check reply in Duncan's inbox

**Step 4: Duncan Replies with Details**
Duncan responds:
```
Subject: Re: Marketing Help Needed

Thanks for the quick response! Here are the details:

1. Target audience: B2B SaaS companies
2. Budget: $2,000-5,000/month
3. Goals: Increase LinkedIn presence, generate leads

Looking forward to working together!
```

**Step 5: Email Processing**
- Run email agent: `npm run email-agent`
- Verify second email processed
- AI score increases (now 80+)

**Step 6: Persona Generation**
- System generates persona automatically (or trigger manually)
- Verify persona includes Duncan's details

**Step 7: Strategy Generated**
- System generates marketing strategy
- Verify strategy includes LinkedIn focus

**Step 8: Content Created**
- Run content agent: `npm run content-agent`
- Verify personalized email draft created

**Step 9: Campaign Created**
- Navigate to campaigns
- Create LinkedIn campaign for Duncan
- Generate sample post with DALL-E

**Step 10: Verify Complete**
Check Duncan's portal shows:
- Email history (2 emails)
- Auto-replies sent
- AI Score: 80+
- Status: Lead (upgraded from prospect)
- Persona created
- Strategy available
- Content drafts ready
- Campaign planned

---

## Part 8: Mock Data Setup

### 8.1: Create Mock Contacts

Run seed script (create if doesn't exist):

```javascript
// scripts/seed-data.mjs
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = new ConvexClient(process.env.CONVEX_URL);
const ORG_ID = process.env.ORG_ID;
const WORKSPACE_ID = process.env.WORKSPACE_ID;

const mockContacts = [
  {
    name: "Sarah Johnson",
    email: "sarah@techstartup.com",
    company: "TechStartup Inc",
    status: "lead",
    aiScore: 85,
    notes: "Interested in social media marketing",
  },
  {
    name: "Mike Chen",
    email: "mike@ecommerce.com",
    company: "E-Commerce Solutions",
    status: "prospect",
    aiScore: 70,
    notes: "Looking for email marketing help",
  },
  {
    name: "Emily Davis",
    email: "emily@consulting.com",
    company: "Davis Consulting",
    status: "contact",
    aiScore: 45,
    notes: "General inquiry",
  },
];

async function seed() {
  console.log("🌱 Seeding mock data...\n");

  for (const contact of mockContacts) {
    const clientId = await client.mutation(api.clients.create, {
      orgId: ORG_ID,
      clientName: contact.name,
      businessName: contact.company,
      businessDescription: "Mock data for testing",
      packageTier: "starter",
      status: "active",
      primaryEmail: contact.email,
      phoneNumbers: [],
    });

    console.log(`✅ Created: ${contact.name} (${contact.email})`);
  }

  console.log("\n✅ Mock data seeded successfully!");
}

seed();
```

Run:
```bash
node scripts/seed-data.mjs
```

### 8.2: Create Mock Emails

Add mock email threads to test contacts:

```javascript
// In seed-data.mjs, add:
const mockEmails = [
  {
    clientId: "sarah-client-id",
    subject: "Social Media Strategy Question",
    body: "Hi, I'm interested in improving our LinkedIn presence...",
    senderEmail: "sarah@techstartup.com",
  },
  // ... more emails
];

for (const email of mockEmails) {
  await client.mutation(api.emailThreads.create, {
    clientId: email.clientId,
    senderEmail: email.senderEmail,
    subject: email.subject,
    messageBody: email.body,
    attachments: [],
    receivedAt: Date.now(),
    autoReplySent: false,
    isRead: false,
  });
}
```

---

## Part 9: Debugging & Troubleshooting

### 9.1: Check Logs

**Next.js logs:**
```bash
# Terminal running `npm run dev`
# Check for errors or warnings
```

**Convex logs:**
```bash
# Convex dashboard > Logs tab
# Filter by function name
# Check for failures
```

**Stripe webhook logs:**
```bash
# Stripe CLI output
# Shows all webhooks received and responses
```

### 9.2: Common Issues

**Email not processing:**
- Check Gmail integration is connected
- Verify OAuth token hasn't expired
- Check email is in inbox (not spam)
- Run manual sync: `npm run email-agent`

**Auto-reply not sending:**
- Check SMTP credentials
- Verify EMAIL_SERVER_* variables
- Check Gmail sending limits (500/day)
- Review email server logs

**Claude API errors:**
- Verify ANTHROPIC_API_KEY is set
- Check API quota/limits
- Review prompt length (max tokens)
- Check error messages in console

**DALL-E not working:**
- Verify OPENAI_API_KEY is set
- Check billing/payment method
- Ensure budget limit not reached
- Review prompt for policy violations

**Stripe webhooks failing:**
- Verify webhook secret matches
- Check endpoint URL is accessible
- Ensure signature verification is working
- Review webhook logs in Stripe dashboard

### 9.3: Enable Debug Mode

Add to `.env.local`:
```bash
DEBUG=true
LOG_LEVEL=debug
```

This will output detailed logs for troubleshooting.

---

## Part 10: Testing Checklist

Before deploying to production, verify all tests pass:

### Email System
- [ ] Gmail integration connects successfully
- [ ] Emails sync from Gmail to application
- [ ] New contacts created automatically
- [ ] Email threads display correctly
- [ ] Auto-replies send successfully
- [ ] Auto-reply questions are relevant

### AI Features
- [ ] Claude API calls work
- [ ] Content generation produces quality output
- [ ] Personas generate with correct data
- [ ] Strategies are comprehensive
- [ ] Mind maps expand automatically
- [ ] AI scoring updates correctly

### Image Generation
- [ ] DALL-E API connects
- [ ] Images generate successfully
- [ ] Images download correctly
- [ ] Cost tracking works
- [ ] Usage limits enforce properly

### Billing
- [ ] Stripe checkout completes
- [ ] Subscriptions create correctly
- [ ] Webhooks process successfully
- [ ] Payment failures handled gracefully
- [ ] Cancellations work properly
- [ ] Customer portal accessible

### End-to-End
- [ ] Full user onboarding flows work
- [ ] Multi-step workflows complete
- [ ] Data persists correctly
- [ ] UI updates reflect backend changes
- [ ] No console errors or warnings

---

## Additional Resources

- [Gmail Setup Guide](./GMAIL_SETUP_GUIDE.md)
- [DALL-E Setup Guide](./DALLE_SETUP_GUIDE.md)
- [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## Support

For testing issues:
- Check individual setup guides for specific integrations
- Review Convex dashboard logs
- Monitor Stripe webhook logs
- Contact: contact@unite-group.in
