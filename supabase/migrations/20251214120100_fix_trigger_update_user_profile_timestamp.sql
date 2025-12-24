/**
 * Fix-forward: ensure updated_at triggers exist without editing historical migrations.
 *
 * This is safe to re-run:
 * - Creates/updates trigger functions via CREATE OR REPLACE
 * - Creates triggers only if missing
 */

CREATE OR REPLACE FUNCTION public.update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NULL THEN
    RAISE NOTICE 'public.user_profiles does not exist; skipping trigger_update_user_profile_timestamp';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_update_user_profile_timestamp'
      AND n.nspname = 'public'
      AND c.relname = 'user_profiles'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE $trg$
      CREATE TRIGGER trigger_update_user_profile_timestamp
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_user_profile_timestamp();
    $trg$;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_user_org_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.user_organizations') IS NULL THEN
    RAISE NOTICE 'public.user_organizations does not exist; skipping trigger_update_user_org_timestamp';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_update_user_org_timestamp'
      AND n.nspname = 'public'
      AND c.relname = 'user_organizations'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE $trg$
      CREATE TRIGGER trigger_update_user_org_timestamp
        BEFORE UPDATE ON public.user_organizations
        FOR EACH ROW
        EXECUTE FUNCTION public.update_user_org_timestamp();
    $trg$;
  END IF;
END $$;

