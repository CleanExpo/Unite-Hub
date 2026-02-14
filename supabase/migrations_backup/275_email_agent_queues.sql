-- Phase 5 Agent 1: Email Agent Queues
-- Stores email composition results and queue for sending

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  brand_aligned BOOLEAN NOT NULL,
  alignment_issues TEXT[],
  approval_status TEXT NOT NULL,
  approval_id UUID,
  ready_to_send BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN,
  bounce_reason TEXT,
  metadata JSONB,
  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (approval_status IN ('auto_approved', 'pending_review', 'pending_approval', 'rejected'))
);

-- Email delivery log (for auditing and analytics)
CREATE TABLE IF NOT EXISTS email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  queue_id UUID NOT NULL REFERENCES email_queue(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  external_message_id TEXT,
  error_message TEXT,
  metadata JSONB,
  CONSTRAINT valid_event CHECK (event IN ('sent', 'failed', 'bounced', 'complained', 'delivered', 'opened', 'clicked'))
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY email_queue_authenticated_read ON email_queue
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY email_delivery_log_authenticated_read ON email_delivery_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_brand ON email_queue(brand_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(approval_status);
CREATE INDEX IF NOT EXISTS idx_email_queue_ready ON email_queue(ready_to_send);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_risk ON email_queue(risk_level);

CREATE INDEX IF NOT EXISTS idx_email_delivery_queue ON email_delivery_log(queue_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_event ON email_delivery_log(event);
CREATE INDEX IF NOT EXISTS idx_email_delivery_created ON email_delivery_log(created_at DESC);

-- Comments
COMMENT ON TABLE email_queue IS 'Email composition queue. Stores emails awaiting approval or ready to send. Integrated with founder approval engine.';
COMMENT ON TABLE email_delivery_log IS 'Audit trail for email delivery events (sent, failed, bounced, opened, clicked). Used for analytics and debugging.';

COMMENT ON COLUMN email_queue.risk_level IS 'Automatic risk assessment: low (0-19), medium (20-39), high (40-69), critical (70+).';
COMMENT ON COLUMN email_queue.approval_status IS 'auto_approved: ready to send, pending_review: needs content review, pending_approval: needs founder decision, rejected: do not send.';
COMMENT ON COLUMN email_queue.ready_to_send IS 'TRUE if email passed all checks and can be sent. FALSE if awaiting approval or feedback.';
