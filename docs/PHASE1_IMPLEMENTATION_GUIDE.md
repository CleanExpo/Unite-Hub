# Phase 1 Implementation Guide: Email Intelligence System

**Timeline:** Week 1-2
**Status:** Ready to implement
**Priority:** P0 (Foundation for entire system)

---

## 📋 Overview

Phase 1 establishes the foundation of the Autonomous Intelligence System by implementing email intelligence extraction. This enables us to automatically analyze Duncan's 4 months of email correspondence and extract actionable business intelligence.

### Success Criteria

- ✅ Analyze 100 emails in < 5 minutes
- ✅ Extract 40-60 ideas from Duncan's emails
- ✅ 90%+ accuracy on intent extraction
- ✅ Cost per email: $0.02 (first run), $0.002 (cached)

---

## 🗂️ Files to Create/Modify

### New Files

1. `supabase/migrations/039_autonomous_intelligence_system.sql` ✅ Created
2. `src/lib/agents/email-intelligence-agent.ts` ✅ Created
3. `src/app/api/intelligence/analyze-email/route.ts` ⏳ To create
4. `src/app/api/intelligence/summary/[contactId]/route.ts` ⏳ To create
5. `scripts/analyze-contact-emails.mjs` ⏳ To create
6. `tests/agents/email-intelligence.test.ts` ⏳ To create

### Modified Files

1. `src/lib/db.ts` - Add email intelligence queries
2. `package.json` - Add new script: `analyze-contact-emails`

---

## 🚀 Step-by-Step Implementation

### Step 1: Run Database Migration (30 minutes)

**Location:** Supabase Dashboard → SQL Editor

**Actions:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/039_autonomous_intelligence_system.sql`
4. Run migration
5. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'email_intelligence',
     'dynamic_questionnaires',
     'questionnaire_responses',
     'autonomous_tasks',
     'marketing_strategies',
     'knowledge_graph_nodes',
     'knowledge_graph_edges'
   );
   ```
6. Expected result: 7 rows returned

**Troubleshooting:**
- If error about `user_workspaces` table not existing:
  - Check if table is named `user_organizations` instead
  - Update RLS policies to use correct table name
- If error about duplicate triggers:
  - Add `IF NOT EXISTS` to trigger creation
  - Or drop existing triggers first

---

### Step 2: Update Database Wrapper (`src/lib/db.ts`)

**Add email intelligence queries:**

```typescript
// Add to db.ts

export const db = {
  // ... existing code ...

  // Email Intelligence queries
  emailIntelligence: {
    async getByEmailId(emailId: string) {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase
        .from("email_intelligence")
        .select("*")
        .eq("email_id", emailId)
        .single();

      if (error) throw error;
      return data;
    },

    async getByContactId(contactId: string) {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase
        .from("email_intelligence")
        .select("*")
        .eq("contact_id", contactId)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    async create(intelligence: any) {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase
        .from("email_intelligence")
        .insert(intelligence)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getSummary(contactId: string) {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.rpc(
        "get_contact_intelligence_summary",
        { p_contact_id: contactId }
      );

      if (error) throw error;
      return data;
    },
  },
};
```

---

### Step 3: Create API Endpoints

#### 3.1 Analyze Email Endpoint

**File:** `src/app/api/intelligence/analyze-email/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { analyzeEmailForIntelligence } from "@/lib/agents/email-intelligence-agent";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emailId, workspaceId } = body;

    if (!emailId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing emailId or workspaceId" },
        { status: 400 }
      );
    }

    // Analyze email
    const result = await analyzeEmailForIntelligence(emailId, workspaceId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Analysis failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      intelligence: result.intelligence,
      cacheStats: result.cache_stats,
    });
  } catch (error) {
    console.error("Email intelligence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### 3.2 Contact Summary Endpoint

**File:** `src/app/api/intelligence/summary/[contactId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getContactIntelligenceSummary } from "@/lib/agents/email-intelligence-agent";

