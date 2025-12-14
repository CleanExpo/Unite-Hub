-- Phase 10: Human Extension Layer – Parallel Phill System
-- Tables for thought logs, life signals, cognitive states, and autonomy decisions

-- Thought Log Table
CREATE TABLE IF NOT EXISTS parallel_phill_thought_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  input_method TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  domains JSONB DEFAULT '[]',
  urgency TEXT NOT NULL,
  status TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  advisor_routing JSONB,
  action_items JSONB,
  follow_up_date DATE
);

-- Life Signals Table
CREATE TABLE IF NOT EXISTS parallel_phill_life_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  snapshot_timestamp TIMESTAMPTZ NOT NULL,
  signal_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.8,
  metadata JSONB
);

-- Cognitive States Table
CREATE TABLE IF NOT EXISTS parallel_phill_cognitive_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  cognitive_state TEXT NOT NULL,
  score INTEGER NOT NULL,
  factors JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]',
  task_suitability JSONB DEFAULT '{}'
);

-- Companion Loop Events Table
CREATE TABLE IF NOT EXISTS parallel_phill_companion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  content JSONB NOT NULL,
  briefing_data JSONB,
  executed_at TIMESTAMPTZ,
  approved_by_founder BOOLEAN DEFAULT FALSE
);

-- Autonomy Decisions Table
CREATE TABLE IF NOT EXISTS parallel_phill_autonomy_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  autonomy_level TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  risk_level TEXT NOT NULL,
  governance_check_passed BOOLEAN DEFAULT FALSE,
  founder_approval JSONB,
  execution_status TEXT NOT NULL,
  explanation TEXT
);

-- Indexes for common queries
CREATE INDEX idx_thought_log_owner_urgency ON parallel_phill_thought_log(owner, urgency);
CREATE INDEX idx_thought_log_status ON parallel_phill_thought_log(status);
CREATE INDEX idx_life_signals_owner_date ON parallel_phill_life_signals(owner, created_at);
CREATE INDEX idx_cognitive_states_owner ON parallel_phill_cognitive_states(owner, created_at);
CREATE INDEX idx_companion_events_owner ON parallel_phill_companion_events(owner, event_type);
CREATE INDEX idx_autonomy_decisions_owner ON parallel_phill_autonomy_decisions(owner, execution_status);

-- Row-Level Security
ALTER TABLE parallel_phill_thought_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parallel_phill_life_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE parallel_phill_cognitive_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE parallel_phill_companion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE parallel_phill_autonomy_decisions ENABLE ROW LEVEL SECURITY;

-- Authenticated read policies
CREATE POLICY "Allow authenticated read thought_log" ON parallel_phill_thought_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read life_signals" ON parallel_phill_life_signals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read cognitive_states" ON parallel_phill_cognitive_states FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read companion_events" ON parallel_phill_companion_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read autonomy_decisions" ON parallel_phill_autonomy_decisions FOR SELECT USING (auth.role() = 'authenticated');
