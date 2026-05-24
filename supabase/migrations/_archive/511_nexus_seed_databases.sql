-- Migration 511: Seed 7 default NEXUS databases with system owner
-- Uses placeholder owner_id; the API clones to the real user on first access.
-- Idempotent: ON CONFLICT DO NOTHING.

DO $$
DECLARE
  sys_owner uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN

  -- 1. Businesses
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Businesses', '🏢', 'Track all Unite-Group businesses',
    '[{"id":"name","name":"Name","type":"text"},{"id":"industry","name":"Industry","type":"text"},{"id":"status","name":"Status","type":"select","options":["active","paused","planning"]},{"id":"mrr","name":"MRR","type":"number"},{"id":"abn","name":"ABN","type":"text"}]',
    'table', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 2. Active Projects
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Active Projects', '🚀', 'Current projects across businesses',
    '[{"id":"name","name":"Name","type":"text"},{"id":"business","name":"Business","type":"text"},{"id":"status","name":"Status","type":"select","options":["in-progress","blocked","complete"]},{"id":"due_date","name":"Due Date","type":"date"},{"id":"owner","name":"Owner","type":"text"}]',
    'board', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 3. Today's Tasks
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Today''s Tasks', '✅', 'Daily task tracker',
    '[{"id":"task","name":"Task","type":"text"},{"id":"business","name":"Business","type":"text"},{"id":"priority","name":"Priority","type":"select","options":["urgent","normal","low"]},{"id":"done","name":"Done","type":"checkbox"}]',
    'table', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 4. Revenue Tracker
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Revenue Tracker', '💰', 'Monthly revenue across businesses',
    '[{"id":"business","name":"Business","type":"text"},{"id":"month","name":"Month","type":"text"},{"id":"mrr","name":"MRR","type":"number"},{"id":"customers","name":"Customers","type":"number"},{"id":"growth_pct","name":"Growth%","type":"number"}]',
    'table', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 5. Content Pipeline
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Content Pipeline', '📝', 'Content creation pipeline',
    '[{"id":"title","name":"Title","type":"text"},{"id":"type","name":"Type","type":"text"},{"id":"business","name":"Business","type":"text"},{"id":"status","name":"Status","type":"select","options":["draft","review","scheduled","published"]},{"id":"platform","name":"Platform","type":"text"}]',
    'board', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 6. Network
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Network', '🤝', 'Key contacts and relationships',
    '[{"id":"name","name":"Name","type":"text"},{"id":"company","name":"Company","type":"text"},{"id":"role","name":"Role","type":"text"},{"id":"email","name":"Email","type":"text"},{"id":"last_contact","name":"Last Contact","type":"date"}]',
    'table', sys_owner
  ) ON CONFLICT DO NOTHING;

  -- 7. Ideas Bank
  INSERT INTO nexus_databases (name, icon, description, columns, default_view, owner_id)
  VALUES (
    'Ideas Bank', '💡', 'Capture ideas for later',
    '[{"id":"idea","name":"Idea","type":"text"},{"id":"business","name":"Business","type":"text"},{"id":"priority","name":"Priority","type":"select","options":["high","medium","low"]},{"id":"status","name":"Status","type":"select","options":["new","validated","building","shipped"]}]',
    'table', sys_owner
  ) ON CONFLICT DO NOTHING;

END $$;
