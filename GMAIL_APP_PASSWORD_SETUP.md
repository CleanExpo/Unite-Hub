# Gmail App Password Setup - Troubleshooting Guide

**Date**: 2025-01-18
**Account**: contact@unite-group.in
**Current Password**: `pvhgsopuarutbyhn` (16 characters)
**Status**: ❌ AUTHENTICATION FAILING

---

## 🚨 Current Issue

**Error**: "535-5.7.8 Username and Password not accepted"

**What This Means**:
Even though you've entered an App Password (`pvhgsopuarutbyhn`), Gmail is rejecting it. This indicates:

1. The App Password might be incorrect or expired
2. 2-Factor Authentication might not be enabled on the account
3. The App Password might have been revoked
4. There might be a typo in the password

---

## ✅ Step-by-Step Gmail App Password Setup

### Step 1: Verify 2-Factor Authentication is Enabled

**Why**: App Passwords ONLY work if 2FA is enabled on the Google account.

1. Go to: https://myaccount.google.com/security
2. Log in with: `contact@unite-group.in`
3. Look for "2-Step Verification" section
4. Check status:
   - ✅ **"On"** - You can create App Passwords
   - ❌ **"Off"** - You MUST enable 2FA first

**If 2FA is OFF**, click "2-Step Verification" and follow the setup wizard:
- Choose verification method (phone, authenticator app, etc.)
- Complete setup
- Then proceed to Step 2

---

### Step 2: Create a New App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You should see "App passwords" page
3. **If you DON'T see this page**, it means:
   - 2FA is not enabled (go back to Step 1)
   - OR you're using a Google Workspace account (different process)

4. Click "Select app" dropdown
5. Choose "Mail" (or "Other (Custom name)")
6. If choosing "Other", type: `Unite-Hub Email Service`
7. Click "Select device" dropdown
8. Choose "Other (Custom name)"
9. Type: `Unite-Hub Server`
10. Click "Generate"

**Result**: You'll see a 16-character password like:
```
abcd efgh ijkl mnop
```

**IMPORTANT**:
- Copy this password EXACTLY as shown
- Include or exclude spaces as needed for your system
- You will ONLY see this password ONCE

---

### Step 3: Update .env.local

**Option A: With Spaces** (some systems handle this):
```env
EMAIL_SERVER_PASSWORD="abcd efgh ijkl mnop"
```

**Option B: Without Spaces** (recommended):
```env
EMAIL_SERVER_PASSWORD="abcdefghijklmnop"
```

**Save the file** and ensure no extra characters are added.

---

### Step 4: Verify the Password

Check what's actually in `.env.local`:

```bash
grep "EMAIL_SERVER_PASSWORD" .env.local
```

**Expected Output**:
```
EMAIL_SERVER_PASSWORD=abcdefghijklmnop
```

**OR** (with quotes):
```
EMAIL_SERVER_PASSWORD="abcdefghijklmnop"
```

---

### Step 5: Test

```bash
node scripts/test-email-service.mjs contact@unite-group.in smtp
```

**Expected Success Output**:
```
✅ Email sent successfully!
   Provider: smtp
   Message ID: <some-message-id>
```

**If Still Failing**, proceed to Step 6.

---

### Step 6: Verify App Password is Active

1. Go back to: https://myaccount.google.com/apppasswords
2. You should see a list of App Passwords you've created
3. Look for "Unite-Hub Email Service" or the name you used
4. Check if it's listed
5. If NOT listed, the password was revoked or expired
6. Create a NEW App Password (repeat Step 2)

---

## 🔍 Troubleshooting Common Issues

### Issue 1: "App passwords" page doesn't show up

**Cause**: 2FA not enabled

**Fix**:
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. After setup completes, try https://myaccount.google.com/apppasswords again

---

### Issue 2: "Invalid login" even with correct App Password

**Possible Causes**:
1. Extra spaces in the password
2. Wrong account (check EMAIL_SERVER_USER=contact@unite-group.in)
3. App Password was revoked
4. Google Workspace account (different setup)

**Fix**:
1. **Check for spaces**:
   ```bash
   grep "EMAIL_SERVER_PASSWORD" .env.local
   ```
   Ensure no extra spaces before or after the password

2. **Check the email address**:
   ```bash
   grep "EMAIL_SERVER_USER" .env.local
   ```
   Must be: `EMAIL_SERVER_USER=contact@unite-group.in`

3. **Create a fresh App Password**:
   - Revoke the old one at https://myaccount.google.com/apppasswords
   - Create a new one
   - Update `.env.local`

---

### Issue 3: Google Workspace Account

