# Unite-Hub Operations Runbook

**Generated**: 2025-11-23
**Version**: 1.0.0

---

## Quick Reference

### Development Commands
```bash
npm run dev              # Start dev server (port 3008)
npm run build            # Production build
npm test                 # Run Vitest tests
npm run test:e2e         # Playwright E2E tests
```

### AI Agent Commands
```bash
npm run email-agent      # Process emails
npm run content-agent    # Generate content
npm run orchestrator     # Coordinate workflows
npm run workflow         # Full pipeline
npm run audit-system     # System health check
```

### SEO Intelligence
```bash
npm run seo:research "topic"        # SEO research
npm run seo:comprehensive "topic"   # Full report
npm run seo:usage                   # Usage stats
```

---

## Environment Setup

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# AI
ANTHROPIC_API_KEY=sk-ant-xxx
OPENROUTER_API_KEY=sk-or-xxx
PERPLEXITY_API_KEY=pplx-xxx
GEMINI_API_KEY=xxx

# Email (at least one)
SENDGRID_API_KEY=xxx
RESEND_API_KEY=xxx
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=xxx
EMAIL_SERVER_PASSWORD=xxx
EMAIL_FROM=xxx@domain.com
```

### Local Development

```bash
# 1. Clone and install
git clone [repo]
cd Unite-Hub
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Start development
npm run dev
# Open http://localhost:3008
```

---

## Feature Operations

### 1. Contact Management

#### View Contacts
Navigate to: `/dashboard/contacts`

#### Create Contact
1. Click "Add Contact" button
2. Fill form (name, email, company, status)
3. Submit

#### AI Scoring
Contacts are scored 0-100 based on:
- Email engagement (40%)
- Sentiment analysis (20%)
- Intent quality (20%)
- Job title (10%)
- Status progression (10%)

**Score Interpretation**:
- 0-39: Cold
- 40-59: Cool
- 60-79: Warm
- 80-100: Hot

### 2. Email Processing

#### Manual Processing
```bash
npm run email-agent
```

#### What It Does
1. Fetches unread Gmail messages
2. Extracts sender information
3. Analyzes intent and sentiment
4. Updates contact AI scores
5. Creates/updates contact records

#### Troubleshooting
- **"No Gmail token"**: Re-authenticate at `/dashboard/settings/integrations`
- **"Rate limited"**: Wait 60 seconds, retry
- **"Processing failed"**: Check Supabase logs

### 3. Content Generation

#### Generate Content
```bash
npm run content-agent
```

#### What It Does
1. Queries contacts with score >= 70 (warm leads)
2. Generates personalized content using Claude Opus
3. Stores drafts in `generatedContent` table
4. Content types: followup, proposal, case_study

#### Review Content
Navigate to: `/dashboard/content`
- Approve/reject drafts
- Edit before sending
- Schedule delivery

### 4. Campaign Management

#### Create Campaign
1. Navigate to `/dashboard/campaigns`
2. Click "Create Campaign"
3. Set name, type, audience
4. Configure steps (email, wait, condition)
5. Activate

#### Campaign Types
- **Email Blast**: Single send to list
- **Drip Campaign**: Multi-step sequences
- **Automated**: Trigger-based

### 5. SEO Intelligence

#### Research Commands
```bash
# General research
npm run seo:research "local SEO strategies"

# E-E-A-T guidelines
npm run seo:eeat

# Comprehensive report
npm run seo:comprehensive "construction industry"

# Check usage
npm run seo:usage
```

#### Output
- Markdown report with citations
- Cost tracking
- Token usage

---

## API Operations

### Authentication Pattern

All API calls require Bearer token:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ workspaceId, ...data })
});
```

### Common Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/contacts` | GET/POST | List/create contacts |
| `/api/contacts/[id]` | GET/PATCH/DELETE | CRUD single contact |
| `/api/campaigns` | GET/POST | List/create campaigns |
| `/api/emails/send` | POST | Send email |
| `/api/agents/contact-intelligence` | POST | AI scoring |
| `/api/profile/update` | PATCH | Update user profile |

---

## Database Operations

### Supabase Admin Access
1. Go to: https://app.supabase.com
2. Select Unite-Hub project
3. Open SQL Editor

### Common Queries

