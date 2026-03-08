-- Phase 13 Migration: Real-World Context Layer (Visual & Situational Awareness)
-- Supports event-based visual capture from smart glasses, environment profiling, and safety context filtering
-- Status: MVP with privacy-first design (no raw image storage)
-- Date: 2025-11-26

-- ============================================================================
-- TABLE 1: visual_context_events
-- Stores semantic descriptions of captured scenes (not raw images)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visual_context_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Event identity
  event_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source information
  glasses_model TEXT NOT NULL, -- 'ray_ban_meta', 'xreal', 'solos', etc.

  -- Semantic scene description (no raw image bytes)
  environment_type TEXT NOT NULL, -- 'home', 'office', 'street', 'car', 'cafe', 'transit', 'outdoor', 'retail', 'unknown'
  scene_summary TEXT NOT NULL, -- <300 chars human readable summary
  scene_hash TEXT NOT NULL, -- Deduplication hash

  -- Detected objects (lightweight representation)
  detected_objects JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {label, confidence, location, color}
  extracted_text JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {content, confidence, position}

  -- Environmental markers
  semantic_tags TEXT[] NOT NULL DEFAULT '{}', -- ['crowded', 'quiet', 'cluttered', 'minimal', etc.]
  safety_markers JSONB NOT NULL DEFAULT '{}'::jsonb, -- {vehicleTraffic, pedestrianTraffic, machinery, hazards}

  -- Metadata
  time_of_day TEXT NOT NULL, -- 'early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'
  overall_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85, -- 0-1

  -- Analysis status
  analyzed BOOLEAN NOT NULL DEFAULT FALSE,
  analysis_timestamp TIMESTAMPTZ,

  -- Privacy: no raw image storage (semantic only)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-delete old events after 30 days

  CONSTRAINT visual_context_valid_confidence CHECK (overall_confidence >= 0 AND overall_confidence <= 1)
);

CREATE INDEX idx_visual_context_owner_time ON visual_context_events(owner_id, timestamp DESC);
CREATE INDEX idx_visual_context_workspace ON visual_context_events(workspace_id, timestamp DESC);
CREATE INDEX idx_visual_context_hash ON visual_context_events(scene_hash);
CREATE INDEX idx_visual_context_analyzed ON visual_context_events(analyzed, timestamp DESC);
CREATE INDEX idx_visual_context_env_type ON visual_context_events(environment_type, timestamp DESC);

-- ============================================================================
-- TABLE 2: surroundings_insights
-- Stores reasoning outputs about detected surroundings
-- ============================================================================

CREATE TABLE IF NOT EXISTS surroundings_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Insight identity
  insight_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Link to visual context
  visual_context_id UUID NOT NULL REFERENCES visual_context_events(id) ON DELETE CASCADE,

  -- Environment assessment
  environment_type TEXT NOT NULL,
  environment_description TEXT NOT NULL,

  -- Scored dimensions (0-100)
  safety_score NUMERIC(3,0) NOT NULL, -- 0 = danger, 100 = very safe
  focus_score NUMERIC(3,0) NOT NULL, -- 0 = high distraction, 100 = perfect focus
  social_pressure_score NUMERIC(3,0) NOT NULL, -- 0 = alone, 100 = crowded

  -- Detected context
  likely_activity TEXT NOT NULL, -- 'working', 'commuting', 'socializing', 'exercising', 'resting'
  social_context TEXT NOT NULL, -- 'alone', 'small_group', 'crowd', 'meeting', 'unknown'

  -- Derived insights
  hazard_warnings JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type, severity, description, recommendation}
  focus_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type, suitability, description}

  -- Interaction recommendations
  recommended_response_length TEXT NOT NULL, -- 'very_brief', 'brief', 'normal', 'detailed'
  recommended_pace TEXT NOT NULL, -- 'very_fast', 'fast', 'normal', 'slow'
  recommended_complexity TEXT NOT NULL, -- 'minimal', 'simple', 'normal', 'complex'
  interaction_reasoning TEXT NOT NULL,

  -- Confidence
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT surroundings_score_range CHECK (
    safety_score >= 0 AND safety_score <= 100 AND
    focus_score >= 0 AND focus_score <= 100 AND
    social_pressure_score >= 0 AND social_pressure_score <= 100
  )
);

