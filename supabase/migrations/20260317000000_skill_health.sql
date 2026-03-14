-- ============================================================
-- SKILL HEALTH — Tracks eval pass rates for Claude Code skills
-- Date: 17/03/2026
-- Part of: Karpathy Auto-Research Pattern (Phase F)
-- Auth: founder_id = auth.uid() + service_role for eval runner
-- ============================================================

CREATE TABLE IF NOT EXISTS public.skill_health (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  eval_count  INTEGER NOT NULL,
  pass_count  INTEGER NOT NULL,
  pass_rate   NUMERIC(5,2) NOT NULL,
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_skill_health_founder ON public.skill_health(founder_id);
CREATE INDEX IF NOT EXISTS idx_skill_health_skill ON public.skill_health(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_health_run_at ON public.skill_health(run_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_health_latest ON public.skill_health(founder_id, skill_name, run_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.skill_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_health_select" ON public.skill_health;
CREATE POLICY "skill_health_select"
  ON public.skill_health FOR SELECT
  USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "skill_health_insert" ON public.skill_health;
CREATE POLICY "skill_health_insert"
  ON public.skill_health FOR INSERT
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "skill_health_delete" ON public.skill_health;
CREATE POLICY "skill_health_delete"
  ON public.skill_health FOR DELETE
  USING (founder_id = auth.uid());

-- Service role access for automated eval runner
DROP POLICY IF EXISTS "skill_health_service_role" ON public.skill_health;
CREATE POLICY "skill_health_service_role"
  ON public.skill_health FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
