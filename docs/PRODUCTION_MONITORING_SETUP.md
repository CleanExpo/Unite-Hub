# Production Monitoring Setup Guide

**Date**: 2025-11-25
**Priority**: P0 (Critical for Production)
**Time to Complete**: 2-4 hours

---

## Overview

Production monitoring is **essential** before launch. Without it, you're flying blind when errors occur.

This guide covers:
1. ✅ **Sentry** - Error tracking (INSTALLED)
2. ⏳ **Uptime monitoring** - Know when your site goes down
3. ⏳ **Performance monitoring** - Track slow pages and API routes
4. ⏳ **Business metrics** - Monitor signups, revenue, usage

---

## 1. Sentry Error Tracking ✅ INSTALLED

### Status: Configured (needs DSN)

Sentry is installed and configured. You just need to add your Sentry DSN.

### Quick Setup (10 minutes):

1. **Create Sentry Account**
   - Go to: https://sentry.io/signup/
   - Sign up (free tier: 5,000 errors/month)

2. **Create Project**
   - Project type: Next.js
   - Project name: Unite-Hub
   - Team: Personal (or your team name)

3. **Get DSN**
   - Copy the DSN from project settings
   - Format: `https://your-sentry-dsn@o1234567.ingest.sentry.io/8901234`

4. **Add to Environment Variables**

Add to `.env.local`:
```env
# Sentry Error Tracking
SENTRY_DSN=https://your-dsn@o1234567.ingest.sentry.io/8901234
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o1234567.ingest.sentry.io/8901234
```

Add to Vercel Environment Variables:
```
Project Settings → Environment Variables → Add:
- SENTRY_DSN (production)
- NEXT_PUBLIC_SENTRY_DSN (production)
```

5. **Test Sentry**

Create test error:
```typescript
// In any page or API route
import * as Sentry from "@sentry/nextjs";

// Trigger test error
Sentry.captureException(new Error("Test error from Unite-Hub"));
```

Check Sentry dashboard - error should appear within seconds.

### What Sentry Tracks:

- ✅ **Unhandled exceptions** - Crashes, runtime errors
- ✅ **API errors** - Failed API calls, 500 errors
- ✅ **Performance** - Slow pages, API routes
- ✅ **User sessions** - 10% of all sessions recorded
- ✅ **Breadcrumbs** - User actions leading to errors
- ✅ **Source maps** - See exact line numbers (not minified)

### Sentry Best Practices:

1. **Set up alerts**:
   - Go to: Alerts → New Alert Rule
   - Trigger: When any issue is first seen
   - Action: Email you + Slack notification

2. **Configure releases**:
   ```bash
   # In package.json, add:
   "scripts": {
     "build": "sentry-cli releases new $(git rev-parse HEAD) && next build"
   }
   ```

