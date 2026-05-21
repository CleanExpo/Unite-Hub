/**
 * Migration 414: STP Phase 2 Compliance Tables
 *
 * Single Touch Payroll (STP) Phase 2 infrastructure for:
 * - Employee records and declarations
 * - Pay run events (wages, PAYG withholding, super)
 * - Year-to-date (YTD) summaries
 * - ATO STP submissions and reporting
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

-- ============================================================================
-- STP Employees
-- ============================================================================

CREATE TABLE IF NOT EXISTS stp_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Employee Identifiers
  employee_id text NOT NULL, -- Internal employee ID
  tfn text, -- Tax File Number (encrypted)
  abn text, -- If contractor

  -- Personal Details
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  email text,
  phone text,

  -- Employment Details
  employment_type text NOT NULL, -- 'full_time', 'part_time', 'casual', 'contractor'
  employment_start_date date NOT NULL,
  employment_end_date date,

  -- Tax Details
  tax_free_threshold boolean DEFAULT false,
  hecs_help_debt boolean DEFAULT false,
  student_loan_debt boolean DEFAULT false,
  tax_scale text DEFAULT 'regular', -- 'regular', 'working_holiday', 'foreign_resident'

  -- Superannuation
  super_fund_name text,
  super_fund_abn text,
  super_account_number text,

  -- Status
  is_active boolean DEFAULT true,
  termination_reason text,
  termination_date date,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id),

  CONSTRAINT stp_employees_workspace_employee UNIQUE (workspace_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_stp_employees_workspace ON stp_employees(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stp_employees_active ON stp_employees(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stp_employees_employee_id ON stp_employees(employee_id);

COMMENT ON TABLE stp_employees IS 'Employee records for STP Phase 2 reporting';
COMMENT ON COLUMN stp_employees.tfn IS 'Tax File Number - must be encrypted';
COMMENT ON COLUMN stp_employees.employment_type IS 'Employment classification for STP reporting';

-- ============================================================================
-- STP Pay Runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS stp_pay_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES stp_employees(id) ON DELETE CASCADE,

  -- Pay Period
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  payment_date date NOT NULL,
  financial_year integer NOT NULL, -- 2026 for FY 2025-26

  -- Gross Pay (in cents for precision)
  gross_earnings bigint NOT NULL DEFAULT 0, -- Total gross pay
  allowances bigint DEFAULT 0, -- Allowances
  bonuses bigint DEFAULT 0, -- Bonuses and commissions
  overtime bigint DEFAULT 0, -- Overtime payments

  -- Deductions (in cents)
  tax_withheld bigint NOT NULL DEFAULT 0, -- PAYG withholding
  super_employee_contribution bigint DEFAULT 0, -- Employee super contributions
  union_fees bigint DEFAULT 0, -- Union fees
  other_deductions bigint DEFAULT 0, -- Other deductions

  -- Employer Contributions (in cents)
  super_employer_contribution bigint NOT NULL DEFAULT 0, -- Employer super (11.5% from 2024)

  -- Net Pay (in cents)
  net_pay bigint NOT NULL DEFAULT 0, -- Take-home pay

  -- Hours Worked
  ordinary_hours decimal(10,2),
  overtime_hours decimal(10,2),

  -- Status
  status text DEFAULT 'draft', -- 'draft', 'finalized', 'submitted', 'amended'

  -- STP Submission Link
  stp_submission_id uuid REFERENCES stp_submissions(id),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id),

  CONSTRAINT stp_pay_runs_workspace_employee_period UNIQUE (workspace_id, employee_id, pay_period_start, pay_period_end)
);

CREATE INDEX IF NOT EXISTS idx_stp_pay_runs_workspace ON stp_pay_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stp_pay_runs_employee ON stp_pay_runs(employee_id);
CREATE INDEX IF NOT EXISTS idx_stp_pay_runs_payment_date ON stp_pay_runs(payment_date);
CREATE INDEX IF NOT EXISTS idx_stp_pay_runs_financial_year ON stp_pay_runs(financial_year);
CREATE INDEX IF NOT EXISTS idx_stp_pay_runs_status ON stp_pay_runs(status);

COMMENT ON TABLE stp_pay_runs IS 'Individual pay events for STP reporting';
COMMENT ON COLUMN stp_pay_runs.tax_withheld IS 'PAYG withholding amount (W1)';
COMMENT ON COLUMN stp_pay_runs.super_employer_contribution IS 'Employer superannuation guarantee';

-- ============================================================================
-- STP YTD Summaries
-- ============================================================================

CREATE TABLE IF NOT EXISTS stp_ytd_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES stp_employees(id) ON DELETE CASCADE,

  -- Financial Year
  financial_year integer NOT NULL, -- 2026 for FY 2025-26

  -- Year-to-Date Totals (in cents)
  ytd_gross_earnings bigint DEFAULT 0,
  ytd_tax_withheld bigint DEFAULT 0,
  ytd_super_employer bigint DEFAULT 0,
  ytd_super_employee bigint DEFAULT 0,
  ytd_allowances bigint DEFAULT 0,
  ytd_bonuses bigint DEFAULT 0,

  -- Last Updated
  last_pay_run_date date,
  last_calculated_at timestamptz DEFAULT now(),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT stp_ytd_summaries_workspace_employee_year UNIQUE (workspace_id, employee_id, financial_year)
);

CREATE INDEX IF NOT EXISTS idx_stp_ytd_summaries_workspace ON stp_ytd_summaries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stp_ytd_summaries_employee ON stp_ytd_summaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_stp_ytd_summaries_year ON stp_ytd_summaries(financial_year);

COMMENT ON TABLE stp_ytd_summaries IS 'Year-to-date summaries for STP Phase 2 reporting';
COMMENT ON COLUMN stp_ytd_summaries.ytd_tax_withheld IS 'Total PAYG withheld year-to-date';

-- ============================================================================
-- STP Submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS stp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Submission Details
  submission_type text NOT NULL, -- 'update', 'finalisation', 'amendment'
  financial_year integer NOT NULL,

  -- Pay Event Details
  pay_event_date date NOT NULL, -- Date of pay run
  submission_date timestamptz DEFAULT now(),

  -- ABN of Payer
  payer_abn text NOT NULL,
  payer_name text NOT NULL,

  -- Employee Count
  employee_count integer NOT NULL DEFAULT 0,

  -- Aggregated Totals (in cents)
  total_gross_earnings bigint DEFAULT 0,
  total_tax_withheld bigint DEFAULT 0,
  total_super_employer bigint DEFAULT 0,

  -- ATO Response
  status text DEFAULT 'draft', -- 'draft', 'submitted', 'accepted', 'rejected', 'amended'
  ato_receipt_id text,
  ato_submission_reference text,
  ato_response jsonb,

  -- Error Handling
  error_message text,
  retry_count integer DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_stp_submissions_workspace ON stp_submissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stp_submissions_financial_year ON stp_submissions(financial_year);
CREATE INDEX IF NOT EXISTS idx_stp_submissions_status ON stp_submissions(status);
CREATE INDEX IF NOT EXISTS idx_stp_submissions_pay_event_date ON stp_submissions(pay_event_date);

COMMENT ON TABLE stp_submissions IS 'STP Phase 2 submissions to ATO';
COMMENT ON COLUMN stp_submissions.submission_type IS 'Type: update (regular), finalisation (end of year), amendment (correction)';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE stp_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE stp_pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stp_ytd_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stp_submissions ENABLE ROW LEVEL SECURITY;

-- STP Employees Policies
CREATE POLICY "Users can view their workspace employees"
  ON stp_employees FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage employees"
  ON stp_employees FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- STP Pay Runs Policies
CREATE POLICY "Users can view their workspace pay runs"
  ON stp_pay_runs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create pay runs"
  ON stp_pay_runs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update pay runs"
  ON stp_pay_runs FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- STP YTD Summaries Policies
CREATE POLICY "Users can view their workspace YTD summaries"
  ON stp_ytd_summaries FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage YTD summaries"
  ON stp_ytd_summaries FOR ALL
  USING (true)
  WITH CHECK (true);

-- STP Submissions Policies
CREATE POLICY "Users can view their workspace submissions"
  ON stp_submissions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage submissions"
  ON stp_submissions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stp_employees_updated_at
  BEFORE UPDATE ON stp_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_stp_updated_at();

CREATE TRIGGER update_stp_pay_runs_updated_at
  BEFORE UPDATE ON stp_pay_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_stp_updated_at();

CREATE TRIGGER update_stp_ytd_summaries_updated_at
  BEFORE UPDATE ON stp_ytd_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_stp_updated_at();

CREATE TRIGGER update_stp_submissions_updated_at
  BEFORE UPDATE ON stp_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_stp_updated_at();
