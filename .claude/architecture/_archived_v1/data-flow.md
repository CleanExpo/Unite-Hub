# Data Flow Diagrams

**Last Updated**: 2026-01-15

---

## Complete Flow: OAuth → Dashboard → Hot Leads

```
1. User clicks "Continue with Google" on /login
   ↓
2. Supabase OAuth (PKCE flow)
   ↓
3. Redirect to /auth/callback
   ↓
4. /auth/callback exchanges code for tokens (PKCE)
   ↓
5. Supabase creates session in cookies (server-side accessible)
   ↓
6. Redirect to /dashboard/overview
   ↓
7. AuthContext detects SIGNED_IN event
   ↓
8. Calls /api/auth/initialize-user (if first login)
    ↓
9. Fetches user profile from user_profiles table
    ↓
10. Fetches organizations from user_organizations + organizations tables
    ↓
11. Sets currentOrganization to first org
    ↓
12. Dashboard overview page renders
    ↓
13. Fetches stats from contacts + campaigns tables
    ↓
14. Passes workspaceId to HotLeadsPanel
    ↓
15. HotLeadsPanel calls /api/agents/contact-intelligence
    ↓
16. API calls getHotLeads(workspaceId)
    ↓
17. getHotLeads queries Supabase with workspace filter
    ↓
18. Calculates composite scores and filters
    ↓
19. Returns hot leads to panel
    ↓
20. Panel displays leads
```

**Critical Break Points** (FIXED in PKCE migration):
- ✅ User initialization triggered properly
- ✅ Organizations always defined (not undefined)
- ✅ Workspace filtering enforced
- ✅ workspaceId is UUID not string

---

## Email Processing Pipeline

```
Gmail Inbox
    ↓
1. Gmail OAuth sync triggered
    ↓
2. Fetch new emails via Gmail API
    ↓
3. Store in emails table (with workspace_id)
    ↓
4. Email Agent processes each email
    │   ├─→ Extract sender info
    │   ├─→ Identify intents (AI)
    │   ├─→ Analyze sentiment (AI)
    │   └─→ Link to contact
    ↓
5. Update or create contact record
    ↓
6. Calculate AI score (0-100)
    │   ├─→ Email engagement (40%)
    │   ├─→ Sentiment (20%)
    │   ├─→ Intent quality (20%)
    │   ├─→ Job title/role (10%)
    │   └─→ Status progression (10%)
    ↓
7. If score >= 80 (Hot Lead)
    ↓
8. Trigger Content Agent
    │   ├─→ Load contact context
    │   ├─→ Extended Thinking (5000-10000 tokens)
    │   ├─→ Generate personalized content
    │   └─→ Store in generatedContent table
    ↓
9. Display in Hot Leads Panel
    ↓
10. User reviews and approves content
    ↓
11. Send email via multi-provider service
    │   ├─→ Try SendGrid (priority 1)
    │   ├─→ Fallback to Resend (priority 2)
    │   └─→ Fallback to Gmail SMTP (priority 3)
    ↓
12. Track opens and clicks
    │   ├─→ email_opens table
    │   └─→ email_clicks table
```

---

## Drip Campaign Execution

```
Trigger Event
    ↓
1. Campaign enrollment created
    │   ├─→ campaign_enrollments table
    │   └─→ status: active
    ↓
2. Load drip campaign steps
    │   └─→ campaign_steps table (ordered)
    ↓
3. For each step in sequence:
    │
    ├─→ [email step]
    │   ├─→ Generate personalized content (Content Agent)
    │   ├─→ Send via multi-provider email service
    │   └─→ Log execution
    │
    ├─→ [wait step]
    │   ├─→ Calculate next execution time
    │   └─→ Schedule via Bull queue
    │
    ├─→ [condition step]
    │   ├─→ Evaluate condition (score, tag, behavior)
    │   └─→ Branch to A or B path
    │
    ├─→ [tag step]
    │   ├─→ Add/remove tags on contact
    │   └─→ Update contact metadata
    │
    ├─→ [score step]
    │   ├─→ Adjust AI score
    │   └─→ Recalculate status
    │
    └─→ [webhook step]
        ├─→ Call external API
        └─→ Handle response
    ↓
4. Log each execution
    │   └─→ campaign_execution_logs table
    ↓
5. If all steps complete
    │   └─→ Update enrollment status: completed
    ↓
6. If contact unsubscribes
    │   └─→ Update enrollment status: cancelled
```

---

## Real-Time Alert Flow (Phase 5 Week 4)

