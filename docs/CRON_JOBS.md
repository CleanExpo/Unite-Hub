# Frontend Cron Jobs

Scheduled tasks using Vercel Cron for periodic maintenance and monitoring.

## Overview

This project uses Vercel Cron to run scheduled tasks directly from the Next.js frontend. This is ideal for:
- Periodic cleanup tasks
- Health monitoring
- Daily/weekly reports
- Scheduled notifications

## Configured Cron Jobs

### 1. Cleanup Old Runs (Daily at 2:00 AM)

**Schedule**: `0 2 * * *` (Every day at 2:00 AM)
**Endpoint**: `/api/cron/cleanup-old-runs`
**Purpose**: Deletes completed/failed agent runs older than 30 days

**What it does**:
- Queries `agent_runs` table for old completed/failed runs
- Deletes runs with `completed_at` older than 30 days
- Logs the number of deleted records

**Why at 2 AM?**
- Low traffic period
- Minimal impact on database performance
- Runs before daily backup (if configured)

### 2. Health Check (Every 5 Minutes)

**Schedule**: `*/5 * * * *` (Every 5 minutes)
**Endpoint**: `/api/cron/health-check`
**Purpose**: Monitors backend health and latency

**What it does**:
- Pings FastAPI backend `/health` endpoint
- Measures response time
- Logs health status
- Can trigger alerts if unhealthy

**Use cases**:
- Early detection of backend issues
- Uptime monitoring
- Performance tracking
- Integration with monitoring services (PagerDuty, etc.)

### 3. Daily Report (Daily at 9:00 AM)

**Schedule**: `0 9 * * *` (Every day at 9:00 AM)
**Endpoint**: `/api/cron/daily-report`
**Purpose**: Generates daily summary of agent activity

**What it does**:
- Queries yesterday's agent runs
- Calculates success rate, failures, escalations
- Computes average execution time
- Lists top failures

**Report includes**:
- Total runs
- Completion rate
- Failed runs with errors
- Agent breakdown
- Average duration

## Setup

### 1. Environment Variables

Add to `.env.local`:

```env
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 2. Vercel Configuration

The `vercel.json` file defines all cron schedules:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-old-runs",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Cron jobs will automatically start running after deployment.

## Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Examples

| Schedule | Description |
|----------|-------------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * *` | Every day at 9 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 0 1 * *` | First day of every month |

## Local Testing

Cron jobs don't run locally. Test them manually:

```bash
# Terminal 1: Start Next.js dev server
pnpm dev

# Terminal 2: Call cron endpoint with authorization
curl http://localhost:3000/api/cron/health-check \
  -H "Authorization: Bearer your-cron-secret"
```

Or use a tool like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/).

## Security

### Authentication

All cron endpoints verify the `CRON_SECRET` header:

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new NextResponse("Unauthorized", { status: 401 });
}
```

**Important**: Never commit `CRON_SECRET` to git. Use environment variables.

### Vercel Protection

Vercel automatically:
- Sets the `Authorization` header with your `CRON_SECRET`
- Only allows Vercel infrastructure to call cron endpoints
- Provides execution logs in the Vercel dashboard

## Monitoring

### View Cron Execution Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments" → Select latest deployment
4. Click "Functions" tab
5. Find your cron function
6. View logs

### Set Up Alerts

Add to your cron handlers:

```typescript
if (!healthy) {
  // Send alert to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({
      text: "🚨 Backend health check failed!",
    }),
  });

  // Or send email via SendGrid, Resend, etc.
  await sendEmail({
    to: "alerts@example.com",
    subject: "Backend health check failed",
    body: "..."
  });
}
```

## Adding New Cron Jobs

### 1. Create API Route

```typescript
// apps/web/app/api/cron/my-task/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Your task logic here
    console.log("Running my custom task");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 2. Add to vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/my-task",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

### 3. Deploy

```bash
vercel --prod
```

## Alternative: Next.js Route Handlers (Without Vercel)

If not using Vercel, you can trigger cron jobs externally:

### Option 1: External Cron Service

Use services like:
- [Cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)
- GitHub Actions

```yaml
# .github/workflows/cron.yml
name: Daily Report
on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  run-report:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger daily report
        run: |
          curl https://your-app.vercel.app/api/cron/daily-report \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 2: Self-Hosted Cron

```bash
# Add to crontab
crontab -e

# Add line:
0 9 * * * curl https://your-app.com/api/cron/daily-report -H "Authorization: Bearer your-secret"
```

## Best Practices

1. **Keep cron jobs lightweight** - Offload heavy work to background jobs
2. **Add timeout protection** - Use `AbortController` for long-running tasks
3. **Implement retries** - Handle transient failures gracefully
4. **Log everything** - Essential for debugging
5. **Monitor execution time** - Alert if jobs take too long
6. **Use idempotency** - Ensure safe re-execution
7. **Secure endpoints** - Always verify `CRON_SECRET`

## Troubleshooting

### Cron job not running

1. Check Vercel dashboard for execution logs
2. Verify `vercel.json` syntax
3. Ensure `CRON_SECRET` environment variable is set
4. Check function timeout limits (Vercel: 10s free, 60s pro)

### Unauthorized errors

1. Verify `CRON_SECRET` matches in code and Vercel
2. Check authorization header format: `Bearer <secret>`
3. Ensure environment variable is set in Vercel dashboard

### Jobs timing out

1. Reduce workload per execution
2. Use background jobs for heavy tasks
3. Upgrade to Vercel Pro for longer timeouts
4. Split into multiple smaller cron jobs

## Related Files

- **Config**: `apps/web/vercel.json`
- **Cleanup**: `apps/web/app/api/cron/cleanup-old-runs/route.ts`
- **Health Check**: `apps/web/app/api/cron/health-check/route.ts`
- **Daily Report**: `apps/web/app/api/cron/daily-report/route.ts`

## Next Steps

- [ ] Add email notifications for daily reports
- [ ] Implement Slack alerts for health check failures
- [ ] Create weekly summary report
- [ ] Add metrics tracking (execution time, success rate)
- [ ] Set up dead letter queue for failed jobs