3. **Filter noise**:
   - Already configured in `sentry.client.config.ts`:
     - Filters 401 errors (expected)
     - Filters network errors (user's connection)
   - Disabled in development

---

## 2. Uptime Monitoring (NOT YET CONFIGURED)

### Recommended: UptimeRobot (Free)

**Why**: Know within 5 minutes if your site goes down

**Setup** (15 minutes):

1. **Create Account**
   - Go to: https://uptimerobot.com/
   - Free tier: 50 monitors, 5-minute checks

2. **Add HTTP Monitor**
   - URL: `https://unite-hub.vercel.app` (your production URL)
   - Monitor type: HTTP(s)
   - Check interval: 5 minutes
   - Alert when: Down

3. **Set up Alerts**
   - Email: Your email
   - SMS: Your phone number (optional, costs extra)
   - Webhook: Slack/Discord notification (recommended)

4. **Add API Monitor**
   - URL: `https://unite-hub.vercel.app/api/health`
   - Check for keyword: `"status":"healthy"`

### Alternative: Better Uptime

- More features: Status page, incident management
- Cost: $20/month (14-day free trial)
- Link: https://betteruptime.com/

---

## 3. Performance Monitoring

### Option A: Sentry Performance (Included)

Already configured in Sentry setup above.

**What it tracks**:
- Page load times
- API route latency
- Database query performance
- External API calls

**Setup**:
- Already enabled in `sentry.client.config.ts`:
  ```typescript
  tracesSampleRate: 0.1 // Track 10% of requests
  ```

**View performance**:
- Sentry Dashboard → Performance
- See slowest pages, API routes
- Identify bottlenecks

### Option B: Vercel Analytics

**Cost**: Free tier included with Vercel

**Setup** (5 minutes):
1. Go to Vercel Dashboard
2. Select Unite-Hub project
3. Go to Analytics tab
4. Click "Enable Analytics"

**What you get**:
- Real User Monitoring (RUM)
- Core Web Vitals (LCP, FID, CLS)
- Page load times by country
- Top pages by traffic

---

## 4. Business Metrics Monitoring

### Track What Matters

Create a `/api/metrics` endpoint:

```typescript
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
  const supabase = await getSupabaseServer();

  // Query business metrics
  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { count: totalContacts },
    { count: totalCampaigns },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    users: totalUsers,
    subscriptions: activeSubscriptions,
    contacts: totalContacts,
    campaigns: totalCampaigns,
    timestamp: new Date().toISOString(),
  });
}
```

### Monitor with Cronitor

**Setup** (10 minutes):

1. **Create Account**
   - Go to: https://cronitor.io/
   - Free tier: 5 monitors

2. **Add API Monitor**
   - URL: `https://unite-hub.vercel.app/api/metrics`
   - Schedule: Every 1 hour
   - Alert if: Response time > 5 seconds OR status != 200

3. **Create Alerts**
   - If active subscriptions drops by 20%
   - If error rate spikes above 5%

---

## 5. Logging & Log Aggregation

### Option A: Vercel Logs (Free)

**Setup**: Already enabled

**Access**:
- Vercel Dashboard → Logs
- Filter by: Function, Status Code, Search term

**Limitations**:
- 1-hour retention on free tier
- No search/filtering on free tier
- Upgrade to Pro: $20/month for 1-day retention

### Option B: Datadog (Professional)

**Cost**: Free tier (50GB logs/month)

**Setup** (30 minutes):

1. **Create Account**
   - Go to: https://www.datadoghq.com/
   - Free trial: 14 days

2. **Install Datadog Integration**
   ```bash
   npm install --save dd-trace
   ```

3. **Configure in `instrumentation.ts`**:
   ```typescript
   import tracer from 'dd-trace';

   tracer.init({
     logInjection: true,
     service: 'unite-hub',
     env: process.env.VERCEL_ENV || 'development',
   });
   ```

4. **Add to Vercel**:
   - Vercel Dashboard → Integrations
   - Add Datadog integration
   - Connect account

**What you get**:
- Full request tracing
- Database query monitoring
- Error correlation
- Custom dashboards
- 30-day log retention

---

## 6. Health Check Dashboard

Create a simple health check page:

```typescript
// src/app/dashboard/health/page.tsx
"use client";

import { useEffect, useState } from 'react';

export default function HealthDashboard() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(setHealth);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/health')
        .then(res => res.json())
        .then(setHealth);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!health) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">System Health</h1>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(health.checks || {}).map(([name, check]: [string, any]) => (
          <div
            key={name}
            className={`p-4 rounded-lg ${
              check.status === 'pass' ? 'bg-green-100' :
              check.status === 'warn' ? 'bg-yellow-100' :
              'bg-red-100'
            }`}
          >
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-gray-600">{check.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Alerting Strategy

### Set up alerts for:

1. **Critical (Page immediately)**:
   - Site is down (uptime < 99%)
   - Database connection lost
   - Payment processing failing
   - Error rate > 10%

2. **High (Alert within 1 hour)**:
   - API response time > 2 seconds
   - Error rate > 5%
   - Active subscriptions dropped by 20%

3. **Medium (Daily digest)**:
   - New users
   - Revenue changes
   - Slow pages (>3 seconds)

### Alert Channels:

- **Email**: Always enabled
- **Slack**: Recommended for team
- **PagerDuty**: For on-call rotations (if team)
- **SMS**: For critical alerts only

---

## 8. Monitoring Checklist

Before production launch:

- [ ] Sentry configured and tested
- [ ] Uptime monitoring active (UptimeRobot or similar)
- [ ] Performance tracking enabled (Sentry or Vercel Analytics)
- [ ] Business metrics dashboard created
- [ ] Alerts configured for critical issues
- [ ] Health check endpoint (/api/health) working
- [ ] Log aggregation set up (Datadog or Vercel)
- [ ] Status page created (optional but recommended)

---

## 9. Cost Estimate

### Recommended Tier (for production launch):

| Service | Plan | Cost | What You Get |
|---------|------|------|-------------|
| Sentry | Developer | $29/mo | 50K errors, unlimited projects |
| UptimeRobot | Free | $0 | 50 monitors, 5-min checks |
| Vercel Analytics | Free | $0 | RUM, Web Vitals |
| **TOTAL** | | **$29/mo** | Production-ready monitoring |

### Professional Tier (scale to 1000+ users):

| Service | Plan | Cost | What You Get |
|---------|------|------|-------------|
| Sentry | Team | $99/mo | 250K errors, advanced features |
| Better Uptime | Pro | $20/mo | Status page, incident management |
| Datadog | Pro | $15/mo | APM, logs, custom dashboards |
| **TOTAL** | | **$134/mo** | Enterprise-grade monitoring |

---

## 10. Next Steps

1. **Immediate** (today):
   - [ ] Create Sentry account
   - [ ] Add SENTRY_DSN to .env.local
   - [ ] Test error tracking

2. **This week**:
   - [ ] Set up UptimeRobot
   - [ ] Configure alerts
   - [ ] Enable Vercel Analytics

3. **Before launch**:
   - [ ] Create health dashboard
   - [ ] Test all monitoring systems
   - [ ] Document incident response plan

---

**Status**: ⚠️ Sentry installed but not configured (needs DSN)
**Estimated Setup Time**: 2-4 hours for complete setup
**Cost**: $29/month (recommended tier)
