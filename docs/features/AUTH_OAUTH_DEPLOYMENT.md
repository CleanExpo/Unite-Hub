# OAuth Authentication - Deployment Guide

> **Feature ID**: AUTH-001
> **Version**: 1.0.0
> **Status**: Ready for Deployment
> **Created**: 2024-12-31

## Pre-Deployment Checklist

### 1. Supabase Configuration

Before deploying, you must configure OAuth providers in your Supabase project:

#### Google OAuth Setup

1. **Create Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://your-domain.com/auth/callback`
     - Supabase: `https://your-project.supabase.co/auth/v1/callback`

2. **Configure Supabase**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to "Authentication" > "Providers"
   - Enable "Google" provider
   - Enter your Google Client ID and Client Secret
   - Save changes

#### GitHub OAuth Setup (Optional)

1. **Create GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Set Authorization callback URL:
     - `https://your-project.supabase.co/auth/v1/callback`

2. **Configure Supabase**
   - Enable "GitHub" provider in Supabase Authentication settings
   - Enter your GitHub Client ID and Client Secret

### 2. Environment Variables

Ensure these environment variables are set in your deployment platform:

```env
# Required for OAuth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional but recommended
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Callback URL Configuration

The OAuth callback URL must be whitelisted in:

1. **Supabase Dashboard**
   - Authentication > URL Configuration
   - Add your site URL to "Site URL"
   - Add callback URLs to "Redirect URLs":
     - `https://your-domain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

2. **OAuth Provider Settings**
   - Google Cloud Console: Authorized redirect URIs
   - GitHub: Authorization callback URL

## Deployment Steps

### Vercel Deployment

1. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Update Supabase Redirect URLs**
   - Add your Vercel deployment URL to Supabase redirect URLs

### Manual Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Set environment variables on your server**

3. **Start the application**
   ```bash
   pnpm start
   ```

## Post-Deployment Verification

### Automated Checks

Run the health check script:
```bash
.\scripts\health-check.ps1 -Quick
```

### Manual Verification

1. **Test Google OAuth Flow**
   - Navigate to `/login`
   - Click "Continue with Google"
   - Complete Google authentication
   - Verify redirect to `/dashboard`
   - Verify user session is created

2. **Test GitHub OAuth Flow** (if enabled)
   - Navigate to `/login`
   - Click "Continue with GitHub"
   - Complete GitHub authentication
   - Verify redirect to `/dashboard`

3. **Test Session Persistence**
   - After OAuth login, refresh the page
   - Verify user remains logged in

4. **Test Logout**
   - Click logout button
   - Verify session is cleared
   - Verify redirect to login page

## Troubleshooting

### Common Issues

#### "OAuth provider not configured"
- Verify the provider is enabled in Supabase Dashboard
- Check that Client ID and Secret are correct

#### "Redirect URI mismatch"
- Ensure callback URL matches exactly in:
  - OAuth provider settings
  - Supabase redirect URLs
  - Application code

#### "Invalid state parameter"
- Clear browser cookies and try again
- Check for CORS issues

#### "User not created after OAuth"
- Verify Supabase auth settings allow new user signups
- Check Supabase logs for errors

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

Check browser console for OAuth flow details.

## Rollback Procedure

If issues occur after deployment:

1. **Disable OAuth Providers**
   - Go to Supabase Dashboard
   - Disable Google/GitHub providers
   - Users can still use email/password

2. **Revert Code Changes**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Redeploy**
   - Trigger new deployment with reverted code

## Security Considerations

- ✅ PKCE flow is enabled by default in Supabase
- ✅ State parameter is validated automatically
- ✅ Callback URLs are whitelisted
- ✅ No sensitive data is logged
- ✅ HTTPS is required in production

## Monitoring

### Metrics to Watch

- OAuth login success rate
- OAuth login latency
- Error rates by provider
- New user signups via OAuth

### Alerts

Set up alerts for:
- OAuth error rate > 5%
- OAuth latency > 5 seconds
- Sudden drop in OAuth logins

## Support

For issues with OAuth implementation:
1. Check Supabase logs
2. Review browser console errors
3. Verify environment variables
4. Check OAuth provider status pages

---

*Deployment guide created as part of feature development workflow*
