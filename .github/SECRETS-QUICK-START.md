# GitHub Secrets - Quick Start Guide

## 🚀 Fastest Way to Add Secrets (Web Interface)

### Step 1: Open Repository Secrets Page

Click this link (or copy to browser):
```
https://github.com/CleanExpo/NodeJS-Starter-V1/settings/secrets/actions
```

### Step 2: Add Required Secrets

Click "New repository secret" for each secret below:

---

## ✅ Required Secrets (Add These First)

### 1. PERCY_TOKEN

**Name**: `PERCY_TOKEN`

**How to get**:
1. Go to https://percy.io/signup
2. Sign up (free tier available)
3. Create new project: "NodeJS-Starter-V1"
4. Go to Project Settings
5. Copy the "PERCY_TOKEN"

**Paste the token value in GitHub**

---

### 2. PACT_BROKER_BASE_URL

**Name**: `PACT_BROKER_BASE_URL`

**How to get**:
1. Go to https://pactflow.io/try-for-free/
2. Sign up (free tier available)
3. Create your organization
4. Your broker URL will be: `https://YOUR-ORG-NAME.pactflow.io`

**Paste the URL in GitHub** (e.g., `https://mycompany.pactflow.io`)

---

### 3. PACT_BROKER_TOKEN

**Name**: `PACT_BROKER_TOKEN`

**How to get**:
1. In Pactflow, go to Settings → API Tokens
2. Click "Create API Token"
3. Name: "GitHub Actions"
4. Scope: "Read/Write"
5. Copy the token

**Paste the token value in GitHub**

---

### 4. CODECOV_TOKEN

**Name**: `CODECOV_TOKEN`

**How to get**:
1. Go to https://codecov.io/signup
2. Sign in with GitHub
3. Add repository: CleanExpo/NodeJS-Starter-V1
4. Copy the upload token from Settings

**Paste the token value in GitHub**

---

## 🔒 Optional Security Secret

### 5. SNYK_TOKEN (Recommended)

**Name**: `SNYK_TOKEN`

**How to get**:
1. Go to https://snyk.io/signup
2. Sign in with GitHub
3. Go to Account Settings → General
4. Copy your "Auth Token"

**Paste the token value in GitHub**

---

## ✅ Verification

After adding all secrets:

1. **Check Secrets List**:
   - Go to https://github.com/CleanExpo/NodeJS-Starter-V1/settings/secrets/actions
   - You should see all 4-5 secrets listed

2. **Test Workflows**:
   - Go to https://github.com/CleanExpo/NodeJS-Starter-V1/actions
   - Click "Advanced Testing" workflow
   - Click "Run workflow" → "Run workflow"
   - Watch it complete successfully ✅

3. **Check Workflow Status**:
   - If it passes: Secrets are configured correctly! 🎉
   - If it fails: Check the logs for which secret is missing

---

## 📋 Secrets Checklist

Copy this checklist to track your progress:

```
Testing Secrets:
[ ] PERCY_TOKEN - Added
[ ] PACT_BROKER_BASE_URL - Added
[ ] PACT_BROKER_TOKEN - Added
[ ] CODECOV_TOKEN - Added

Security Secrets (Optional):
[ ] SNYK_TOKEN - Added

Verification:
[ ] All secrets visible in GitHub settings
[ ] Advanced Testing workflow runs successfully
[ ] Security workflow runs successfully
```

---

## 🆘 Need Help?

**Common Issues**:

1. **"Secret not found" error**:
   - Check spelling is EXACTLY as shown (case-sensitive)
   - Ensure you're adding to "Repository secrets" not "Environment secrets"

2. **"Invalid token" error**:
   - Verify you copied the entire token (no spaces before/after)
   - Try generating a new token
   - Check token hasn't expired

3. **Percy/Pact/Codecov not working**:
   - Ensure you created a project in their dashboard
   - Verify organization/project name matches
   - Check token has correct permissions

**Still stuck?**
- See full documentation: `.github/SECRETS.md`
- Check workflow logs: https://github.com/CleanExpo/NodeJS-Starter-V1/actions

---

## ⏱️ Estimated Time

- **Getting all tokens**: 15-20 minutes
- **Adding to GitHub**: 2-3 minutes
- **Total**: ~20-25 minutes

All services offer free tiers perfect for this project!

---

**Quick Links**:
- Repository Secrets: https://github.com/CleanExpo/NodeJS-Starter-V1/settings/secrets/actions
- GitHub Actions: https://github.com/CleanExpo/NodeJS-Starter-V1/actions
- Full Documentation: `.github/SECRETS.md`
