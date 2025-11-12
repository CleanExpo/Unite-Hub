# Duncan Onboarding Guide

Step-by-step guide to test the complete Unite-Hub CRM workflow using Duncan as a test user.

## Overview

This guide will walk through:
1. Creating Duncan's test account
2. Sending test email from Duncan
3. Verifying auto-reply received
4. Email appears in portal
5. Mind map updates
6. Persona generates
7. Strategy creates
8. End-to-end verification

**Time Required:** 30-45 minutes

---

## Prerequisites

Before starting:
- [ ] All environment variables configured
- [ ] Development server running: `npm run dev`
- [ ] Convex running: `npx convex dev`
- [ ] Gmail integration connected
- [ ] Duncan has an email address to use for testing

---

## Part 1: Create Duncan's Test Account

### Option A: Duncan Signs Up (Recommended)

1. **Send Duncan the signup link:**
   ```
   http://localhost:3008/auth/signup
   ```
   Or production URL:
   ```
   https://your-domain.com/auth/signup
   ```

2. **Duncan completes signup:**
   - Email: `duncan@example.com` (or his real email)
   - Password: `Test123!` (or his choice)
   - Full name: `Duncan Smith`
   - Company: `Duncan's Test Company`

3. **Duncan selects plan:**
   - Choose "Starter" plan ($249 AUD/month)
   - Click "Get Started"

4. **Duncan completes Stripe checkout:**
   - **For testing, use test card:**
     - Card: 4242 4242 4242 4242
     - Expiry: 12/34
     - CVC: 123
     - ZIP: 12345
   - Click "Subscribe"

5. **Verify account created:**
   - Duncan should be redirected to dashboard
   - Check Convex dashboard for new organization
   - Verify subscription status: "active"

### Option B: Admin Creates Account for Duncan

1. **As admin, create organization:**
   ```bash
   curl -X POST http://localhost:3008/api/organizations/create \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Duncan Test Org",
       "email": "duncan@example.com",
       "websiteUrl": "https://duncan-test.com",
       "businessDescription": "Test organization for Duncan"
     }'
   ```

2. **Note the organization ID returned**

3. **Create test subscription manually in Convex:**
   - Navigate to Convex dashboard
   - Add record to `subscriptions` table:
     ```json
     {
       "orgId": "[duncan-org-id]",
       "planTier": "starter",
       "status": "trialing",
       "currentPeriodStart": 1700000000000,
       "currentPeriodEnd": 1702592000000,
       "stripeCustomerId": "cus_test_duncan",
       "stripeSubscriptionId": "sub_test_duncan",
       "stripePriceId": "price_test",
       "cancelAtPeriodEnd": false
     }
     ```

---

## Part 2: Duncan Sends Test Email

### 2.1: Email Duncan the Instructions

Send Duncan this email template:

```
Subject: Test Unite-Hub CRM - Please Send This Email

Hi Duncan,

Thanks for helping test Unite-Hub CRM!

Please send an email FROM your email address TO: contact@unite-group.in

Use this content (or customize it):

---

Subject: Excited About Partnership - Marketing Help Needed

Hi Unite Group Team,

My name is Duncan Smith, and I'm the founder of Duncan's Test Company.
I'm really excited about the possibility of working together!

I've been following your work and I'm particularly interested in:
- Developing a strong social media presence
- Creating engaging content for LinkedIn and Instagram
- Building a comprehensive marketing strategy for my business

Our company focuses on [describe your business], and we're looking to
reach [target audience]. We're ready to invest in professional marketing
to take our business to the next level.

I'd love to schedule a call next week to discuss how we can partner.
What's your availability?

Some additional details about our needs:
- Budget: $3,000-5,000 per month
- Timeline: Looking to start within 2-3 weeks
- Platforms: Mainly LinkedIn, Instagram, and email marketing

Looking forward to hearing from you soon!

Best regards,
Duncan Smith
Founder & CEO
Duncan's Test Company
duncan@example.com
+61 400 123 456

---

After sending, check your inbox for an auto-reply from our system!

Thanks!
```

### 2.2: Duncan Sends the Email

Duncan should:
1. Open his email client
2. Compose new email
3. To: contact@unite-group.in
4. Copy/paste the subject and body above (or customize)
5. Send the email

### 2.3: Confirm Email Sent

Verify with Duncan that email was sent successfully.

---

## Part 3: Process the Email

### 3.1: Trigger Email Sync

**Option A: Automatic (if configured)**
- Wait 2-5 minutes for automatic sync

