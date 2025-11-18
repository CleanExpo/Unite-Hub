# Gmail SMTP - Final Resolution Guide

**Date**: 2025-01-18
**Account**: contact@unite-group.in
**Current Status**: ❌ BLOCKED - Application-specific password required
**Error**: `534-5.7.9 Application-specific password required`

---

## 🚨 Current Situation

**What's Happening**:
- Gmail recognizes the account `contact@unite-group.in` ✅
- Gmail detects that 2-Factor Authentication (2FA) is enabled ✅
- Gmail is **rejecting** the current password in `.env.local` ❌
- Error message: "Application-specific password required"

**Current Password in `.env.local`**: `tibveuibgnktasvp`
**Problem**: This is **NOT** a valid Gmail App Password for this account

---

## ✅ Step-by-Step Resolution

### Step 1: Verify 2FA is Enabled

1. Go to: https://myaccount.google.com/security
2. Log in with: `contact@unite-group.in`
3. Look for "2-Step Verification" section
4. **Confirm it shows "On"**

If it shows "Off":
- Click "2-Step Verification"
- Complete the setup wizard
- Choose verification method (phone, authenticator app, etc.)
- **THEN** proceed to Step 2

---

### Step 2: Create a Fresh Gmail App Password

**IMPORTANT**: You need to create a **NEW** App Password specifically for Unite-Hub.

1. **Go to**: https://myaccount.google.com/apppasswords
   - You must be logged in as `contact@unite-group.in`

2. **If you see "App passwords" page**:
   - Good! 2FA is enabled
   - Proceed to step 3

3. **If you DON'T see "App passwords" page**:
   - 2FA is not properly enabled
   - Go back to Step 1

4. **Create the App Password**:
   ```
   Click "Select app" dropdown
   → Choose "Mail" (or "Other (Custom name)")

   If "Other", type: Unite-Hub Email Service

   Click "Select device" dropdown
   → Choose "Other (Custom name)"
   → Type: Unite-Hub Production Server

   Click "Generate"
   ```

5. **You'll see a 16-character password like this**:
   ```
   abcd efgh ijkl mnop
   ```
   **OR**:
   ```
   abcdefghijklmnop
   ```

6. **CRITICAL**:
   - Copy this password **EXACTLY** as shown
   - You will **ONLY see this password ONCE**
   - If you close the window, you'll need to create a new one

---

### Step 3: Update .env.local

**Option A: Password has spaces** (like `abcd efgh ijkl mnop`):

Remove all spaces first:
```
abcd efgh ijkl mnop  →  abcdefghijklmnop
```

**Option B: Password has no spaces** (like `abcdefghijklmnop`):

Use it as-is.

**Update `.env.local` line 49**:
```env
EMAIL_SERVER_PASSWORD=abcdefghijklmnop
```

**Replace `abcdefghijklmnop` with your ACTUAL 16-character password**

---

### Step 4: Verify the Password in File

Run this command to check what's actually in `.env.local`:

```bash
grep "EMAIL_SERVER_PASSWORD" .env.local
```

**Expected Output**:
```
EMAIL_SERVER_PASSWORD=your-16-char-password-here
```

**Make sure**:
- No extra spaces before or after the password
- No quotes around the password (unless you copied them)
- Exactly 16 characters (no spaces in the middle)

---

### Step 5: Test Gmail SMTP

```bash
node scripts/test-email-service.mjs contact@unite-group.in smtp
```

**Expected Success Output**:
```
✅ Email sent successfully!
   Provider: smtp
   Message ID: <some-message-id@gmail.com>
```

**If you see this**, you're done! ✅

**If Still Failing**:
- Go to Step 6 (Troubleshooting)

---

### Step 6: Troubleshooting

#### Issue 1: Still Getting "Application-specific password required"

**Cause**: The password is still not correct

**Fix**:
1. Go back to https://myaccount.google.com/apppasswords
2. **DELETE** the old "Unite-Hub Email Service" password
3. Create a **NEW** App Password
4. Copy the NEW 16-character password
5. Update `.env.local` with the NEW password
6. Test again

---

#### Issue 2: "App passwords" page doesn't exist

**Cause**: 2FA is not enabled or you're using a Google Workspace account

**Fix for Personal Gmail**:
1. Enable 2FA at https://myaccount.google.com/security
2. Wait 5-10 minutes for Google to activate it
3. Try https://myaccount.google.com/apppasswords again

