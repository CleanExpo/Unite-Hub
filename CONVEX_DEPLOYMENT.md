# Convex Deployment Guide for Vercel

This document explains how to properly deploy Unite-Hub with Convex backend to Vercel.

## Problem

The `convex/_generated/` directory contains auto-generated TypeScript files that are:
- Generated locally by running `convex dev`
- Excluded from git via `.gitignore`
- Required by 49+ API route files that import from `@/convex/_generated/api`

This causes Vercel builds to fail with "Module not found" errors.

## Solution

Configure Convex to generate these files during the Vercel build process.

## Setup Steps

### 1. Create Production Convex Deployment

```bash
# Login to Convex (if not already logged in)
npx convex login

# Deploy to production (creates a prod deployment URL)
npx convex deploy --prod
```

This will create a production deployment URL like: `https://your-project-name.convex.cloud`

### 2. Get Convex Deploy Key

```bash
# Generate a deploy key for CI/CD
npx convex deploy-key create vercel-production
```

Copy the deploy key that's printed (starts with `prod:`).

### 3. Configure Vercel Environment Variables

Go to your Vercel project settings → Environment Variables and add:

**Production Environment:**
- `CONVEX_DEPLOY_KEY` = `prod:xxxxx...` (the key from step 2)
- `NEXT_PUBLIC_CONVEX_URL` = `https://your-project-name.convex.cloud`
- `CONVEX_URL` = `https://your-project-name.convex.cloud` (same as above)

**Preview Environment (optional):**
- You can use the same prod deployment or create a separate preview deployment

### 4. Update .env.local for Local Development

Your `.env.local` should keep the local development URLs:

```env
CONVEX_DEPLOYMENT=anonymous:anonymous-Unite-Hub
CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

### 5. Build Process

The `package.json` has been updated with:

```json
"build": "convex deploy --codegen --typecheck disable && next build"
```

This ensures:
1. Convex deploys your functions to production
2. Code generation runs (creates `_generated/` files)
3. Next.js build can access the generated files

### 6. Deploy to Vercel

Once environment variables are configured:

```bash
git push origin main
```

Vercel will automatically:
1. Run `convex deploy --codegen` (using your CONVEX_DEPLOY_KEY)
2. Generate the `_generated/` files
3. Build Next.js with access to these files
4. Deploy successfully

## Verification

After deployment:
1. Check Vercel build logs - should see "Convex deployment complete"
2. Check that no "Module not found: @/convex/_generated/api" errors appear
3. Visit your deployed site and test API routes

## Local Development

For local development, continue using:

```bash
# Terminal 1: Start Convex dev server
npm run convex

# Terminal 2: Start Next.js dev server
npm run dev
```

The `convex dev` command watches for schema changes and regenerates `_generated/` files automatically.

## Troubleshooting

### Build fails with "CONVEX_DEPLOY_KEY not found"
- Verify the environment variable is set in Vercel settings
- Make sure it's set for "Production" environment
- Redeploy after adding the variable

### Build fails with "Deployment not found"
- Run `npx convex deploy --prod` locally first to create the production deployment
- Make sure `NEXT_PUBLIC_CONVEX_URL` matches your actual Convex deployment URL

### API routes return errors
- Check Convex dashboard to ensure functions are deployed
- Verify environment variables are correct in Vercel
- Check Convex logs for runtime errors

## Additional Resources

- [Convex + Vercel Guide](https://docs.convex.dev/production/hosting/vercel)
- [Convex Deploy Keys](https://docs.convex.dev/production/deploy-keys)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
