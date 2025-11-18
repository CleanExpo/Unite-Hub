# SendGrid DNS Setup - Domain Authentication

**Date**: 2025-01-18
**Domain**: httpsunite-hub.vercel.app (⚠️ INCORRECT FORMAT)
**Status**: ⚠️ NEEDS CORRECTION

---

## 🚨 Critical Issue Detected

Your DNS records show:
```
httpsunite-hub.vercel.app
```

**Problem**: The "https" prefix should NOT be in the domain name. Domains don't include the protocol.

**Correct Format**:
```
unite-hub.vercel.app
```

OR if you have a custom domain:
```
unite-group.in
```

---

## 📋 Current DNS Records (From Your Setup)

```
TYPE:   Host:                                        Value:
CNAME   url9135.httpsunite-hub.vercel.app            sendgrid.net
CNAME   49942585.httpsunite-hub.vercel.app           sendgrid.net
CNAME   m4414.httpsunite-hub.vercel.app              u49942585.wl086.sendgrid.net
CNAME   s1._domainkey.httpsunite-hub.vercel.app      s1.domainkey.u49942585.wl086.sendgrid.net
CNAME   s2._domainkey.httpsunite-hub.vercel.app      s2.domainkey.u49942585.wl086.sendgrid.net
TXT     _dmarc.httpsunite-hub.vercel.app             v=DMARC1; p=none;
```

---

## ✅ What Should Be Done

### Option 1: Fix SendGrid Domain (Recommended)

**If you want to use Vercel domain** (`unite-hub.vercel.app`):

1. Go to SendGrid Dashboard: https://app.sendgrid.com/settings/sender_auth/domain/create
2. **Delete the current domain authentication** for `httpsunite-hub.vercel.app`
3. **Create NEW domain authentication** with:
   ```
   Domain: unite-hub.vercel.app
   ```
   (No "https", no "www", just the domain)

4. SendGrid will give you DNS records like:
   ```
   TYPE:   Host:                                  Value:
   CNAME   url9135.unite-hub.vercel.app           sendgrid.net
   CNAME   49942585.unite-hub.vercel.app          sendgrid.net
   CNAME   m4414.unite-hub.vercel.app             u49942585.wl086.sendgrid.net
   CNAME   s1._domainkey.unite-hub.vercel.app     s1.domainkey.u49942585.wl086.sendgrid.net
   CNAME   s2._domainkey.unite-hub.vercel.app     s2.domainkey.u49942585.wl086.sendgrid.net
   TXT     _dmarc.unite-hub.vercel.app            v=DMARC1; p=none;
   ```

5. **Add these to your DNS provider** (Vercel, Cloudflare, etc.)

---

### Option 2: Use Custom Domain (Better for Production)

**If you have `unite-group.in`**:

1. Go to SendGrid: https://app.sendgrid.com/settings/sender_auth/domain/create
2. Enter your custom domain:
   ```
   Domain: unite-group.in
   ```
3. SendGrid will give you DNS records like:
   ```
   TYPE:   Host:                            Value:
   CNAME   url9135.unite-group.in           sendgrid.net
   CNAME   49942585.unite-group.in          sendgrid.net
   CNAME   m4414.unite-group.in             u49942585.wl086.sendgrid.net
   CNAME   s1._domainkey.unite-group.in     s1.domainkey.u49942585.wl086.sendgrid.net
   CNAME   s2._domainkey.unite-group.in     s2.domainkey.u49942585.wl086.sendgrid.net
   TXT     _dmarc.unite-group.in            v=DMARC1; p=none;
   ```

4. **Add these to your domain registrar** (GoDaddy, Namecheap, etc.)

---

## 🎯 Recommended Approach

### For Now (Quick Fix): Use Single Sender Verification

Instead of domain authentication, use **Single Sender Verification** which is faster:

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Create New Sender"
3. Fill in:
   ```
   From Name: Unite-Hub
   From Email Address: contact@unite-group.in
   Reply To: contact@unite-group.in
   Company Address: [Your address]
   City: [Your city]
   Country: [Your country]
   ```
4. Click "Create"
5. **Check email inbox** for `contact@unite-group.in`
6. Click the verification link in the email
7. Return to SendGrid dashboard
8. Verify status shows ✅ "Verified"

**Then test**:
```bash
node scripts/test-email-service.mjs contact@unite-group.in sendgrid
```

**Benefits**:
- ✅ Takes 5 minutes (vs 1-24 hours for DNS)
- ✅ No DNS changes needed
- ✅ Good enough for development/testing
- ❌ Less professional (emails come from sendgrid.net domain)

