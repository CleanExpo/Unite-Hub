# 👥 Contact Management Agent

## Agent Overview

**Agent Name:** Contact Management Agent
**Agent ID:** `unite-hub.contact-agent`
**Type:** Core CRM Agent
**Priority:** P0 (Critical - Week 2)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-sonnet-4-5-20250929` (standard operations), `claude-opus-4-5-20251101` (AI scoring)

### Database Tables Used

This agent manages 4 core contact relationship tables:

1. **`contacts`** - Primary contact records (CRM database)
2. **`interactions`** - Interaction history (emails, calls, meetings, notes)
3. **`contact_interactions`** - Legacy table (to be deprecated)
4. **`client_emails`** - Client-specific email storage (Gmail sync)

### Related Tables (Read-Only Access)

- **`emails`** - Inbound email storage (for contact linking)
- **`sent_emails`** - Outbound emails (for engagement tracking)
- **`email_opens`** - Open tracking (for AI scoring)
- **`email_clicks`** - Click tracking (for AI scoring)
- **`campaign_enrollments`** - Campaign participation
- **`generated_content`** - Content generated for contacts

---

## Purpose & Scope

### Responsibilities

The Contact Agent is the **central CRM intelligence** for Unite-Hub, managing:

#### 1. Contact Lifecycle Management
- Create, read, update, delete (CRUD) contacts
- Contact deduplication (fuzzy matching on email/name)
- Contact enrichment (company, job title, LinkedIn data)
- Contact status progression (prospect → lead → customer)
- Custom field management (JSONB storage)
- Tag management and bulk tagging

#### 2. Contact Segmentation & Lists
- Dynamic segments (filter by tags, score, status, industry)
- Saved segments (reusable filters)
- Smart lists (auto-update based on rules)
- Export to CSV (with field mapping)
- Import from CSV (with validation and deduplication)

#### 3. AI-Powered Lead Scoring
- Composite scoring algorithm (0-100 scale)
- Engagement scoring (email opens, clicks, replies)
- Behavioral scoring (website visits, form submissions)
- Demographic scoring (job title, company size, industry)
- Real-time score updates on events
- Score decay (reduce score over time if no engagement)

#### 4. Interaction Tracking
- Email interactions (sent, opened, clicked, replied)
- Call logging (manual entry)
- Meeting tracking (calendar integration)
- Note taking (manual annotations)
- Task management (follow-up reminders)
- Timeline view (chronological interaction history)

#### 5. Contact Intelligence & Insights
- Engagement summary (last 30/60/90 days)
- Communication frequency analysis
- Best time to contact (timezone + behavioral patterns)
- Relationship strength score
- Churn risk prediction (inactive contacts)
- Next best action recommendations (AI-powered)

#### 6. Data Quality & Compliance
- Email validation (syntax + deliverability check)
- Phone number formatting (Australian +61 format)
- Duplicate detection and merging
- GDPR consent tracking
- Data retention policies (auto-delete after X days)
- PII redaction in logs

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== CONTACTS TABLE (Primary CRM Database) =====
interface Contact {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy

  // Basic info
  name: string; // Full name
  email: string; // Primary email (unique per workspace)
  company?: string; // Company name
  phone?: string; // Phone number (formatted as +61 XXX XXX XXX)
  job_title?: string; // Role/position

  // Extended fields (from migration 009)
  industry?: string; // e.g., "Technology", "Healthcare", "Finance"
  source?: string; // Lead source (e.g., "website", "referral", "trade_show")
  custom_fields?: Record<string, any>; // JSONB for unlimited custom fields

  // AI scoring
  ai_score: number; // 0.0-1.0 (displayed as 0-100)

  // Lifecycle status
  status: 'prospect' | 'lead' | 'customer' | 'contact';

  // Engagement tracking
  last_interaction?: string; // ISO timestamp of most recent interaction
  last_contacted_at?: string; // ISO timestamp when we last reached out

  // Segmentation
  tags: string[]; // Array of tags (e.g., ["vip", "enterprise", "australia"])

  // Subscription status
  email_subscription_status?: 'subscribed' | 'unsubscribed' | 'bounced';
  unsubscribed_at?: string; // ISO timestamp
  unsubscribe_reason?: string;

  // Email deliverability
  email_status?: 'valid' | 'invalid' | 'unreachable'; // From bounce tracking
  email_bounced_at?: string; // ISO timestamp

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  // Constraints
  // UNIQUE(workspace_id, email) - Prevents duplicate emails per workspace
}

// ===== INTERACTIONS TABLE (Interaction History) =====
interface Interaction {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id: string; // UUID - References contacts.id

  // Interaction details
  interaction_type:
    | 'email_sent'
    | 'email_opened'
    | 'email_clicked'
    | 'email_replied'
    | 'call'
    | 'meeting'
    | 'note'
    | 'task'
    | 'form_submission'
    | 'website_visit'
    | 'demo_request'
    | 'purchase';

  subject?: string; // Title/summary (max 500 chars)
  details: Record<string, any>; // JSONB for interaction-specific data

  // Example details formats:
  // email_sent: { email_id: "uuid", campaign_id: "uuid", subject: "..." }
  // call: { duration_minutes: 15, outcome: "interested", notes: "..." }
  // meeting: { calendar_event_id: "...", attendees: [...], outcome: "..." }
  // note: { content: "Customer mentioned budget constraints" }
  // task: { due_date: "2025-12-01", assigned_to: "uuid", status: "pending" }

  // Timing
  interaction_date: string; // ISO timestamp when interaction occurred

  // Attribution
  created_by?: string; // UUID - User who created/performed interaction

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== CLIENT EMAILS TABLE (Client-Specific Email Storage) =====
interface ClientEmail {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  org_id: string; // UUID - Organization owner

  // Email source
  integration_id?: string; // UUID - Which Gmail account synced this
  provider_message_id: string; // Gmail Message-ID (unique)
  provider_thread_id?: string; // Gmail Thread-ID (for threading)

  // Email headers
  from_email: string;
  from_name?: string;
  to_emails: string[]; // Array of recipients
  cc_emails?: string[];
  bcc_emails?: string[];
  subject?: string;

  // Email body
  body_html?: string; // HTML version
  body_text?: string; // Plain text version
  snippet?: string; // First 200 characters (for previews)

  // Associations
  contact_id?: string; // UUID - Auto-linked to contact (if found)

  // Email metadata
  direction: 'inbound' | 'outbound';
  is_read: boolean;
  is_starred: boolean;
  labels: string[]; // Gmail labels

  // AI processing
  ai_processed: boolean;
  ai_summary?: string;
  ai_intent?: 'inquiry' | 'proposal' | 'complaint' | 'question' | 'followup' | 'meeting';
  ai_sentiment?: 'positive' | 'neutral' | 'negative';
  ai_action_items?: string[]; // Extracted action items

  // Attachments
  has_attachments: boolean;
  attachment_count: number;
  attachment_metadata?: Array<{
    filename: string;
    mime_type: string;
    size_bytes: number;
  }>;

  // Timestamps
  received_at: string; // ISO timestamp (email sent time)
  processed_at?: string; // ISO timestamp (AI processing time)
  created_at: string; // ISO timestamp (synced to DB)
}

// ===== CONTACT SEARCH QUERY (Input Type) =====
interface ContactSearchQuery {
  workspace_id: string; // REQUIRED

  // Text search
  query?: string; // Full-text search across name, email, company

  // Filters
  status?: 'prospect' | 'lead' | 'customer' | 'contact' | 'all';
  tags?: string[]; // Match ANY of these tags
  tags_operator?: 'AND' | 'OR'; // Match ALL or ANY tags
  industry?: string[];
  source?: string[];

  // Score range
  min_score?: number; // 0-100
  max_score?: number; // 0-100

  // Date range
  created_after?: string; // ISO timestamp
  created_before?: string; // ISO timestamp
  last_interaction_after?: string;
  last_interaction_before?: string;

  // Subscription status
  subscription_status?: 'subscribed' | 'unsubscribed' | 'bounced';

  // Custom fields
  custom_filters?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
    value: any;
  }>;

  // Sorting
  sort_by?: 'name' | 'email' | 'ai_score' | 'created_at' | 'last_interaction';
  sort_order?: 'asc' | 'desc';

  // Pagination
  limit?: number; // Default: 50, Max: 1000
  offset?: number; // Default: 0
}

// ===== AI SCORING INPUT (For Score Calculation) =====
interface ScoringInput {
  contact_id: string;
  workspace_id: string;

  // Engagement signals
  email_opens_30d: number;
  email_clicks_30d: number;
  email_replies_30d: number;

  // Behavioral signals
  website_visits_30d: number;
  form_submissions_30d: number;
  demo_requests_30d: number;

  // Demographic signals
  job_title?: string; // Score higher for "CEO", "Director", "VP"
  company_size?: 'startup' | 'smb' | 'mid_market' | 'enterprise';
  industry?: string; // Score higher for target industries

  // Recency
  days_since_last_interaction: number;
  days_since_created: number;

  // Lifecycle
  current_status: 'prospect' | 'lead' | 'customer' | 'contact';
}

// ===== AI SCORING OUTPUT =====
interface ScoringResult {
  contact_id: string;
  ai_score: number; // 0.0-1.0 (displayed as 0-100)
  score_breakdown: {
    engagement: number; // 0-40 points (email opens, clicks, replies)
    behavioral: number; // 0-20 points (website visits, form submissions)
    demographic: number; // 0-20 points (job title, company size)
    recency: number; // 0-10 points (days since last interaction)
    lifecycle: number; // 0-10 points (prospect=0, lead=5, customer=10)
  };
  score_label: 'cold' | 'warm' | 'hot'; // Cold: 0-39, Warm: 40-69, Hot: 70-100
  confidence: number; // 0.0-1.0 (confidence in score accuracy)
  reasons: string[]; // Human-readable explanations
  recommendations: string[]; // Next best actions
}
```