**Option B: Manual Trigger**
```bash
npm run email-agent
```

Or via API:
```bash
curl -X POST http://localhost:3008/api/integrations/gmail/sync
```

### 3.2: Verify Email Received

Check terminal output:
```
📧 Email Agent Started
Organization: k57akqzf14r07d9q3pbf9kebvn7v7929
Workspace: kh72b1cng9h88691sx4x7krt2h7v7deh

🔍 Fetching unprocessed emails...
Found 1 unprocessed emails

📨 Processing: "Excited About Partnership - Marketing Help Needed"
   From: duncan@example.com
   🔗 Looking up contact...
   ➕ Creating new contact...
   ✅ New contact created
   🧠 Analyzing content...
   Intents: partnership, meeting, inquiry
   Sentiment: positive
   💾 Updating email status...
   📊 Updating contact score...
   📝 Adding interaction note...
   ✅ Email processed successfully

====================================================
✅ Email Processing Complete
====================================================
Total processed: 1
New contacts created: 1
Errors: 0
====================================================
```

---

## Part 4: Verify Auto-Reply Received

### 4.1: Duncan Checks Inbox

Duncan should check his email (duncan@example.com) within 5-10 minutes.

### 4.2: Expected Auto-Reply

Duncan should receive something like:

```
From: Unite Group Team <contact@unite-group.in>
To: duncan@example.com
Subject: Re: Excited About Partnership - Marketing Help Needed

Hi Duncan,

Thank you so much for reaching out! We're excited about the opportunity
to work with Duncan's Test Company.

To help us create the perfect marketing strategy for you, could you
provide a bit more information:

1. What are your primary business goals for the next 6-12 months?

2. Who is your ideal customer? Can you describe their demographics,
   interests, and pain points?

3. What has been your experience with marketing in the past? What
   worked well and what didn't?

4. Are there any competitors you admire or want to differentiate from?

5. What does success look like for you? (e.g., more leads, brand
   awareness, sales targets)

We're looking forward to learning more about your business and discussing
how we can help you achieve your marketing goals!

Best regards,
Unite Group Team

---
This is an automated response. A team member will follow up personally
within 24 hours.
```

### 4.3: Verification Checklist

Verify with Duncan:
- [ ] Auto-reply received in inbox
- [ ] Email is from contact@unite-group.in
- [ ] Questions are relevant and make sense
- [ ] Tone is professional and friendly
- [ ] Duncan can reply to the email

---

## Part 5: Verify Email Appears in Portal

### 5.1: Admin Views Duncan's Contact

1. Navigate to: `http://localhost:3008/dashboard/contacts`
2. You should see "Duncan Smith" in the contacts list
3. Click on Duncan's name

### 5.2: Verify Contact Details

Check Duncan's profile shows:
- **Name:** Duncan Smith
- **Email:** duncan@example.com
- **Company:** Duncan's Test Company
- **Status:** Prospect or Lead
- **AI Score:** 65-75 (boosted due to positive sentiment)
- **Tags:** "email-inbound"

### 5.3: Verify Email Thread

In Duncan's profile:
1. Navigate to "Emails" or "Communication" tab
2. You should see the email thread:
   - **Subject:** "Excited About Partnership - Marketing Help Needed"
   - **From:** duncan@example.com
   - **Date:** [timestamp of email]
   - **Body:** Full email content visible
   - **Auto-reply sent:** ✅ Yes
   - **Auto-reply date:** [timestamp]

### 5.4: Verify AI Analysis

Check the AI analysis section:
- **Intents Detected:**
  - Partnership
  - Meeting request
  - Inquiry
- **Sentiment:** Positive
- **Key Topics:**
  - Social media
  - LinkedIn
  - Instagram
  - Marketing strategy
  - Budget: $3,000-5,000/month
- **Summary:** "Duncan Smith from Duncan's Test Company is interested in partnership for social media and content marketing. Positive sentiment, high engagement score."

---

## Part 6: Verify Mind Map Updates

### 6.1: View Mind Map

1. In Duncan's profile, click "Mind Map" tab
2. You should see an automatically generated mind map

### 6.2: Expected Mind Map Structure

**Root Node:**
- Duncan's Test Company

**Main Branches:**