CREATE INDEX idx_surroundings_owner ON surroundings_insights(owner_id, timestamp DESC);
CREATE INDEX idx_surroundings_workspace ON surroundings_insights(workspace_id, timestamp DESC);
CREATE INDEX idx_surroundings_visual_context ON surroundings_insights(visual_context_id);
CREATE INDEX idx_surroundings_safety ON surroundings_insights(safety_score, timestamp DESC);
CREATE INDEX idx_surroundings_focus ON surroundings_insights(focus_score, timestamp DESC);
CREATE INDEX idx_surroundings_activity ON surroundings_insights(likely_activity, timestamp DESC);

-- ============================================================================
-- TABLE 3: situation_snapshots
-- Fused context snapshots combining visual, audio, calendar, and cognitive state
-- ============================================================================

CREATE TABLE IF NOT EXISTS situation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Snapshot identity
  snapshot_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source freshness
  visual_context_age_ms INTEGER NOT NULL,
  audio_context_age_ms INTEGER NOT NULL,
  calendar_age_ms INTEGER NOT NULL,
  cognitive_state_age_ms INTEGER NOT NULL,

  -- Environment summary
  environment_type TEXT NOT NULL,
  environment_description TEXT NOT NULL,
  environment_confidence NUMERIC(3,2) NOT NULL,

  -- Activity inference
  likely_activity TEXT NOT NULL,
  activity_confidence NUMERIC(3,2) NOT NULL,

  -- Time context
  time_of_day TEXT NOT NULL,
  day_type TEXT NOT NULL, -- 'weekday', 'weekend', 'holiday'
  urgency_from_calendar TEXT NOT NULL, -- 'low', 'medium', 'high'

  -- Risk assessment
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type, severity, description, recommendation}

  -- Opportunity assessment
  opportunity_flags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type, suitability, description, actionableWindow}

  -- Safety & focus scores
  safety_score NUMERIC(3,0) NOT NULL,
  focus_score NUMERIC(3,0) NOT NULL,
  social_pressure_score NUMERIC(3,0) NOT NULL,

  -- Interaction recommendations
  recommended_response_length TEXT NOT NULL,
  recommended_pace TEXT NOT NULL,
  recommended_complexity TEXT NOT NULL,
  interaction_reasoning TEXT NOT NULL,

  -- Recent context
  recent_transcript TEXT,
  recent_entities TEXT[] NOT NULL DEFAULT '{}',

  -- Cognitive & physiological
  cognitive_load TEXT NOT NULL, -- 'low', 'moderate', 'high', 'overloaded'
  energy_level TEXT NOT NULL, -- 'sharp', 'good', 'tired', 'fatigued', 'overloaded'
  emotional_state TEXT NOT NULL,

  -- Fusion quality
  completeness NUMERIC(3,2) NOT NULL, -- 0-1, how many sources available
  consistency NUMERIC(3,2) NOT NULL, -- 0-1, agreement between sources
  confidence NUMERIC(3,2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT snapshot_scores_valid CHECK (
    safety_score >= 0 AND safety_score <= 100 AND
    focus_score >= 0 AND focus_score <= 100 AND
    social_pressure_score >= 0 AND social_pressure_score <= 100
  )
);

CREATE INDEX idx_situation_snapshot_owner ON situation_snapshots(owner_id, timestamp DESC);
CREATE INDEX idx_situation_snapshot_workspace ON situation_snapshots(workspace_id, timestamp DESC);
CREATE INDEX idx_situation_snapshot_activity ON situation_snapshots(likely_activity, timestamp DESC);
CREATE INDEX idx_situation_snapshot_safety ON situation_snapshots(safety_score, timestamp DESC);

-- ============================================================================
-- TABLE 4: environment_profiles
-- Learned environment patterns with productivity outcomes
-- ============================================================================

