# 🔒 Security Checklist - Unite-Hub

## Pre-Deployment Security Verification

Run this checklist **before every push to GitHub or deployment**:

---

## ✅ Environment Variables

- [ ] `.env.local` exists locally with real values
- [ ] `.env.local` is listed in `.gitignore`
- [ ] `.env.production` is listed in `.gitignore`
- [ ] `.env.example` exists with placeholder values only
- [ ] No API keys in `.env.example`

### Verify with:
```bash
# Check gitignore contains env files
cat .gitignore | grep -E "\.env"

# Verify no env files in git
git status --short | grep -E "^(A|\?\?) \.env" | grep -v "\.env\.example"
# Should return nothing or only .env.example files
```

---

## ✅ No Hardcoded Secrets

- [ ] No API keys hardcoded in source files
- [ ] No database credentials in code
- [ ] No OAuth secrets in code
- [ ] All secrets use `process.env.VARIABLE_NAME`

### Scan for secrets:
```bash
# Search for common secret patterns in src/
grep -r "sk-ant-api03-\|sk_test_\|sk_live_\|GOCSPX-\|whsec_" src/
# Should return: No files found

# Search for hardcoded URLs with credentials
grep -r "postgresql://.*:.*@\|mongodb://.*:.*@" src/
# Should return: No files found
```

---

## ✅ Sensitive Files Not Tracked

Files that should **NEVER** be in git:

- [ ] `.env`
- [ ] `.env.local`
- [ ] `.env.production`
- [ ] `.env.development`
- [ ] `.env.test`
- [ ] `node_modules/`
- [ ] `.next/`
- [ ] Any files with actual API keys

### Verify:
```bash
# Check what will be committed
git add --dry-run . 2>&1 | grep -E "\.env" | grep -v "\.env\.example"
# Should return: nothing or only .env.example files
```

---

## ✅ Git Configuration

- [ ] Git repository initialized
- [ ] `.gitignore` properly configured
- [ ] No sensitive files in git history
- [ ] Remote repository set up

### Verify:
```bash
# Check git is initialized
git status

# Verify gitignore is working
git check-ignore -v .env.local
# Should show: .gitignore:XX:.env.local    .env.local
```

---

## ✅ Code Security

- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all forms
- [ ] CSRF protection enabled (NextAuth)
- [ ] Rate limiting on API routes (if applicable)
- [ ] Webhook signature verification enabled

### Security Patterns Used:

**Stripe Webhooks** (src/app/api/stripe/webhook/route.ts:29)
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```
✅ Verified: Signature verification implemented

**Database Queries**
- Using Supabase/PostgreSQL with parameterized queries
- No string concatenation in queries

**Gmail Integration** (src/lib/integrations/gmail.ts)
- OAuth 2.0 flow implemented
- Tokens refreshed automatically
- No credentials stored in code

---

## ✅ Third-Party API Keys Security

### Required for Development:
- [ ] Stripe Test Keys (`sk_test_...`)
- [ ] Supabase Development Project
- [ ] Google OAuth Test Credentials
- [ ] Anthropic API Key

### Required for Production:
- [ ] Stripe Live Keys (`sk_live_...`)
- [ ] Supabase Production Project
- [ ] Google OAuth Production Credentials
- [ ] New Anthropic API Key (separate from dev)

**Important**: Never use production keys in development or test keys in production

---

## ✅ Deployment Secrets

When deploying to Vercel:

- [ ] All environment variables configured
- [ ] Secrets generated fresh for production:
  - `NEXTAUTH_SECRET` (new, not from dev)
  - `JWT_SECRET` (new, not from dev)
  - `STRIPE_WEBHOOK_SECRET` (from production webhook)
- [ ] Production URLs updated:
  - `NEXTAUTH_URL`
  - `NEXT_PUBLIC_URL`
  - `GMAIL_REDIRECT_URI`
  - `GOOGLE_CALLBACK_URL`

---

## ✅ Access Control

- [ ] GitHub repository set to Private initially
- [ ] Vercel team access configured
- [ ] Stripe account has 2FA enabled
- [ ] Supabase project has appropriate access controls
- [ ] Google Cloud Console has 2FA enabled
- [ ] Anthropic Console has 2FA enabled

---

## 🚨 Emergency Response

If secrets are accidentally committed:

1. **Immediately** rotate all exposed credentials
2. Remove from git history using:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push to remote:
   ```bash
   git push origin --force --all
   ```
4. Update all environment variables in Vercel
5. Notify team members

---

## 📋 Final Pre-Push Checklist

Before running `git push`:

```bash
# 1. Verify no env files will be committed
git status | grep ".env"

# 2. Check for hardcoded secrets
grep -r "sk-ant-api03-\|sk_test_\|sk_live_" src/ || echo "✅ No secrets found"

# 3. Verify gitignore is working
git check-ignore .env.local && echo "✅ .env.local ignored"

# 4. Review what will be committed
git diff --cached

# 5. Check no large files
git ls-files | xargs du -sh | sort -h | tail -10
```

If all checks pass: ✅ **Safe to push**

---

## 🎯 Security Best Practices

1. **Principle of Least Privilege**: Only grant minimum necessary permissions
2. **Defense in Depth**: Multiple layers of security
3. **Regular Audits**: Review access logs monthly
4. **Key Rotation**: Change secrets quarterly
5. **Monitoring**: Set up alerts for suspicious activity
6. **Backups**: Maintain encrypted backups of environment variables
7. **Documentation**: Keep this checklist updated

---

## 📞 Security Contacts

- **Stripe Security**: https://stripe.com/docs/security
- **Supabase Security**: https://supabase.com/security
- **Vercel Security**: https://vercel.com/security
- **GitHub Security**: https://github.com/security

---

**Last Updated**: 2025-01-13
**Review Frequency**: Before each deployment
**Next Review**: Before first GitHub push
