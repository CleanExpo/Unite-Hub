# Quick Fix Guide - Common Issues & Solutions

**Purpose**: Resolve 90% of issues in <5 minutes

Last updated: 2025-12-02

---

## Issue: "workspace_id is undefined"

**Symptoms**:
- Queries return wrong data or empty results
- Data isolation broken (seeing other workspace data)
- Tests fail with workspace mismatch

**Cause**: Query missing `.eq('workspace_id', workspaceId)` filter

**Fix** (30 seconds):

```typescript
// BEFORE (WRONG)
const { data } = await supabase.from('contacts').select('*');

// AFTER (CORRECT)
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId);
```

**How to find it**:
```bash
grep -r "\.select\(.*\)" src/lib/agents/ | grep -v "workspace_id"
```

**Prevention**: Use ESLint rule to flag queries without workspace filter

---

## Issue: "supabase is not defined" or "supabase is undefined"

**Symptoms**:
- TypeError: Cannot read property 'from' of undefined
- Agent fails with ReferenceError
- Database operations crash

**Cause**: Wrong import of Supabase client

**Fix** (1 minute):

```typescript
// WRONG
import { supabase } from '@/lib/supabase';  // ❌ Incorrect
const data = await supabase.from(...).select(...);

// CORRECT - Use right client for context
// In API routes & server components:
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// In client components:
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// In middleware only:
import { createMiddlewareClient } from '@/lib/supabase/middleware';
const { supabase } = createMiddlewareClient(request);

// For admin operations:
import { supabaseAdmin } from '@/lib/supabase';
```

**Quick check**:
```bash
# Find incorrect imports
grep -r "import.*supabase.*from.*@/lib/supabase" src/ | grep -v "server\|client\|middleware\|admin"
```

---

## Issue: Email agent produces low quality output

**Symptoms**:
- Sentiment always returns 50
- Intent classification wrong
- Content feels generic

**Causes**:
1. Model is Haiku (too fast/cheap)
2. System prompt too vague
3. Input is too sparse

**Fix** (2 minutes):

```typescript
// Upgrade model from Haiku to Sonnet
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',  // ← Was 'claude-haiku-4-5-20251001'
  // ... rest of config
});

// Provide richer context
const input = {
  email: emailText,
  senderHistory: recentEmails,  // ← Add history for context
  companyProfile: senderCompany,  // ← Add company info
  recentInteractions: conversationThread,  // ← Add context
};
```

**Prevention**: Use Sonnet 4.5 as default (cost is worth quality improvement)

---

## Issue: Content generation takes 30+ seconds

**Symptoms**:
- API timeout on content generation
- User sees "waiting..." spinner too long
- Orchestrator workflow stalls

**Causes**:
1. Using Opus 4.5 with Extended Thinking (slow by design)
2. Network latency to Anthropic API
3. Anthropic service is slow

**Fix** (2 minutes):

```typescript
// Option 1: Use faster model for non-critical content
const model = isCritical ? 'opus-4-5' : 'sonnet-4-5';

// Option 2: Add explicit timeout & fallback
const result = await Promise.race([
  contentAgent.generate(input),
  timeout(5000).then(() => generateTemplate(input))
]);

// Option 3: Reduce thinking tokens if using Extended Thinking
thinking: {
  type: 'enabled',
  budget_tokens: 5000  // ← Reduce from 10000
}
```

**Prevention**:
- Profile content generation in staging
- Set realistic timeouts (5-10s for API calls)
- Use Sonnet 4.5 for time-sensitive tasks

---

## Issue: RLS policy prevents access

**Symptoms**:
- "ERROR: new row violates row-level security policy"
- Agent can't read/write data
- Tests fail with RLS errors

**Cause**: RLS policies not set up correctly or helper functions missing

**Fix** (3 minutes):