```
Alert Trigger Event
    ↓
1. Alert Processor receives event
    │   └─→ alertProcessor.processTriggerEvent()
    ↓
2. Check deduplication (5-min window)
    │   ├─→ If duplicate → Skip
    │   └─→ If new → Continue
    ↓
3. Evaluate alert rules
    │   └─→ Fetch from database (cached)
    ↓
4. For each triggered rule:
    │
    ├─→ Create alert record
    │   └─→ Store in database
    │
    ├─→ Add to Bull queue
    │   └─→ alertQueue.add()
    │
    └─→ Broadcast via WebSocket
        └─→ alertWebSocketManager.broadcastAlert()
    ↓
5. Bull queue processes alert job
    │   ├─→ Retry logic (3 attempts, exponential backoff)
    │   └─→ Multi-channel notifications
    │       ├─→ Email
    │       ├─→ Slack
    │       ├─→ Webhook
    │       └─→ In-App
    ↓
6. Client receives WebSocket message
    │   └─→ useAlertWebSocket hook
    │       ├─→ Update UI
    │       ├─→ Play notification sound
    │       └─→ Show toast
    ↓
7. Record metrics
    │   ├─→ AlertMetrics.recordAlertProcessed()
    │   ├─→ Track latency
    │   └─→ Update health score
```

---

## Content Generation Flow

```
User Request: "Generate content for warm leads"
    ↓
1. Orchestrator receives request
    ↓
2. Query warm leads (score 60-79)
    │   └─→ SELECT * FROM contacts WHERE ai_score BETWEEN 60 AND 79
    ↓
3. For each warm lead:
    │
    ├─→ Load contact context
    │   ├─→ Email history
    │   ├─→ Intents
    │   ├─→ Sentiment
    │   └─→ Metadata
    │
    ├─→ Invoke Content Agent
    │   ├─→ Model: claude-opus-4-5-20251101
    │   ├─→ Extended Thinking: enabled (5000-10000 tokens)
    │   ├─→ Prompt: Personalization instructions
    │   └─→ Generate email content
    │
    ├─→ Store draft
    │   └─→ generatedContent table (status: draft)
    │
    └─→ Return to user for review
    ↓
4. User reviews drafts
    │   ├─→ Approve → status: approved
    │   ├─→ Reject → status: rejected
    │   └─→ Edit → Update content
    ↓
5. Send approved content
    │   └─→ Multi-provider email service
```

---

## API Request Flow (with PKCE Auth)

```
Client Request
    ↓
1. Browser sends request with cookie
    │   └─→ Cookie contains session token
    ↓
2. Next.js middleware intercepts
    │   └─→ src/middleware.ts
    ↓
3. Validate session (server-side)
    │   ├─→ createMiddlewareClient()
    │   ├─→ supabase.auth.getUser()  // JWT validation
    │   └─→ NOT just reading cookies
    ↓
4. If invalid:
    │   └─→ Redirect to /login
    ↓
5. If valid:
    │   └─→ Continue to API route
    ↓
6. API route receives request
    │   └─→ src/app/api/[route]/route.ts
    ↓
7. Create server-side Supabase client
    │   ├─→ import { createClient } from "@/lib/supabase/server"
    │   └─→ const supabase = await createClient()
    ↓
8. Validate user again (defense in depth)
    │   ├─→ const { data: { user } } = await supabase.auth.getUser()
    │   └─→ If no user → 401 Unauthorized
    ↓
9. Extract workspaceId
    │   └─→ req.nextUrl.searchParams.get("workspaceId")
    ↓
10. Query database with workspace filter
    │   └─→ .from("table").select("*").eq("workspace_id", workspaceId)
    ↓
11. Return response
    │   └─→ NextResponse.json({ success: true, data })
```

---

## Workspace Isolation Pattern (CRITICAL)

```
Every Database Query Must Follow This Pattern:

❌ WRONG:
const { data } = await supabase
  .from("contacts")
  .select("*");
// Returns data from ALL workspaces

✅ CORRECT:
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);
// Returns only current workspace data

Enforcement:
├─→ RLS policies in database
├─→ API middleware validation
└─→ Client-side AuthContext
```

---

## Multi-Provider Email Flow

```
sendEmail() called
    ↓
1. Check provider priority list
    │   ├─→ Priority 1: SendGrid
    │   ├─→ Priority 2: Resend
    │   └─→ Priority 3: Gmail SMTP
    ↓
2. Try SendGrid
    │   ├─→ If success → Return
    │   └─→ If fails → Continue
    ↓
3. Try Resend
    │   ├─→ If success → Return
    │   └─→ If fails → Continue
    ↓
4. Try Gmail SMTP (fallback)
    │   ├─→ If success → Return
    │   └─→ If fails → Return error
    ↓
5. Log result
    │   ├─→ Provider used
    │   ├─→ Message ID
    │   └─→ Timestamp
```

---

**Source**: .claude/CLAUDE.md (Original), COMPLETE_SYSTEM_AUDIT.md