---

## Core Functions

### 1. Create Contact

**Function:** `createContact(data: ContactInput): Promise<Contact>`

**Purpose:** Create a new contact with deduplication

**Input:**
```typescript
{
  workspace_id: "uuid",
  name: "John Smith",
  email: "john@acme.com",
  company: "Acme Corp",
  phone: "+61 412 345 678",
  job_title: "Marketing Director",
  industry: "Technology",
  source: "website",
  tags: ["enterprise", "australia"],
  custom_fields: {
    "linkedin_url": "https://linkedin.com/in/johnsmith",
    "annual_revenue": "$5M-$10M"
  }
}
```

**Output:**
```typescript
{
  success: true,
  contact: {
    id: "uuid",
    workspace_id: "uuid",
    name: "John Smith",
    email: "john@acme.com",
    ai_score: 0.45, // Initial score based on demographics
    status: "prospect",
    created_at: "2025-11-18T10:00:00Z"
  }
}
```

**Business Logic:**

1. **Validate Input:**
   ```typescript
   if (!name || !email || !workspace_id) {
     throw new Error('CONTACT_001: Missing required fields');
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     throw new Error('CONTACT_002: Invalid email format');
   }

   // Format phone number (Australian)
   if (phone) {
     phone = formatAustralianPhone(phone);
   }
   ```

