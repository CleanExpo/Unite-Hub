-- Agent Runs table with Realtime support for event bridge
-- This table enables real-time communication between Next.js frontend and FastAPI backend

-- Agent runs table to track all agent executions
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Agent identification
  agent_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'awaiting_verification',
    'verification_in_progress',
    'verification_passed',
    'verification_failed',
    'completed',
    'failed',
    'blocked',
    'escalated_to_human'
  )),

  -- Progress tracking
  current_step TEXT,
  progress_percent FLOAT DEFAULT 0.0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

  -- Results and metadata
  result JSONB,
  error TEXT,
  metadata JSONB DEFAULT '{}',

  -- Verification tracking
  verification_attempts INT DEFAULT 0,
  verification_evidence JSONB DEFAULT '[]',

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own agent runs"
  ON public.agent_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent runs"
  ON public.agent_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role has full access"
  ON public.agent_runs
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_task_id ON public.agent_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON public.agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON public.agent_runs(agent_name);

-- Trigger for updated_at
CREATE TRIGGER update_agent_runs_updated_at
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for this table
-- This allows frontend to subscribe to changes in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;

-- Create a view for agent run summaries (useful for dashboards)
CREATE OR REPLACE VIEW public.agent_run_summaries AS
SELECT
  ar.id,
  ar.task_id,
  ar.user_id,
  ar.agent_name,
  ar.status,
  ar.current_step,
  ar.progress_percent,
  ar.verification_attempts,
  ar.started_at,
  ar.completed_at,
  ar.updated_at,
  t.description as task_description,
  EXTRACT(EPOCH FROM (COALESCE(ar.completed_at, NOW()) - ar.started_at)) as duration_seconds
FROM public.agent_runs ar
LEFT JOIN public.tasks t ON ar.task_id = t.id;

-- Grant access to the view
GRANT SELECT ON public.agent_run_summaries TO authenticated;
GRANT SELECT ON public.agent_run_summaries TO service_role;

-- Create function to emit custom events for specific actions
CREATE OR REPLACE FUNCTION public.notify_agent_run_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to certain states, we can add custom logic
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log the status change in metadata
    NEW.metadata = jsonb_set(
      COALESCE(NEW.metadata, '{}'::jsonb),
      '{status_history}',
      COALESCE(NEW.metadata->'status_history', '[]'::jsonb) ||
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track status changes
CREATE TRIGGER agent_run_status_change
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_agent_run_status_change();

-- Create helper function to get active runs for a user
CREATE OR REPLACE FUNCTION public.get_active_agent_runs(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  agent_name TEXT,
  status TEXT,
  current_step TEXT,
  progress_percent FLOAT,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.agent_name,
    ar.status,
    ar.current_step,
    ar.progress_percent,
    ar.started_at
  FROM public.agent_runs ar
  WHERE ar.user_id = p_user_id
    AND ar.status IN ('pending', 'in_progress', 'awaiting_verification', 'verification_in_progress')
  ORDER BY ar.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_agent_runs(UUID) TO authenticated;

-- Comment on table
COMMENT ON TABLE public.agent_runs IS 'Real-time agent execution tracking for event bridge between Next.js and FastAPI';
COMMENT ON COLUMN public.agent_runs.metadata IS 'Flexible JSONB field for additional agent-specific data and status history';
COMMENT ON COLUMN public.agent_runs.verification_evidence IS 'Array of verification evidence collected by IndependentVerifier';
