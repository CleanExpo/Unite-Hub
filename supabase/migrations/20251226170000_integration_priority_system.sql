-- =====================================================================
-- Integration Priority System
-- Migration: 20251226170000_integration_priority_system.sql
-- Purpose: Define required vs optional integrations with consequences
-- Based on: Pattern 3 - "I don't know what's required vs optional" (3 users)
-- =====================================================================

-- =====================================================================
-- Table: integration_metadata
-- Defines which integrations are required/optional and why
-- =====================================================================
CREATE TABLE IF NOT EXISTS integration_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key TEXT NOT NULL UNIQUE, -- gmail, outlook, xero, stripe, etc.
  integration_name TEXT NOT NULL,

  -- Priority classification
  priority TEXT NOT NULL CHECK (priority IN ('required', 'recommended', 'optional')),

  -- User-facing information
  short_description TEXT NOT NULL,
  full_description TEXT,

  -- Consequence messaging
  enables_features TEXT[], -- What this integration unlocks
  consequence_if_skipped TEXT, -- What happens if user doesn't connect

  -- Recommendations
  recommended_for_business_types TEXT[], -- ['small_business', 'agency', 'enterprise']
  required_for_features TEXT[], -- ['email_intelligence', 'calendar_scheduling']

  -- Display metadata
  icon_name TEXT,
  category TEXT, -- email, calendar, accounting, payments, crm
  display_order INTEGER DEFAULT 100,

  -- Setup complexity
  setup_time_minutes INTEGER, -- Estimated setup time
  requires_approval BOOLEAN DEFAULT false, -- OAuth approval needed

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_metadata_priority
  ON integration_metadata(priority, display_order);

CREATE INDEX IF NOT EXISTS idx_integration_metadata_category
  ON integration_metadata(category, display_order);

CREATE INDEX IF NOT EXISTS idx_integration_metadata_active
  ON integration_metadata(is_active, display_order)
  WHERE is_active = true;

-- =====================================================================
-- Seed Data: Core Integrations
-- =====================================================================

INSERT INTO integration_metadata (
  integration_key,
  integration_name,
  priority,
  short_description,
  full_description,
  enables_features,
  consequence_if_skipped,
  recommended_for_business_types,
  required_for_features,
  icon_name,
  category,
  display_order,
  setup_time_minutes,
  requires_approval
) VALUES
  (
    'gmail',
    'Gmail',
    'required',
    'Enables email intelligence (core feature)',
    'Connect your Gmail account to let Unite-Hub AI process incoming emails, extract contact data, detect intents, and automate follow-ups.',
    ARRAY['Email Intelligence', 'Contact Auto-linking', 'AI Email Generation', 'Meeting Detection'],
    'Email agent won''t work. You''ll need to manually process all emails.',
    ARRAY['small_business', 'agency', 'enterprise'],
    ARRAY['email_intelligence', 'email_agent', 'contact_intelligence'],
    'gmail',
    'email',
    1,
    3,
    true
  ),
  (
    'google_calendar',
    'Google Calendar',
    'recommended',
    'Sync meetings and detect scheduling requests',
    'Connect your Google Calendar to automatically detect meeting requests in emails, create calendar events, and suggest optimal meeting times.',
    ARRAY['Meeting Detection', 'Calendar Scheduling', 'Availability Sync'],
    'Meeting requests won''t be auto-detected. Manual calendar management.',
    ARRAY['small_business', 'agency'],
    ARRAY['calendar_scheduling', 'meeting_detection'],
    'calendar',
    'calendar',
    2,
    2,
    true
  ),
  (
    'outlook',
    'Outlook',
    'optional',
    'Alternative to Gmail (if you use Outlook)',
    'Connect Microsoft Outlook for email intelligence if you use Outlook instead of Gmail. Provides same features as Gmail integration.',
    ARRAY['Email Intelligence (Outlook)', 'Contact Linking'],
    'Use Gmail instead. Only connect if you use Outlook as your primary email.',
    ARRAY['enterprise'],
    ARRAY['email_intelligence'],
    'outlook',
    'email',
    3,
    3,
    true
  ),
  (
    'xero',
    'Xero',
    'optional',
    'Sync accounting data and invoices',
    'Connect Xero to automatically sync invoices, expenses, and client billing data. Useful for financial reporting and client profitability tracking.',
    ARRAY['Invoice Sync', 'Expense Tracking', 'Financial Reports'],
    'Manual expense and invoice tracking. No automatic financial reporting.',
    ARRAY['agency', 'enterprise'],
    ARRAY['accounting_sync', 'financial_reports'],
    'xero',
    'accounting',
    10,
    5,
    true
  ),
  (
    'stripe',
    'Stripe',
    'optional',
    'Payment processing and billing',
    'Connect Stripe to process payments, manage subscriptions, and track revenue directly in Unite-Hub.',
    ARRAY['Payment Processing', 'Subscription Billing', 'Revenue Tracking'],
    'No payment processing. Use external billing system.',
    ARRAY['agency', 'enterprise'],
    ARRAY['payment_processing', 'subscription_billing'],
    'stripe',
    'payments',
    11,
    10,
    true
  ),
  (
    'slack',
    'Slack',
    'optional',
    'Team notifications and alerts',
    'Connect Slack to receive real-time notifications about new leads, campaign performance, and team updates.',
    ARRAY['Team Notifications', 'Real-time Alerts', 'Collaboration'],
    'No Slack notifications. Email notifications only.',
    ARRAY['agency', 'enterprise'],
    ARRAY['team_notifications'],
    'slack',
    'communication',
    20,
    2,
    true
  )
ON CONFLICT (integration_key) DO UPDATE SET
  updated_at = NOW();

-- =====================================================================
-- Comments
-- =====================================================================

COMMENT ON TABLE integration_metadata IS 'Defines integration priority (required/recommended/optional) with user-facing explanations. Based on Pattern 3: "I don''t know what''s required vs optional" (3 users). Shows consequences of skipping and which features each integration enables.';

COMMENT ON COLUMN integration_metadata.priority IS 'Required: Must connect for core functionality. Recommended: Strongly suggested for best experience. Optional: Nice-to-have, skip if not needed.';

COMMENT ON COLUMN integration_metadata.consequence_if_skipped IS 'User-facing explanation of what happens if they skip this integration. Helps with decision-making.';
