-- ============================================================
-- Nexus 2.0 Schema — Clean Baseline
-- Date: 09/03/2026
-- Auth: Single-tenant, founder_id = auth.uid()
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  domain      TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive', 'archived')),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, slug)
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  first_name  TEXT,
  last_name   TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  role        TEXT,
  status      TEXT NOT NULL DEFAULT 'lead'
              CHECK (status IN ('lead', 'prospect', 'client', 'churned', 'archived')),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS PAGES (block editor documents)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_pages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES nexus_pages(id) ON DELETE SET NULL,
  business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
  title        TEXT NOT NULL DEFAULT 'Untitled',
  icon         TEXT,
  cover_url    TEXT,
  content      JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS DATABASES (Notion-style databases)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_databases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id     UUID REFERENCES nexus_pages(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  schema      JSONB NOT NULL DEFAULT '{"properties":[]}',
  view_type   TEXT NOT NULL DEFAULT 'table'
              CHECK (view_type IN ('table', 'kanban', 'calendar', 'gallery')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS ROWS
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_rows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_id  UUID NOT NULL REFERENCES nexus_databases(id) ON DELETE CASCADE,
  properties   JSONB NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREDENTIALS VAULT (AES-256-GCM encrypted)
-- ============================================================
CREATE TABLE IF NOT EXISTS credentials_vault (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id      UUID REFERENCES businesses(id) ON DELETE SET NULL,
  label            TEXT NOT NULL,
  service          TEXT NOT NULL,
  encrypted_value  TEXT NOT NULL,
  iv               TEXT NOT NULL,
  salt             TEXT NOT NULL,
  notes            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  last_accessed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVAL QUEUE (human-in-the-loop gate)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_queue (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'expired')),
  expires_at   TIMESTAMPTZ,
  approved_at  TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SOCIAL CHANNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS social_channels (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform                TEXT NOT NULL
                          CHECK (platform IN ('facebook','instagram','linkedin','tiktok','youtube','twitter')),
  channel_name            TEXT NOT NULL,
  channel_id              TEXT,
  access_token_encrypted  TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at        TIMESTAMPTZ,
  is_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, business_id, platform)
);

-- ============================================================
-- CONNECTED PROJECTS (Linear/GitHub/Jira sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS connected_projects (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id           UUID REFERENCES businesses(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL CHECK (provider IN ('linear', 'github', 'jira')),
  provider_project_id   TEXT NOT NULL,
  provider_project_name TEXT NOT NULL,
  sync_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, provider, provider_project_id)
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'businesses','contacts','nexus_pages','nexus_databases',
    'nexus_rows','credentials_vault','approval_queue',
    'social_channels','connected_projects'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_businesses_founder_id ON businesses(founder_id);
CREATE INDEX idx_contacts_founder_id ON contacts(founder_id);
CREATE INDEX idx_contacts_business_id ON contacts(business_id);
CREATE INDEX idx_nexus_pages_founder_id ON nexus_pages(founder_id);
CREATE INDEX idx_nexus_pages_parent_id ON nexus_pages(parent_id);
CREATE INDEX idx_nexus_rows_database_id ON nexus_rows(database_id);
CREATE INDEX idx_approval_queue_founder_status ON approval_queue(founder_id, status);
CREATE INDEX idx_social_channels_business ON social_channels(business_id);