```bash
# Step 1: Run diagnostics
# In Supabase SQL Editor:
\i scripts/rls-diagnostics.sql

# If error "does not exist":
# Step 2: Create helper functions
# Migration: supabase/migrations/023_rls_helper_functions.sql
# See: .claude/RLS_WORKFLOW.md for complete process

# Step 3: Create policies on table
# Migration: supabase/migrations/024_enable_rls_table.sql

# Step 4: Test
SELECT * FROM contacts WHERE workspace_id = 'org_test';
```

**Prevention**: Always run diagnostics BEFORE writing RLS policies. See `.claude/RLS_WORKFLOW.md`

---

## Issue: API route returns 401 Unauthorized

**Symptoms**:
- Authentication fails
- Bearer token rejected
- PKCE flow broken

**Cause**: Missing or wrong JWT validation

**Fix** (2 minutes):

```typescript
// WRONG
const { data, error } = await supabase.auth.getUser(token);
// This doesn't validate server-side!

// CORRECT - Use server client
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed
}
```

**Prevention**: Always use server client in API routes, never trust client-side tokens

---

## Issue: Environment variables not loaded

**Symptoms**:
- process.env.ANTHROPIC_API_KEY is undefined
- Agent can't call Claude API
- "SENDGRID_API_KEY is missing"

**Cause**: Variables not in `.env.local` or wrong format

**Fix** (1 minute):

```bash
# Check what's set
echo $ANTHROPIC_API_KEY
echo $SENDGRID_API_KEY

# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret

# Restart dev server
npm run dev
```

