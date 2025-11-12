# 🚀 Unite Hub - AI-Powered Marketing CRM

**AI-first customer relationship and marketing automation platform built with Next.js 16, Supabase, and Claude AI**

## ✨ Features

### 🤖 AI Intelligence Layer
- **Email Agent**: Automatically processes incoming emails, extracts intents, analyzes sentiment, and updates contact records
- **Content Generator**: Creates personalized marketing content using Claude Opus 4 with Extended Thinking
- **Contact Intelligence**: AI-powered lead scoring (0-100) based on engagement, sentiment, and behavior
- **Orchestrator**: Coordinates multi-agent workflows for complex automation

### 📧 Email Integration
- **Gmail OAuth 2.0**: Secure connection to Gmail accounts
- **Email Sync**: Automatic import of emails with sender extraction
- **Open/Click Tracking**: Pixel-based tracking for email engagement
- **Thread Management**: Organize emails by conversation threads

### 🎯 Drip Campaign Automation
- **Visual Campaign Builder**: Drag-and-drop interface for multi-step sequences
- **Conditional Branching**: If/else logic based on opens, clicks, replies, scores
- **Trigger Types**: Manual, new contact, tag, score threshold, email events, no-reply
- **Step Types**: Email, wait, condition, tag, score update, webhook
- **A/B Testing**: Test multiple subject line variants
- **Performance Metrics**: Track enrollments, completions, open rates, click rates, reply rates

### 📊 Lead Scoring
- Email engagement frequency (40%)
- Sentiment analysis (20%)
- Intent quality (20%)
- Job title/role (10%)
- Status progression (10%)

Scores 60-79 = Warm leads | 80-100 = Hot leads

### 🎨 Modern Dashboard
- Real-time contact management with AI scores
- Campaign performance analytics
- Content draft review and approval
- Gmail integration settings
- Dark theme with Tailwind CSS
- Responsive design

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.0.1** - React framework with App Router and Turbopack
- **React 19.0.0** - UI library with Server Components
- **TypeScript 5.x** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Card, Button, Badge, Dialog, Dropdown, etc.)
- **Lucide React** - Icon system

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase PostgreSQL** - Database with Row Level Security
- **NextAuth.js** - Authentication with SupabaseAdapter
- **Google Gmail API** - OAuth 2.0 email integration

### AI & Integrations
- **Anthropic Claude API** - Claude Opus 4 (`claude-opus-4-1-20250805`) with Extended Thinking (5,000-10,000 token budgets)
- **@anthropic-ai/sdk** v0.68.0 - Official Anthropic SDK
- **googleapis** v144.0.0 - Google API client for Gmail

### Infrastructure
- **Vercel** - Hosting and deployment (recommended)
- **Docker** - Containerization (optional)
- **Supabase** - Managed PostgreSQL + Auth + Storage

## 📐 Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (React 19 +    │
│   App Router)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼─────────┐
│  API  │ │ Dashboard  │
│Routes │ │   Pages    │
└───┬───┘ └────────────┘
    │
┌───▼────────────────┐
│  AI Agent Layer    │
│ • Email Agent      │
│ • Content Agent    │
│ • Orchestrator     │
└───┬────────────────┘
    │
┌───▼────────────────┐
│  Supabase Layer    │
│ • PostgreSQL       │
│ • Row Level Sec    │
│ • Real-time Subs   │
└───┬────────────────┘
    │
┌───▼────────────────┐
│  External APIs     │
│ • Claude Opus 4    │
│ • Gmail API        │
└────────────────────┘
```

## 🚀 Installation

### Prerequisites
- **Node.js 18+** (20+ recommended)
- **npm** or **yarn**
- **Supabase Account** (free tier available)
- **Anthropic API Key** (Claude AI)
- **Google Cloud Console Project** (for Gmail OAuth)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/unite-hub.git
cd unite-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database migrations (see Database Schema section)

### 4. Configure Environment Variables

Create `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3008/api/integrations/gmail/callback`
6. Copy Client ID and Client Secret to `.env.local`

### 6. Run Database Migrations

```bash
# Apply schema to Supabase
npx supabase db push
```

### 7. Start Development Server

```bash
npm run dev
```

Dashboard available at `http://localhost:3008`

