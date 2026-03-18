-- Email triage results — stores AI categorisation of Gmail threads
-- Used by the nightly email-triage CRON and manual triage from the workbench

CREATE TABLE email_triage_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_email    TEXT NOT NULL,
  thread_id        TEXT NOT NULL,
  subject          TEXT,
  from_email       TEXT,
  category         TEXT NOT NULL,   -- IMPORTANT | INVOICE | TASK | NEWSLETTER | PROMOTIONAL | SOCIAL | SPAM
  action           TEXT NOT NULL,   -- KEEP | ARCHIVE | CREATE_TASK | FLAG_REVIEW
  priority         INTEGER DEFAULT 3,
  reason           TEXT,
  linear_issue_id  TEXT,
  auto_applied     BOOLEAN DEFAULT FALSE,
  applied_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (founder_id, account_email, thread_id)
);

CREATE INDEX idx_email_triage_founder ON email_triage_results(founder_id);
CREATE INDEX idx_email_triage_account ON email_triage_results(account_email);
CREATE INDEX idx_email_triage_created ON email_triage_results(created_at DESC);

ALTER TABLE email_triage_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_only" ON email_triage_results
  USING (founder_id = auth.uid());
