-- Check if realtime publication exists and what it's configured for
SELECT
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Check which tables are in the realtime publication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
