/**
 * Helper: safe table existence check for Guardian services.
 *
 * Avoids using pg_table_is_visible() and other visibility helpers from RPC.
 */

CREATE OR REPLACE FUNCTION public.guardian_table_exists(tablename text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT to_regclass(tablename) IS NOT NULL;
$$;

COMMENT ON FUNCTION public.guardian_table_exists(text) IS
  'Returns true if to_regclass(tablename) resolves to a relation; safe helper for existence checks.';