2. **Check for Duplicate (Fuzzy Matching):**
   ```sql
   -- Exact email match
   SELECT * FROM contacts
   WHERE workspace_id = $1 AND LOWER(email) = LOWER($2);

   -- If no exact match, check for similar names + company
   SELECT *, similarity(name, $1) AS sim
   FROM contacts
   WHERE workspace_id = $2
     AND company ILIKE $3
     AND similarity(name, $1) > 0.7
   ORDER BY sim DESC
   LIMIT 5;
   ```

3. **Calculate Initial AI Score:**
   ```typescript
   const initialScore = calculateInitialScore({
     job_title,
     company_size: inferCompanySize(company),
     industry,
     source
   });

   // Score breakdown:
   // - Executive titles (CEO, VP, Director): +15 points
   // - Enterprise companies: +10 points
   // - Target industries: +10 points
   // - High-value sources (referral, partner): +10 points
   ```

4. **Insert Contact:**
   ```sql
   INSERT INTO contacts (
     workspace_id, name, email, company, phone, job_title,
     industry, source, custom_fields, tags,
     ai_score, status, created_at, updated_at
   ) VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'prospect', NOW(), NOW()
   )
   ON CONFLICT (workspace_id, email)
   DO UPDATE SET
     name = EXCLUDED.name,
     company = COALESCE(EXCLUDED.company, contacts.company),
     phone = COALESCE(EXCLUDED.phone, contacts.phone),
     job_title = COALESCE(EXCLUDED.job_title, contacts.job_title),
     updated_at = NOW()
   RETURNING *;
   ```

