# Synthex Client Onboarding Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Audience**: Synthex Clients (Marketing Agency Customers)

---

## Welcome to Synthex! 🚀

Congratulations on choosing Synthex as your marketing automation partner. This guide will help you get set up and start seeing results quickly.

---

## Quick Setup Checklist

- [ ] Step 1: Activate your account (5 min)
- [ ] Step 2: Complete your profile (3 min)
- [ ] Step 3: Connect your email (5 min)
- [ ] Step 4: Import your contacts (10 min)
- [ ] Step 5: Launch your first campaign (15 min)

**Total setup time: ~40 minutes**

---

## Step 1: Activate Your Account

### 1.1 Accept Invitation

1. Check your email for invitation from Synthex
2. Click **"Accept Invitation"**
3. You'll be redirected to login

### 1.2 First Login

1. Click **"Continue with Google"**
2. Select the email address where you received the invite
3. Grant necessary permissions
4. You're in! 🎉

### 1.3 Set Your Password (Optional)

If you prefer email/password login:

1. Go to **Settings → Account**
2. Click **"Set Password"**
3. Create a strong password
4. Confirm via email

---

## Step 2: Complete Your Profile

### 2.1 Business Information

Navigate to **Settings → Business Profile**

Fill in:
| Field | Example |
|-------|---------|
| Business Name | "Acme Restoration Services" |
| Industry | Restoration & Cleaning |
| Website | www.acmerestoration.com.au |
| Phone | +61 7 1234 5678 |
| Address | 123 Main St, Brisbane QLD 4000 |

### 2.2 Branding

Upload your assets:
- **Logo**: PNG or SVG, min 200x200px
- **Brand Color**: Your primary brand color (hex code)

These appear in:
- Your email campaigns
- Client portal
- Generated reports

### 2.3 Team Members (Optional)

Add your team:

1. Go to **Settings → Team**
2. Click **"Invite Member"**
3. Enter their email
4. Select role:
   - **Admin**: Full access
   - **Editor**: Can create/edit campaigns
   - **Viewer**: Read-only access

---

## Step 3: Connect Your Email

### Why Connect Email?

- Send campaigns from your domain
- Auto-sync replies and conversations
- Track opens and clicks
- Build sender reputation

### 3.1 Gmail Connection

1. Go to **Settings → Email Integration**
2. Click **"Connect Gmail"**
3. Sign in with your business Gmail
4. Grant permissions:
   - ✅ Read and send emails
   - ✅ Manage labels
5. Done!

### 3.2 Verify Your Domain (Recommended)

For better deliverability:

1. Go to **Settings → Email → Domain Verification**
2. Add these DNS records:
   ```
   Type: TXT
   Name: @
   Value: [provided verification code]

   Type: CNAME
   Name: em.[yourdomain]
   Value: [provided value]
   ```
3. Click **"Verify"**

**Tip**: Ask your web developer or IT team to help with DNS records.

---

## Step 4: Import Your Contacts

### 4.1 Prepare Your Data

Format your contact list as CSV with these columns:

```csv
name,email,company,phone,source,tags
John Smith,john@example.com,Smith Corp,0400123456,website,contractor
Jane Doe,jane@example.com,Doe Inc,0400654321,referral,commercial
```

**Required**: name, email
**Optional**: company, phone, source, tags, job_title, notes

### 4.2 Import Process

1. Go to **Contacts → Import**
2. Click **"Upload CSV"**
3. Select your file
4. Map columns:
   - Match your CSV headers to Synthex fields
   - Preview looks correct? Continue
5. Click **"Import"**

### 4.3 Cleaning & Deduplication

Synthex automatically:
- Removes duplicate emails
- Validates email format
- Identifies invalid addresses
- Tags bounced emails

### 4.4 Manual Entry

For individual contacts:

1. Click **"+ Add Contact"**
2. Fill in details
3. Add tags (optional)
4. Save

---

## Step 5: Launch Your First Campaign

### 5.1 Choose Campaign Type

| Type | Best For |
|------|----------|
| **One-Time** | Announcements, newsletters |
| **Drip** | Nurture sequences, onboarding |
| **Automated** | Welcome emails, follow-ups |

### 5.2 Create a One-Time Campaign

1. Go to **Campaigns → New Campaign**
2. Select **"One-Time Email"**
3. Configure:
   - **Name**: "November Newsletter"
   - **Subject**: "Your Monthly Update from Acme"
   - **From**: Your connected email
4. Design your email:
   - Choose a template or start blank
   - Add your content
   - Insert images
   - Add links
