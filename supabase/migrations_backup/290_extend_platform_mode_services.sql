-- Migration: Extend sys_platform_mode with per-service modes
-- Date: 2025-11-27
-- Phase: 10 - Pre-Hard-Launch Tuning

-- Add new columns for DataForSEO, SEMRush, and AI modes
ALTER TABLE sys_platform_mode
ADD COLUMN IF NOT EXISTS dataforseo_mode TEXT DEFAULT 'test' CHECK (dataforseo_mode IN ('test', 'live')),
ADD COLUMN IF NOT EXISTS semrush_mode TEXT DEFAULT 'test' CHECK (semrush_mode IN ('test', 'live')),
ADD COLUMN IF NOT EXISTS ai_mode TEXT DEFAULT 'test' CHECK (ai_mode IN ('test', 'live'));

-- Update existing row to have default values
UPDATE sys_platform_mode
SET
  dataforseo_mode = COALESCE(dataforseo_mode, 'test'),
  semrush_mode = COALESCE(semrush_mode, 'test'),
  ai_mode = COALESCE(ai_mode, 'test')
WHERE id = 1;

-- Add service column to audit table for tracking per-service changes
ALTER TABLE sys_platform_mode_audit
ADD COLUMN IF NOT EXISTS service TEXT DEFAULT 'stripe';

-- Add comment for documentation
COMMENT ON TABLE sys_platform_mode IS 'Platform-wide service mode configuration (test/live) for Stripe, DataForSEO, SEMRush, and AI models. Only modifiable by platform admins.';

COMMENT ON COLUMN sys_platform_mode.dataforseo_mode IS 'TEST uses mock data, LIVE uses real DataForSEO API credits';
COMMENT ON COLUMN sys_platform_mode.semrush_mode IS 'TEST uses mock data, LIVE uses real SEMRush API credits';
COMMENT ON COLUMN sys_platform_mode.ai_mode IS 'TEST uses cheaper Haiku model, LIVE uses full Opus/Sonnet capability';