5. **Create Initial Interaction:**
   ```sql
   INSERT INTO interactions (
     workspace_id, contact_id, interaction_type, subject, details, interaction_date
   ) VALUES (
     $1, $2, 'note', 'Contact created',
     jsonb_build_object('source', $3, 'created_by', $4),
     NOW()
   );
   ```

**Error Codes:**
- `CONTACT_001` - Missing required fields (name, email, workspace_id)
- `CONTACT_002` - Invalid email format
- `CONTACT_003` - Duplicate email in workspace

---

### 2. Update AI Score

**Function:** `updateAIScore(contact_id: string, scoring_input: ScoringInput): Promise<ScoringResult>`

**Purpose:** Calculate and update contact AI score (0-100)

**Input:**
```typescript
{
  contact_id: "uuid",
  workspace_id: "uuid",
  // Engagement metrics (last 30 days)
  email_opens_30d: 5,
  email_clicks_30d: 3,
  email_replies_30d: 1,
  // Behavioral metrics
  website_visits_30d: 8,
  form_submissions_30d: 1,
  // Demographics
  job_title: "VP of Marketing",
  company_size: "enterprise",
  industry: "Technology",
  // Recency
  days_since_last_interaction: 2
}
```

**Output:**
```typescript
{
  contact_id: "uuid",
  ai_score: 0.78, // 78/100
  score_breakdown: {
    engagement: 32, // High email engagement
    behavioral: 16, // Website visits + form submission
    demographic: 18, // VP title + enterprise + tech industry
    recency: 10, // Recent interaction
    lifecycle: 5 // Lead status
  },
  score_label: "hot",
  confidence: 0.85,
  reasons: [
    "High email engagement (5 opens, 3 clicks in 30 days)",
    "Recent interaction (2 days ago)",
    "Executive title (VP of Marketing)",
    "Target industry (Technology)"
  ],
  recommendations: [
    "Schedule demo call within next 48 hours",
    "Send personalized proposal",
    "Add to VIP nurture campaign"
  ]
}
```

**Scoring Algorithm:**

