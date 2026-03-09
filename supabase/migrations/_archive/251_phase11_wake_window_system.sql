-- Phase 11: Wake-Window Mode & Real-Time Advisor Integration
-- Tables for wake-window events, glasses sessions, and real-time interactions

-- Wake Window Events Table
CREATE TABLE IF NOT EXISTS wake_window_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Wake Detection
  trigger_type TEXT NOT NULL, -- wake_word, tap_glasses, manual_trigger
  wake_word_detected TEXT,
  confidence NUMERIC DEFAULT 0,

  -- Audio Processing
  audio_duration_ms INTEGER,
  transcript TEXT NOT NULL,
  raw_audio_deleted BOOLEAN DEFAULT TRUE,

  -- Compression Status
  compression_status TEXT NOT NULL, -- pending, compressed, failed

  -- Processing Metrics
  processing_time_ms INTEGER,
  battery_drain_percent NUMERIC,

  -- Context Packet (compressed)
  context_packet JSONB,

  -- Metadata
  glasses_model TEXT, -- ray_ban_meta, solos, xreal, viture, android_xr
  device_battery_percent INTEGER
);

-- Glasses Real-Time Sessions Table
CREATE TABLE IF NOT EXISTS glasses_realtime_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Session Info
  session_id TEXT NOT NULL UNIQUE,
  glasses_model TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  -- Device Capabilities
  has_audio_out BOOLEAN DEFAULT TRUE,
  has_haptic BOOLEAN DEFAULT FALSE,
  has_display BOOLEAN DEFAULT FALSE,
  display_width INTEGER,
  display_height INTEGER,

  -- Session State
  battery_percent INTEGER,
  wifi_quality INTEGER,
  speech_rate NUMERIC DEFAULT 1.0,
  volume_level INTEGER DEFAULT 75,
  display_brightness INTEGER DEFAULT 80,
  haptic_enabled BOOLEAN DEFAULT FALSE,

  -- Session Duration
  duration_minutes NUMERIC,

  -- Metadata
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Glasses Output/Display History Table
CREATE TABLE IF NOT EXISTS glasses_output_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Output Identity
  output_id TEXT NOT NULL UNIQUE,
  glasses_session_id UUID REFERENCES glasses_realtime_sessions(id),

  -- Output Type & Content
  output_type TEXT NOT NULL, -- advisor_response, notification, metric_update, status_alert
  primary_text TEXT NOT NULL,
  secondary_text TEXT,

  -- Audio Output
  audio_enabled BOOLEAN DEFAULT TRUE,
  audio_format TEXT, -- mp3, aac, wav, opus
  audio_speed INTEGER, -- words per minute
  audio_volume INTEGER,

  -- Visual Output
  visual_enabled BOOLEAN DEFAULT FALSE,
  visual_layout TEXT, -- text_only, text_with_metrics, full_dashboard, minimal_notification
  visual_duration_seconds INTEGER,

  -- Haptic Feedback
  haptic_enabled BOOLEAN DEFAULT FALSE,
  haptic_patterns JSONB, -- array of haptic pattern objects
  haptic_timing TEXT, -- start, during, end

  -- Output Control
  allow_interruption BOOLEAN DEFAULT TRUE,
  priority TEXT NOT NULL, -- low, medium, high, critical
  auto_dismiss_seconds INTEGER,

  -- User Engagement
  display_time_ms INTEGER,
  user_engagement TEXT -- skipped, partial, full, reread, unknown
);

-- Advisor Response Tracking Table
CREATE TABLE IF NOT EXISTS advisor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Response Identity
  response_id TEXT NOT NULL UNIQUE,
  wake_window_event_id UUID REFERENCES wake_window_events(id),

  -- Advisor Info
  advisor_type TEXT NOT NULL, -- business_advisor, product_advisor, etc.
  advice_type TEXT NOT NULL, -- immediate_action, decision_guidance, strategic_analysis, etc.

  -- Content
  primary_recommendation TEXT NOT NULL,
  supporting_reasoning TEXT,
  confidence NUMERIC DEFAULT 0,

  -- Actions
  immediate_actions JSONB, -- array of action strings
  follow_up_actions JSONB, -- array of action strings

  -- Context Integration
  considers_cognitive_state BOOLEAN DEFAULT FALSE,
  considers_life_signals BOOLEAN DEFAULT FALSE,
  considers_business_metrics BOOLEAN DEFAULT FALSE,
  considers_autonomy_policy BOOLEAN DEFAULT FALSE,

  -- Timing
  suggested_execution_time TEXT NOT NULL, -- immediate, next_hour, today, this_week, deferred
  best_time_to_act TEXT,
  reason_for_timing TEXT,

  -- Risk & Governance
  risk_level TEXT NOT NULL, -- low, medium, high, critical
  requires_founder_approval BOOLEAN DEFAULT FALSE,
  founder_approval_reason TEXT,

  -- Quality
  advisor_confidence NUMERIC,
  can_execute_autonomously BOOLEAN DEFAULT FALSE,
  escalation_criteria TEXT,

  -- Performance
  processing_time_ms INTEGER,
  model_used TEXT,
  tokens_used INTEGER
);

