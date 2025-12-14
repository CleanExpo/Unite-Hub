/**
 * Migration 272: Managed Service Strategies Table
 * Creates tables for storing Blue Ocean and other strategic analyses for managed service projects
 *
 * Note: This migration depends on migration 270 (managed_service_projects)
 * Ensure migration 270 is applied before this migration.
 */

-- Create managed_service_strategies table
CREATE TABLE IF NOT EXISTS managed_service_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  strategy_type TEXT NOT NULL DEFAULT 'blue_ocean',
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  category_name TEXT,
  full_strategy JSONB NOT NULL,
  defensibility_score NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT strategy_type_valid CHECK (strategy_type IN ('blue_ocean', 'competitive_pivot', 'market_shift')),
  CONSTRAINT defensibility_score_valid CHECK (defensibility_score >= 0 AND defensibility_score <= 100)
);

-- Add foreign key constraint if managed_service_projects exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'managed_service_projects') THEN
    ALTER TABLE managed_service_strategies
    ADD CONSTRAINT fk_managed_service_strategies_project_id
    FOREIGN KEY (project_id) REFERENCES managed_service_projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create strategy execution tracking table
CREATE TABLE IF NOT EXISTS strategy_execution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES managed_service_strategies(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  output_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT phase_number_valid CHECK (phase_number >= 1),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  CONSTRAINT completion_percentage_valid CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Create strategy mutations and pivots tracking
CREATE TABLE IF NOT EXISTS strategy_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES managed_service_strategies(id) ON DELETE CASCADE,
  mutation_name TEXT NOT NULL,
  description TEXT,
  original_data JSONB,
  mutated_data JSONB,
  pros TEXT[],
  cons TEXT[],
  risk_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT risk_level_valid CHECK (risk_level IN ('low', 'medium', 'high'))
);

-- Create sub-agent execution records
CREATE TABLE IF NOT EXISTS strategy_sub_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES managed_service_strategies(id) ON DELETE CASCADE,
  sub_agent_type TEXT NOT NULL,
  task_description TEXT,
  status TEXT DEFAULT 'pending',
  execution_result JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,

  CONSTRAINT status_valid CHECK (status IN ('pending', 'running', 'completed', 'failed', 'blocked'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_managed_service_strategies_project_id
  ON managed_service_strategies(project_id);

CREATE INDEX IF NOT EXISTS idx_managed_service_strategies_strategy_type
  ON managed_service_strategies(strategy_type);

CREATE INDEX IF NOT EXISTS idx_managed_service_strategies_created_at
  ON managed_service_strategies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_execution_phases_strategy_id
  ON strategy_execution_phases(strategy_id);

CREATE INDEX IF NOT EXISTS idx_strategy_execution_phases_status
  ON strategy_execution_phases(status);

CREATE INDEX IF NOT EXISTS idx_strategy_mutations_strategy_id
  ON strategy_mutations(strategy_id);

CREATE INDEX IF NOT EXISTS idx_strategy_sub_agent_executions_strategy_id
  ON strategy_sub_agent_executions(strategy_id);

CREATE INDEX IF NOT EXISTS idx_strategy_sub_agent_executions_status
  ON strategy_sub_agent_executions(status);

-- Create RLS policies for workspace isolation
ALTER TABLE managed_service_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_execution_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_sub_agent_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy helper: Allow access to all authenticated users (can be refined with workspace checks)
DO $$
BEGIN
  -- Create policies, ignoring if they already exist
  BEGIN
    CREATE POLICY "strategies_workspace_isolation"
      ON managed_service_strategies
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "strategies_insert"
      ON managed_service_strategies
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "strategies_update"
      ON managed_service_strategies
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "execution_phases_select"
      ON strategy_execution_phases
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "execution_phases_insert"
      ON strategy_execution_phases
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "mutations_select"
      ON strategy_mutations
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "sub_agent_executions_select"
      ON strategy_sub_agent_executions
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

END $$;

-- Create audit trigger for strategy changes
CREATE OR REPLACE FUNCTION log_strategy_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditLogs (event, details, timestamp)
  VALUES (
    'strategy_' || TG_OP,
    jsonb_build_object(
      'strategy_id', NEW.id,
      'strategy_type', NEW.strategy_type,
      'business_name', NEW.business_name,
      'defensibility_score', NEW.defensibility_score
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategy_audit_trigger ON managed_service_strategies;
CREATE TRIGGER strategy_audit_trigger
AFTER INSERT OR UPDATE ON managed_service_strategies
FOR EACH ROW
EXECUTE FUNCTION log_strategy_change();

-- Log migration completion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migration_log') THEN
    INSERT INTO public.migration_log (name, executed_at)
    VALUES ('272_managed_service_strategies', NOW());
  END IF;
END $$;
