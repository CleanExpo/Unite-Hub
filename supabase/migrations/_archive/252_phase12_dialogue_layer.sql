-- Phase 12: Real-Time Dialogue Layer & Memory Consolidation
-- Tables for dialogue sessions, turns, and long-term memory consolidation

-- Dialogue Sessions Table
CREATE TABLE IF NOT EXISTS dialogue_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Session Info
  session_id TEXT NOT NULL UNIQUE,
  workspace_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  duration_seconds INTEGER,

  -- Dialogue State
  current_turn INTEGER DEFAULT 0,
  last_user_turn_time TIMESTAMPTZ,
  last_assistant_turn_time TIMESTAMPTZ,

  -- Cognitive Context (from Phase 10)
  cognitive_state TEXT NOT NULL, -- sharp, good, tired, fatigued, overloaded
  energy_level INTEGER DEFAULT 70, -- 0-100

  -- Conversation Flow
  topic_stack JSONB DEFAULT '[]', -- array of topics
  interrupts_detected INTEGER DEFAULT 0,
  backtrack_requests INTEGER DEFAULT 0,

  -- Emotional Arc
  user_sentiment_trend TEXT DEFAULT 'stable', -- improving, stable, declining
  user_frustration_level INTEGER DEFAULT 0, -- 0-100

  -- Metadata
  glasses_model TEXT, -- ray_ban_meta, solos, xreal, viture, android_xr
  active_advisor_type TEXT,
  phase8_violations INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT
);

-- Dialogue Turns Table
CREATE TABLE IF NOT EXISTS dialogue_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Turn Identity
  turn_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES dialogue_sessions(session_id),
  turn_number INTEGER NOT NULL,

  -- Speaker & Content
  speaker TEXT NOT NULL, -- user, assistant
  transcript TEXT NOT NULL,

  -- User Context
  user_emotion TEXT, -- calm, engaged, curious, frustrated, urgent, confused
  user_energy_level TEXT, -- low, normal, high
  user_confidence NUMERIC, -- 0-1

  -- Assistant Context
  assistant_tone TEXT, -- casual, clarifying, advising, urgent, warm, precise
  confidence NUMERIC, -- 0-1

  -- Timing
  latency_ms INTEGER,
  pacing_ms INTEGER,
  natural_pause_ms INTEGER,

  -- Safety & Governance
  safety_status TEXT NOT NULL DEFAULT 'safe', -- safe, flagged, blocked
  requires_approval BOOLEAN DEFAULT FALSE,
  risk_level TEXT DEFAULT 'low', -- low, medium, high, critical

  -- Memory Integration
  captured_memories JSONB, -- array of memory fragment IDs
  references_long_term BOOLEAN DEFAULT FALSE,

  -- Metadata
  domain TEXT,
  intent TEXT,
  context_used JSONB -- array of context references
);

-- Dialogue Memory Events Table (for consolidation)
CREATE TABLE IF NOT EXISTS dialogue_memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Memory Fragment Identity
  memory_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES dialogue_sessions(session_id),

  -- Content
  content TEXT NOT NULL,
  source_turn_id TEXT NOT NULL REFERENCES dialogue_turns(turn_id),

  -- Classification
  domain TEXT NOT NULL, -- business, personal, financial, relationship, health, learning, goal, decision, strategy
  emotional_valence TEXT NOT NULL, -- positive, neutral, negative

  -- Markers
  involves_person BOOLEAN DEFAULT FALSE,
  involves_decision BOOLEAN DEFAULT FALSE,
  involves_goal BOOLEAN DEFAULT FALSE,

  -- Importance Score
  importance_score INTEGER DEFAULT 50, -- 0-100
  recency_weight NUMERIC DEFAULT 0.2,
  emotion_weight NUMERIC DEFAULT 0.2,
  impact_weight NUMERIC DEFAULT 0.3,

  -- Consolidation Status
  consolidated BOOLEAN DEFAULT FALSE,
  consolidated_at TIMESTAMPTZ,
  unified_memory_id UUID, -- Reference to unified_agent_memory

  -- Topic Tags
  topic_tags JSONB DEFAULT '[]', -- array of tags

  -- Metadata
  summary TEXT -- Human-readable summary
);

