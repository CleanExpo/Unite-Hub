# 🔧 Environment Configuration Guide

## Complete Setup for 100% Website Functionality

### 1. Google Analytics Setup

#### Step 1: Create Google Analytics 4 Account
1. Go to https://analytics.google.com/
2. Click "Start measuring"
3. Set up account name (e.g., "Unite Group")
4. Set up property name (e.g., "Unite Group Website")
5. Select your business details
6. Get your Measurement ID (format: G-XXXXXXXXXX)

#### Step 2: Add to Environment Variables
Add to your `.env.local` file:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Complete Environment Variables List

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase (Already Configured)
NEXT_PUBLIC_SUPABASE_URL=https://euviqrttsmbymrdphuow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (Already Configured)
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_2zscv88gTrul2bnrLrNbRab4m8iCqwoF
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# Email (Already Configured)
RESEND_API_KEY=re_Q9YrXMop_3M4MhpZABsQ5vhsr7RLThoqr
EMAIL_FROM=contact@unite-group.in

# OpenAI (Already Configured)
OPENAI_API_KEY=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

# Google OAuth (Already Configured)
GOOGLE_CLIENT_ID=28568213419-bhv57p4btgavvijoq9bjv4q41499s7bf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth (Already Configured)
NEXTAUTH_SECRET=xPlHM+TBxWycSZU0YS5fo7n1bwAPjJwfP+tkazcrUPE=
NEXTAUTH_URL=https://unite-group.in

# Optional: Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional: Customer Support (Intercom/Crisp)
NEXT_PUBLIC_INTERCOM_APP_ID=your_intercom_id_here
NEXT_PUBLIC_CRISP_WEBSITE_ID=your_crisp_id_here
```

### 3. Analytics Features Now Available

With Google Analytics integrated, you can now:

#### Track Automatically:
- Page views
- User sessions
- Traffic sources
- Device types
- Geographic data
- User flow

#### Track Custom Events:
```typescript
import { trackEvent, trackConversion, trackFormSubmission } from '@/components/GoogleAnalytics';

// Track button clicks
trackEvent('click', 'button', 'header-cta');

// Track form submissions
trackFormSubmission('contact-form');

// Track conversions
trackConversion('AW-CONVERSION_ID', 100, 'USD');
```

### 4. Schema Markup Features

The following schemas are now active:
- ✅ **Organization Schema** - Business information
- ✅ **LocalBusiness Schema** - Local SEO boost
- ✅ **WebPage Schema** - Per page (can be added)
- ✅ **FAQ Schema** - For FAQ sections
- ✅ **Service Schema** - For service pages
- ✅ **Article Schema** - For blog posts
- ✅ **Breadcrumb Schema** - Navigation structure

### 5. Performance Optimizations

#### Image Optimization Component Usage:
```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

// Basic usage
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
/>

// Fill container
<OptimizedImage
  src="/images/background.jpg"
  alt="Background"
  fill
  className="w-full h-screen"
/>
```

### 6. Testing Your Configuration

#### Test Google Analytics:
1. Visit your website
2. Go to Google Analytics Real-Time reports
3. You should see your visit immediately

#### Test Schema Markup:
1. Go to https://search.google.com/test/rich-results
2. Enter your website URL
3. Check for detected structured data

#### Test Performance:
1. Go to https://pagespeed.web.dev/
2. Enter your website URL
3. Check Core Web Vitals scores

### 7. Deployment Checklist

Before deploying to production:
- [ ] Set all environment variables in Vercel
- [ ] Test contact forms
- [ ] Verify payment processing
- [ ] Check Google Analytics is receiving data
- [ ] Validate all schema markup
- [ ] Run Lighthouse performance audit
- [ ] Test on mobile devices
- [ ] Verify SSL certificate

### 8. Monitoring Setup

#### Google Search Console:
1. Verify ownership
2. Submit sitemap.xml
3. Monitor indexing status
4. Check for crawl errors

#### Analytics Dashboard:
1. Set up conversion goals
2. Create custom reports
3. Set up alerts for traffic drops
4. Configure e-commerce tracking

### 9. Optional Enhancements

#### Add Microsoft Clarity (Free Heatmaps):
```env
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_id
```

#### Add Hotjar (User Recordings):
```env
NEXT_PUBLIC_HOTJAR_SITE_ID=your_hotjar_id
```

#### Add Google Tag Manager:
```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 10. Security Notes

⚠️ **Important Security Reminders:**
- Never commit `.env.local` to git
- Use different API keys for development and production
- Rotate API keys regularly
- Set up proper CORS policies
- Enable rate limiting on APIs
- Use environment-specific configurations

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for issues
npm run lint
```

## Support Resources

- Google Analytics Help: https://support.google.com/analytics
- Next.js Documentation: https://nextjs.org/docs
- Vercel Deployment: https://vercel.com/docs
- Schema.org Reference: https://schema.org

---

*Last Updated: August 24, 2025*
*Status: READY FOR PRODUCTION*
