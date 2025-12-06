-- Phase B17: Synthex Conversation Intelligence
-- Migration: 424_synthex_conversation_intel.sql
-- Creates tables for conversation tracking, messages, and AI-generated insights

-- ============================================
-- Conversations Table
-- Stores email/SMS/call conversations
-- ============================================
create table if not exists synthex_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  contact_id uuid references synthex_audience_contacts(id) on delete set null,
  -- Conversation metadata
  channel text not null, -- email, sms, call, chat, other
  direction text default 'inbound', -- inbound, outbound
  subject_or_title text,
  external_id text, -- External thread ID, call ID, etc.
  -- Ownership
  primary_owner text, -- User ID or name of conversation owner
  assigned_to text,
  -- Status
  status text default 'open', -- open, pending, resolved, closed
  priority text default 'normal', -- low, normal, high, urgent
  -- AI-derived fields (updated by insights)
  sentiment text, -- positive, negative, neutral, mixed
  sentiment_score numeric(5,4), -- -1 to 1
  outcome text, -- converted, lost, pending, escalated
  -- Metadata
  tags text[] default '{}',
  labels text[] default '{}',
  metadata jsonb default '{}',
  -- Counts (denormalized for performance)
  message_count int default 0,
  unread_count int default 0,
  -- Timestamps
  first_message_at timestamptz,
  last_message_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Conversation Messages Table
-- Individual messages within conversations
-- ============================================
create table if not exists synthex_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  conversation_id uuid not null references synthex_conversations(id) on delete cascade,
  -- Message details
  sender text not null, -- Email, phone, user ID, etc.
  sender_name text,
  role text default 'contact', -- contact, agent, system, bot
  channel text not null, -- email, sms, call, chat
  direction text default 'inbound', -- inbound, outbound
  -- Content
  subject text,
  body text not null,
  body_html text,
  attachments jsonb default '[]', -- Array of { name, type, url, size }
  -- Message metadata
  external_id text, -- Message-ID, SMS ID, etc.
  in_reply_to text, -- Parent message reference
  headers jsonb default '{}', -- Email headers, etc.
  metadata jsonb default '{}',
  -- Status
  is_read boolean default false,
  is_starred boolean default false,
  -- For calls
  call_duration_seconds int,
  call_recording_url text,
  transcript text,
  -- Timestamps
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- Conversation Insights Table
-- AI-generated analysis of conversations
-- ============================================
create table if not exists synthex_conversation_insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  conversation_id uuid not null references synthex_conversations(id) on delete cascade,
  -- AI Analysis
  summary text, -- Concise summary of conversation
  sentiment text, -- positive, negative, neutral, mixed
  sentiment_score numeric(5,4), -- -1 to 1
  -- Key information
  topics text[] default '{}', -- Main topics discussed
  keywords text[] default '{}', -- Key terms extracted
  entities jsonb default '{}', -- Named entities { people, companies, products, etc. }
  -- Action items
  action_items jsonb default '[]', -- Array of { description, assignee, due_date, priority }
  next_steps text[] default '{}',
  -- Risk assessment
  risk_flags jsonb default '[]', -- Array of { type, description, severity }
  churn_risk numeric(5,4), -- 0-1 churn probability
  urgency_score numeric(5,2), -- 0-100
  -- Intent analysis
  primary_intent text, -- inquiry, complaint, purchase, support, etc.
  secondary_intents text[] default '{}',
  -- Quality metrics
  response_quality numeric(5,2), -- 0-100 agent response quality
  customer_satisfaction numeric(5,2), -- 0-100 estimated CSAT
  -- Model info
  confidence_score numeric(5,4), -- 0-1
  model_version text default 'claude-sonnet-4.5',
  analysis_type text default 'full', -- full, quick, followup
  -- Timestamps
  analyzed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- Conversation Templates Table
-- Saved response templates
-- ============================================
create table if not exists synthex_conversation_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  category text,
  channel text, -- email, sms, chat, or null for all
  -- Content
  subject text,
  body text not null,
  body_html text,
  variables text[] default '{}', -- Placeholder variables like {{name}}, {{company}}
  -- Usage stats
  usage_count int default 0,
  last_used_at timestamptz,
  -- Status
  is_active boolean default true,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Indexes for Performance
-- ============================================
drop index if exists idx_conversations_tenant;
create index if not exists idx_conversations_tenant
  on synthex_conversations(tenant_id);
drop index if exists idx_conversations_contact;
create index if not exists idx_conversations_contact
  on synthex_conversations(contact_id);
drop index if exists idx_conversations_channel;
create index if not exists idx_conversations_channel
  on synthex_conversations(channel);
drop index if exists idx_conversations_status;
create index if not exists idx_conversations_status
  on synthex_conversations(status);
drop index if exists idx_conversations_sentiment;
create index if not exists idx_conversations_sentiment
  on synthex_conversations(sentiment);
