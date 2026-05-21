-- AI File Cache — persistent mapping of founder-owned files uploaded to the Anthropic Files API.
-- Replaces the in-memory Map in files.ts; survives cold starts and is shared across all instances.

CREATE TABLE ai_file_cache (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key     TEXT        NOT NULL,
  file_id       TEXT        NOT NULL,
  filename      TEXT        NOT NULL,
  mime_type     TEXT        NOT NULL DEFAULT 'application/octet-stream',
  size_bytes    BIGINT      NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ai_file_cache              IS 'Anthropic Files API uploads — one row per founder × cache_key.';
COMMENT ON COLUMN ai_file_cache.cache_key    IS 'Caller-defined key for lookup (e.g. "xero_jun_2026", "bas_q3").';
COMMENT ON COLUMN ai_file_cache.file_id      IS 'Anthropic Files API file ID (file_abc123).';
COMMENT ON COLUMN ai_file_cache.expires_at   IS 'Optional TTL — caller can set to force re-upload after N days.';

CREATE UNIQUE INDEX ai_file_cache_upsert_key ON ai_file_cache (founder_id, cache_key);
CREATE INDEX ai_file_cache_founder_idx ON ai_file_cache (founder_id, created_at DESC);

ALTER TABLE ai_file_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders_own_files"
  ON ai_file_cache FOR ALL TO authenticated
  USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

CREATE POLICY "service_role_full_access"
  ON ai_file_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);
