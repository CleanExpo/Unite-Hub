# 🔐 Environment Variables Configuration Guide

## 📋 Required Variables Checklist

### ✅ Core Requirements
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `RESEND_API_KEY` - Resend email service API key
- [ ] `ADMIN_EMAIL` - Email address for admin notifications

### 📍 Optional but Recommended
- [ ] `NEXT_PUBLIC_SITE_URL` - Your production domain URL
- [ ] `NEXTAUTH_SECRET` - NextAuth.js secret (generate with: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` - NextAuth callback URL (usually same as SITE_URL)

### 🔧 Optional Services
- [ ] Redis configuration (for caching)
- [ ] AI service keys (OpenAI, Anthropic, etc.)
- [ ] Analytics (Google Analytics, Sentry)

---

## 🚀 Quick Setup Guide

### 1. Copy the Template
```bash
cp .env.example .env.local
```

### 2. Get Your Keys

#### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

#### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys:
   - Developers → API keys
   - Copy `Secret key` → `STRIPE_SECRET_KEY`
   - Copy `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. For webhooks:
   - Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

#### Resend
1. Go to [Resend Dashboard](https://resend.com)
2. API Keys → Create API Key
3. Copy key → `RESEND_API_KEY`
4. Set `ADMIN_EMAIL` to your admin email address

---

## 🔍 Environment Variables by Feature

### 🗄️ Database (Supabase)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 💳 Payments (Stripe)
```env
STRIPE_SECRET_KEY=sk_test_51... (or sk_live_51... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51... (or pk_live_51... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 📧 Email (Resend)
```env
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@your-company.com
```

### 🔐 Authentication
```env
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com
```

### 📱 Application
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Unite Group
NEXT_PUBLIC_APP_VERSION=14.0
NEXT_PUBLIC_CURRENCY=aud
NEXT_PUBLIC_CONSULTATION_PRICE=55000  # Price in cents ($550.00)
```

---

## ⚠️ Security Best Practices

### DO ✅
- Keep `.env.local` in `.gitignore`
- Use different keys for development and production
- Rotate keys periodically
- Use Vercel/hosting provider's environment variable UI for production

### DON'T ❌
- Commit `.env.local` to version control
- Share keys in plain text
- Use production keys in development
- Expose server-side keys to client

---

## 🚨 Common Issues

### Issue: "Supabase client not configured"
**Solution**: Ensure all three Supabase variables are set correctly

### Issue: "Stripe webhook failing"
**Solution**: 
1. Verify webhook endpoint URL
2. Check webhook secret is correct
3. Ensure Stripe CLI is forwarding to correct port in development

### Issue: "Email not sending"
**Solution**:
1. Verify Resend API key
2. Check sender domain is verified in Resend
3. Ensure ADMIN_EMAIL is set

---

## 🧪 Testing Your Configuration

### 1. Test Supabase Connection
```
GET /api/test/supabase-connection
```

### 2. Test Email Service
```
GET /api/test/email-service
```

### 3. Test Overall Health
```
GET /api/health
```

---

## 📝 Production Deployment

### Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Select appropriate environments (Production/Preview/Development)
4. Redeploy to apply changes

### Other Hosts
Follow your hosting provider's documentation for setting environment variables.

---

## 🆘 Need Help?

1. Check the test endpoints above
2. Review error messages in browser console
3. Check server logs
4. Verify all required variables are set
5. Ensure no typos in variable names

Remember: Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser, all others are server-side only.
