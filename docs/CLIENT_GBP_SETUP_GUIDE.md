# How to Connect Your Google Business Profile to Unite-Hub
## Client Self-Service Setup Guide

**Estimated Time**: 5 minutes
**Cost**: Free (no credit card required)
**Technical Level**: Beginner-friendly

---

## 📋 What You'll Need

- ✅ A **verified Google Business Profile**
- ✅ **Owner** or **Manager** access to the profile
- ✅ A Google Account (the one you use for GBP)
- ✅ 5 minutes of your time

**Don't have a Google Business Profile yet?**
[Create one here](https://business.google.com/create) (takes 10-15 minutes)

---

## 🔒 Security & Privacy First

### Your Data, Your Control

When you connect your Google Business Profile to Unite-Hub:

✅ **You create your OWN Google Cloud Project** (not shared with other clients)
✅ **Your credentials are encrypted** and stored securely
✅ **You can revoke access anytime** from Google Console
✅ **Your API quota is separate** (no platform limits)
✅ **Unite-Hub never sees your Google password**

### What Unite-Hub Can Access (With Your Permission)

- ✅ View and update your business information (name, address, phone, hours)
- ✅ Create posts on your Google Business Profile
- ✅ View insights (profile views, direction requests, phone calls)
- ✅ Read reviews (to help you respond with AI suggestions)

### What Unite-Hub CANNOT Access

- ❌ Your Gmail or other Google services
- ❌ Delete your Google Business Profile
- ❌ Transfer profile ownership
- ❌ Access any data outside your GBP

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project (2 minutes)

**Why?** This is YOUR personal Google Cloud Project. You own it, control it, and can delete it anytime.

1. **Open Google Cloud Console**:
   👉 [Click here to create a project](https://console.cloud.google.com/projectcreate)

2. **Sign in** with the Google Account that manages your GBP

3. **Enter project details**:
   - **Project name**: `unite-hub-gbp` (or any name you like)
   - **Organization**: Leave as "No organization" (unless you have a Google Workspace)
   - Click **"Create"**

4. **Wait 10-15 seconds** for the project to be created

**💡 Pro Tip**: Keep this browser tab open - you'll need it for the next steps!

---

### Step 2: Enable Required APIs (1 minute)

**Why?** These APIs allow Unite-Hub to connect to your Google Business Profile.

#### Enable API #1: Google My Business API

1. **Open the API library page**:
   👉 [Enable My Business API](https://console.cloud.google.com/apis/library/mybusiness.googleapis.com)

2. **Select your project** from the dropdown at the top (if not already selected)

3. Click the blue **"Enable"** button

4. Wait for the green checkmark (5-10 seconds)

#### Enable API #2: Google My Business Business Information API

1. **Open the API library page**:
   👉 [Enable Business Information API](https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com)

2. **Select your project** from the dropdown

3. Click **"Enable"**

4. Wait for confirmation

**✅ Both APIs enabled!** You should see "API enabled" with a green checkmark.

---

### Step 3: Configure OAuth Consent Screen (1 minute)

**Why?** This tells Google what permissions Unite-Hub needs and shows you a consent screen when connecting.

1. **Open OAuth Consent Screen**:
   👉 [Configure Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

2. **Select user type**: Click **"External"**

3. Click **"Create"**

4. **Fill in the form**:
   - **App name**: `Unite-Hub GBP Integration`
   - **User support email**: Select your email from dropdown
   - **Developer contact information**: Enter your email

5. Click **"Save and Continue"**

6. **On the "Scopes" page**: Click **"Save and Continue"** (skip this step)

7. **On the "Test users" page**: Click **"Save and Continue"** (skip this step)

8. **On the "Summary" page**: Click **"Back to Dashboard"**

**✅ Consent screen configured!**

---

### Step 4: Create OAuth Credentials (1 minute)

**Why?** These credentials (Client ID and Secret) allow Unite-Hub to securely connect to YOUR Google account.

1. **Open Credentials page**:
   👉 [Create Credentials](https://console.cloud.google.com/apis/credentials)

2. Click **"+ CREATE CREDENTIALS"** → Select **"OAuth client ID"**

3. **Configure the OAuth client**:
   - **Application type**: Select **"Web application"**
   - **Name**: `Unite-Hub GBP` (or any name)

4. **Add Authorized redirect URI**:
   - Click **"+ Add URI"** under "Authorized redirect URIs"
   - Paste this exact URL:
     ```
     https://unite-hub.com/api/integrations/gbp/callback
     ```
   - ⚠️ **Important**: Copy it exactly (including `/callback` at the end)

5. Click **"Create"**

6. **A popup appears with your credentials**:
   - **Client ID**: Looks like `123456789-abc123xyz.apps.googleusercontent.com`
   - **Client secret**: Looks like `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

7. **Click "Download JSON"** (saves credentials.json to your computer)
   - OR copy both values to a text file temporarily

**🚨 Important**: Don't close this popup yet! You'll need these values in the next step.

---

### Step 5: Connect in Unite-Hub (<1 minute)

**Now the easy part!** Head back to Unite-Hub.

1. **Log in to Unite-Hub**:
   👉 Go to your [Unite-Hub Dashboard](https://unite-hub.com/dashboard)

2. **Navigate to Google Business Profile**:
   - Click **"Integrations"** in the sidebar
   - Click **"Google Business Profile"**

3. **Click "Connect Google Business Profile"**

4. **Follow the setup wizard**:
   - Step 1: Introduction (click "Next")
   - Step 2: You've already created your project! ✅ (click "Next")
   - Step 3: Paste your credentials:
     - **Client ID**: Paste from Step 4
     - **Client Secret**: Paste from Step 4
   - Click **"Connect & Authorize"**

5. **Google Authorization Screen**:
   - You'll be redirected to Google
   - Review the permissions Unite-Hub is requesting
   - Click **"Allow"**

6. **Success!**
   - You'll be redirected back to Unite-Hub
   - Your Google Business Profile locations will be displayed

**🎉 You're connected!** Unite-Hub can now help you manage your Google Business Profile.

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] You see your GBP location(s) in Unite-Hub dashboard
- [ ] NAP Consistency shows ✅ Green checkmark
- [ ] Profile completion percentage is displayed
- [ ] You can see recent insights (profile views, etc.)

If any of these are missing, see [Troubleshooting](#troubleshooting) below.

---

## 🔧 Troubleshooting

### Issue 1: "Invalid Client ID" Error

**Symptoms**: Error message when pasting Client ID

**Causes**:
- Typo in Client ID (missing characters)
- Wrong project selected

**Fix**:
1. Go back to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth Client ID name
3. Copy the Client ID again (use the copy button icon)
4. Paste into Unite-Hub

---

### Issue 2: "Redirect URI Mismatch" Error

**Symptoms**: Google shows "redirect_uri_mismatch" error after clicking "Allow"

**Causes**:
- Redirect URI not configured correctly in Step 4

**Fix**:
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth Client ID
3. Under "Authorized redirect URIs", verify you have EXACTLY:
   ```
   https://unite-hub.com/api/integrations/gbp/callback
   ```
4. If it's different, edit and click "Save"
5. Try connecting again in Unite-Hub

---

### Issue 3: "Access Denied" Error

**Symptoms**: Google says you don't have permission

**Causes**:
- You're not logged into the correct Google Account
- Your account doesn't have Owner/Manager role on GBP

**Fix**:
1. Log out of all Google accounts
2. Log in with the account that owns your GBP
3. Try connecting again
4. OR: Add your current Google Account as a Manager on your GBP

---

### Issue 4: "API Not Enabled" Error

**Symptoms**: Error says "Google My Business API has not been used in project..."

**Causes**:
- You skipped Step 2 (enabling APIs)
- APIs were enabled in a different project

**Fix**:
1. Verify your project name in Google Cloud Console (top of page)
2. Go to [APIs & Services](https://console.cloud.google.com/apis/dashboard)
3. Click **"+ ENABLE APIS AND SERVICES"**
4. Search for "My Business API"
5. Enable both APIs from Step 2
6. Try connecting again

---

### Issue 5: No Locations Found

**Symptoms**: Connection succeeds but "No locations found"

**Causes**:
- GBP not verified yet
- Account doesn't have Manager role

**Fix**:
1. Go to [Google Business Profile Manager](https://business.google.com/)
2. Verify you see your business location
3. Check that it's verified (has a green checkmark)
4. If not verified, complete verification process
5. Try connecting again in Unite-Hub

---

## 🔄 Managing Your Connection

### Viewing Connection Status

1. Go to **Dashboard → Google Business Profile**
2. You'll see:
   - Connection status (✅ Connected or ❌ Disconnected)
   - Last sync time
   - Number of locations connected
   - NAP consistency score

### Refreshing Data

Unite-Hub automatically syncs your GBP data:
- **Every 24 hours** (automatic background sync)
- **When you click "Sync Now"** (manual refresh)

To manually refresh:
1. Go to **Dashboard → Google Business Profile**
2. Click **"Sync Now"** button
3. Wait 5-10 seconds for sync to complete

### Disconnecting

If you want to disconnect your GBP:

**Option 1: From Unite-Hub**
1. Go to **Dashboard → Google Business Profile**
2. Click **"Settings"** (gear icon)
3. Click **"Disconnect Google Business Profile"**
4. Confirm disconnection

**Option 2: From Google Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services → Credentials**
4. Click the trash icon next to your OAuth Client ID
5. Confirm deletion

**Option 3: Revoke App Permission**
1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "Unite-Hub GBP Integration"
3. Click **"Remove Access"**

---

## 🛡️ Security Best Practices

### Keep Your Credentials Secure

🔒 **DO**:
- ✅ Store your credentials.json file in a secure location (password manager, encrypted folder)
- ✅ Use a strong password for your Google Account
- ✅ Enable 2-factor authentication on your Google Account
- ✅ Regularly review connected apps at [Google Permissions](https://myaccount.google.com/permissions)

🚫 **DON'T**:
- ❌ Share your Client Secret with anyone (not even Unite-Hub support)
- ❌ Post your credentials in public forums or chat
- ❌ Email your credentials to anyone
- ❌ Use the same Client Secret for multiple applications

### Monitoring Access

**Check who has access to your Google Cloud Project**:
1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Review the list of members
3. Remove anyone who shouldn't have access

**Check recent activity**:
1. Go to [Activity Log](https://console.cloud.google.com/logs)
2. Filter by "OAuth Client ID"
3. Review recent authorization attempts

---

## 💡 What Happens Next?

After connecting your GBP, Unite-Hub will:

1. **Sync your business information**:
   - Name, address, phone number
   - Business hours
   - Categories and services
   - Photos and media

2. **Run NAP consistency check**:
   - Compare CRM data vs GBP data
   - Highlight any discrepancies
   - Offer one-click fixes

3. **Generate Schema.org markup**:
   - Auto-create LocalBusiness schema
   - Sync to your website
   - Improve local SEO

4. **Enable automation features**:
   - Auto-post when you publish blog content
   - AI-suggested review responses
   - Weekly performance reports

---

## 📊 Features You Can Use

### 1. Auto-Sync

Keep your GBP profile updated automatically:
- Changes in CRM → Auto-update GBP
- Changes in GBP → Alert you to review
- One-click conflict resolution

### 2. Post Automation

Publish to GBP without manual work:
- Blog posts → Auto-create GBP post
- New features → Announcement post
- Promotions → Offer post with expiry date

### 3. Review Management

Never miss a review:
- Email alerts for new reviews
- AI-suggested responses
- Track response rate and sentiment

### 4. Insights Dashboard

Track your local search performance:
- Profile views (trend over time)
- Direction requests
- Phone calls from GBP
- Photo views
- Search queries

### 5. NAP Consistency

Ensure your business info is consistent:
- CRM vs GBP vs Website vs Schema.org
- Automatic discrepancy detection
- One-click fixes

---

## ❓ Frequently Asked Questions

### Q: Does this cost money?

**A**: No! Creating a Google Cloud Project and using the Google Business Profile API is completely free. You don't need to add a credit card.

### Q: Can I disconnect anytime?

**A**: Yes! You can disconnect from Unite-Hub dashboard or delete your OAuth credentials in Google Cloud Console anytime.

### Q: What happens if I delete my Google Cloud Project?

**A**: Unite-Hub will lose access to your GBP. You'll see a "Connection expired" error in the dashboard. You can reconnect by creating a new project and following this guide again.

### Q: Can I use the same credentials for multiple Unite-Hub accounts?

**A**: No. Each Unite-Hub organization should have its own Google Cloud Project and credentials for security and quota isolation.

### Q: Will Unite-Hub post to my GBP without my approval?

**A**: No (by default). All auto-posting features are opt-in. You control which triggers (blog publish, feature launch) create GBP posts. You can review drafts before they go live.

### Q: What if I have multiple GBP locations?

**A**: Great! Unite-Hub will detect all locations your Google Account manages. You can choose which ones to sync and manage them all from one dashboard.

### Q: Can I revoke access temporarily and reconnect later?

**A**: Yes! Disconnect from Unite-Hub (Option 1 above) to revoke access. When you're ready to reconnect, you can use the same Client ID and Secret (no need to recreate them).

### Q: Is my data shared with other Unite-Hub clients?

**A**: No. Your GBP data is isolated to your organization. Unite-Hub uses Row Level Security to ensure org isolation.

### Q: What happens to my credentials if I cancel Unite-Hub subscription?

**A**: You should disconnect GBP before canceling (to revoke access). Your credentials remain in your Google Cloud Project (which you own), so you can delete them yourself or keep them for future use.

---

## 📞 Need Help?

### Contact Support

- **Email**: support@unite-hub.com
- **Live Chat**: Click the chat icon in Unite-Hub dashboard (bottom right)
- **Documentation**: https://unite-hub.com/docs/gbp
- **Video Tutorial**: https://unite-hub.com/tutorials/gbp-setup

### Community

- **Forum**: https://community.unite-hub.com/
- **Facebook Group**: https://facebook.com/groups/unitehub
- **Discord**: https://discord.gg/unitehub

---

## 📚 Additional Resources

- [Google Business Profile Help Center](https://support.google.com/business/)
- [Google Cloud Console Quickstart](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
- [OAuth 2.0 Explained](https://developers.google.com/identity/protocols/oauth2)
- [Unite-Hub API Documentation](https://unite-hub.com/docs/api)

---

**Congratulations!** 🎉 You've successfully connected your Google Business Profile to Unite-Hub. Enjoy automated GBP management and improved local SEO!

---

**Last Updated**: 2025-01-17
**Version**: 2.0.0 (Client Self-Service Model)