export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;

    // Get summary
    const summary = await getContactIntelligenceSummary(contactId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Intelligence summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Step 4: Create CLI Script for Batch Analysis

**File:** `scripts/analyze-contact-emails.mjs`

```javascript
#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get command line arguments
const contactId = process.argv[2];
const workspaceId = process.argv[3];

if (!contactId || !workspaceId) {
  console.error("Usage: npm run analyze-contact-emails <contactId> <workspaceId>");
  process.exit(1);
}

console.log(`\n🧠 Email Intelligence Extraction`);
console.log(`Contact ID: ${contactId}`);
console.log(`Workspace ID: ${workspaceId}\n`);

async function main() {
  // 1. Get all emails for contact
  const { data: emails, error: emailError } = await supabase
    .from("client_emails")
    .select("*")
    .eq("contact_id", contactId)
    .order("sent_at", { ascending: true });

  if (emailError) {
    console.error("Error fetching emails:", emailError);
    process.exit(1);
  }

  console.log(`📧 Found ${emails.length} emails to analyze\n`);

  let processed = 0;
  let cached = 0;
  let errors = 0;

  const stats = {
    totalIdeas: 0,
    totalGoals: 0,
    totalPainPoints: 0,
    totalRequirements: 0,
  };

  // 2. Analyze each email
  for (const email of emails) {
    try {
      // Check if already analyzed
      const { data: existing } = await supabase
        .from("email_intelligence")
        .select("id")
        .eq("email_id", email.id)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping email ${email.id} (already analyzed)`);
        cached++;
        continue;
      }

      console.log(`🔍 Analyzing: "${email.subject.substring(0, 50)}..."`);

      // Call Anthropic API
      const result = await analyzeEmail(email);

      // Store in database
      await supabase.from("email_intelligence").insert({
        email_id: email.id,
        contact_id: contactId,
        workspace_id: workspaceId,
        ideas: result.ideas,
        business_goals: result.business_goals,
        pain_points: result.pain_points,
        requirements: result.requirements,
        questions_asked: result.questions_asked,
        decisions_made: result.decisions_made,
        sentiment: result.sentiment,
        energy_level: result.energy_level,
        decision_readiness: result.decision_readiness,
        ai_model: "claude-sonnet-4-5-20250929",
        confidence_score: calculateConfidence(result),
      });

      stats.totalIdeas += result.ideas.length;
      stats.totalGoals += result.business_goals.length;
      stats.totalPainPoints += result.pain_points.length;
      stats.totalRequirements += result.requirements.length;

      processed++;
      console.log(`✅ Extracted: ${result.ideas.length} ideas, ${result.business_goals.length} goals\n`);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error analyzing email ${email.id}:`, error.message);
      errors++;
    }
  }

  // 3. Print summary
  console.log(`\n📊 Analysis Complete!\n`);
  console.log(`Processed: ${processed}`);
  console.log(`Cached: ${cached}`);
  console.log(`Errors: ${errors}`);
  console.log(`\n📈 Intelligence Extracted:`);
  console.log(`  Ideas: ${stats.totalIdeas}`);
  console.log(`  Goals: ${stats.totalGoals}`);
  console.log(`  Pain Points: ${stats.totalPainPoints}`);
  console.log(`  Requirements: ${stats.totalRequirements}`);
  console.log(`\n💰 Estimated Cost: $${(processed * 0.02).toFixed(2)}\n`);
}

async function analyzeEmail(email) {
  const SYSTEM_PROMPT = `You are an expert business intelligence analyst...`; // (use full prompt from agent)

  const emailContent = `
**FROM:** ${email.from}
**TO:** ${email.to}
**SUBJECT:** ${email.subject}
**DATE:** ${email.sent_at}

**EMAIL BODY:**
${email.body.substring(0, 4000)}

---

Analyze this email and extract business intelligence.
`.trim();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: emailContent,
      },
    ],
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

function calculateConfidence(result) {
  if (result.ideas.length === 0) return 0.5;
  return (
    result.ideas.reduce((sum, idea) => sum + idea.confidence_score, 0) /
    result.ideas.length
  );
}

main().catch(console.error);
```

**Update `package.json`:**

```json
{
  "scripts": {
    "analyze-contact-emails": "node scripts/analyze-contact-emails.mjs"
  }
}
```

---

### Step 5: Testing

#### 5.1 Unit Tests

**File:** `tests/agents/email-intelligence.test.ts`

```typescript
import { describe, test, expect, beforeAll } from "vitest";
import {
  analyzeEmailForIntelligence,
  batchAnalyzeContactEmails,
  getContactIntelligenceSummary,
} from "@/lib/agents/email-intelligence-agent";

describe("Email Intelligence Agent", () => {
  let testEmailId: string;
  let testContactId: string;
  let testWorkspaceId: string;

  beforeAll(async () => {
    // Create test data
    testEmailId = "test-email-123";
    testContactId = "test-contact-456";
    testWorkspaceId = "test-workspace-789";
  });

  test("analyzes email and extracts intelligence", async () => {
    const result = await analyzeEmailForIntelligence(testEmailId, testWorkspaceId);

    expect(result.success).toBe(true);
    expect(result.intelligence).toBeDefined();
    expect(result.intelligence.ideas).toBeInstanceOf(Array);
    expect(result.intelligence.business_goals).toBeInstanceOf(Array);
  });

  test("calculates sentiment correctly", async () => {
    const result = await analyzeEmailForIntelligence(testEmailId, testWorkspaceId);

    expect(result.intelligence.sentiment).toMatch(
      /excited|concerned|neutral|frustrated/
    );
    expect(result.intelligence.energy_level).toBeGreaterThanOrEqual(1);
    expect(result.intelligence.energy_level).toBeLessThanOrEqual(10);
  });

  test("uses prompt caching on repeated calls", async () => {
    const result1 = await analyzeEmailForIntelligence(testEmailId, testWorkspaceId);
    const result2 = await analyzeEmailForIntelligence(testEmailId, testWorkspaceId);

    expect(result2.cache_stats.cache_hit).toBe(true);
  });

  test("batch analyzes contact emails", async () => {
    const result = await batchAnalyzeContactEmails(
      testContactId,
      testWorkspaceId,
      10
    );

    expect(result.processed).toBeGreaterThan(0);
    expect(result.totalIntelligence.ideas).toBeGreaterThan(0);
  });

  test("generates intelligence summary", async () => {
    const summary = await getContactIntelligenceSummary(testContactId);

    expect(summary.totalEmailsAnalyzed).toBeGreaterThan(0);
    expect(summary.allIdeas.length).toBeGreaterThan(0);
  });
});
```

