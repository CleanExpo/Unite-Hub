# SendGrid Setup Guide for Unite-Hub

**Date:** 2025-01-18
**Your SendGrid User SID:** `US99183660febc8c770ea8ee728d9079d7`
**Status:** API Key Configured ✅ | Sender Verification Pending ⏳

---

## 📋 Current Status

✅ **Completed:**
- [x] SendGrid API Key added to `.env.local`
- [x] SendGrid API Key added to Vercel environment variables
- [x] `@sendgrid/mail` npm package installed
- [x] Test script created (`scripts/test-sendgrid.mjs`)

⏳ **Pending:**
- [ ] Verify sender email address (`contact@unite-group.in`)
- [ ] Test email sending with test script
- [ ] (Optional) Authenticate domain for better deliverability

---

## 🚀 Quick Start - Test SendGrid Now

### Step 1: Run the Test Script

```bash
# Test with default email (test@unite-group.in)
node scripts/test-sendgrid.mjs

# OR test with your own email
node scripts/test-sendgrid.mjs your-email@example.com
```

### Step 2: Expected Outcomes

**✅ If Successful:**
```
============================================================
SendGrid Email Service Test
============================================================

Step 1: Checking SendGrid API Key...
✅ SendGrid API Key found and valid format

Step 2: Current Configuration
  From Email: contact@unite-group.in
  To Email: your-email@example.com
  API Key: re_R4vniZC...dSe

Step 3: Preparing Test Email...
✅ Email message prepared

Step 4: Sending Email via SendGrid...

✅ EMAIL SENT SUCCESSFULLY!

Response Details:
  Status Code: 202
```

**❌ If Error 403 (Most Likely):**
```
❌ ERROR SENDING EMAIL

Status Code: 403

🔍 Diagnosis: Sender Not Verified
  - contact@unite-group.in is not verified in SendGrid
  - Go to: https://app.sendgrid.com/settings/sender_auth
  - Click "Verify Single Sender" and verify your email
```

**This is expected!** You need to verify your sender email first (see Step 3 below).

---

## 📧 Step 3: Verify Sender Email (REQUIRED)

### Option A: Single Sender Verification (Quick - 5 minutes)

**Best for:** Testing, low volume, getting started quickly

1. **Go to SendGrid Dashboard:**
   - URL: https://app.sendgrid.com/settings/sender_auth/senders
   - Login with your SendGrid account

2. **Click "Create New Sender"**

3. **Fill in Sender Details:**
   ```
   From Name: Unite-Hub
   From Email Address: contact@unite-group.in
   Reply To: contact@unite-group.in
   Company Address: [Your address]
   City: [Your city]
   State: [Your state]
   Zip Code: [Your zip]
   Country: [Your country]
   ```

4. **Click "Create"**

5. **Check Your Email:**
   - SendGrid will send verification email to `contact@unite-group.in`
   - Open the email and click the verification link
   - Return to SendGrid dashboard

6. **Verify It's Active:**
   - You should see `contact@unite-group.in` with a ✅ verified status

7. **Test Again:**
   ```bash
   node scripts/test-sendgrid.mjs your-email@example.com
   ```

### Option B: Domain Authentication (Recommended for Production)

**Best for:** Production, high deliverability, brand trust

1. **Go to Domain Authentication:**
   - URL: https://app.sendgrid.com/settings/sender_auth/domain/create

2. **Enter Your Domain:**
   ```
   Domain: unite-group.in
   Use automated security: Yes (recommended)
   ```

3. **Get DNS Records:**
   - SendGrid will provide 3 CNAME records
   - You need to add these to your domain's DNS settings

4. **Add DNS Records:**
   Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add:

   ```
   Type: CNAME
   Host: em123.unite-group.in
   Value: u99183660.wl456.sendgrid.net
   TTL: 3600

   Type: CNAME
   Host: s1._domainkey.unite-group.in
   Value: s1.domainkey.u99183660.wl456.sendgrid.net
   TTL: 3600

   Type: CNAME
   Host: s2._domainkey.unite-group.in
   Value: s2.domainkey.u99183660.wl456.sendgrid.net
   TTL: 3600
   ```

   *Note: Actual values will be provided by SendGrid - these are examples*

5. **Verify DNS Records:**
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify" in SendGrid dashboard
   - Status should change to "Verified" ✅

6. **Test:**
   ```bash
   node scripts/test-sendgrid.mjs your-email@example.com
   ```

---

## 🔧 SendGrid CLI (Optional)

There is a SendGrid CLI, but it's primarily for account management, not email sending. The API (which we're using) is the standard way.

### Install SendGrid CLI (Optional)

```bash
npm install -g sendgrid-cli
```

### Useful CLI Commands

```bash
# Login to SendGrid CLI
sendgrid login

# Check API key status
sendgrid api_keys list

# View sender authentication status
sendgrid senders list

# Check email activity (last 10)
sendgrid email_activity list --limit 10
```

**Note:** For sending emails, use the `@sendgrid/mail` npm package (already installed) via our API integration, not the CLI.

---

## 📊 Monitoring Email Delivery

### SendGrid Dashboard

**Email Activity:**
- URL: https://app.sendgrid.com/email_activity
- See all sent emails, delivery status, opens, clicks
- Filter by date, recipient, status

