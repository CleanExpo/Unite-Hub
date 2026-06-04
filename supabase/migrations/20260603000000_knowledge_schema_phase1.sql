-- ============================================================
-- Knowledge Console Schema — Phase 1 (Read-Only MVP)
-- Issue #74 — Obsidian Nexus Knowledge Command Center
-- Date: 2026-06-03
-- Author: Hermes Agent / Pi-CEO Board
--
-- Additive only. No destructive changes to existing tables.
-- Follows existing RLS pattern: founder_id = auth.uid()
-- ============================================================

-- ============================================================
-- 1. KNOWLEDGE PROJECTS (canonical project registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,                     -- 'restoreassist', 'nexus', etc.
  label           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'watching', 'planned', 'archived')),
  note_count      INTEGER NOT NULL DEFAULT 0,
  last_ingested_at TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, key)
);

COMMENT ON TABLE knowledge_projects IS 'Canonical project registry for the Knowledge Console';
COMMENT ON COLUMN knowledge_projects.key IS 'Machine-readable project key (e.g. restoreassist)';
COMMENT ON COLUMN knowledge_projects.label IS 'Human-readable project name';

-- ============================================================
-- 2. KNOWLEDGE NOTES (mirrors Obsidian vault notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_key     TEXT NOT NULL,
  vault_path      TEXT NOT NULL,                     -- e.g. '/02-Projects/RestoreAssist/ai-claim-scribe.md'
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',          -- Full markdown content
  content_html    TEXT,                              -- Cached HTML render
  word_count      INTEGER NOT NULL DEFAULT 0,
  note_type       TEXT NOT NULL DEFAULT 'concept'
                  CHECK (note_type IN ('concept', 'entity', 'research', 'runbook', 'project', 'writing', 'meta')),
  tags            TEXT[] NOT NULL DEFAULT '{}',
  frontmatter     JSONB NOT NULL DEFAULT '{}',       -- Parsed YAML frontmatter
  sources         JSONB NOT NULL DEFAULT '[]',       -- Array of {title, url}
  confidence      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (confidence IN ('high', 'medium', 'low')),
  quality         TEXT NOT NULL DEFAULT 'draft'
                  CHECK (quality IN ('draft', 'polished', 'published')),
  ai_optimized    BOOLEAN NOT NULL DEFAULT FALSE,
  obsidian_source TEXT,                              -- Absolute path to .md file
  obsidian_mtime  TIMESTAMPTZ,                       -- Last modified in Obsidian
  ingestion_batch UUID,                              -- Will reference knowledge_batches later
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,    -- Soft delete
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE knowledge_notes IS 'Knowledge notes synced from Obsidian vault';
COMMENT ON COLUMN knowledge_notes.vault_path IS 'Relative path within the vault (unique per founder)';
COMMENT ON COLUMN knowledge_notes.content IS 'Raw markdown content';
COMMENT ON COLUMN knowledge_notes.frontmatter IS 'Parsed YAML frontmatter as JSONB';

-- ============================================================
-- 3. KNOWLEDGE BATCHES (ingestion runs — Phase 2 prep)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type     TEXT NOT NULL DEFAULT 'git'
                  CHECK (source_type IN ('git', 'manual', 'api', 'obsidian_plugin')),
  source_path     TEXT,                              -- e.g. git repo path, Obsidian vault path
  stats           JSONB NOT NULL DEFAULT '{}',       -- { files_processed, files_added, files_updated, errors }
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE knowledge_batches IS 'Tracks ingestion/sync runs from Obsidian vault';

-- ============================================================
-- 4. FOREIGN KEY: knowledge_notes → knowledge_batches
-- ============================================================
ALTER TABLE knowledge_notes
  ADD CONSTRAINT fk_knowledge_notes_batch
  FOREIGN KEY (ingestion_batch) REFERENCES knowledge_batches(id)
  ON DELETE SET NULL;

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- Project lookup
CREATE INDEX IF NOT EXISTS knowledge_notes_project_idx
  ON knowledge_notes(founder_id, project_key)
  WHERE is_deleted = FALSE;

-- Unique vault path per founder (soft-delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_notes_vault_path_idx
  ON knowledge_notes(founder_id, vault_path)
  WHERE is_deleted = FALSE;

-- Tag search
CREATE INDEX IF NOT EXISTS knowledge_notes_tags_idx
  ON knowledge_notes USING GIN(tags);

-- Full-text search on title + content
CREATE INDEX IF NOT EXISTS knowledge_notes_search_idx
  ON knowledge_notes USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
  );

-- Project lookup
CREATE INDEX IF NOT EXISTS knowledge_projects_founder_idx
  ON knowledge_projects(founder_id, status);

-- Batch lookup
CREATE INDEX IF NOT EXISTS knowledge_batches_founder_idx
  ON knowledge_batches(founder_id, started_at DESC);

-- ============================================================
-- 6. RLS POLICIES (Phase 1 read-only founder access)
-- ============================================================

ALTER TABLE knowledge_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_batches ENABLE ROW LEVEL SECURITY;

-- knowledge_notes
CREATE POLICY knowledge_notes_select ON knowledge_notes
  FOR SELECT USING (founder_id = auth.uid());

-- knowledge_projects
CREATE POLICY knowledge_projects_select ON knowledge_projects
  FOR SELECT USING (founder_id = auth.uid());

-- knowledge_batches
CREATE POLICY knowledge_batches_select ON knowledge_batches
  FOR SELECT USING (founder_id = auth.uid());

-- Normal authenticated users intentionally receive no insert/update/delete
-- policies in Phase 1. Future ingestion should use reviewed server-side
-- service-role code or a separately approved write policy.

-- ============================================================
-- 7. TRIGGERS (auto-update updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION update_knowledge_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_notes_updated_at
  BEFORE UPDATE ON knowledge_notes
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_updated_at_column();

CREATE TRIGGER knowledge_projects_updated_at
  BEFORE UPDATE ON knowledge_projects
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_updated_at_column();

-- ============================================================
-- 8. AUTO-UPDATE note_count ON knowledge_projects
-- ============================================================

CREATE OR REPLACE FUNCTION update_project_note_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = FALSE THEN
    UPDATE knowledge_projects
    SET note_count = note_count + 1,
        last_ingested_at = NOW()
    WHERE founder_id = NEW.founder_id AND key = NEW.project_key;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
      UPDATE knowledge_projects
      SET note_count = note_count + 1
      WHERE founder_id = NEW.founder_id AND key = NEW.project_key;
    ELSIF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      UPDATE knowledge_projects
      SET note_count = GREATEST(note_count - 1, 0)
      WHERE founder_id = NEW.founder_id AND key = NEW.project_key;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = FALSE THEN
    UPDATE knowledge_projects
    SET note_count = GREATEST(note_count - 1, 0)
    WHERE founder_id = OLD.founder_id AND key = OLD.project_key;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_notes_update_project_count
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_notes
  FOR EACH ROW EXECUTE FUNCTION update_project_note_count();

-- ============================================================
-- 9. FULL-TEXT SEARCH HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION search_knowledge_notes(
  p_founder_id UUID,
  p_query TEXT,
  p_project_key TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  vault_path TEXT,
  title TEXT,
  content TEXT,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.vault_path,
    kn.title,
    kn.content,
    ts_rank(
      to_tsvector('english', COALESCE(kn.title, '') || ' ' || COALESCE(kn.content, '')),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM knowledge_notes kn
  WHERE kn.founder_id = p_founder_id
    AND kn.founder_id = auth.uid()
    AND kn.is_deleted = FALSE
    AND (
      p_project_key IS NULL
      OR kn.project_key = p_project_key
    )
    AND (
      kn.title ILIKE '%' || p_query || '%'
      OR kn.content ILIKE '%' || p_query || '%'
      OR to_tsvector('english', COALESCE(kn.title, '') || ' ' || COALESCE(kn.content, '')) @@ plainto_tsquery('english', p_query)
    )
  ORDER BY rank DESC, kn.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_knowledge_notes IS 'Full-text search across knowledge notes with optional project filter';