## ⚙️ Configuration

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | App URL (http://localhost:3008 for dev) | Yes |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | Yes |
| `ANTHROPIC_API_KEY` | Claude AI API key | Yes |

### Port Configuration

Default port is `3008`. To change:

```bash
# package.json
"dev": "next dev -p YOUR_PORT"
```

Update `NEXTAUTH_URL` and `GOOGLE_CALLBACK_URL` accordingly.

## 📖 Usage

### For End Users

#### 1. Connect Gmail
1. Navigate to **Dashboard → Settings**
2. Click **Connect** under Gmail
3. Authorize Unite Hub to access your Gmail
4. Click **Sync Now** to import emails

#### 2. View Contacts
- Go to **Dashboard → Contacts**
- See AI scores (0-100) for each contact
- Filter by score, status, tags
- View interaction history

#### 3. Create Drip Campaign
1. Navigate to **Dashboard → Campaigns → Drip Sequences**
2. Click **Create Campaign**
3. Configure trigger (manual, new contact, tag, score, etc.)
4. Add steps:
   - **Email**: Subject + content (supports AI personalization)
   - **Wait**: Delay (days/hours) or wait for event (open, click, reply)
   - **Condition**: Branch based on score, tag, email engagement
   - **Tag**: Add/remove tags
   - **Score Update**: Adjust AI score
5. Activate campaign
6. Enroll contacts manually or via triggers

#### 4. Review Generated Content
- Go to **Dashboard → Contacts**
- Select a high-scoring contact (60+)
- Run `npm run generate-content` (CLI)
- Review drafts in contact detail view
- Edit and send via Gmail

### For Developers

#### CLI Commands

```bash
# Analyze contacts and update AI scores
npm run analyze-contacts

# Generate personalized content for hot leads
npm run generate-content

# Process pending drip campaign steps
npm run process-campaigns
```

#### API Endpoints

**Contacts**
- `POST /api/contacts` - Create contact
- `GET /api/contacts/list` - List contacts with filters
- `GET /api/contacts/[id]` - Get contact details
- `PATCH /api/contacts/[id]` - Update contact
- `POST /api/contacts/score` - Update AI score

**Campaigns**
- `POST /api/campaigns/drip` - Unified campaign endpoint
  - `action: "create"` - Create campaign
  - `action: "get"` - Get campaign with steps
  - `action: "list"` - List campaigns by workspace
  - `action: "add_step"` - Add campaign step
  - `action: "enroll"` - Enroll contact
  - `action: "process_pending"` - Process pending steps
  - `action: "metrics"` - Get campaign metrics

**Integrations**
- `POST /api/integrations/gmail/connect` - Start OAuth flow
- `GET /api/integrations/gmail/callback` - OAuth callback
- `POST /api/integrations/gmail/sync` - Sync emails
- `GET /api/integrations/list` - List integrations

**Agents**
- `POST /api/agents/analyze` - Analyze contact with AI
- `POST /api/agents/generate` - Generate content

**Health**
- `GET /api/test/db` - Database connection test

## 🤖 Automation

### CLI Scripts

Located in `scripts/`:

#### 1. Analyze Contacts (`analyze-contacts.mjs`)
```bash
npm run analyze-contacts
```
- Fetches all contacts from Supabase
- Calculates AI engagement score (0-100)
- Updates contact records
- Logs audit events

#### 2. Generate Content (`generate-content.mjs`)
```bash
npm run generate-content
```
- Queries contacts with score ≥ 60
- Loads interaction history
- Generates personalized content via Claude Opus 4
- Stores drafts in `generatedContent` table
- Supports: followup emails, proposals, case studies

#### 3. Process Campaigns (`process-campaigns.mjs`)
```bash
npm run process-campaigns
```
- Fetches pending campaign steps (scheduled_for ≤ now)
- Executes step actions (send email, wait, evaluate condition)
- Updates enrollment status
- Schedules next steps
- Logs execution results

### Scheduled Jobs (Production)

Use **Vercel Cron** or **GitHub Actions**:

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/process-campaigns",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/sync-emails",
      "schedule": "0 * * * *"
    }
  ]
}
```

**GitHub Actions** (`.github/workflows/automation.yml`):
```yaml
name: Automation
on:
  schedule:
    - cron: '*/10 * * * *'
jobs:
  process-campaigns:
    runs-on: ubuntu-latest
    steps:
      - name: Process Campaigns
        run: |
          curl -X POST https://your-domain.com/api/campaigns/drip \
            -H "Content-Type: application/json" \
            -d '{"action":"process_pending"}'
