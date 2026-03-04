-- Migration 509: NEXUS 2.0 — Notion-style pages, databases, and rows
-- Part of UNI-1403 (Schema)

-- ─── nexus_pages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nexus_pages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid        REFERENCES nexus_pages(id) ON DELETE SET NULL,
  title        text        NOT NULL DEFAULT 'Untitled',
  icon         text,
  cover_url    text,
  body         jsonb       DEFAULT '{}',
  properties   jsonb       DEFAULT '{}',
  business_id  text,
  page_type    text        DEFAULT 'page',
  is_template  boolean     DEFAULT false,
  is_favorite  boolean     DEFAULT false,
  sort_order   integer     DEFAULT 0,
  owner_id     uuid        NOT NULL,
  workspace_id uuid,
  archived_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_pages_parent    ON nexus_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_nexus_pages_business  ON nexus_pages(business_id);
CREATE INDEX IF NOT EXISTS idx_nexus_pages_type      ON nexus_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_nexus_pages_owner     ON nexus_pages(owner_id);
CREATE INDEX IF NOT EXISTS idx_nexus_pages_created   ON nexus_pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_pages_title_gin ON nexus_pages USING gin(to_tsvector('english', title));

-- ─── nexus_databases ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nexus_databases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  icon         text,
  description  text,
  columns      jsonb       DEFAULT '[]',
  default_view text        DEFAULT 'table',
  group_by     text,
  sort_by      jsonb       DEFAULT '[]',
  filters      jsonb       DEFAULT '[]',
  business_id  text,
  owner_id     uuid        NOT NULL,
  workspace_id uuid,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_databases_owner   ON nexus_databases(owner_id);
CREATE INDEX IF NOT EXISTS idx_nexus_databases_created ON nexus_databases(created_at DESC);

-- ─── nexus_rows ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nexus_rows (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id  uuid        NOT NULL REFERENCES nexus_databases(id) ON DELETE CASCADE,
  cells        jsonb       DEFAULT '{}',
  starred      boolean     DEFAULT false,
  sort_order   integer     DEFAULT 0,
  owner_id     uuid        NOT NULL,
  archived_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_rows_database ON nexus_rows(database_id);
CREATE INDEX IF NOT EXISTS idx_nexus_rows_owner    ON nexus_rows(owner_id);

-- ─── updated_at triggers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_nexus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nexus_pages_updated ON nexus_pages;
CREATE TRIGGER trg_nexus_pages_updated
  BEFORE UPDATE ON nexus_pages
  FOR EACH ROW EXECUTE FUNCTION update_nexus_updated_at();

DROP TRIGGER IF EXISTS trg_nexus_databases_updated ON nexus_databases;
CREATE TRIGGER trg_nexus_databases_updated
  BEFORE UPDATE ON nexus_databases
  FOR EACH ROW EXECUTE FUNCTION update_nexus_updated_at();

DROP TRIGGER IF EXISTS trg_nexus_rows_updated ON nexus_rows;
CREATE TRIGGER trg_nexus_rows_updated
  BEFORE UPDATE ON nexus_rows
  FOR EACH ROW EXECUTE FUNCTION update_nexus_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE nexus_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_rows ENABLE ROW LEVEL SECURITY;

-- Pages: owner can CRUD
CREATE POLICY nexus_pages_owner_select ON nexus_pages FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY nexus_pages_owner_insert ON nexus_pages FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY nexus_pages_owner_update ON nexus_pages FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY nexus_pages_owner_delete ON nexus_pages FOR DELETE USING (owner_id = auth.uid());

-- Service role bypass
CREATE POLICY nexus_pages_service ON nexus_pages FOR ALL USING (auth.role() = 'service_role');

-- Databases: owner can CRUD (system seed rows use sentinel '00000000-...' and are visible to all auth users)
CREATE POLICY nexus_databases_owner_select ON nexus_databases FOR SELECT USING (
  owner_id = auth.uid() OR owner_id = '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE POLICY nexus_databases_owner_insert ON nexus_databases FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY nexus_databases_owner_update ON nexus_databases FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY nexus_databases_owner_delete ON nexus_databases FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY nexus_databases_service ON nexus_databases FOR ALL USING (auth.role() = 'service_role');

-- Rows: owner can CRUD
CREATE POLICY nexus_rows_owner_select ON nexus_rows FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY nexus_rows_owner_insert ON nexus_rows FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY nexus_rows_owner_update ON nexus_rows FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY nexus_rows_owner_delete ON nexus_rows FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY nexus_rows_service ON nexus_rows FOR ALL USING (auth.role() = 'service_role');

-- ─── Default databases ───────────────────────────────────────────────────────
-- Default databases are created by the API (/api/nexus/databases/seed) on first
-- user login — they require a real auth.uid() and cannot be seeded here.