---

### For Production (Later): Fix Domain Authentication

After Single Sender Verification works:

1. **Decide on domain**:
   - Use `unite-hub.vercel.app` (Vercel subdomain)
   - OR `unite-group.in` (custom domain - recommended)

2. **Set up domain authentication** (correct domain this time)

3. **Add DNS records** to your DNS provider

4. **Wait for DNS propagation** (5 minutes to 24 hours)

5. **Verify in SendGrid dashboard**

---

## 🔍 Where to Add DNS Records

### If Using `unite-hub.vercel.app`:

**DNS Provider**: Vercel

1. Go to: https://vercel.com/your-team/unite-hub/settings/domains
2. Click on `unite-hub.vercel.app`
3. Add the CNAME records SendGrid provided
4. Wait 5-10 minutes for propagation

---

### If Using `unite-group.in`:

**DNS Provider**: Your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)

1. Log into your domain registrar
2. Go to DNS Management / DNS Records
3. Add each CNAME record:
   ```
   Type: CNAME
   Host: url9135
   Value: sendgrid.net
   TTL: 3600

   Type: CNAME
   Host: 49942585
   Value: sendgrid.net
   TTL: 3600

   ... (add all 6 records)
   ```
4. Save changes
5. Wait 5-60 minutes for propagation

---

## ⚡ Quick Action Plan

**Right Now** (5 minutes):

1. **Use Single Sender Verification** (fastest):
   - Go to: https://app.sendgrid.com/settings/sender_auth/senders
   - Add `contact@unite-group.in`
   - Verify email
   - Test: `node scripts/test-email-service.mjs contact@unite-group.in sendgrid`

**This Week** (if you want proper domain authentication):

2. **Delete wrong domain** (`httpsunite-hub.vercel.app`)
3. **Create new domain authentication** for `unite-group.in` OR `unite-hub.vercel.app`
4. **Add DNS records** to your DNS provider
5. **Verify in SendGrid** (click "Verify" button)
6. **Test again**

---

## 🔧 Testing Current Setup

Even with the wrong domain name in DNS, let's test if SendGrid works with Single Sender Verification:

### Step 1: Verify Sender Email

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Check if `contact@unite-group.in` is verified
3. If NOT verified:
   - Click "Create New Sender"
   - Add `contact@unite-group.in`
   - Check email and click verification link

### Step 2: Test SendGrid

```bash
node scripts/test-email-service.mjs contact@unite-group.in sendgrid
```

**Expected Result** (if sender is verified):
```
✅ Email sent successfully!
   Provider: sendgrid
   Message ID: <message-id>
```

**If Still Failing**:
- Check if API key is valid: https://app.sendgrid.com/settings/api_keys
- Create new API key if needed
- Update `.env.local` line 19

---

## 📊 Current SendGrid Configuration

**From .env.local**:
```env
SENDGRID_API_KEY="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"
```

**Status**: ❌ Getting "Permission denied, wrong credentials" error

**Possible Issues**:
1. API key revoked
2. API key has wrong permissions
3. SendGrid account has issues

**Fix**:
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Check if key `SG.Iqb5xNUgTsqXJTuh4aJi9Q...` is active
3. If not, create new key:
   - Name: "Unite-Hub Production"
   - Permissions: "Full Access"
4. Copy new key
5. Update `.env.local`:
   ```env
   SENDGRID_API_KEY="SG.your-new-api-key-here"
   ```

---

## ✅ Recommended Next Steps

**Option A: Quick Fix (5 minutes)**

1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Verify `contact@unite-group.in` as a single sender
3. Check if API key is valid at https://app.sendgrid.com/settings/api_keys
4. Create new API key if needed
5. Update `.env.local` with new key
6. Test: `node scripts/test-email-service.mjs contact@unite-group.in sendgrid`

**Option B: Proper Setup (1 hour)**

1. Delete domain auth for `httpsunite-hub.vercel.app`
2. Create domain auth for `unite-group.in`
3. Add DNS records to your domain registrar
4. Wait for propagation (5-60 minutes)
5. Verify in SendGrid dashboard
6. Test emails

---

**Status**: ⚠️ **DNS DOMAIN INCORRECT**

**Issue**: Domain has "https" prefix which is wrong for DNS

**Quick Fix**: Use Single Sender Verification instead

**Proper Fix**: Re-create domain authentication with correct domain name

---

*Last Updated: 2025-01-18*
*Current DNS Domain*: `httpsunite-hub.vercel.app` ❌ WRONG FORMAT
*Should Be*: `unite-hub.vercel.app` OR `unite-group.in`
