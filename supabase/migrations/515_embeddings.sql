-- Migration 515: pgvector semantic embeddings for contacts + nexus_pages
-- Part of UNI-1235

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Add embedding columns ─────────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE nexus_pages
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ─── Indexes for fast similarity search ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_embedding
  ON contacts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_nexus_pages_embedding
  ON nexus_pages USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── match_contacts — RLS-safe similarity search ────────────────────────────

CREATE OR REPLACE FUNCTION match_contacts(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_workspace_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  company text,
  status text,
  ai_score numeric,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.email,
    c.company,
    c.status,
    c.ai_score,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM contacts c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_workspace_id IS NULL OR c.workspace_id = filter_workspace_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── match_nexus_pages — RLS-safe similarity search ─────────────────────────

CREATE OR REPLACE FUNCTION match_nexus_pages(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_owner_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  icon text,
  page_type text,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.icon,
    p.page_type,
    p.updated_at,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM nexus_pages p
  WHERE p.embedding IS NOT NULL
    AND p.archived_at IS NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (filter_owner_id IS NULL OR p.owner_id = filter_owner_id)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
