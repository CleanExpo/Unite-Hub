-- ============================================================
-- EXPERIMENTS — A/B testing and experiment tracking
-- Date: 15/03/2026
-- Auth: founder_id = auth.uid() + service_role for API routes
-- ============================================================

-- ── EXPERIMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key    TEXT NOT NULL,
  title           TEXT NOT NULL,
  hypothesis      TEXT NOT NULL,
  experiment_type TEXT NOT NULL
                  CHECK (experiment_type IN (
                    'social_copy', 'social_media', 'social_timing',
                    'social_platform', 'cta_variation', 'subject_line',
                    'landing_page', 'offer_test'
                  )),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  generated_by    TEXT CHECK (generated_by IN ('synthex_ai', 'manual')),
  ai_rationale    TEXT,
  metric_primary  TEXT NOT NULL DEFAULT 'engagement'
                  CHECK (metric_primary IN ('engagement', 'clicks', 'conversions', 'reach')),
  metric_secondary TEXT,
  sample_size_target INTEGER,
  confidence_level NUMERIC(3,2) NOT NULL DEFAULT 0.95,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  winner_variant_id UUID,
  conclusion      TEXT,
  approval_queue_id UUID REFERENCES public.approval_queue(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EXPERIMENT VARIANTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiment_variants (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id   UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_key     TEXT NOT NULL,
  label           TEXT NOT NULL,
  description     TEXT,
  content         TEXT,
  media_urls      JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_text        TEXT,
  scheduled_time  TEXT,
  platforms       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_control      BOOLEAN NOT NULL DEFAULT FALSE,
  weight          NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(experiment_id, variant_key)
);

-- Add winner FK now that experiment_variants exists
ALTER TABLE public.experiments
  ADD CONSTRAINT fk_winner_variant
  FOREIGN KEY (winner_variant_id) REFERENCES public.experiment_variants(id) ON DELETE SET NULL;

-- ── EXPERIMENT RESULTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiment_results (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id      UUID NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  experiment_id   UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_date     DATE NOT NULL,
  impressions     INTEGER NOT NULL DEFAULT 0,
  reach           INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  likes           INTEGER NOT NULL DEFAULT 0,
  comments        INTEGER NOT NULL DEFAULT 0,
  shares          INTEGER NOT NULL DEFAULT 0,
  saves           INTEGER NOT NULL DEFAULT 0,
  conversions     INTEGER NOT NULL DEFAULT 0,
  conversion_value_cents INTEGER NOT NULL DEFAULT 0,
  platform_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
  source          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual', 'api_sync', 'webhook')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(variant_id, period_date)
);

-- ── LINK social_posts to experiment variants ────────────────
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS experiment_variant_id UUID REFERENCES public.experiment_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_experiment
  ON public.social_posts(experiment_variant_id)
  WHERE experiment_variant_id IS NOT NULL;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_experiments_founder ON public.experiments(founder_id);
CREATE INDEX IF NOT EXISTS idx_experiments_business ON public.experiments(business_key);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment ON public.experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_variant ON public.experiment_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_period ON public.experiment_results(experiment_id, period_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- experiments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiments_select' AND tablename = 'experiments') THEN
    CREATE POLICY experiments_select ON public.experiments FOR SELECT USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiments_insert' AND tablename = 'experiments') THEN
    CREATE POLICY experiments_insert ON public.experiments FOR INSERT WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiments_update' AND tablename = 'experiments') THEN
    CREATE POLICY experiments_update ON public.experiments FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiments_delete' AND tablename = 'experiments') THEN
    CREATE POLICY experiments_delete ON public.experiments FOR DELETE USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiments_service_role' AND tablename = 'experiments') THEN
    CREATE POLICY experiments_service_role ON public.experiments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- experiment_variants policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_variants_select' AND tablename = 'experiment_variants') THEN
    CREATE POLICY experiment_variants_select ON public.experiment_variants FOR SELECT USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_variants_insert' AND tablename = 'experiment_variants') THEN
    CREATE POLICY experiment_variants_insert ON public.experiment_variants FOR INSERT WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_variants_update' AND tablename = 'experiment_variants') THEN
    CREATE POLICY experiment_variants_update ON public.experiment_variants FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_variants_delete' AND tablename = 'experiment_variants') THEN
    CREATE POLICY experiment_variants_delete ON public.experiment_variants FOR DELETE USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_variants_service_role' AND tablename = 'experiment_variants') THEN
    CREATE POLICY experiment_variants_service_role ON public.experiment_variants FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- experiment_results policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_results_select' AND tablename = 'experiment_results') THEN
    CREATE POLICY experiment_results_select ON public.experiment_results FOR SELECT USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_results_insert' AND tablename = 'experiment_results') THEN
    CREATE POLICY experiment_results_insert ON public.experiment_results FOR INSERT WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_results_update' AND tablename = 'experiment_results') THEN
    CREATE POLICY experiment_results_update ON public.experiment_results FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_results_delete' AND tablename = 'experiment_results') THEN
    CREATE POLICY experiment_results_delete ON public.experiment_results FOR DELETE USING (founder_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'experiment_results_service_role' AND tablename = 'experiment_results') THEN
    CREATE POLICY experiment_results_service_role ON public.experiment_results FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiment_variants_updated_at
  BEFORE UPDATE ON public.experiment_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
