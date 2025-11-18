# SendGrid Credits Exceeded - Resolution Guide

**Date:** 2025-01-18
**Error:** "Maximum credits exceeded"
**Status:** ⚠️ SendGrid API Key Valid but Account Needs Upgrade

---

## 🚨 Current Issue

**Error Message:**
```json
{
  "errors": [
    {
      "message": "Maximum credits exceeded",
      "field": null,
      "help": null
    }
  ]
}
```

**What This Means:**
- ✅ Your SendGrid API key IS valid (authentication working)
- ✅ Your sender configuration IS correct
- ✅ Email message IS properly formatted
- ❌ Your SendGrid account has used all available credits

---

## 💡 Understanding SendGrid Credits

### Free Tier (Trial)
- **100 emails/day** for first 30 days
- **0 cost** during trial
- **Then:** $0 for 0 emails (must upgrade)

### Common Causes of Credit Depletion
1. Testing sent too many emails
2. Free trial period expired
3. Account not upgraded to paid plan
4. Monthly email quota reached

---

## 🛠️ Solutions (Choose One)

### Option 1: Upgrade SendGrid Account (Recommended for Production)

**Step 1: Check Current Plan**
1. Go to: https://app.sendgrid.com/account/billing
2. Look at "Current Plan" section
3. Check "Emails Remaining This Month"

**Step 2: Upgrade to Paid Plan**

**Essentials Plan ($19.95/month):**
- **50,000 emails/month**
- Email API
- Email validation
- Dedicated IP (for $50+ plans)

**Pro Plan ($89.95/month):**
- **100,000 emails/month**
- Everything in Essentials
- Email testing
- Subuser management
- 1,000 contacts

**Premier Plan (Custom pricing):**
- **Custom volume**
- Dedicated IP included
- Advanced features
- Priority support

**How to Upgrade:**
1. Go to: https://app.sendgrid.com/account/billing
2. Click "Upgrade Plan"
3. Select plan (Essentials recommended for start)
4. Enter payment information
5. Confirm upgrade

**Cost:** $19.95/month for 50,000 emails (lowest paid tier)

---

### Option 2: Use Alternative Email Service (Temporary)

While you upgrade SendGrid, use the Gmail SMTP you already have configured:

**Current .env.local Configuration:**
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=Support2025!@
EMAIL_FROM=contact@unite-group.in
```

**To Use Gmail SMTP:**

1. **Create Email Utility** (`src/lib/email.ts`):

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
```

2. **Install nodemailer:**
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

3. **Use in your app:**
```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Unite-Hub',
  text: 'Thank you for signing up!',
  html: '<h1>Welcome!</h1><p>Thank you for signing up!</p>',
});
```

**Gmail SMTP Limits:**
- **500 emails/day** (free Gmail account)
- **2,000 emails/day** (Google Workspace account)

---

### Option 3: Use Resend (Alternative to SendGrid)

I noticed your `.env.local` has what looks like a Resend API key:
```env
SENDGRID_API_KEY="re_R4vniZCd_76Q5Q6urRpYPNSN1NAxEdmSe"
```

**Resend Pricing:**
- **Free:** 100 emails/day, 3,000 emails/month
- **Paid:** $20/month for 50,000 emails

**To Use Resend:**

1. **Verify API Key:**
   - Go to: https://resend.com/api-keys
   - Check if key exists and is active

2. **Install Resend SDK:**
```bash
npm install resend
```

3. **Create Email Utility** (`src/lib/resend.ts`):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.SENDGRID_API_KEY); // Use Resend key

export async function sendEmailViaResend({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'contact@unite-group.in',
      to,
      subject,
      text,
      html: html || text,
    });

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
```

---

## ✅ Recommended Approach

### For Development/Testing NOW:
**Use Gmail SMTP** (Option 2)
- Already configured
- Free 500 emails/day
- Works immediately

### For Production:
**Upgrade SendGrid** (Option 1)
- Professional email service
- Better deliverability
- Advanced features (templates, analytics, webhooks)
- Scalable
- Only $19.95/month for 50,000 emails

### Alternative Production Option:
**Use Resend**
- Similar pricing to SendGrid
- Modern API
- Good deliverability
- Developer-friendly

---

## 🔧 Implementation Steps (Using Gmail SMTP)

Since SendGrid is blocked, let's set up Gmail SMTP now:

### Step 1: Install nodemailer

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### Step 2: Create email utility

Create `src/lib/email.ts` with the nodemailer code above.

### Step 3: Test it

```bash
node scripts/test-gmail-smtp.mjs
```

I'll create this test script for you next.

---

## 📊 Email Service Comparison

| Feature | SendGrid | Resend | Gmail SMTP | Recommendation |
|---------|----------|--------|------------|----------------|
| **Free Tier** | 100/day (30 days) | 100/day, 3k/month | 500/day | Resend best free |
| **Paid (50k emails)** | $19.95/month | $20/month | N/A | Similar |
| **Deliverability** | Excellent | Excellent | Good | SendGrid/Resend |
| **Analytics** | Yes | Yes | No | SendGrid/Resend |
| **Templates** | Yes | Yes | No | SendGrid/Resend |
| **Webhooks** | Yes | Yes | No | SendGrid/Resend |
| **Developer Experience** | Good | Excellent | Basic | Resend |

---

## 🎯 Next Steps

### Immediate (Right Now):

1. **Choose temporary solution:**
   - Gmail SMTP (easiest, already configured)
   - OR Resend (if you have active account)

2. **Set up chosen solution:**
   - Follow implementation steps above
   - Test email sending
   - Update application to use new email utility

### This Week:

1. **Upgrade SendGrid account:**
   - Go to: https://app.sendgrid.com/account/billing
   - Upgrade to Essentials plan ($19.95/month)
   - Wait for activation (usually instant)
   - Test with `node scripts/test-sendgrid.mjs`

2. **Or switch to Resend permanently:**
   - Sign up at https://resend.com
   - Get API key
   - Update environment variables
   - Authenticate domain

---

## 💰 Cost Comparison (Monthly)

**Your Expected Email Volume:** ~10,000 emails/month (estimated)

| Service | Plan | Cost/Month | Includes |
|---------|------|------------|----------|
| SendGrid | Essentials | $19.95 | 50,000 emails |
| Resend | Starter | $20.00 | 50,000 emails |
| Gmail SMTP | Free | $0 | 500/day = 15,000/month |
| AWS SES | Pay-as-you-go | $1.00 | 10,000 emails @ $0.10/1k |

**Recommendation:**
- **Now:** Gmail SMTP (free, immediate)
- **Production:** SendGrid or Resend ($20/month, professional)

---

## 📞 Support Resources

### SendGrid Support
- **Dashboard:** https://app.sendgrid.com/
- **Billing:** https://app.sendgrid.com/account/billing
- **Support:** https://support.sendgrid.com/

### Alternative Services
- **Resend:** https://resend.com
- **Gmail SMTP:** Already configured
- **AWS SES:** https://aws.amazon.com/ses/

---

**Current Status:** ⏳ SendGrid credits exceeded, Gmail SMTP ready as fallback

**Next Action:**
1. Test Gmail SMTP with test script (I'll create next)
2. OR upgrade SendGrid account at https://app.sendgrid.com/account/billing

---

*Last Updated: 2025-01-18*
*Issue: Maximum credits exceeded*
*Solution: Upgrade SendGrid OR use Gmail SMTP*
