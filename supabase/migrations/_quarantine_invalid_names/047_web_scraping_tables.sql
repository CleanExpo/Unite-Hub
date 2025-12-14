-- Migration: Web Scraping and Competitor Analysis Tables
-- Created: 2025-11-19
-- Purpose: Add tables for storing web scraping results and competitor monitoring

-- Table: competitor_analysis
-- Stores results from competitor website analysis
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('basic', 'seo', 'full', 'competitor')),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: competitor_monitoring
-- Stores change detection results from competitor monitoring
CREATE TABLE IF NOT EXISTS competitor_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    changes_detected BOOLEAN DEFAULT FALSE,
    changes JSONB,
    previous_analysis_id UUID REFERENCES competitor_analysis(id) ON DELETE SET NULL,
    current_analysis_id UUID REFERENCES competitor_analysis(id) ON DELETE SET NULL,
    monitored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: scraping_jobs
-- Queue for scheduled scraping jobs
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    analysis_type TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_workspace ON competitor_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_url ON competitor_analysis(url);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_created ON competitor_analysis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_monitoring_workspace ON competitor_monitoring(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_monitoring_competitor ON competitor_monitoring(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_monitoring_monitored ON competitor_monitoring(monitored_at DESC);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_workspace ON scraping_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_next_run ON scraping_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);

-- RLS Policies

-- competitor_analysis policies
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace's competitor analysis"
ON competitor_analysis FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert competitor analysis"
ON competitor_analysis FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update their workspace's competitor analysis"
ON competitor_analysis FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their workspace's competitor analysis"
ON competitor_analysis FOR DELETE
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- competitor_monitoring policies
ALTER TABLE competitor_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace's monitoring results"
ON competitor_monitoring FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert monitoring results"
ON competitor_monitoring FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- scraping_jobs policies
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace's scraping jobs"
ON scraping_jobs FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert scraping jobs"
ON scraping_jobs FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their workspace's scraping jobs"
ON scraping_jobs FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their workspace's scraping jobs"
ON scraping_jobs FOR DELETE
USING (
    workspace_id IN (
        SELECT workspace_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_competitor_analysis_updated_at
    BEFORE UPDATE ON competitor_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at
    BEFORE UPDATE ON scraping_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE competitor_analysis IS 'Stores comprehensive competitor website analysis results';
COMMENT ON TABLE competitor_monitoring IS 'Tracks changes detected in competitor websites over time';
COMMENT ON TABLE scraping_jobs IS 'Queue for scheduled web scraping jobs';

-- Grant permissions (if needed)
-- GRANT ALL ON competitor_analysis TO authenticated;
-- GRANT ALL ON competitor_monitoring TO authenticated;
-- GRANT ALL ON scraping_jobs TO authenticated;