```typescript
function calculateAIScore(input: ScoringInput): ScoringResult {
  let total_score = 0;
  const breakdown = {
    engagement: 0,
    behavioral: 0,
    demographic: 0,
    recency: 0,
    lifecycle: 0
  };

  // ===== 1. ENGAGEMENT (40 points max) =====
  // Email opens (max 15 points)
  breakdown.engagement += Math.min(input.email_opens_30d * 3, 15);

  // Email clicks (max 15 points)
  breakdown.engagement += Math.min(input.email_clicks_30d * 5, 15);

  // Email replies (max 10 points)
  breakdown.engagement += Math.min(input.email_replies_30d * 10, 10);

  // ===== 2. BEHAVIORAL (20 points max) =====
  // Website visits (max 10 points)
  breakdown.behavioral += Math.min(input.website_visits_30d * 2, 10);

  // Form submissions (max 10 points)
  breakdown.behavioral += Math.min(input.form_submissions_30d * 10, 10);

  // ===== 3. DEMOGRAPHIC (20 points max) =====
  // Job title scoring
  const titleScores = {
    'CEO': 20, 'CTO': 20, 'CFO': 20, 'COO': 20,
    'VP': 15, 'Vice President': 15, 'SVP': 15,
    'Director': 10, 'Head of': 10,
    'Manager': 5, 'Lead': 5,
    'default': 0
  };

  const titleScore = Object.entries(titleScores)
    .find(([title]) => input.job_title?.toLowerCase().includes(title.toLowerCase()))?.[1] || 0;

  breakdown.demographic += titleScore;

  // Company size scoring (already capped at 20 by title score)
  const companySizeScores = {
    'enterprise': 5,
    'mid_market': 3,
    'smb': 1,
    'startup': 0
  };
  breakdown.demographic += companySizeScores[input.company_size || 'smb'];

  // Cap demographic at 20
  breakdown.demographic = Math.min(breakdown.demographic, 20);

  // ===== 4. RECENCY (10 points max) =====
  // Decay score based on days since last interaction
  if (input.days_since_last_interaction <= 7) {
    breakdown.recency = 10; // Very recent
  } else if (input.days_since_last_interaction <= 14) {
    breakdown.recency = 8;
  } else if (input.days_since_last_interaction <= 30) {
    breakdown.recency = 5;
  } else if (input.days_since_last_interaction <= 60) {
    breakdown.recency = 2;
  } else {
    breakdown.recency = 0; // Stale contact
  }

  // ===== 5. LIFECYCLE (10 points max) =====
  const lifecycleScores = {
    'prospect': 0,
    'lead': 5,
    'customer': 10,
    'contact': 2
  };
  breakdown.lifecycle = lifecycleScores[input.current_status];

  // ===== CALCULATE TOTAL (0-100) =====
  total_score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  const ai_score = total_score / 100; // Normalize to 0.0-1.0

  // Determine label
  let score_label: 'cold' | 'warm' | 'hot';
  if (total_score >= 70) score_label = 'hot';
  else if (total_score >= 40) score_label = 'warm';
  else score_label = 'cold';

  // Calculate confidence (based on data completeness)
  const data_points = [
    input.email_opens_30d,
    input.email_clicks_30d,
    input.job_title,
    input.company_size,
    input.industry
  ].filter(v => v !== undefined && v !== null && v !== 0).length;

  const confidence = Math.min(data_points / 5, 1.0);

  return {
    contact_id: input.contact_id,
    ai_score,
    score_breakdown: breakdown,
    score_label,
    confidence,
    reasons: generateReasons(breakdown, input),
    recommendations: generateRecommendations(ai_score, breakdown)
  };
}
```

**Update Database:**
```sql
UPDATE contacts
SET ai_score = $1, updated_at = NOW()
WHERE id = $2;
```

**Error Codes:**
- `CONTACT_004` - Contact not found
- `CONTACT_005` - Invalid scoring input

---

### 3. Search Contacts (Advanced Filtering)

**Function:** `searchContacts(query: ContactSearchQuery): Promise<ContactSearchResult>`

**Purpose:** Search and filter contacts with pagination

**Input:**
```typescript
{
  workspace_id: "uuid",
  query: "acme", // Full-text search
  tags: ["enterprise", "australia"],
  tags_operator: "AND",
  min_score: 60,
  status: "lead",
  created_after: "2025-01-01T00:00:00Z",
  sort_by: "ai_score",
  sort_order: "desc",
  limit: 50,
  offset: 0
}
```

**Output:**
```typescript
{
  success: true,
  contacts: [
    {
      id: "uuid",
      name: "John Smith",
      email: "john@acme.com",
      company: "Acme Corp",
      ai_score: 0.78,
      status: "lead",
      tags: ["enterprise", "australia"],
      last_interaction: "2025-11-16T14:30:00Z"
    }
  ],
  total: 247,
  limit: 50,
  offset: 0,
  has_more: true
}
```

**SQL Query Building:**
```sql
SELECT *
FROM contacts
WHERE workspace_id = $1
  -- Full-text search
  AND (
    $2::text IS NULL OR (
      name ILIKE '%' || $2 || '%' OR
      email ILIKE '%' || $2 || '%' OR
      company ILIKE '%' || $2 || '%'
    )
  )
  -- Status filter
  AND ($3::text IS NULL OR status = $3)
  -- Score range
  AND ($4::numeric IS NULL OR ai_score >= $4 / 100.0)
  AND ($5::numeric IS NULL OR ai_score <= $5 / 100.0)
  -- Tags filter (AND operator)
  AND ($6::text[] IS NULL OR tags @> $6) -- Contains all tags
  -- Date range
  AND ($7::timestamptz IS NULL OR created_at >= $7)
  AND ($8::timestamptz IS NULL OR created_at <= $8)
ORDER BY
  CASE WHEN $9 = 'ai_score' THEN ai_score END DESC,
  CASE WHEN $9 = 'name' THEN name END ASC,
  CASE WHEN $9 = 'created_at' THEN created_at END DESC
LIMIT $10 OFFSET $11;
```