drop index if exists idx_conversations_owner;
create index if not exists idx_conversations_owner
  on synthex_conversations(primary_owner);
drop index if exists idx_conversations_last_message;
create index if not exists idx_conversations_last_message
  on synthex_conversations(last_message_at desc);
drop index if exists idx_conversations_tenant_updated;
create index if not exists idx_conversations_tenant_updated
  on synthex_conversations(tenant_id, updated_at desc);

drop index if exists idx_conv_messages_tenant;
create index if not exists idx_conv_messages_tenant
  on synthex_conversation_messages(tenant_id);
drop index if exists idx_conv_messages_conversation;
create index if not exists idx_conv_messages_conversation
  on synthex_conversation_messages(conversation_id);
drop index if exists idx_conv_messages_sender;
create index if not exists idx_conv_messages_sender
  on synthex_conversation_messages(sender);
drop index if exists idx_conv_messages_occurred;
create index if not exists idx_conv_messages_occurred
  on synthex_conversation_messages(occurred_at desc);

drop index if exists idx_conv_insights_tenant;
create index if not exists idx_conv_insights_tenant
  on synthex_conversation_insights(tenant_id);
drop index if exists idx_conv_insights_conversation;
create index if not exists idx_conv_insights_conversation
  on synthex_conversation_insights(conversation_id);
drop index if exists idx_conv_insights_sentiment;
create index if not exists idx_conv_insights_sentiment
  on synthex_conversation_insights(sentiment);

drop index if exists idx_conv_templates_tenant;
create index if not exists idx_conv_templates_tenant
  on synthex_conversation_templates(tenant_id);
drop index if exists idx_conv_templates_category;
create index if not exists idx_conv_templates_category
  on synthex_conversation_templates(category);

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_conversations enable row level security;
alter table synthex_conversation_messages enable row level security;
alter table synthex_conversation_insights enable row level security;
alter table synthex_conversation_templates enable row level security;

-- Conversations policies
drop policy if exists "synthex_conversations_select" on synthex_conversations;
create policy "synthex_conversations_select"
  on synthex_conversations for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conversations_insert" on synthex_conversations;
create policy "synthex_conversations_insert"
  on synthex_conversations for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conversations_update" on synthex_conversations;
create policy "synthex_conversations_update"
  on synthex_conversations for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conversations_delete" on synthex_conversations;
create policy "synthex_conversations_delete"
  on synthex_conversations for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Messages policies
drop policy if exists "synthex_conv_messages_select" on synthex_conversation_messages;
create policy "synthex_conv_messages_select"
  on synthex_conversation_messages for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_messages_insert" on synthex_conversation_messages;
create policy "synthex_conv_messages_insert"
  on synthex_conversation_messages for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_messages_update" on synthex_conversation_messages;
create policy "synthex_conv_messages_update"
  on synthex_conversation_messages for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_messages_delete" on synthex_conversation_messages;
create policy "synthex_conv_messages_delete"
  on synthex_conversation_messages for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Insights policies
drop policy if exists "synthex_conv_insights_select" on synthex_conversation_insights;
create policy "synthex_conv_insights_select"
  on synthex_conversation_insights for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_insights_insert" on synthex_conversation_insights;
create policy "synthex_conv_insights_insert"
  on synthex_conversation_insights for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_insights_update" on synthex_conversation_insights;
create policy "synthex_conv_insights_update"
  on synthex_conversation_insights for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Templates policies
drop policy if exists "synthex_conv_templates_select" on synthex_conversation_templates;
create policy "synthex_conv_templates_select"
  on synthex_conversation_templates for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_templates_insert" on synthex_conversation_templates;
create policy "synthex_conv_templates_insert"
  on synthex_conversation_templates for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_templates_update" on synthex_conversation_templates;
create policy "synthex_conv_templates_update"
  on synthex_conversation_templates for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_conv_templates_delete" on synthex_conversation_templates;
create policy "synthex_conv_templates_delete"
  on synthex_conversation_templates for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- ============================================
-- Updated At Triggers
-- ============================================
drop trigger if exists trigger_conversations_updated_at on synthex_conversations;
create trigger trigger_conversations_updated_at
  before update on synthex_conversations
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_conv_templates_updated_at on synthex_conversation_templates;
create trigger trigger_conv_templates_updated_at
  before update on synthex_conversation_templates
  for each row execute function update_synthex_automation_updated_at();

-- ============================================
-- Message Count Trigger
-- ============================================
create or replace function update_conversation_message_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update synthex_conversations
    set
      message_count = message_count + 1,
      last_message_at = NEW.occurred_at,
      first_message_at = coalesce(first_message_at, NEW.occurred_at)
    where id = NEW.conversation_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update synthex_conversations
    set message_count = message_count - 1
    where id = OLD.conversation_id;
    return OLD;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trigger_message_count on synthex_conversation_messages;
create trigger trigger_message_count
  after insert or delete on synthex_conversation_messages
  for each row execute function update_conversation_message_count();