-- Consolidated Memory Batches Table (one per dialogue session conclusion)
CREATE TABLE IF NOT EXISTS dialogue_consolidated_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Memory Identity
  consolidated_memory_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES dialogue_sessions(session_id),
  workspace_id UUID NOT NULL,

  -- Fragments Consolidated
  fragment_count INTEGER NOT NULL,
  fragment_ids JSONB NOT NULL, -- array of memory_id references

  -- Aggregated Metadata
  dominant_domain TEXT NOT NULL,
  dominant_emotion TEXT NOT NULL, -- positive, neutral, negative
  average_importance INTEGER,
  peak_importance INTEGER,

  -- Unified Memory Link
  unified_memory_id UUID, -- Link to unified_agent_memory table
  sync_status TEXT DEFAULT 'pending', -- pending, synced, error
  sync_timestamp TIMESTAMPTZ,

  -- Extracted Data
  person_mentions JSONB DEFAULT '[]', -- array of names
  decision_points JSONB DEFAULT '[]', -- array of decisions
  goal_references JSONB DEFAULT '[]', -- array of goals
  topic_tags JSONB DEFAULT '[]', -- array of tags

  -- Bidirectional Sync
  requires_bidirectional_update BOOLEAN DEFAULT FALSE,
  bidirectional_sync_reason TEXT,

  -- Metadata
  notes TEXT
);

-- Voice Output History Table (for glasses audio delivery)
CREATE TABLE IF NOT EXISTS dialogue_voice_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Output Identity
  output_id TEXT NOT NULL UNIQUE,
  turn_id TEXT NOT NULL REFERENCES dialogue_turns(turn_id),

  -- Content
  text TEXT NOT NULL,
  audio_url TEXT, -- URL to stored audio
  audio_duration_ms INTEGER,

  -- TTS Details
  provider TEXT NOT NULL, -- elevenlabs, google, aws_polly, device_native
  voice_profile TEXT NOT NULL, -- male_natural, female_natural, etc.
  synthesis_time_ms INTEGER,

  -- Playback Control
  autoplay BOOLEAN DEFAULT TRUE,
  allow_interruption BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical

  -- Fallback Info
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT,

  -- Performance Metrics
  first_byte_latency_ms INTEGER,
  total_playback_duration_ms INTEGER
);

-- Dialogue Safety Log Table
CREATE TABLE IF NOT EXISTS dialogue_safety_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,

  -- Event Identity
  interaction_id TEXT NOT NULL,
  turn_id TEXT REFERENCES dialogue_turns(turn_id),

  -- Safety Check
  safety_status TEXT NOT NULL, -- safe, flagged, blocked
  reasons JSONB NOT NULL, -- array of block reasons

  -- Details
  user_input TEXT,
  assistant_output TEXT,
  domain TEXT,
  explanation TEXT,

  -- Approval
  requires_founder_approval BOOLEAN DEFAULT FALSE,
  approval_priority TEXT, -- low, medium, high, critical
  approved_by_founder BOOLEAN,
  founder_approval_timestamp TIMESTAMPTZ,
  founder_notes TEXT,

  -- Metadata
  latency_ms INTEGER
);

-- Indexes for common queries
CREATE INDEX idx_dialogue_sessions_owner ON dialogue_sessions(owner, created_at DESC);
CREATE INDEX idx_dialogue_sessions_active ON dialogue_sessions(owner, is_active);
CREATE INDEX idx_dialogue_sessions_workspace ON dialogue_sessions(workspace_id);
CREATE INDEX idx_dialogue_turns_session ON dialogue_turns(session_id, turn_number);
CREATE INDEX idx_dialogue_turns_speaker ON dialogue_turns(speaker);
CREATE INDEX idx_dialogue_memory_session ON dialogue_memory_events(session_id);
CREATE INDEX idx_dialogue_memory_domain ON dialogue_memory_events(domain);
CREATE INDEX idx_dialogue_memory_importance ON dialogue_memory_events(importance_score DESC);
CREATE INDEX idx_dialogue_memory_consolidated ON dialogue_memory_events(consolidated);
CREATE INDEX idx_consolidated_memory_session ON dialogue_consolidated_memory(session_id);
CREATE INDEX idx_consolidated_memory_unified ON dialogue_consolidated_memory(unified_memory_id);
CREATE INDEX idx_voice_outputs_turn ON dialogue_voice_outputs(turn_id);
CREATE INDEX idx_voice_outputs_provider ON dialogue_voice_outputs(provider);
CREATE INDEX idx_safety_log_interaction ON dialogue_safety_log(interaction_id);
CREATE INDEX idx_safety_log_status ON dialogue_safety_log(safety_status);
CREATE INDEX idx_safety_log_approval ON dialogue_safety_log(requires_founder_approval);

-- Row-Level Security
ALTER TABLE dialogue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_consolidated_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_voice_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_safety_log ENABLE ROW LEVEL SECURITY;

-- Authenticated read/write policies
CREATE POLICY "Allow authenticated read dialogue_sessions" ON dialogue_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read dialogue_turns" ON dialogue_turns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read dialogue_memory_events" ON dialogue_memory_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read dialogue_consolidated_memory" ON dialogue_consolidated_memory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read dialogue_voice_outputs" ON dialogue_voice_outputs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read dialogue_safety_log" ON dialogue_safety_log FOR SELECT USING (auth.role() = 'authenticated');