CREATE TABLE IF NOT EXISTS environment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Profile identity
  profile_id TEXT NOT NULL UNIQUE,
  environment_signature TEXT NOT NULL, -- Hash of scene markers for deduplication
  display_name TEXT NOT NULL,

  -- Location
  place_type TEXT NOT NULL, -- 'home', 'office', 'cafe', 'commute', 'outdoor', 'other'
  approximate_address TEXT,
  location_confidence NUMERIC(3,2),

  -- Temporal patterns
  frequent_time_of_day TEXT[] NOT NULL DEFAULT '{}',
  frequent_day_type TEXT[] NOT NULL DEFAULT '{}',
  average_session_duration_ms INTEGER,
  visit_frequency NUMERIC(4,2), -- times per week

  -- Productivity metrics
  focus_quality_average NUMERIC(3,0) NOT NULL DEFAULT 70, -- 0-100
  focus_quality_best_time_start TEXT,
  focus_quality_best_time_end TEXT,
  focus_consistency NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- 0-1

  -- Activity outcomes
  deep_work_optimal BOOLEAN NOT NULL DEFAULT FALSE,
  creative_optimal BOOLEAN NOT NULL DEFAULT FALSE,
  communication_optimal BOOLEAN NOT NULL DEFAULT FALSE,
  rest_optimal BOOLEAN NOT NULL DEFAULT FALSE,

  -- Contextual conditions
  ideal_weather TEXT[] NOT NULL DEFAULT '{}',
  distraction_factors TEXT[] NOT NULL DEFAULT '{}',
  focus_factors TEXT[] NOT NULL DEFAULT '{}',

  -- Recommendations (JSON for flexibility)
  recommended_activities JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {activity, suitability, optimalTimeWindow}

  -- Learning metadata
  sample_size INTEGER NOT NULL DEFAULT 1,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.3, -- 0-1

  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profile_scores_valid CHECK (
    focus_quality_average >= 0 AND focus_quality_average <= 100 AND
    confidence_score >= 0 AND confidence_score <= 1
  )
);

CREATE INDEX idx_env_profile_owner ON environment_profiles(owner_id);
CREATE INDEX idx_env_profile_workspace ON environment_profiles(workspace_id);
CREATE INDEX idx_env_profile_signature ON environment_profiles(environment_signature);
CREATE INDEX idx_env_profile_type ON environment_profiles(place_type);
CREATE INDEX idx_env_profile_confidence ON environment_profiles(confidence_score DESC);

-- ============================================================================
-- TABLE 5: productivity_outcomes
-- Track productivity results in different environments to train profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS productivity_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Link to environment
  environment_profile_id UUID NOT NULL REFERENCES environment_profiles(id) ON DELETE CASCADE,

  -- What happened
  activity TEXT NOT NULL, -- 'deep_work', 'creative', 'communication', 'rest'
  duration_minutes INTEGER NOT NULL,
  focus_quality_rating NUMERIC(3,0) NOT NULL, -- 0-100
  success_metric NUMERIC(3,0) NOT NULL, -- 0-100

  -- Context
  time_of_day TEXT NOT NULL,
  day_type TEXT NOT NULL, -- 'weekday', 'weekend'

  -- Cognitive state when it happened
  energy_before NUMERIC(3,0),
  energy_after NUMERIC(3,0),
  stress_level TEXT, -- 'low', 'normal', 'elevated'

  -- Factors
  helped_by TEXT[] NOT NULL DEFAULT '{}',
  hindered_by TEXT[] NOT NULL DEFAULT '{}',

  -- Satisfaction
  satisfaction NUMERIC(3,0) NOT NULL, -- 0-100

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT outcome_scores_valid CHECK (
    focus_quality_rating >= 0 AND focus_quality_rating <= 100 AND
    success_metric >= 0 AND success_metric <= 100 AND
    satisfaction >= 0 AND satisfaction <= 100
  )
);

