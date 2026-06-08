-- AI File Transcripts — durable transcript artefacts for founder-owned cached files.
-- Additive to ai_file_cache; mock-provider tests can prove persistence without live provider cost.

CREATE TABLE IF NOT EXISTS ai_file_transcripts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_cache_id   UUID        NOT NULL REFERENCES ai_file_cache(id) ON DELETE CASCADE,
  cache_key       TEXT        NOT NULL,
  file_id         TEXT        NOT NULL,
  filename        TEXT        NOT NULL,
  provider        TEXT        NOT NULL,
  source          TEXT        NOT NULL,
  transcript_text TEXT        NOT NULL,
  language        TEXT        NOT NULL DEFAULT 'und',
  confidence      NUMERIC(5, 4),
  transcript      JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_file_transcripts_provider_check CHECK (provider IN ('mock')),
  CONSTRAINT ai_file_transcripts_source_check CHECK (source IN ('mocked_provider')),
  CONSTRAINT ai_file_transcripts_confidence_check CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  )
);

COMMENT ON TABLE  ai_file_transcripts                 IS 'Durable transcript results for founder-owned ai_file_cache rows.';
COMMENT ON COLUMN ai_file_transcripts.file_cache_id   IS 'Owning ai_file_cache row; cascades when the cached file is removed.';
COMMENT ON COLUMN ai_file_transcripts.provider        IS 'Transcription provider identifier. Only mock is currently enabled.';
COMMENT ON COLUMN ai_file_transcripts.source          IS 'Honest source marker for fake-vs-real detection.';
COMMENT ON COLUMN ai_file_transcripts.transcript_text IS 'Plain text transcript for search and review.';
COMMENT ON COLUMN ai_file_transcripts.transcript      IS 'Full transcript payload returned by the provider adapter.';

CREATE UNIQUE INDEX IF NOT EXISTS ai_file_transcripts_founder_cache_key
  ON ai_file_transcripts (founder_id, cache_key);
CREATE INDEX IF NOT EXISTS ai_file_transcripts_file_cache_idx
  ON ai_file_transcripts (file_cache_id);
CREATE INDEX IF NOT EXISTS ai_file_transcripts_founder_created_idx
  ON ai_file_transcripts (founder_id, created_at DESC);

ALTER TABLE ai_file_transcripts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_file_transcripts'
      AND policyname = 'founders_own_transcripts'
  ) THEN
    CREATE POLICY "founders_own_transcripts"
      ON ai_file_transcripts FOR ALL TO authenticated
      USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_file_transcripts'
      AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY "service_role_full_access"
      ON ai_file_transcripts FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;
