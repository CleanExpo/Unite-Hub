-- 518: Feedback table for ATO + CRM user feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  page text,
  source text DEFAULT 'ato',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "service_role_all_feedback"
  ON feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonymous inserts allowed (public feedback)
CREATE POLICY "anon_insert_feedback"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (true);