If `contact@unite-group.in` is a **Google Workspace** (G Suite) account:

1. Go to Google Admin Console: https://admin.google.com
2. Navigate to: Security → Basic settings
3. Enable "Allow users to manage their access to less secure apps"
4. OR use OAuth 2.0 instead of App Passwords (more complex)

**For now**: Try using SendGrid instead if this is a Workspace account.

---

## 🎯 Recommended Action

### If 2FA is NOT Enabled:

1. Enable 2FA at: https://myaccount.google.com/security
2. Create App Password at: https://myaccount.google.com/apppasswords
3. Update `.env.local` with the 16-character password (no spaces)
4. Test: `node scripts/test-email-service.mjs contact@unite-group.in smtp`

### If 2FA IS Enabled:

1. Go to: https://myaccount.google.com/apppasswords
2. Revoke existing "Unite-Hub" App Password (if exists)
3. Create a NEW App Password
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
5. Remove all spaces: `abcdefghijklmnop`
6. Update `.env.local`:
   ```env
   EMAIL_SERVER_PASSWORD=abcdefghijklmnop
   ```
7. Save file
8. Test: `node scripts/test-email-service.mjs contact@unite-group.in smtp`

---

## ⚡ Quick Test (Bypass .env.local)

Test with a fresh App Password without editing files:

```bash
# Replace YOUR_APP_PASSWORD with the actual 16-character password (no spaces)
EMAIL_SERVER_PASSWORD=YOUR_APP_PASSWORD node scripts/test-email-service.mjs contact@unite-group.in smtp
```

**Example**:
```bash
EMAIL_SERVER_PASSWORD=abcdefghijklmnop node scripts/test-email-service.mjs contact@unite-group.in smtp
```

**If This Works**: The issue is with how the password is stored in `.env.local`
**If This Fails**: The App Password itself is wrong or 2FA is not enabled

---

## 🔄 Alternative: Use SendGrid Instead

If Gmail App Passwords are too complex, use SendGrid:

### Current SendGrid Status

You already have a SendGrid API key configured:
```env
SENDGRID_API_KEY="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"
```

But it's showing "Permission denied, wrong credentials" error.

### Fix SendGrid

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Check if `SG.Iqb5xNUgTsqXJTuh4aJi9Q...` is active
3. If not active or revoked:
   - Click "Create API Key"
   - Name: "Unite-Hub Production"
   - Permissions: "Full Access"
   - Click "Create & View"
   - Copy the new key
4. Update `.env.local`:
   ```env
   SENDGRID_API_KEY="SG.your-new-api-key-here"
   ```
5. Verify sender:
   - Go to: https://app.sendgrid.com/settings/sender_auth/senders
   - Add `contact@unite-group.in`
   - Check email and verify
6. Test:
   ```bash
   node scripts/test-email-service.mjs contact@unite-group.in sendgrid
   ```

---

## 📊 Current .env.local Configuration

**Email Settings** (from your file):
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=pvhgsopuarutbyhn  # <-- This is being rejected
EMAIL_FROM=contact@unite-group.in
```

**SendGrid**:
```env
SENDGRID_API_KEY=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  # <-- This is being rejected too
```

**Both providers are failing authentication** - you need to update at least ONE of them.

---

## ✅ Next Steps

**Choose ONE**:

### Option A: Fix Gmail (Recommended for Free Tier)

1. Verify 2FA is enabled: https://myaccount.google.com/security
2. Create new App Password: https://myaccount.google.com/apppasswords
3. Copy password (remove spaces)
4. Update `.env.local` line 49: `EMAIL_SERVER_PASSWORD=your-new-password-here`
5. Test: `node scripts/test-email-service.mjs contact@unite-group.in smtp`

### Option B: Fix SendGrid (Recommended for Production)

1. Create new API key: https://app.sendgrid.com/settings/api_keys
2. Copy key (starts with "SG.")
3. Update `.env.local` line 19: `SENDGRID_API_KEY="SG.your-new-key"`
4. Verify sender: https://app.sendgrid.com/settings/sender_auth/senders
5. Test: `node scripts/test-email-service.mjs contact@unite-group.in sendgrid`

---

**Status**: ⏳ **AWAITING VALID CREDENTIALS**

**Blocking**: Either Gmail App Password OR SendGrid API Key needs to be updated

**Test Command**: `node scripts/test-email-service.mjs contact@unite-group.in`

---

*Last Updated: 2025-01-18*
*Current Password Tested*: `pvhgsopuarutbyhn` ❌ REJECTED
*SendGrid Key Tested*: `SG.Iqb5xNUgTsqXJTuh4aJi9Q...` ❌ REJECTED
