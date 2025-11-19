# Adding Perplexity API Key to Vercel

**Quick Guide**: Add environment variables to Vercel for production deployment

---

## Method 1: Vercel Dashboard (Recommended)

### Step 1: Go to Project Settings

1. Visit: https://vercel.com/unite-groups-projects/unite-hub
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar

### Step 2: Add Perplexity API Key

1. Click **Add New** button
2. Fill in:
   - **Key**: `PERPLEXITY_API_KEY`
   - **Value**: `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`
   - **Environments**: Select all (Production, Preview, Development)
3. Click **Save**

### Step 3: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** → **Redeploy**
4. Wait for deployment to complete

---

## Method 2: Vercel CLI (Alternative)

If you have Vercel CLI installed:

```bash
# Add to production
vercel env add PERPLEXITY_API_KEY production

# Paste value when prompted:
# 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

# Add to preview
vercel env add PERPLEXITY_API_KEY preview

# Add to development
vercel env add PERPLEXITY_API_KEY development

# Or add to all environments at once
vercel env add PERPLEXITY_API_KEY
# Select: Production, Preview, Development (all)
```

---

## Method 3: Vercel CLI Pull (Sync to Local)

If you want to pull Vercel's environment variables to your local `.env.local`:

```bash
# Link to Vercel project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.local
```

This will overwrite your `.env.local` with Vercel's environment variables.

---

## Verify Environment Variables

### On Vercel Dashboard

1. Go to: https://vercel.com/unite-groups-projects/unite-hub/settings/environment-variables
2. Look for `PERPLEXITY_API_KEY` in the list
3. Should show environments: Production, Preview, Development

### Test in Production

After deploying, test the API:

```bash
# Test SEO intelligence endpoint
curl https://unite-hub.vercel.app/api/seo/research \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"topic": "local SEO", "researchType": "trends"}'
```

If successful, you'll get JSON response with SEO trends and citations.

---

## All Environment Variables to Add

Here's the complete list of environment variables that should be in Vercel:

### Required (Already in Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (should be https://unite-hub.vercel.app for production)

### To Add

✅ **Perplexity API**:
```
PERPLEXITY_API_KEY=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
```

### Optional (For Full SEO Platform)

If you build the full SEO platform with SERP APIs:

**SerpApi** (200 free searches/month):
```
SERPAPI_KEY=your-serpapi-key
```

**ValueSERP** (100 free searches/month):
```
VALUESERP_API_KEY=your-valueserp-key
```

**ScrapingBee** (1000 free credits):
```
SCRAPINGBEE_API_KEY=your-scrapingbee-key
```

---

## Troubleshooting

### Error: "PERPLEXITY_API_KEY is required"

**Check**:
1. Variable is added to Vercel
2. Correct environment (Production/Preview/Development)
3. Redeployed after adding variable
4. No typos in variable name (case-sensitive)

### Error: "Invalid API key"

**Check**:
1. API key starts with `pplx-`
2. No extra spaces or quotes
3. Key is active on Perplexity dashboard: https://www.perplexity.ai/settings/api

### Variable Not Working in Production

**Solution**:
1. Verify variable exists in Vercel dashboard
2. Check it's enabled for "Production" environment
3. Redeploy (environment variables only apply to new deployments)
4. Check deployment logs for errors

---

## Quick Checklist

Before deploying SEO Intelligence features:

- [x] `PERPLEXITY_API_KEY` in `.env.local` (already done)
- [ ] `PERPLEXITY_API_KEY` added to Vercel (via dashboard or CLI)
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed application
- [ ] Tested API endpoint in production
- [ ] Verified no errors in deployment logs

---

## Next Steps

1. **Add to Vercel**: Follow Method 1 (Vercel Dashboard) above
2. **Redeploy**: Trigger a new deployment
3. **Test**: Run `npm run seo:eeat` locally to verify
4. **Deploy SEO Features**: Add SEO intelligence to dashboard

---

## Resources

- Vercel Dashboard: https://vercel.com/unite-groups-projects/unite-hub/settings/environment-variables
- Vercel CLI Docs: https://vercel.com/docs/cli/env
- Perplexity API: https://www.perplexity.ai/settings/api

---

**Current Status**:
- ✅ Local `.env.local` has Perplexity key
- ⏳ Waiting for Vercel environment variable setup
- ⏳ Waiting for redeploy after adding variable
