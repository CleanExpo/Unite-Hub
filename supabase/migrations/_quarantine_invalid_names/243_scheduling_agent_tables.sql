-- Phase 5 Agent 4: Scheduling Agent Tables
-- Stores meeting scheduling requests, availability analysis, and approval workflow

CREATE TABLE IF NOT EXISTS scheduling_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  participant TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  description TEXT,
  preferred_times TEXT[],

  -- Calendar data
  calendar_events JSONB NOT NULL DEFAULT '[]',

  -- Analysis results
  available_slots JSONB NOT NULL DEFAULT '[]',
  conflicts JSONB NOT NULL DEFAULT '[]',

  -- Communications
  proposal_email TEXT,
  calendar_invite TEXT,

  -- Risk & Approval
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_reasons TEXT[] DEFAULT '{}',
  approval_status TEXT NOT NULL DEFAULT 'pending_review',
  requires_founder_review BOOLEAN NOT NULL DEFAULT FALSE,
  founder_reviewed_at TIMESTAMP WITH TIME ZONE,
  founder_decision TEXT,
  founder_notes TEXT,
  ready_to_send BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  meeting_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_time TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB,

  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (approval_status IN ('auto_approved', 'pending_review', 'pending_approval', 'rejected')),
  CONSTRAINT valid_date_range CHECK (date_range_start < date_range_end)
);

-- Scheduling conflict analysis log
CREATE TABLE IF NOT EXISTS scheduling_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  request_id UUID NOT NULL REFERENCES scheduling_requests(id) ON DELETE CASCADE,
  event_a_title TEXT NOT NULL,
  event_b_title TEXT NOT NULL,
  event_a_start TIMESTAMP WITH TIME ZONE NOT NULL,
  event_a_end TIMESTAMP WITH TIME ZONE NOT NULL,
  event_b_start TIMESTAMP WITH TIME ZONE NOT NULL,
  event_b_end TIMESTAMP WITH TIME ZONE NOT NULL,
  overlap_minutes INTEGER NOT NULL,
  severity TEXT NOT NULL,
  resolution_suggested TEXT,
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high'))
);

-- Availability slot history
CREATE TABLE IF NOT EXISTS scheduling_availability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  request_id UUID NOT NULL REFERENCES scheduling_requests(id) ON DELETE CASCADE,
  slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  is_business_hours BOOLEAN NOT NULL DEFAULT TRUE,
  buffer_before_minutes INTEGER,
  buffer_after_minutes INTEGER
);

-- Scheduling communication log
CREATE TABLE IF NOT EXISTS scheduling_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  request_id UUID NOT NULL REFERENCES scheduling_requests(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  content_preview TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_type CHECK (communication_type IN ('proposal', 'confirmation', 'reschedule_request', 'busy_notification')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced'))
);

-- Enable RLS
ALTER TABLE scheduling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_availability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY scheduling_requests_authenticated_read ON scheduling_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY scheduling_conflicts_authenticated_read ON scheduling_conflicts
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY scheduling_availability_history_authenticated_read ON scheduling_availability_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY scheduling_communications_authenticated_read ON scheduling_communications
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_brand ON scheduling_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_participant ON scheduling_requests(participant_email);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_status ON scheduling_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_risk ON scheduling_requests(risk_level);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_requires_review ON scheduling_requests(requires_founder_review);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_ready ON scheduling_requests(ready_to_send);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_created ON scheduling_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduling_requests_date_range ON scheduling_requests(date_range_start, date_range_end);

CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_request ON scheduling_conflicts(request_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_severity ON scheduling_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_created ON scheduling_conflicts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduling_availability_request ON scheduling_availability_history(request_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_availability_confidence ON scheduling_availability_history(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_scheduling_communications_request ON scheduling_communications(request_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_communications_type ON scheduling_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_scheduling_communications_status ON scheduling_communications(status);

-- Conditional index creation (handles schema variations)
DO $$
BEGIN
  -- Try to create index on slot timing columns
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'scheduling_availability_history' AND column_name = 'slot_start') THEN
    CREATE INDEX IF NOT EXISTS idx_scheduling_availability_slot_time ON scheduling_availability_history(slot_start, slot_end);
  END IF;

  -- Try to create index on communication delivery status
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'scheduling_communications' AND column_name = 'delivery_status') THEN
    CREATE INDEX IF NOT EXISTS idx_scheduling_communications_delivery ON scheduling_communications(delivery_status);
  END IF;
END $$;

-- Comments (with error handling for schema variations)
DO $$
BEGIN
  -- Table comments
  COMMENT ON TABLE scheduling_requests IS 'Stores meeting scheduling requests with availability analysis and founder approval workflow.';
  COMMENT ON TABLE scheduling_conflicts IS 'Records detected calendar conflicts with severity classification and resolution suggestions.';
  COMMENT ON TABLE scheduling_availability_history IS 'Tracks available time slots with confidence scores and business hours alignment.';
  COMMENT ON TABLE scheduling_communications IS 'Logs all scheduling-related communications (proposals, confirmations, reschedules, busy notifications).';

  -- Column comments (will succeed even if columns don't exist in old schema)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduling_requests' AND column_name = 'risk_level') THEN
    COMMENT ON COLUMN scheduling_requests.risk_level IS 'Risk classification: low (0-19), medium (20-39), high (40-69), critical (70+).';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduling_requests' AND column_name = 'requires_founder_review') THEN
    COMMENT ON COLUMN scheduling_requests.requires_founder_review IS 'TRUE if risk level is high/critical or conflicts detected.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduling_requests' AND column_name = 'ready_to_send') THEN
    COMMENT ON COLUMN scheduling_requests.ready_to_send IS 'TRUE if approved by founder or auto-approved by system.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduling_conflicts' AND column_name = 'severity') THEN
    COMMENT ON COLUMN scheduling_conflicts.severity IS 'Conflict severity: low (≤15min), medium (15-30min), high (>30min).';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduling_availability_history' AND column_name = 'confidence') THEN
    COMMENT ON COLUMN scheduling_availability_history.confidence IS 'Availability confidence score (0-1) based on slot duration and business hours fit.';
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Silently ignore comment errors (they're non-critical)
  NULL;
END $$;