5. Select recipients:
   - All contacts
   - Filtered list (by tag, score, status)
6. Preview and test
7. Schedule or send immediately

### 5.3 Email Best Practices

**Subject Lines:**
- Keep under 50 characters
- Use personalization: "Hi {{name}}"
- Create urgency (when appropriate)
- Avoid spam triggers (FREE!!!, Click now!!!)

**Content:**
- One clear call-to-action
- Mobile-friendly design
- Include unsubscribe link (automatic)
- Keep paragraphs short

**Timing:**
- B2B: Tuesday-Thursday, 9am-11am
- B2C: Weekends often work well
- Test what works for your audience

---

## Understanding Your Dashboard

### Key Metrics

| Metric | Good | Great | What It Means |
|--------|------|-------|---------------|
| **Open Rate** | 20% | 30%+ | People opening your emails |
| **Click Rate** | 2% | 5%+ | People clicking your links |
| **Bounce Rate** | <5% | <2% | Invalid email addresses |
| **Unsubscribe** | <1% | <0.5% | People opting out |

### Contact Scoring

Synthex AI analyzes your contacts:

- **80-100** 🔥 Hot Lead - Ready to engage
- **60-79** ☀️ Warm Lead - Interested, needs nurturing
- **40-59** 🌤️ Cool Lead - Some interest
- **0-39** ❄️ Cold Lead - Not ready yet

**Focus your efforts on Hot and Warm leads!**

---

## Your Subscription

### Tier Features

| Feature | Starter | Professional | Elite |
|---------|---------|--------------|-------|
| Contacts | 500 | 2,500 | 10,000 |
| Campaigns/mo | 5 | 25 | Unlimited |
| AI Scoring | Basic | Advanced | Full |
| Email Templates | 10 | 50 | Unlimited |
| Team Members | 2 | 5 | Unlimited |
| API Access | ❌ | Limited | Full |
| Priority Support | ❌ | ✅ | ✅ |

### Upgrading

1. Go to **Settings → Subscription**
2. Click **"Upgrade"**
3. Select new tier
4. Update payment if needed
5. Instant activation

### Billing

- Monthly billing on signup date
- View invoices: **Settings → Billing**
- Update payment: **Settings → Payment Method**
- Cancel anytime (no lock-in)

---

## Getting Results

### Week 1: Foundation

- ✅ Complete all setup steps
- ✅ Import your contacts
- ✅ Send welcome campaign
- ✅ Review initial metrics

### Week 2-4: Optimize

- A/B test subject lines
- Refine your targeting
- Review AI insights
- Adjust send times

### Month 2+: Scale

- Build drip campaigns
- Segment your audience
- Implement automation
- Track ROI

---

## Best Practices for Success

### Do ✅

- Send consistently (weekly or bi-weekly)
- Personalize your messages
- Clean your list regularly
- Monitor your metrics
- Test before sending large campaigns
- Respect unsubscribes

### Don't ❌

- Buy email lists
- Send without permission
- Ignore bounce rates
- Overload with emails
- Use misleading subject lines
- Skip the preview

---

## Getting Help

### Self-Service

- **Knowledge Base**: docs.synthex.com.au
- **Video Tutorials**: [Link to tutorials]
- **FAQ**: Common questions answered

### Support

| Tier | Support Level |
|------|---------------|
| Starter | Email (48hr response) |
| Professional | Email + Chat (same day) |
| Elite | Priority + Phone |

**Email**: support@synthex.com.au
**Chat**: Click the chat icon (bottom right)
**Phone** (Elite): 1300-SYNTHEX

### Office Hours

Monday-Friday: 9am - 5pm AEST
Saturday-Sunday: Email only

---

## FAQ

**Q: Can I send to people who haven't opted in?**
A: No. You must have permission to email contacts. Synthex complies with Australian spam laws.

**Q: What happens if I exceed my contact limit?**
A: You'll be prompted to upgrade. Existing contacts remain accessible.

**Q: Can I cancel anytime?**
A: Yes, no lock-in contracts. Cancel from Settings → Subscription.

**Q: How long until I see results?**
A: Most clients see improved engagement within 2-4 weeks of consistent sending.

**Q: Do you offer training?**
A: Yes! Professional and Elite tiers include onboarding calls. Request via support.

---

## Next Steps

1. ✅ Finish this setup guide
2. 📧 Send your first campaign
3. 📊 Review results after 48 hours
4. 📞 Book onboarding call (Pro/Elite)
5. 🚀 Scale your marketing!

---

**Welcome aboard! We're excited to help you grow your business.**

*Questions? Contact us at support@synthex.com.au*
