-- supabase/migrations/520_kanban_tasks.sql

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'todo'
                      CHECK (status IN ('todo','in-progress','blocked','done')),
  priority            TEXT NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  assignee_type       TEXT NOT NULL DEFAULT 'self'
                      CHECK (assignee_type IN ('self','agent','staff','client')),
  assignee_id         UUID,
  assignee_name       TEXT,
  obsidian_path       TEXT,
  obsidian_synced_at  TIMESTAMPTZ,
  tags                TEXT[] DEFAULT '{}',
  due_date            DATE,
  position            INT NOT NULL DEFAULT 0,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Vault config per workspace
CREATE TABLE IF NOT EXISTS public.workspace_vault_config (
  workspace_id    UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  vault_path      TEXT NOT NULL,
  sync_enabled    BOOLEAN DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS tasks_workspace_status_idx ON public.tasks (workspace_id, status);
CREATE INDEX IF NOT EXISTS tasks_workspace_position_idx ON public.tasks (workspace_id, status, position);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_vault_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_workspace_isolation" ON public.tasks
  USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "tasks_workspace_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "vault_config_isolation" ON public.workspace_vault_config
  USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "vault_config_insert" ON public.workspace_vault_config
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