---

### 4. Log Interaction

**Function:** `logInteraction(data: InteractionInput): Promise<Interaction>`

**Purpose:** Record a contact interaction (email, call, meeting, note)

**Input:**
```typescript
{
  workspace_id: "uuid",
  contact_id: "uuid",
  interaction_type: "call",
  subject: "Discovery call",
  details: {
    duration_minutes: 30,
    outcome: "interested",
    notes: "Customer is evaluating 3 vendors. Budget: $50k. Decision by end of Q1.",
    next_steps: "Send proposal by Friday"
  },
  interaction_date: "2025-11-18T14:00:00Z",
  created_by: "uuid"
}
```

**Output:**
```typescript
{
  success: true,
  interaction: {
    id: "uuid",
    contact_id: "uuid",
    interaction_type: "call",
    subject: "Discovery call",
    interaction_date: "2025-11-18T14:00:00Z",
    created_at: "2025-11-18T14:05:00Z"
  }
}
```

**Business Logic:**

1. **Insert Interaction:**
   ```sql
   INSERT INTO interactions (
     workspace_id, contact_id, interaction_type, subject, details,
     interaction_date, created_by, created_at, updated_at
   ) VALUES (
     $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
   ) RETURNING *;
   ```

2. **Update Contact Last Interaction:**
   ```sql
   UPDATE contacts
   SET
     last_interaction = $1,
     last_contacted_at = CASE
       WHEN $2 IN ('email_sent', 'call') THEN $1
       ELSE last_contacted_at
     END,
     updated_at = NOW()
   WHERE id = $3;
   ```

3. **Trigger AI Score Update (Async):**
   ```typescript
   // Queue background job to recalculate score
   await queueJob('update-contact-score', {
     contact_id,
     workspace_id
   });
   ```

---

### 5. Get Contact Timeline

**Function:** `getContactTimeline(contact_id: string, options?: TimelineOptions): Promise<TimelineResult>`

**Purpose:** Get chronological interaction history for a contact

**Input:**
```typescript
{
  contact_id: "uuid",
  workspace_id: "uuid",
  interaction_types: ["email_sent", "call", "meeting"], // Optional filter
  limit: 50,
  offset: 0
}
```

**Output:**
```typescript
{
  success: true,
  timeline: [
    {
      id: "uuid",
      interaction_type: "email_sent",
      subject: "Follow-up after demo",
      interaction_date: "2025-11-18T10:00:00Z",
      details: {
        email_id: "uuid",
        opened: true,
        clicked: true,
        opens_count: 3,
        clicks_count: 2
      }
    },
    {
      id: "uuid",
      interaction_type: "meeting",
      subject: "Product demo",
      interaction_date: "2025-11-15T14:00:00Z",
      details: {
        duration_minutes: 45,
        attendees: ["uuid1", "uuid2"],
        outcome: "very_interested"
      }
    }
  ],
  total: 23,
  contact: {
    id: "uuid",
    name: "John Smith",
    email: "john@acme.com",
    ai_score: 0.78
  }
}
```

**SQL Query:**
```sql
SELECT * FROM interactions
WHERE contact_id = $1 AND workspace_id = $2
  AND ($3::text[] IS NULL OR interaction_type = ANY($3))
ORDER BY interaction_date DESC
LIMIT $4 OFFSET $5;
```

---

### 6. Merge Contacts (Deduplication)

**Function:** `mergeContacts(primary_id: string, duplicate_id: string): Promise<Contact>`

**Purpose:** Merge duplicate contacts, preserving data

**Input:**
```typescript
{
  primary_id: "uuid1", // Keep this contact
  duplicate_id: "uuid2", // Merge and delete this
  workspace_id: "uuid"
}
```