#### Check Contact Scores
```sql
SELECT name, email, ai_score, status
FROM contacts
WHERE workspace_id = 'your-workspace-id'
ORDER BY ai_score DESC
LIMIT 20;
```

#### View Recent Emails
```sql
SELECT subject, from_email, created_at
FROM emails
WHERE workspace_id = 'your-workspace-id'
ORDER BY created_at DESC
LIMIT 50;
```

#### Check AI Generated Content
```sql
SELECT content_type, status, created_at
FROM "generatedContent"
WHERE workspace_id = 'your-workspace-id'
ORDER BY created_at DESC;
```

### Running Migrations

1. Create file: `supabase/migrations/XXX_description.sql`
2. Open Supabase SQL Editor
3. Copy/paste SQL
4. Execute
5. Wait 1-5 minutes for schema cache refresh

---

## Monitoring & Debugging

### Check Application Logs

**Vercel**:
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Select deployment
5. View "Functions" logs

**Local**:
```bash
npm run dev
# Logs appear in terminal
```

### Common Issues

#### 1. "Unauthorized" Errors
**Cause**: Session expired or auth disabled on route
**Fix**:
- Re-login at `/login`
- Check API route has auth check enabled

#### 2. "workspaceId is required"
**Cause**: No workspace selected or undefined
**Fix**:
- Check AuthContext provides currentOrganization
- Verify workspaceId is passed to API call

#### 3. "Database query failed"
**Cause**: Supabase connection issue or RLS policy
**Fix**:
- Check Supabase status
- Verify RLS policies allow access
- Check workspace_id filter

#### 4. "Claude API error"
**Cause**: Rate limit or API key issue
**Fix**:
- Wait 60 seconds for rate limit reset
- Verify ANTHROPIC_API_KEY is set
- Check API key has sufficient credits

#### 5. 404 on Dashboard Pages
**Cause**: Page file doesn't exist
**Fix**:
- Create page at correct path
- Add to navigation

---

## Deployment

### Deploy to Production

**Automatic (Git Push)**:
```bash
git add .
git commit -m "feat: description"
git push origin main
# Vercel auto-deploys
```

**Manual**:
```bash
vercel --prod
```

### Verify Deployment

1. Check Vercel dashboard for build status
2. Visit https://unite-hub.vercel.app
3. Test login flow
4. Check dashboard loads
5. Verify API routes respond

### Rollback

```bash
# In Vercel Dashboard
# Go to Deployments
# Find last working deployment
# Click "..." → "Promote to Production"
```

---

## Maintenance Tasks

### Weekly

- [ ] Check error logs in Vercel
- [ ] Review AI usage costs
- [ ] Verify email deliverability
- [ ] Check database growth

### Monthly

- [ ] Run Lighthouse audit
- [ ] Review security advisories (npm audit)
- [ ] Update dependencies
- [ ] Backup Supabase data
- [ ] Review API usage patterns

### Quarterly

- [ ] Full E2E test suite
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Cost optimization review

---

## Emergency Procedures

### Site Down

1. Check Vercel status: https://vercel-status.com
2. Check Supabase status: https://status.supabase.com
3. Check recent deployments for breaking changes
4. If deployment issue: rollback to last working version
5. If database issue: contact Supabase support

### Data Breach

1. Immediately rotate all API keys
2. Disable affected user accounts
3. Review audit logs for unauthorized access
4. Notify affected users
5. Document incident

### AI Service Unavailable

1. Check Anthropic status
2. Temporarily disable AI features
3. Show user-friendly error messages
4. Queue requests for retry
5. Enable fallback to OpenRouter/Gemini

---

## Support Contacts

- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Anthropic Support**: support@anthropic.com

---

## Appendix

### File Paths Reference

| Feature | Location |
|---------|----------|
| Dashboard layout | `src/app/dashboard/layout.tsx` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Email service | `src/lib/email/email-service.ts` |
| AI agents | `src/lib/agents/` |
| API routes | `src/app/api/` |
| Components | `src/components/` |
| Migrations | `supabase/migrations/` |

### Environment-Specific URLs

| Environment | URL |
|------------|-----|
| Local | http://localhost:3008 |
| Preview | https://xxx-xxx.vercel.app |
| Production | https://unite-hub.vercel.app |

### Port Configuration

Default port is **3008** (not 3000).

Change in `package.json`:
```json
"dev": "next dev -p 3008"
```