1. **Products/Services** (auto-inferred from email)
   - [Duncan's business description]

2. **Target Audience**
   - [Audience mentioned in email]

3. **Marketing Challenges**
   - Need social media presence
   - Content creation
   - Comprehensive strategy needed

4. **Opportunities**
   - Ready to invest ($3-5k/month)
   - Partnership with Unite Group
   - LinkedIn presence
   - Instagram engagement
   - Email marketing

5. **Timeline**
   - Start within 2-3 weeks
   - Call scheduled for next week

### 6.3: Verify Mind Map Features

- [ ] All email insights are captured
- [ ] Nodes are color-coded by category
- [ ] Mind map is interactive (if UI supports)
- [ ] Source email linked to each insight
- [ ] Timestamp shows when node was added

---

## Part 7: Generate Persona

### 7.1: Trigger Persona Generation

**Option A: Automatic (if configured)**
- System may auto-generate after email processing

**Option B: Manual Trigger via UI**
1. In Duncan's profile, click "Generate Persona"
2. Wait 10-30 seconds

**Option C: Manual Trigger via API**
```bash
curl -X POST http://localhost:3008/api/personas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "[duncan-client-id]",
    "emailThreadIds": ["[email-thread-id]"]
  }'
```

### 7.2: Verify Persona Generated

Navigate to "Persona" tab in Duncan's profile.

### 7.3: Expected Persona

**Persona Name:** Ambitious SMB Founder

**Demographics:**
- Age Range: 30-45
- Gender: Male
- Location: Australia (or Duncan's location)
- Income: $100k-250k
- Education: University degree
- Occupation: Founder/CEO

**Psychographics:**
- **Values:** Innovation, Growth, Professional excellence, ROI-focused
- **Interests:** Digital marketing, Business growth, Social media, LinkedIn networking
- **Lifestyle:** Entrepreneurial, Time-conscious, Results-driven
- **Personality:** Proactive, Decisive, Detail-oriented

**Pain Points:**
- Limited marketing expertise in-house
- Struggling to gain social media traction
- Unclear how to position brand effectively
- Time constraints as founder
- Need professional guidance

**Goals:**
- Establish strong LinkedIn presence
- Build engaged Instagram audience
- Generate qualified leads through content
- Increase brand awareness in target market
- Achieve measurable ROI on marketing spend

**Buying Behavior:**
- **Motivations:**
  - Ready to invest (mentioned $3-5k budget)
  - Time-sensitive (wants to start in 2-3 weeks)
  - Values expertise and professionalism
- **Barriers:**
  - Budget considerations
  - Need to see clear ROI
  - Timeline constraints
- **Decision Factors:**
  - Proven track record
  - Comprehensive strategy
  - Clear deliverables and metrics

**Communication Preferences:**
- Email for initial contact
- Prefers scheduled calls
- Professional but friendly tone
- Appreciates detailed information

### 7.4: Verification Checklist

- [ ] Persona generated successfully
- [ ] All sections populated with relevant data
- [ ] Information aligns with Duncan's email
- [ ] Persona is actionable for marketing
- [ ] Can view/edit persona in UI

---

## Part 8: Generate Marketing Strategy

### 8.1: Trigger Strategy Generation

**Option A: Via UI**
1. In Duncan's profile, click "Generate Strategy"
2. Wait 30-60 seconds for Claude to analyze

**Option B: Via API**
```bash
curl -X POST http://localhost:3008/api/strategies/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "[duncan-client-id]",
    "personaId": "[persona-id]"
  }'
```

### 8.2: Expected Strategy Components

**Executive Summary:**
- Overview of Duncan's business
- Primary marketing objectives
- Recommended approach
- Expected outcomes

**Market Analysis:**
- Industry overview (Duncan's sector)
- Target market size and characteristics
- Current trends and opportunities
- Competitive landscape

**Target Audience:**
- Detailed description based on persona
- Audience segmentation
- Key demographics and psychographics
- Decision-making process

**Unique Selling Proposition:**
- What makes Duncan's business unique
- Key differentiators
- Value proposition to customers

**Marketing Channels (Ranked by Priority):**

1. **LinkedIn Marketing**
   - Why: B2B focus, professional audience
   - Tactics: Thought leadership, company page, sponsored content
   - KPIs: Followers, engagement rate, leads

2. **Instagram Marketing**
   - Why: Visual storytelling, brand building
   - Tactics: Stories, reels, influencer partnerships
   - KPIs: Followers, engagement, website traffic

3. **Email Marketing**
   - Why: Direct communication, nurture leads
   - Tactics: Newsletter, drip campaigns, personalization
   - KPIs: Open rate, click rate, conversions

4. **Content Marketing**
   - Why: Authority building, SEO, education
   - Tactics: Blog posts, videos, guides
   - KPIs: Traffic, shares, backlinks

5. **Paid Advertising (Optional)**
   - Why: Accelerate growth, targeted reach
   - Tactics: LinkedIn ads, Instagram ads
   - KPIs: CPC, conversion rate, ROAS

**Content Strategy:**
- Content themes aligned with audience interests
- Editorial calendar structure
- Content formats (video, carousel, blog, etc.)

**Content Pillars:**
1. Industry insights and trends
2. Educational how-to content
3. Customer success stories
4. Behind-the-scenes/company culture
5. Product/service highlights

**Success Metrics:**
| Metric | Target | Timeframe |
|--------|--------|-----------|
| LinkedIn followers | +500 | 3 months |
| LinkedIn engagement rate | 5%+ | Ongoing |
| Instagram followers | +1,000 | 3 months |
| Email list growth | +250 subscribers | 3 months |
| Website traffic from social | +50% | 3 months |
| Marketing qualified leads | 15-20/month | 3 months |

**Budget Guidance:**
- Recommended allocation: $4,000/month (within Duncan's range)
- Breakdown:
  - Content creation: $1,500
  - Social media management: $1,200
  - Paid advertising: $800
  - Tools and software: $300
  - Design and creative: $200

### 8.3: Verification Checklist

- [ ] Strategy generated successfully
- [ ] All sections are comprehensive
- [ ] Recommendations align with Duncan's needs
- [ ] Budget aligns with Duncan's stated range ($3-5k)
- [ ] Metrics are specific and measurable
- [ ] Timeline is realistic (2-3 weeks to start)
- [ ] Strategy accounts for Duncan's platforms (LinkedIn, Instagram)

---

## Part 9: Duncan Receives Follow-Up Content

### 9.1: Generate Personalized Follow-Up

Run content agent:
```bash
npm run content-agent
```

### 9.2: Verify Draft Email Created

Check Convex dashboard or UI:
1. Navigate to "Generated Content" or "Drafts"
2. You should see a draft email for Duncan

### 9.3: Expected Follow-Up Email

```
Subject: Marketing Strategy for Duncan's Test Company - Next Steps

Hi Duncan,

Thank you again for reaching out about partnering with Unite Group!

Based on our conversation, I've put together some initial thoughts on
how we can help Duncan's Test Company achieve your marketing goals.

Key Recommendations:

1. LinkedIn Thought Leadership
   Build your personal brand and company presence on LinkedIn through
   consistent, valuable content that resonates with your target audience.

2. Instagram Visual Storytelling
   Create engaging visual content that showcases your brand personality
   and connects emotionally with potential customers.

3. Strategic Content Calendar
   Develop a comprehensive content plan that aligns with your business
   goals and keeps you consistently visible.

Given your budget of $3,000-5,000 per month, I recommend starting with
our Professional tier ($549/month for the CRM platform) plus a custom
marketing package ($3,500/month) that includes:

- Weekly LinkedIn posts + engagement
- 3x weekly Instagram posts (feed + stories)
- Monthly email newsletter
- Quarterly strategy reviews
- Performance analytics and reporting

Next Steps:

I'd love to schedule a 30-minute strategy call to walk through this in
more detail. Would Tuesday or Thursday next week work for you?

You can book directly here: [calendar link]

Or just reply with your availability and I'll send over an invite.

Looking forward to working together!

Best regards,
[Your Name]
Unite Group Team
```

### 9.4: Admin Reviews and Sends

1. Admin reviews the draft in dashboard
2. Makes any necessary edits
3. Approves and sends to Duncan
4. Or schedules for later sending

---

## Part 10: Complete Verification Checklist

### Email System
- [ ] Duncan's email received and processed
- [ ] Contact created automatically with correct details
- [ ] Email thread visible in portal
- [ ] Auto-reply sent to Duncan
- [ ] Duncan received auto-reply in his inbox
- [ ] AI analysis accurate (intents, sentiment)

### Mind Map
- [ ] Mind map generated automatically
- [ ] All key insights from email captured
- [ ] Nodes categorized correctly (challenges, opportunities, etc.)
- [ ] Visual structure makes sense
- [ ] Source email linked to insights

### Persona
- [ ] Persona generated successfully
- [ ] Demographics align with Duncan's profile
- [ ] Pain points match email content
- [ ] Goals reflect Duncan's stated objectives
- [ ] Buying behavior analysis is accurate
- [ ] Persona is detailed and actionable

### Strategy
- [ ] Marketing strategy generated
- [ ] Recommendations align with Duncan's needs
- [ ] Budget guidance matches Duncan's range
- [ ] Marketing channels prioritized correctly (LinkedIn, Instagram)
- [ ] Success metrics are specific and measurable
- [ ] Timeline considerations match Duncan's urgency
- [ ] Content pillars are relevant

### Follow-Up Content
- [ ] Personalized email draft created
- [ ] Content references Duncan's specific situation
- [ ] Tone is professional and engaging
- [ ] Call-to-action is clear
- [ ] Budget and plan details included
- [ ] Next steps outlined

### Overall Experience
- [ ] End-to-end process completed smoothly
- [ ] No errors or bugs encountered
- [ ] Data persistence across all tables
- [ ] UI displays all information correctly
- [ ] Duncan had positive experience
- [ ] System demonstrates clear value

---

## Part 11: Duncan Provides Feedback

### 11.1: Send Duncan Feedback Form

Ask Duncan to rate:

1. **Email auto-reply (1-5):**
   - Relevance of questions
   - Tone and professionalism
   - Timing (how quickly received)

2. **Overall experience (1-5):**
   - Ease of sending initial email
   - Quality of auto-response
   - Would you use this as a real customer?

3. **Suggestions:**
   - What worked well?
   - What could be improved?
   - Any confusion or friction points?

### 11.2: Review Feedback

Use Duncan's feedback to:
- Improve auto-reply templates
- Refine persona generation
- Enhance strategy prompts
- Optimize user experience

---

## Part 12: Next Steps

After successful Duncan test:

1. **Repeat with 2-3 more test users** to ensure consistency

2. **Test different scenarios:**
   - Negative/neutral sentiment emails
   - Vague inquiries
   - Very detailed emails
   - Follow-up emails
   - Budget-conscious inquiries
   - Enterprise-level inquiries

3. **Refine based on feedback:**
   - Adjust AI prompts
   - Improve auto-reply templates
   - Enhance persona accuracy
   - Optimize strategy generation

4. **Prepare for production:**
   - Review DEPLOYMENT_GUIDE.md
   - Set up production environment
   - Configure production integrations
   - Test with live (small) transactions

5. **Create onboarding materials for real clients:**
   - Welcome email sequence
   - Getting started guide
   - Video tutorials
   - FAQ documentation

---

## Troubleshooting

### Duncan Doesn't Receive Auto-Reply

**Check:**
1. Spam/junk folder
2. Email server logs for sending errors
3. SMTP credentials in .env.local
4. Gmail sending limits (500/day)
5. Duncan's email address in allowlist (if configured)

**Solution:**
- Manually trigger auto-reply: `curl -X POST http://localhost:3008/api/emails/send-auto-reply`
- Check email logs in application
- Verify EMAIL_SERVER_* environment variables

### Email Not Showing in Portal

**Check:**
1. Email agent ran successfully
2. Gmail integration is connected
3. Email wasn't filtered out (spam, etc.)
4. Convex database has record

**Solution:**
- Re-run email agent: `npm run email-agent`
- Check Convex dashboard for email record
- Verify workspaceId and orgId match

### Persona Generation Fails

**Check:**
1. ANTHROPIC_API_KEY is set correctly
2. API quota not exceeded
3. Email content provides enough information

**Solution:**
- Check API key: `console.log(process.env.ANTHROPIC_API_KEY?.substring(0, 20))`
- Review Claude API error messages
- Manually trigger with verbose logging

### Strategy Missing Details

**Check:**
1. Persona was generated first
2. Enough context from emails
3. Claude API limits/errors

**Solution:**
- Ensure persona exists before strategy generation
- Add more email threads for context
- Review and refine strategy generation prompt

---

## Support

For issues during Duncan's onboarding test:
- Review individual setup guides (Gmail, DALL-E, Stripe)
- Check application logs and Convex dashboard
- Contact: contact@unite-group.in

---

## Success Criteria

Duncan's test is successful if:
1. ✅ Email received and processed automatically
2. ✅ Auto-reply sent and received within 10 minutes
3. ✅ Contact created with accurate details
4. ✅ Mind map generated with relevant insights
5. ✅ Persona is detailed and actionable
6. ✅ Strategy aligns with Duncan's needs and budget
7. ✅ Follow-up content is personalized and professional
8. ✅ No errors or technical issues encountered
9. ✅ Duncan has positive experience overall
10. ✅ System demonstrates clear business value

**If all criteria met:** Ready for more test users and production deployment!
