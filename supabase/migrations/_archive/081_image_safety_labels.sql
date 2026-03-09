-- Migration 081: Image Safety Labels
-- Required by Phase 25 - Visual Intelligence Engine (VIE)
-- Stores VIE safety analysis tags for images

CREATE TABLE IF NOT EXISTS image_safety_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_approval_id UUID NOT NULL,
  label TEXT NOT NULL,
  score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT image_safety_labels_approval_fk
    FOREIGN KEY (image_approval_id) REFERENCES image_approvals(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_image_fk ON image_safety_labels(image_approval_id);
CREATE INDEX IF NOT EXISTS idx_safety_label ON image_safety_labels(label);
CREATE INDEX IF NOT EXISTS idx_safety_score ON image_safety_labels(score DESC);

-- Enable RLS
ALTER TABLE image_safety_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies (internal access for admins)
CREATE POLICY safety_labels_select ON image_safety_labels
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND image_approval_id IN (
    SELECT id FROM image_approvals WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY safety_labels_insert ON image_safety_labels
  FOR INSERT TO authenticated
  WITH CHECK (image_approval_id IN (
    SELECT id FROM image_approvals WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE image_safety_labels IS 'Stores VIE safety analysis tags for images (Phase 25)';
