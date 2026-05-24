-- Migration 507: Human-in-the-Loop Approval Queue
-- UNI-1423 / UNI-1424 / UNI-1425
-- Enables Bron (AI orchestrator) to submit work for Phill's review

-- ─── approval_queue ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_queue (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text        NOT NULL,                          -- email | linear | pr | content | contract | agent_output
  title             text        NOT NULL,
  summary           text,
  content_json      jsonb       NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'pending',        -- pending | approved | rejected | deferred | executed
  priority          integer     DEFAULT 2,                         -- 1=urgent  2=normal  3=low
  agent_source      text,                                          -- bron | quill | sage | vex | forge
  review_notes      jsonb,                                         -- [{agent, score, summary}]
  execution_config  jsonb,                                         -- what to do on approve
  execution_result  jsonb,                                         -- result after execution
  callback_url      text,                                          -- Bron polls this for status
  owner_id          uuid,                                          -- who sees this item
  workspace_id      uuid,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  resolved_at       timestamptz
);

-- ─── approval_comments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_comments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id       uuid        NOT NULL REFERENCES approval_queue(id) ON DELETE CASCADE,
  author            text        NOT NULL,                          -- 'phill' | 'bron' | agent name
  body              text        NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_approval_queue_status      ON approval_queue (status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_owner       ON approval_queue (owner_id);
CREATE INDEX IF NOT EXISTS idx_approval_queue_workspace   ON approval_queue (workspace_id);
CREATE INDEX IF NOT EXISTS idx_approval_queue_type        ON approval_queue (type);
CREATE INDEX IF NOT EXISTS idx_approval_queue_priority    ON approval_queue (priority);
CREATE INDEX IF NOT EXISTS idx_approval_queue_created     ON approval_queue (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_comments_approval ON approval_comments (approval_id);

-- ─── Updated-at trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_approval_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_approval_queue_updated_at ON approval_queue;
CREATE TRIGGER trg_approval_queue_updated_at
  BEFORE UPDATE ON approval_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_queue_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;

-- approval_queue: owner can see their items
CREATE POLICY approval_queue_select ON approval_queue
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY approval_queue_insert ON approval_queue
  FOR INSERT WITH CHECK (true);  -- agents insert via service role

CREATE POLICY approval_queue_update ON approval_queue
  FOR UPDATE USING (auth.uid() = owner_id);

-- approval_comments: visible to approval owner
CREATE POLICY approval_comments_select ON approval_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM approval_queue
      WHERE approval_queue.id = approval_comments.approval_id
        AND approval_queue.owner_id = auth.uid()
    )
  );

CREATE POLICY approval_comments_insert ON approval_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM approval_queue
      WHERE approval_queue.id = approval_comments.approval_id
        AND approval_queue.owner_id = auth.uid()
    )
  );
