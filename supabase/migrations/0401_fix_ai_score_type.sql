-- Migration 0401: Fix ai_score column type from NUMERIC to INTEGER
-- Purpose: Change ai_score from 0.0-1.0 numeric to 0-100 integer scale

DO $$
DECLARE
  ai_score_data_type TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
  ) THEN
    RETURN;
  END IF;

  SELECT c.data_type
    INTO ai_score_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'contacts'
    AND c.column_name = 'ai_score';

  IF ai_score_data_type = 'numeric' THEN
    EXECUTE 'ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_score_new INTEGER';
    EXECUTE 'UPDATE public.contacts SET ai_score_new = COALESCE(ROUND(ai_score * 100)::INTEGER, 0)';
    EXECUTE 'ALTER TABLE public.contacts DROP COLUMN IF EXISTS ai_score';

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contacts'
        AND column_name = 'ai_score_new'
    ) THEN
      EXECUTE 'ALTER TABLE public.contacts RENAME COLUMN ai_score_new TO ai_score';
    END IF;
  ELSIF ai_score_data_type IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contacts'
        AND column_name = 'ai_score_new'
    ) THEN
      EXECUTE 'ALTER TABLE public.contacts RENAME COLUMN ai_score_new TO ai_score';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'ai_score'
  ) THEN
    EXECUTE 'ALTER TABLE public.contacts ALTER COLUMN ai_score SET DEFAULT 0';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE c.conname = 'ai_score_range'
      AND c.contype = 'c'
      AND n.nspname = 'public'
      AND r.relname = 'contacts'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'ai_score'
  ) THEN
    EXECUTE 'ALTER TABLE public.contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100)';
  END IF;
END $$;