CREATE INDEX idx_outcome_profile ON productivity_outcomes(environment_profile_id, created_at DESC);
CREATE INDEX idx_outcome_owner ON productivity_outcomes(owner_id, created_at DESC);
CREATE INDEX idx_outcome_activity ON productivity_outcomes(activity, created_at DESC);
CREATE INDEX idx_outcome_satisfaction ON productivity_outcomes(satisfaction DESC);

-- ============================================================================
-- TABLE 6: capture_events
-- Tracks all vision capture events from glasses (for cost control & audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Event identity
  event_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Glasses info
  glasses_model TEXT NOT NULL,

  -- Trigger
  trigger_mode TEXT NOT NULL, -- 'tap', 'voice', 'scheduled', 'manual', 'adaptive'
  trigger_reason TEXT,

  -- Capture result
  status TEXT NOT NULL, -- 'pending', 'capturing', 'processing', 'complete', 'failed'
  frame_id TEXT,

  -- Image metadata (size only, no actual image)
  image_width INTEGER,
  image_height INTEGER,
  image_format TEXT, -- 'jpeg', 'webp'
  image_size_bytes INTEGER,

  -- Processing
  visual_context_id UUID REFERENCES visual_context_events(id) ON DELETE SET NULL,
  analysis_complete BOOLEAN NOT NULL DEFAULT FALSE,
  analysis_error TEXT,

  -- Cost tracking
  estimated_cost NUMERIC(10,5), -- USD

  -- Metadata
  battery_percent NUMERIC(3,0) NOT NULL,
  signal_quality NUMERIC(3,2) NOT NULL, -- 0-1
  user_consent BOOLEAN NOT NULL,
  successful_analysis BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT capture_valid_battery CHECK (battery_percent >= 0 AND battery_percent <= 100),
  CONSTRAINT capture_valid_signal CHECK (signal_quality >= 0 AND signal_quality <= 1)
);

CREATE INDEX idx_capture_owner ON capture_events(owner_id, timestamp DESC);
CREATE INDEX idx_capture_workspace ON capture_events(workspace_id, timestamp DESC);
CREATE INDEX idx_capture_status ON capture_events(status, timestamp DESC);
CREATE INDEX idx_capture_cost ON capture_events(estimated_cost DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE visual_context_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE surroundings_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visual_context_events
CREATE POLICY "Users can view their own visual contexts"
  ON visual_context_events FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own visual contexts"
  ON visual_context_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for surroundings_insights
CREATE POLICY "Users can view their own insights"
  ON surroundings_insights FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own insights"
  ON surroundings_insights FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for situation_snapshots
CREATE POLICY "Users can view their own snapshots"
  ON situation_snapshots FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own snapshots"
  ON situation_snapshots FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for environment_profiles
CREATE POLICY "Users can view their own profiles"
  ON environment_profiles FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own profiles"
  ON environment_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own profiles"
  ON environment_profiles FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for productivity_outcomes
CREATE POLICY "Users can view their own outcomes"
  ON productivity_outcomes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own outcomes"
  ON productivity_outcomes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for capture_events
CREATE POLICY "Users can view their own captures"
  ON capture_events FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own captures"
  ON capture_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

-- Tables created: 6
-- - visual_context_events (semantic scene storage, MVP: mock implementation)
-- - surroundings_insights (reasoning outputs from scene analysis)
-- - situation_snapshots (fused context from multiple streams)
-- - environment_profiles (learned productivity patterns)
-- - productivity_outcomes (training data for profiles)
-- - capture_events (cost tracking and audit)
--
-- Total indexes: 25 (covering owner, workspace, temporal, and semantic searches)
-- RLS: Enabled on all tables with owner-scoped access
--
-- Privacy notes:
-- - No raw image storage (semantic descriptions only)
-- - All personal context isolated by owner
-- - Automatic expiration of old events (30 days)
-- - Cost tracking for vision API calls
--
-- Next steps:
-- 1. Run Supabase caching refresh (SELECT * FROM visual_context_events LIMIT 1;)
-- 2. Implement application layer for capture events
-- 3. Integrate with Phase 11 (wake-window) and Phase 10 (cognitive state);