**Fix for Google Workspace**:
If `contact@unite-group.in` is a **Google Workspace** account (not personal Gmail):
1. Go to Google Admin Console: https://admin.google.com
2. Navigate to: Security → Basic settings
3. Enable "Allow users to manage their access to less secure apps"
4. OR switch to using SendGrid instead (recommended)

---

#### Issue 3: Password has weird characters or length

**Valid App Password Format**:
- **Exactly 16 characters** (after removing spaces)
- **Only lowercase letters** (a-z)
- **No numbers, no symbols, no uppercase**
- Example: `abcdefghijklmnop`

**If your password doesn't match this**:
- You copied the wrong thing
- Create a new App Password and copy carefully

---

## 🔄 Alternative: Use SendGrid Instead

If Gmail continues to fail, you can upgrade your SendGrid account:

### SendGrid Status
- ✅ Sender verified: `contact@unite-group.in`
- ✅ API key valid: `SG.Mrm6Y2ZcSP6F1qIiFnGU4g...`
- ❌ Account status: Out of credits

### Upgrade SendGrid

1. **Go to**: https://app.sendgrid.com/account/billing
2. **Choose plan**: Essentials ($19.95/month for 50k emails)
3. **Payment method**: Add credit card
4. **Skip domain verification** (you already have Single Sender verified)
5. **Test immediately**:
   ```bash
   node scripts/test-email-service.mjs contact@unite-group.in sendgrid
   ```

**Benefits**:
- ✅ Professional email service
- ✅ 50,000 emails/month
- ✅ Better deliverability than Gmail
- ✅ Email analytics (opens, clicks, bounces)
- ✅ No daily limits like Gmail (500/day)

---

## 📊 Current .env.local Configuration

```env
# Line 6-7
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"

# Line 48-50
EMAIL_SERVER_USER="contact@unite-group.in"
EMAIL_SERVER_PASSWORD="tibveuibgnktasvp"  # ❌ NOT WORKING
EMAIL_FROM="contact@unite-group.in"

# Line 19
SENDGRID_API_KEY="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"
```

---

## ⚡ Quick Decision Matrix

**Choose ONE path**:

### Path A: Fix Gmail (5-10 minutes)
✅ **If**:
- You can access https://myaccount.google.com/apppasswords
- You see "2-Step Verification: On" at https://myaccount.google.com/security
- You're willing to create a new app password

**Steps**:
1. Create new App Password
2. Copy 16-character code
3. Update `.env.local` line 49
4. Test: `node scripts/test-email-service.mjs contact@unite-group.in smtp`

**Cost**: Free (Gmail allows 500 emails/day)

---

### Path B: Upgrade SendGrid (10-15 minutes)
✅ **If**:
- Gmail App Passwords are too complex
- You want professional email service
- You need more than 500 emails/day
- You want email analytics

**Steps**:
1. Go to https://app.sendgrid.com/account/billing
2. Upgrade to Essentials plan ($19.95/month)
3. Test: `node scripts/test-email-service.mjs contact@unite-group.in sendgrid`

**Cost**: $19.95/month (50,000 emails)

---

## 🎯 Recommended Action

**For Production**: Use SendGrid (Path B)
- More reliable for business use
- Better deliverability
- Email analytics
- No daily limits

**For Testing/Development**: Fix Gmail (Path A)
- Free
- Good enough for low volume
- Quick to set up

---

## 📝 What to Provide

If you're continuing with Gmail SMTP, please provide:

1. **Screenshot or confirmation** that you see "2-Step Verification: On"
2. **The NEW 16-character App Password** you just created (like `abcd efgh ijkl mnop`)
3. **Confirmation** you created it at https://myaccount.google.com/apppasswords

**Example of what to share**:
```
New App Password: abcd efgh ijkl mnop
Created for: Unite-Hub Email Service
Date created: 2025-01-18
```

---

## ✅ Success Criteria

You'll know it's working when:

```bash
node scripts/test-email-service.mjs contact@unite-group.in smtp
```

**Shows**:
```
✅ Email sent successfully!
   Provider: smtp
   Message ID: <long-message-id@gmail.com>
   Fallback used: false
```

**AND**:
- You receive the test email in `contact@unite-group.in` inbox
- Email has Unite-Hub branding
- All template variables are replaced correctly

---

**Status**: ⏳ **AWAITING VALID APP PASSWORD**

**Blocking**: Need NEW 16-character Gmail App Password OR SendGrid account upgrade

**Test Command**: `node scripts/test-email-service.mjs contact@unite-group.in`

---

*Last Updated: 2025-01-18*
*Current Password Tested*: `tibveuibgnktasvp` ❌ REJECTED
*Error*: `534-5.7.9 Application-specific password required`