**Output:**
```typescript
{
  success: true,
  merged_contact: {
    id: "uuid1",
    name: "John Smith",
    email: "john@acme.com",
    // Merged fields from both contacts
  },
  interactions_moved: 15,
  campaign_enrollments_moved: 3
}
```

**Business Logic:**

1. **Merge Contact Fields:**
   ```sql
   UPDATE contacts
   SET
     -- Prefer non-null values from primary, fallback to duplicate
     company = COALESCE(contacts.company, dup.company),
     phone = COALESCE(contacts.phone, dup.phone),
     job_title = COALESCE(contacts.job_title, dup.job_title),
     -- Merge tags (unique)
     tags = ARRAY(SELECT DISTINCT unnest(contacts.tags || dup.tags)),
     -- Merge custom fields (deep merge)
     custom_fields = contacts.custom_fields || dup.custom_fields,
     -- Keep higher AI score
     ai_score = GREATEST(contacts.ai_score, dup.ai_score),
     updated_at = NOW()
   FROM contacts AS dup
   WHERE contacts.id = $1 AND dup.id = $2;
   ```

2. **Move Interactions:**
   ```sql
   UPDATE interactions
   SET contact_id = $1, updated_at = NOW()
   WHERE contact_id = $2;
   ```

3. **Move Campaign Enrollments:**
   ```sql
   UPDATE campaign_enrollments
   SET contact_id = $1, updated_at = NOW()
   WHERE contact_id = $2;
   ```

4. **Delete Duplicate:**
   ```sql
   DELETE FROM contacts WHERE id = $1;
   ```

**Error Codes:**
- `CONTACT_006` - Cannot merge contacts from different workspaces
- `CONTACT_007` - Primary and duplicate cannot be same contact

---

### 7. Export Contacts (CSV)

**Function:** `exportContacts(query: ContactSearchQuery, fields: string[]): Promise<CSVExportResult>`

**Purpose:** Export filtered contacts to CSV

**Input:**
```typescript
{
  query: {
    workspace_id: "uuid",
    tags: ["enterprise"],
    min_score: 70
  },
  fields: ["name", "email", "company", "ai_score", "status", "last_interaction"]
}
```

**Output:**
```typescript
{
  success: true,
  csv_url: "https://storage.unite-hub.com/exports/contacts-2025-11-18.csv",
  total_records: 156,
  file_size_bytes: 45678,
  expires_at: "2025-11-19T10:00:00Z" // 24 hour expiry
}
```

**CSV Format:**
```csv
Name,Email,Company,AI Score,Status,Last Interaction
John Smith,john@acme.com,Acme Corp,78,lead,2025-11-16T14:30:00Z
Jane Doe,jane@beta.com,Beta Inc,85,customer,2025-11-18T09:00:00Z
```

---

## API Endpoints

### 1. Create Contact

**Endpoint:** `POST /api/contacts`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "name": "John Smith",
  "email": "john@acme.com",
  "company": "Acme Corp",
  "phone": "+61 412 345 678",
  "job_title": "Marketing Director",
  "industry": "Technology",
  "source": "website",
  "tags": ["enterprise", "australia"],
  "custom_fields": {
    "linkedin_url": "https://linkedin.com/in/johnsmith"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "contact": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@acme.com",
    "ai_score": 45,
    "status": "prospect",
    "created_at": "2025-11-18T10:00:00Z"
  }
}
```

---

### 2. Search Contacts

**Endpoint:** `GET /api/contacts`

**Query Params:**
```
?workspaceId=uuid
&query=acme
&tags=enterprise,australia
&minScore=60
&status=lead
&sortBy=ai_score
&sortOrder=desc
&limit=50
&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "contacts": [...],
  "total": 247,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

---

### 3. Update AI Score

**Endpoint:** `POST /api/contacts/:contact_id/score`

**Request Body:**
```json
{
  "workspaceId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "scoring_result": {
    "contact_id": "uuid",
    "ai_score": 0.78,
    "score_breakdown": {...},
    "score_label": "hot",
    "recommendations": [...]
  }
}
```

---

### 4. Log Interaction

