-- =====================================================================
-- Phase D60: Operational Runbook & Playbook Automation
-- =====================================================================
-- Tables: unite_runbooks, unite_runbook_steps, unite_runbook_executions
--
-- Purpose:
-- - Operational runbook library
-- - Step-by-step playbook execution
-- - Execution tracking and logging
-- - AI-powered runbook generation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 488

-- =====================================================================
-- 1. Tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_runbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'draft',
  tags text[],
  ai_profile jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_runbook_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runbook_id uuid NOT NULL REFERENCES unite_runbooks(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  title text NOT NULL,
  instructions text,
  action_type text,
  action_config jsonb,
  ai_prompt text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_runbook_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  runbook_id uuid NOT NULL REFERENCES unite_runbooks(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_ref text,
  status text NOT NULL DEFAULT 'running',
  current_step_index integer DEFAULT 0,
  logs jsonb,
  ai_summary jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_runbooks_tenant_slug ON unite_runbooks(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_unite_runbook_steps_runbook ON unite_runbook_steps(runbook_id, order_index);
CREATE INDEX IF NOT EXISTS idx_unite_runbook_executions_tenant ON unite_runbook_executions(tenant_id, runbook_id, started_at DESC);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_runbook_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON unite_runbooks;
CREATE POLICY "tenant_isolation" ON unite_runbooks
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "tenant_isolation" ON unite_runbook_executions;
CREATE POLICY "tenant_isolation" ON unite_runbook_executions
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);