```

## 🗄️ Database Schema

### Core Tables (18 total)

#### 1. `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'member',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `workspaces`
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead',
  ai_score INTEGER DEFAULT 0,
  tags TEXT[],
  custom_fields JSONB,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `emails`
```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  contact_id UUID REFERENCES contacts(id),
  integration_id UUID REFERENCES integrations(id),
  external_id TEXT,
  thread_id TEXT,
  subject TEXT,
  body TEXT,
  from_email TEXT,
  from_name TEXT,
  to_email TEXT,
  direction TEXT, -- 'inbound' | 'outbound'
  intent TEXT,
  sentiment TEXT,
  ai_summary TEXT,
  processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `drip_campaigns`
```sql
CREATE TABLE drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `campaign_steps`
```sql
CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  content_template TEXT,
  subject_template TEXT,
  use_ai_personalization BOOLEAN DEFAULT FALSE,
  wait_duration INTEGER,
  wait_until TEXT,
  condition_type TEXT,
  condition_value JSONB,
  true_next_step_id UUID,
  false_next_step_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. `campaign_enrollments`
```sql
CREATE TABLE campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES drip_campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  status TEXT DEFAULT 'active',
  current_step INTEGER DEFAULT 1,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);
```

#### 9. `campaign_execution_logs`
```sql
CREATE TABLE campaign_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES campaign_enrollments(id),
  step_id UUID REFERENCES campaign_steps(id),
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. `email_opens`
```sql
CREATE TABLE email_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id),
  contact_id UUID REFERENCES contacts(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
```

#### 11. `email_clicks`
```sql
CREATE TABLE email_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id),
  contact_id UUID REFERENCES contacts(id),
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
```

#### 12. `generatedContent`
```sql
CREATE TABLE generatedContent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  contact_id UUID REFERENCES contacts(id),
  content_type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  generated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 13. `integrations`
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL,
  account_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  settings JSONB,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 14. `campaigns` (Email Campaigns)
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 15. `auditLogs`
```sql
CREATE TABLE auditLogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  context JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 16. `aiMemory`
```sql
CREATE TABLE aiMemory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  agent_name TEXT NOT NULL,
  memory_type TEXT,
  content JSONB NOT NULL,
  relevance_score DECIMAL(3,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 17. `collaborations`
```sql
CREATE TABLE collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  permission TEXT DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 18. `systemState`
```sql
CREATE TABLE systemState (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_ai_score ON contacts(ai_score DESC);
CREATE INDEX idx_emails_contact ON emails(contact_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_campaign_enrollments_contact ON campaign_enrollments(contact_id);
CREATE INDEX idx_campaign_enrollments_campaign ON campaign_enrollments(campaign_id);
CREATE INDEX idx_execution_logs_scheduled ON campaign_execution_logs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_opens_contact ON email_opens(contact_id);
CREATE INDEX idx_email_clicks_contact ON email_clicks(contact_id);
```

## 🚀 Deployment

### Vercel (Recommended)

#### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables from `.env.production`
4. Deploy

#### 3. Configure Production Supabase
1. Create production project on Supabase
2. Run migrations
3. Update environment variables in Vercel

#### 4. Set Up Cron Jobs
Add `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-campaigns",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Docker

#### Build Image
```bash
docker build -t unite-hub .
```

#### Run Container
```bash
docker run -p 3008:3008 \
  -e NEXTAUTH_URL=http://localhost:3008 \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e ANTHROPIC_API_KEY=your-key \
  unite-hub
```

## 📊 Monitoring

### Health Checks

**Database Connection**
```bash
curl http://localhost:3008/api/test/db
```

**Campaign Processing**
```bash
npm run process-campaigns
```

### Logs

View logs in Vercel dashboard or via CLI:
```bash
vercel logs
```

### Metrics to Monitor

- Campaign enrollment rate
- Email open rate (industry avg: 20-30%)
- Email click rate (industry avg: 2-5%)
- Reply rate (industry avg: 1-3%)
- AI score distribution
- Content generation success rate
- API error rate

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

ISC

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@unite-hub.com
- Documentation: [https://docs.unite-hub.com](https://docs.unite-hub.com)

---

**Built with ❤️ using Next.js, Supabase, Claude AI, and TypeScript**
