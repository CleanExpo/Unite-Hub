-- AI Memory Store — cross-session persistence for AI capabilities.
-- Scoped by founder_id with RLS for strict per-founder isolation.
-- Used by: advisory, content-generate, email-triage capabilities.
-- Key: storeMemory() upserts on (founder_id, capability_id, key) — latest value wins.

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE ai_memories (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_id TEXT        NOT NULL,
  memory_type   TEXT        NOT NULL CHECK (memory_type IN ('fact', 'preference', 'outcome', 'pattern')),
  key           TEXT        NOT NULL,
  value         TEXT        NOT NULL,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ai_memories                  IS 'Persistent AI memory store — one row per founder × capability × key.';
COMMENT ON COLUMN ai_memories.capability_id    IS 'AI capability that owns this memory (advisory, content-generate, etc.)';
COMMENT ON COLUMN ai_memories.memory_type      IS 'fact | preference | outcome | pattern';
COMMENT ON COLUMN ai_memories.key              IS 'Logical name for the memory (e.g. "risk_tolerance", "case_abc123").';
COMMENT ON COLUMN ai_memories.value            IS 'Human-readable memory text injected into future prompts.';
COMMENT ON COLUMN ai_memories.metadata         IS 'Structured data for programmatic access (caseId, scores, businessKey, etc.)';

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Unique constraint: one value per (founder, capability, key) — upsert target.
CREATE UNIQUE INDEX ai_memories_upsert_key
  ON ai_memories (founder_id, capability_id, key);

-- Efficient recall: by capability + type, most-recent first.
CREATE INDEX ai_memories_recall_idx
  ON ai_memories (founder_id, capability_id, memory_type, updated_at DESC);

-- ── Auto-update trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_ai_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_memories_updated_at
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE FUNCTION update_ai_memories_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

-- Authenticated users see and manage only their own memories.
CREATE POLICY "founders_own_memories"
  ON ai_memories
  FOR ALL
  TO authenticated
  USING  (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

-- Service role has unrestricted access for cron jobs and API route handlers.
CREATE POLICY "service_role_full_access"
  ON ai_memories
  FOR ALL
  TO service_role
  USING  (true)
  WITH CHECK (true);
