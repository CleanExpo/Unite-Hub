-- Check for EVENT TRIGGERS that might fire on DDL commands
SELECT
  evtname AS trigger_name,
  evtevent AS event,
  evtfoid::regproc AS function_name,
  evtenabled AS enabled
FROM pg_event_trigger
ORDER BY evtname;

-- Check the actual functions these triggers call
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.oid IN (
  SELECT evtfoid FROM pg_event_trigger
);