**Endpoint:** `POST /api/contacts/:contact_id/interactions`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "interaction_type": "call",
  "subject": "Discovery call",
  "details": {
    "duration_minutes": 30,
    "outcome": "interested"
  },
  "interaction_date": "2025-11-18T14:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "interaction": {
    "id": "uuid",
    "interaction_type": "call",
    "subject": "Discovery call",
    "created_at": "2025-11-18T14:05:00Z"
  }
}
```

---

### 5. Get Contact Timeline

**Endpoint:** `GET /api/contacts/:contact_id/timeline`

**Query Params:**
```
?workspaceId=uuid
&limit=50
&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "timeline": [...],
  "total": 23
}
```

---

### 6. Merge Contacts

**Endpoint:** `POST /api/contacts/:primary_id/merge`

**Request Body:**
```json
{
  "duplicate_id": "uuid2",
  "workspaceId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "merged_contact": {...},
  "interactions_moved": 15
}
```

---

### 7. Export Contacts

**Endpoint:** `POST /api/contacts/export`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "query": {
    "tags": ["enterprise"],
    "min_score": 70
  },
  "fields": ["name", "email", "company", "ai_score"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "csv_url": "https://storage.unite-hub.com/exports/contacts-2025-11-18.csv",
  "total_records": 156,
  "expires_at": "2025-11-19T10:00:00Z"
}
```

---

## Integration Points

### Inputs (What Triggers This Agent)

1. **Email Agent:**
   - New email received → Create contact or link to existing
   - Email opened → Log interaction, update score
   - Email clicked → Log interaction, update score
   - Email replied → Log interaction, update score

2. **Campaign Agent:**
   - Campaign enrollment → Verify contact exists
   - Campaign completed → Update contact status (prospect → lead)

3. **User Actions (Dashboard UI):**
   - Create/edit contact
   - Add tags
   - Log manual interaction (call, meeting, note)
   - Merge duplicates

4. **Webhooks:**
   - Form submissions (website, landing pages)
   - CRM integrations (Salesforce, HubSpot sync)

### Outputs (What This Agent Provides)

1. **To Campaign Agent:**
   - Contact eligibility for enrollment
   - Contact segments for targeting

2. **To Email Agent:**
   - Contact email addresses for sending
   - Unsubscribe status

3. **To Analytics Agent:**
   - Contact lifecycle metrics
   - Score distribution

4. **To Content Agent:**
   - Contact context for personalization

---

## Business Rules

### 1. Contact Deduplication

**Exact Match:** Email address (case-insensitive)
**Fuzzy Match:** Name similarity + Company match (> 70% confidence)

---

### 2. AI Score Decay

Contacts lose 5 points per month of inactivity:
```typescript
if (days_since_last_interaction > 30) {
  const months = Math.floor(days_since_last_interaction / 30);
  score -= months * 5;
  score = Math.max(score, 0);
}
```

---

## Performance Requirements

| Operation | Target | Max |
|-----------|--------|-----|
| Create contact | < 200ms | 500ms |
| Search contacts | < 300ms | 1s |
| Update AI score | < 500ms | 1.5s |
| Get timeline | < 200ms | 800ms |

---

## Testing Strategy

### Unit Tests
- `createContact()` - Deduplication logic
- `calculateAIScore()` - Scoring algorithm
- `searchContacts()` - Filter combinations

### Integration Tests
- Email → Contact linking
- Score updates on interactions

---

## Error Codes

| Code | Error | Status |
|------|-------|--------|
| `CONTACT_001` | Missing required fields | 400 |
| `CONTACT_002` | Invalid email format | 400 |
| `CONTACT_003` | Duplicate email | 409 |
| `CONTACT_004` | Contact not found | 404 |
| `CONTACT_005` | Invalid scoring input | 400 |
| `CONTACT_006` | Cannot merge across workspaces | 403 |
| `CONTACT_007` | Cannot merge same contact | 400 |

---

## Future Enhancements

### Phase 2
- LinkedIn enrichment API
- Company data enrichment (Clearbit, FullContact)
- Churn risk prediction (ML model)

### Phase 3
- Contact recommendations (similar contacts)
- Relationship graph visualization
- Multi-contact account management

---

**Status:** ✅ Specification Complete
**Implementation:** 2-3 weeks
**Dependencies:** Email Agent (P0)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5)