-- Companion Loop Events Table (scheduled advisor sessions)
CREATE TABLE IF NOT EXISTS companion_loop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Loop Info
  loop_type TEXT NOT NULL, -- morning_briefing, midday_check, evening_recap
  scheduled_time TEXT NOT NULL, -- HH:MM format

  -- Execution
  executed_at TIMESTAMPTZ,
  execution_status TEXT, -- pending, scheduled, executing, completed, skipped

  -- Content
  content JSONB, -- briefing content, recommendations, etc.
  briefing_data JSONB, -- business brain data, life signals, goals

  -- Approval
  approved_by_founder BOOLEAN DEFAULT FALSE,
  founder_approval_at TIMESTAMPTZ,

  -- Metadata
  cognitive_state TEXT, -- state when executed
  duration_minutes NUMERIC
);

-- Routing Decision Log (for cost tracking and optimization)
CREATE TABLE IF NOT EXISTS routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Decision Info
  decision_id TEXT NOT NULL UNIQUE,
  wake_window_event_id UUID REFERENCES wake_window_events(id),

  -- Routing
  primary_engine TEXT NOT NULL, -- local_intent, local_task, cloud_standard, cloud_extended, advisor_network, blocked
  selected_model TEXT, -- claude-haiku-4-5, claude-sonnet-4-5, claude-opus-4-1
  fallback_engines JSONB, -- array of fallback engine names

  -- Cost & Performance
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  estimated_latency_ms INTEGER,
  actual_latency_ms INTEGER,
  execution_priority TEXT, -- immediate, high, normal, batch

  -- Flags
  phase8_review BOOLEAN DEFAULT FALSE,
  founder_approval_required BOOLEAN DEFAULT FALSE,
  governance_check_passed BOOLEAN,

  -- Confidence & Reasoning
  confidence NUMERIC,
  reasoning TEXT,

  -- Execution Status
  execution_status TEXT -- pending, executing, completed, failed
);

-- Compression Metrics Tracking
CREATE TABLE IF NOT EXISTS compression_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Batch Info
  batch_id TEXT NOT NULL,
  event_count INTEGER,

  -- Metrics
  total_events_processed INTEGER,
  avg_compression_ratio NUMERIC,
  total_tokens_saved INTEGER,

  -- Breakdown by Domain
  domain_breakdown JSONB, -- {domain: {count, avg_ratio}}
  tag_breakdown JSONB, -- {tag: count}

  -- Quality
  high_confidence_count INTEGER, -- confidence > 0.8
  medium_confidence_count INTEGER,
  low_confidence_count INTEGER,

  -- Cost Savings
  estimated_cost_saved NUMERIC
);

-- Indexes for common queries
CREATE INDEX idx_wake_window_owner_date ON wake_window_events(owner, created_at DESC);
CREATE INDEX idx_wake_window_compression ON wake_window_events(compression_status);
CREATE INDEX idx_glasses_sessions_owner ON glasses_realtime_sessions(owner, created_at DESC);
CREATE INDEX idx_glasses_sessions_active ON glasses_realtime_sessions(owner, is_active);
CREATE INDEX idx_glasses_output_session ON glasses_output_history(glasses_session_id, created_at DESC);
CREATE INDEX idx_advisor_response_event ON advisor_responses(wake_window_event_id);
CREATE INDEX idx_advisor_response_type ON advisor_responses(advisor_type, risk_level);
CREATE INDEX idx_companion_events_owner ON companion_loop_events(owner, loop_type);
CREATE INDEX idx_companion_events_status ON companion_loop_events(execution_status);
CREATE INDEX idx_routing_decisions_engine ON routing_decisions(primary_engine);
CREATE INDEX idx_routing_decisions_cost ON routing_decisions(estimated_cost DESC);
CREATE INDEX idx_compression_metrics_batch ON compression_metrics(batch_id);

-- Row-Level Security
ALTER TABLE wake_window_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE glasses_realtime_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE glasses_output_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_loop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compression_metrics ENABLE ROW LEVEL SECURITY;

-- Authenticated read policies
CREATE POLICY "Allow authenticated read wake_window_events" ON wake_window_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read glasses_realtime_sessions" ON glasses_realtime_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read glasses_output_history" ON glasses_output_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read advisor_responses" ON advisor_responses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read companion_loop_events" ON companion_loop_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read routing_decisions" ON routing_decisions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read compression_metrics" ON compression_metrics FOR SELECT USING (auth.role() = 'authenticated');
