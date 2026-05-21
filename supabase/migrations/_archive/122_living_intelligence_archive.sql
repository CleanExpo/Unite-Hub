-- Phase 78: Living Intelligence Archive
-- Creates schema for unified chronological archive of client events

-- Create archive_entries table
CREATE TABLE IF NOT EXISTS archive_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  source_engine TEXT NOT NULL,
  category TEXT NOT NULL,
  importance_score INTEGER DEFAULT 50 CHECK (importance_score >= 0 AND importance_score <= 100),
  summary TEXT NOT NULL,
  details_json JSONB DEFAULT '{}'::jsonb,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE,
  truth_completeness TEXT DEFAULT 'complete',
  data_sources TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create archive_tags table for optional tagging
CREATE TABLE IF NOT EXISTS archive_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_entry_id UUID NOT NULL REFERENCES archive_entries(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_archive_entries_workspace_client_date
  ON archive_entries(workspace_id, client_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_archive_entries_source_date
  ON archive_entries(source_engine, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_archive_entries_event_type
  ON archive_entries(event_type);

CREATE INDEX IF NOT EXISTS idx_archive_entries_category
  ON archive_entries(category);

CREATE INDEX IF NOT EXISTS idx_archive_entries_importance
  ON archive_entries(importance_score DESC);

CREATE INDEX IF NOT EXISTS idx_archive_tags_entry
  ON archive_tags(archive_entry_id);

CREATE INDEX IF NOT EXISTS idx_archive_tags_tag
  ON archive_tags(tag);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_archive_entries_details
  ON archive_entries USING GIN (details_json);

-- Enable RLS
ALTER TABLE archive_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archive_entries
-- Clients can only see their own workspace entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'archive_entries' AND policyname = 'archive_entries_select_own'
  ) THEN
    CREATE POLICY archive_entries_select_own ON archive_entries
      FOR SELECT
      USING (
        workspace_id IN (
          SELECT org_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Authenticated users can insert entries for their workspace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'archive_entries' AND policyname = 'archive_entries_insert_own'
  ) THEN
    CREATE POLICY archive_entries_insert_own ON archive_entries
      FOR INSERT
      WITH CHECK (
        workspace_id IN (
          SELECT org_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS Policies for archive_tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'archive_tags' AND policyname = 'archive_tags_select_own'
  ) THEN
    CREATE POLICY archive_tags_select_own ON archive_tags
      FOR SELECT
      USING (
        archive_entry_id IN (
          SELECT id FROM archive_entries
          WHERE workspace_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'archive_tags' AND policyname = 'archive_tags_insert_own'
  ) THEN
    CREATE POLICY archive_tags_insert_own ON archive_tags
      FOR INSERT
      WITH CHECK (
        archive_entry_id IN (
          SELECT id FROM archive_entries
          WHERE workspace_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE archive_entries IS 'Living Intelligence Archive - unified chronological history of client events';
COMMENT ON COLUMN archive_entries.event_type IS 'Type: weekly_report, monthly_report, ninety_day_report, story, touchpoint, success_event, performance_event, creative_event, vif_event, production_event, director_alert, governance_alert';
COMMENT ON COLUMN archive_entries.source_engine IS 'Source: performance, success, creative_ops, creative_director, vif, production, director, governance, reports, storytelling, touchpoints';
COMMENT ON COLUMN archive_entries.category IS 'Category: reports, stories, events, alerts, milestones';
COMMENT ON COLUMN archive_entries.importance_score IS 'Importance 0-100: routine=30, notable=50, significant=70, critical=90';
COMMENT ON COLUMN archive_entries.truth_completeness IS 'Data status: complete, partial, limited';
COMMENT ON COLUMN archive_entries.data_sources IS 'Array of data sources used to generate this entry';