**Prevention**:
- Keep `.env.local` in `.gitignore` (don't commit secrets)
- Copy `.env.example` to `.env.local` on first clone
- Check startup logs for missing vars

---

## Issue: Database query returns slow results

**Symptoms**:
- Contact score takes 5+ seconds
- Dashboard loads slowly
- Timeouts on large datasets

**Causes**:
1. No database index on workspace_id
2. N+1 query problem (fetching contacts in loop)
3. Large unfiltered result set

**Fix** (3 minutes):

```sql
-- Check if index exists
SELECT * FROM pg_indexes WHERE tablename = 'contacts';

-- Create missing index (if not there)
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);

-- Use LIMIT for large result sets
SELECT * FROM contacts
WHERE workspace_id = 'org_abc'
LIMIT 100;

-- Use batch operations instead of loops
-- WRONG:
for (let contact of contacts) {
  const score = await scoreContact(contact);  // N queries!
}

-- CORRECT:
const scores = await scoreAllContacts(contacts);  // 1 query
```

**Prevention**: Add indexes to workspace_id on all tables. See `COMPLETE_DATABASE_SCHEMA.sql`

---

## Issue: Email sync fails silently

**Symptoms**:
- No error message but emails aren't processing
- Agent runs but returns empty result
- Gmail doesn't authenticate

**Cause**: Gmail OAuth token expired or revoked

**Fix** (5 minutes):

```bash
# Step 1: Check token status
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://www.googleapis.com/oauth2/v1/tokeninfo

# Step 2: Re-authenticate Gmail
# In dashboard:
1. Go to Settings → Integrations → Gmail
2. Click "Disconnect" then "Reconnect"
3. Approve OAuth permissions again

# Step 3: Test sync
npm run email-agent

# Step 4: Check logs
grep -i "gmail\|oauth" logs/*.log
```

**Prevention**:
- Refresh tokens before they expire (30-day refresh window)
- Add token expiry monitoring
- Log all OAuth events

---

## Issue: Anthropic API rate limit exceeded

**Symptoms**:
- "rate_limit_exceeded" error
- 429 Too Many Requests
- Requests fail intermittently

**Cause**: Hitting Anthropic rate limits (requests/min or tokens/day)

**Fix** (2 minutes):

```typescript
// Add retry logic with exponential backoff
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    messages: [...]
  });
});

// Configuration in rate-limiter.ts:
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;  // 1 second
const BACKOFF_FACTOR = 2;     // Double wait time each retry
// Retry delays: 1s, 2s, 4s
```

**Prevention**:
- Monitor token usage daily
- Use prompt caching (90% savings) for repeated prompts
- Batch requests during off-peak hours

---

## Issue: Test fails with "Cannot find module"

**Symptoms**:
- Jest can't find @/lib/supabase
- Import error in test files
- Tests fail on CI but work locally

**Cause**: Jest path alias or TypeScript config issue

**Fix** (1 minute):

```json
// In jest.config.js:
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

Or use:
```bash
# Run tests with TypeScript support
npm run test -- --preset ts-jest
```

---

## Issue: Agent imports work locally but fail on Vercel

**Symptoms**:
- Local tests pass
- Vercel build fails: "module not found"
- Production errors but dev works

**Cause**: Path case sensitivity or missing files

**Fix** (2 minutes):

```bash
# Check file exists with exact case
ls -la src/lib/agents/email-processor.ts

# Fix imports to match exact case
// WRONG:
import { EmailProcessor } from '@/lib/agents/Email-Processor';

// CORRECT:
import { EmailProcessor } from '@/lib/agents/email-processor';
```

**Prevention**: Use lowercase filenames, verify in git

---

## Issue: Build fails with TypeScript errors

**Symptoms**:
- npm run build fails
- "Type 'undefined' is not assignable to type 'string'"
- Vercel deploy blocked

**Fix** (3 minutes):

```bash
# Run type checker
npm run typecheck

# See which files have errors
npm run typecheck 2>&1 | head -20

# Fix errors
# Option 1: Add types
const value: string = await getValue();

# Option 2: Use non-null assertion (careful!)
const value = await getValue()!;

# Option 3: Handle undefined
const value = await getValue() || '';
```

**Prevention**:
- Enable strict TypeScript: `"strict": true` in tsconfig.json
- Type all function parameters
- Use non-null assertions sparingly

---

## Issue: Pre-commit hook blocks commit

**Symptoms**:
- "lint-staged error"
- "prettier formatting failed"
- Can't git commit

**Fix** (1 minute):

```bash
# Option 1: Auto-fix with prettier
npm run lint:fix

# Option 2: Skip for this commit only (not recommended)
git commit --no-verify

# Option 3: Check what's wrong
npm run lint
```

**Prevention**: Run `npm run lint:fix` before committing

---

## 🚨 Emergency Issues

### If Anthropic API is down

```typescript
// Fallback to template-based content
const content = getTemplateContent(template, variables);
```

### If database is down

```typescript
// Switch to cached version
const data = await cache.get(cacheKey) || lastKnownValue;
```

### If authentication is broken

```bash
# Regenerate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Redeploy
vercel --prod
```

---

## Preventive Checklist

Before deploying:
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run build` - no TypeScript errors
- [ ] Run `npm run lint` - no linting errors
- [ ] Check `.env.local` has all required vars
- [ ] Verify workspace_id filters on all queries
- [ ] Check Anthropic API quotas
- [ ] Test on Vercel preview first

Before committing:
- [ ] Run `npm run lint:fix` to auto-format
- [ ] Run `npm test:unit` for quick validation
- [ ] Review git diff
- [ ] Write clear commit message

---

## When All Else Fails

1. **Check recent commits**: Did this work before?
   ```bash
   git log --oneline -5
   git diff HEAD~1
   ```

2. **Check error logs**:
   ```bash
   npm run dev 2>&1 | grep -i error
   ```

3. **Check database**:
   ```sql
   SELECT COUNT(*) FROM contacts WHERE workspace_id = 'org_xyz';
   ```

4. **Check API status**: https://status.anthropic.com

5. **Ask in docs**:
   - `.claude/context-manifest.md` - routing to right doc
   - `CLAUDE.md` - quick patterns
   - `.claude/RLS_WORKFLOW.md` - database issues

---

**Last resort**: Check git history to find when it broke, revert that commit, understand what went wrong.

**Status**: Covers 90% of issues. If yours isn't here, add it! 🎯