**Statistics:**
- URL: https://app.sendgrid.com/statistics
- View email metrics over time
- Track deliverability rates

**Alerts:**
- URL: https://app.sendgrid.com/settings/alerts
- Set up alerts for bounces, spam reports
- Get notified of delivery issues

---

## 🔐 API Key Management

### Your Current API Key

**Location in .env.local:**
```env
SENDGRID_API_KEY="re_R4vniZCd_76Q5Q6urRpYPNSN1NAxEdmSe"
```

**Note:** This key format (`re_*`) suggests it might be a Resend API key, not SendGrid. SendGrid keys start with `SG.`

### ⚠️ IMPORTANT: Verify Your API Key

1. **Go to SendGrid API Keys:**
   - URL: https://app.sendgrid.com/settings/api_keys

2. **Check if key exists:**
   - Look for a key created recently
   - Check if it starts with `SG.`

3. **If no key exists or key is wrong:**
   - Click "Create API Key"
   - Name: `Unite-Hub Production`
   - API Key Permissions: "Full Access" (for now, restrict later)
   - Copy the key (you'll only see it once!)
   - Update `.env.local`:
     ```env
     SENDGRID_API_KEY="SG.your-actual-sendgrid-key-here"
     ```
   - Update Vercel environment variables

### Test with Correct API Key

```bash
node scripts/test-sendgrid.mjs
```

---

## 🚨 Troubleshooting

### Error: 401 Unauthorized

**Cause:** Invalid or expired API key

**Fix:**
1. Create new API key in SendGrid dashboard
2. Update `.env.local` with new key
3. Update Vercel environment variables
4. Restart dev server

### Error: 403 Forbidden

**Cause:** Sender email not verified

**Fix:**
1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Verify `contact@unite-group.in`
3. Check email inbox for verification link
4. Click link to verify

### Error: 400 Bad Request

**Cause:** Invalid email format or missing required fields

**Fix:**
1. Check FROM email is verified
2. Check TO email format is valid
3. Ensure subject and content are not empty

### Emails Going to Spam

**Causes:**
- Sender domain not authenticated
- No SPF/DKIM records
- Content triggers spam filters

**Fixes:**
1. Authenticate your domain (Option B above)
2. Warm up IP address (gradually increase sending volume)
3. Avoid spam trigger words
4. Include unsubscribe link
5. Use consistent "From" address

---

## ✅ Next Steps

### Immediate (Before Testing)

1. **Verify API Key Format:**
   ```bash
   # Should start with "SG." not "re_"
   echo $SENDGRID_API_KEY
   ```
   - If it starts with `re_`, you have a Resend key, not SendGrid
   - Get correct SendGrid key from dashboard

2. **Verify Sender Email:**
   - Go to: https://app.sendgrid.com/settings/sender_auth/senders
   - Verify `contact@unite-group.in`

3. **Run Test:**
   ```bash
   node scripts/test-sendgrid.mjs your-email@example.com
   ```

### Short-term (This Week)

1. **Authenticate Domain** (for production)
   - Better deliverability
   - Higher email reputation
   - Less likely to go to spam

2. **Create Email Templates** (optional)
   - Welcome email template
   - Password reset template
   - Notification templates

3. **Set Up Webhooks** (optional)
   - Track email opens
   - Track link clicks
   - Handle bounces and spam reports

### Production Deployment

1. **Update Vercel Environment Variables:**
   ```
   SENDGRID_API_KEY=SG.your-production-key
   EMAIL_FROM=contact@unite-group.in
   ```

2. **Test in Production:**
   - Send test email after deployment
   - Verify delivery in SendGrid dashboard

3. **Monitor:**
   - Check delivery rates daily
   - Set up alerts for issues
   - Review spam reports

---

## 📚 Resources

### SendGrid Documentation
- **Getting Started:** https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs
- **API Reference:** https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Sender Authentication:** https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- **Error Codes:** https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/responses

### SendGrid Dashboard Links
- **Dashboard:** https://app.sendgrid.com/
- **API Keys:** https://app.sendgrid.com/settings/api_keys
- **Sender Auth:** https://app.sendgrid.com/settings/sender_auth
- **Email Activity:** https://app.sendgrid.com/email_activity
- **Statistics:** https://app.sendgrid.com/statistics

### Support
- **SendGrid Support:** https://support.sendgrid.com/
- **Community Forum:** https://community.sendgrid.com/

---

## ⚡ Quick Commands Reference

```bash
# Test SendGrid with default email
node scripts/test-sendgrid.mjs

# Test SendGrid with custom email
node scripts/test-sendgrid.mjs your-email@example.com

# Check if package is installed
npm list @sendgrid/mail

# Reinstall SendGrid package
npm install @sendgrid/mail

# Check environment variables
echo $SENDGRID_API_KEY
echo $EMAIL_FROM

# Restart dev server
npm run dev
```

---

**Status:** ⏳ Ready to Test
**Next Action:** Run `node scripts/test-sendgrid.mjs` and verify sender email

---

*Last Updated: 2025-01-18*
*SendGrid User SID: US99183660febc8c770ea8ee728d9079d7*