Run tests:
```bash
npm run test tests/agents/email-intelligence.test.ts
```

---

## 📝 Usage Examples

### Example 1: Analyze Duncan's Emails via CLI

```bash
# Get Duncan's contact ID
node -e "console.log('Duncan Contact ID: <insert-id>')"

# Run analysis
npm run analyze-contact-emails <duncan-contact-id> <workspace-id>

# Expected output:
# 🧠 Email Intelligence Extraction
# Contact ID: abc-123
# Workspace ID: xyz-789
#
# 📧 Found 45 emails to analyze
#
# 🔍 Analyzing: "Re: Business idea discussion..."
# ✅ Extracted: 3 ideas, 2 goals
#
# ... (continues for all emails)
#
# 📊 Analysis Complete!
# Processed: 45
# Cached: 0
# Errors: 0
#
# 📈 Intelligence Extracted:
#   Ideas: 52
#   Goals: 28
#   Pain Points: 31
#   Requirements: 19
#
# 💰 Estimated Cost: $0.90
```

### Example 2: Analyze Single Email via API

```bash
curl -X POST http://localhost:3008/api/intelligence/analyze-email \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "email-123",
    "workspaceId": "workspace-456"
  }'

# Response:
{
  "success": true,
  "intelligence": {
    "ideas": [
      {
        "id": "idea-1",
        "title": "AI-powered CRM",
        "description": "Build CRM with Claude AI integration",
        "category": "product",
        "confidence_score": 0.85
      }
    ],
    "business_goals": [...],
    "pain_points": [...],
    "sentiment": "excited",
    "energy_level": 8,
    "decision_readiness": 7
  },
  "cacheStats": {
    "input_tokens": 1234,
    "cache_creation_tokens": 456,
    "cache_read_tokens": 0,
    "output_tokens": 789,
    "cache_hit": false
  }
}
```

### Example 3: Get Intelligence Summary

```bash
curl http://localhost:3008/api/intelligence/summary/duncan-contact-id \
  -H "Authorization: Bearer <token>"

# Response:
{
  "success": true,
  "summary": {
    "totalEmailsAnalyzed": 45,
    "allIdeas": [52 unique ideas],
    "allGoals": [28 unique goals],
    "allPainPoints": [31 unique pain points],
    "allRequirements": [19 unique requirements],
    "avgSentiment": 1.2,
    "avgEnergyLevel": 7.5,
    "avgDecisionReadiness": 6.8
  }
}
```

---

## ✅ Acceptance Criteria

Before moving to Phase 2, verify:

- [ ] Migration 039 successfully run in Supabase
- [ ] 7 new tables created with RLS enabled
- [ ] Email Intelligence Agent passes all unit tests
- [ ] API endpoints functional and tested
- [ ] CLI script runs without errors
- [ ] Duncan's emails analyzed (45+ emails)
- [ ] 40-60 ideas extracted
- [ ] Intelligence summary accessible via API
- [ ] Total cost < $2.00 for complete analysis
- [ ] Analysis time < 5 minutes for 45 emails

---

## 🐛 Troubleshooting

### Issue: Migration fails with "column does not exist"

**Solution:** Check that `client_emails` table exists and has required columns:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'client_emails';
```

### Issue: RLS policy blocks access

**Solution:** Verify `user_workspaces` or `user_organizations` table exists and user has access:
```sql
SELECT * FROM user_workspaces WHERE user_id = auth.uid();
```

### Issue: Anthropic API rate limiting

**Solution:** Add delay between API calls in batch script:
```javascript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
```

### Issue: JSON parsing error from Claude

**Solution:** Add fallback parsing logic:
```typescript
try {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
} catch (error) {
  console.error("Failed to parse:", responseText);
  return defaultIntelligence;
}
```

---

## 📊 Progress Tracking

Use this checklist to track implementation progress:

- [ ] **Database Setup**
  - [ ] Run migration 039
  - [ ] Verify tables created
  - [ ] Test RLS policies

- [ ] **Code Implementation**
  - [ ] Email Intelligence Agent complete
  - [ ] Database wrapper updated
  - [ ] API endpoints created
  - [ ] CLI script created

- [ ] **Testing**
  - [ ] Unit tests written
  - [ ] Unit tests passing
  - [ ] Manual API testing complete
  - [ ] CLI script tested

- [ ] **Duncan Analysis**
  - [ ] All emails fetched
  - [ ] Batch analysis run
  - [ ] Intelligence summary generated
  - [ ] Results verified

---

**Next Phase:** [Phase 2 - Knowledge Graph Builder](./PHASE2_IMPLEMENTATION_GUIDE.md)

**Questions?** Check [AUTONOMOUS_INTELLIGENCE_SYSTEM.md](./AUTONOMOUS_INTELLIGENCE_SYSTEM.md) for architecture details.
