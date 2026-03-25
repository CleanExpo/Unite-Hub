-- Strategy Intelligence Board
-- Tables for AI-generated daily insights (gstack × SEO/GEO lenses) + discussion threads

CREATE TABLE strategy_insights (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key text NOT NULL,
  run_date     date NOT NULL DEFAULT CURRENT_DATE,
  type         text NOT NULL CHECK (type IN ('seo-opportunity','content-gap','strategy','technical','quick-win')),
  title        text NOT NULL,
  body         text NOT NULL,
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','acting','done')),
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE strategy_insight_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid NOT NULL REFERENCES strategy_insights(id) ON DELETE CASCADE,
  author     text NOT NULL DEFAULT 'founder' CHECK (author IN ('founder','ai')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ON strategy_insights (founder_id, run_date DESC);
CREATE INDEX ON strategy_insights (business_key, status);
CREATE INDEX ON strategy_insight_comments (insight_id, created_at);

-- RLS
ALTER TABLE strategy_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_insight_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder owns insights" ON strategy_insights
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY "founder owns comments" ON strategy_insight_comments
  FOR ALL USING (
    insight_id IN (SELECT id FROM strategy_insights WHERE founder_id = auth.uid())
  );
