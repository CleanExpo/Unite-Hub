/**
 * STP Phase 2 Compliance Service
 *
 * Handles Single Touch Payroll reporting to ATO:
 * - Employee management and tax declarations
 * - Pay run calculations (gross pay, PAYG withholding, super)
 * - Year-to-date aggregation
 * - STP submission formatting
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type EmploymentType = 'full_time' | 'part_time' | 'casual' | 'contractor';
export type TaxScale = 'regular' | 'working_holiday' | 'foreign_resident';
export type PayRunStatus = 'draft' | 'finalized' | 'submitted' | 'amended';
export type SubmissionType = 'update' | 'finalisation' | 'amendment';

export interface Employee {
  id: string;
  workspace_id: string;
  employee_id: string;
  tfn?: string;
  abn?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  email?: string;
  employment_type: EmploymentType;
  employment_start_date: Date;
  employment_end_date?: Date;
  tax_free_threshold: boolean;
  hecs_help_debt: boolean;
  student_loan_debt: boolean;
  tax_scale: TaxScale;
  super_fund_name?: string;
  super_fund_abn?: string;
  super_account_number?: string;
  is_active: boolean;
}

export interface PayRunInput {
  employee_id: string;
  pay_period_start: Date;
  pay_period_end: Date;
  payment_date: Date;
  gross_earnings: number; // Dollars
  allowances?: number;
  bonuses?: number;
  overtime?: number;
  ordinary_hours?: number;
  overtime_hours?: number;
  super_employee_contribution?: number;
  union_fees?: number;
  other_deductions?: number;
}

export interface PayRun {
  id: string;
  workspace_id: string;
  employee_id: string;
  pay_period_start: Date;
  pay_period_end: Date;
  payment_date: Date;
  financial_year: number;
  gross_earnings: number; // Cents
  allowances: number;
  bonuses: number;
  overtime: number;
  tax_withheld: number; // PAYG
  super_employee_contribution: number;
  union_fees: number;
  other_deductions: number;
  super_employer_contribution: number;
  net_pay: number;
  ordinary_hours?: number;
  overtime_hours?: number;
  status: PayRunStatus;
}

export interface YTDSummary {
  id: string;
  workspace_id: string;
  employee_id: string;
  financial_year: number;
  ytd_gross_earnings: number;
  ytd_tax_withheld: number;
  ytd_super_employer: number;
  ytd_super_employee: number;
  ytd_allowances: number;
  ytd_bonuses: number;
  last_pay_run_date?: Date;
}

export interface STPSubmission {
  workspace_id: string;
  submission_type: SubmissionType;
  financial_year: number;
  pay_event_date: Date;
  payer_abn: string;
  payer_name: string;
  employee_count: number;
  total_gross_earnings: number;
  total_tax_withheld: number;
  total_super_employer: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Superannuation Guarantee Rate
 * 11.5% from July 1, 2024 (FY 2024-25)
 */
export const SUPER_GUARANTEE_RATE = 0.115;

/**
 * PAYG Tax Withholding Scales (2024-25)
 * Simplified weekly scale for residents with tax-free threshold
 *
 * Source: ATO Tax Withholding Tables
 */
export const PAYG_TAX_SCALE_WEEKLY = [
  { min: 0, max: 359, baseAmount: 0, rate: 0 },
  { min: 359, max: 438, baseAmount: 0, rate: 0.19 },
  { min: 438, max: 548, baseAmount: 15.01, rate: 0.29 },
  { min: 548, max: 721, baseAmount: 46.91, rate: 0.21 },
  { min: 721, max: 865, baseAmount: 83.24, rate: 0.219 },
  { min: 865, max: 1282, baseAmount: 114.78, rate: 0.3477 },
  { min: 1282, max: 2307, baseAmount: 259.78, rate: 0.345 },
  { min: 2307, max: 3461, baseAmount: 613.41, rate: 0.39 },
  { min: 3461, max: Infinity, baseAmount: 1063.47, rate: 0.47 },
];

/**
 * No tax-free threshold scale (higher withholding)
 */
export const PAYG_TAX_SCALE_WEEKLY_NO_TFT = [
  { min: 0, max: 88, baseAmount: 0, rate: 0.19 },
  { min: 88, max: 371, baseAmount: 16.72, rate: 0.29 },
  { min: 371, max: 515, baseAmount: 98.79, rate: 0.21 },
  { min: 515, max: 932, baseAmount: 129.03, rate: 0.219 },
  { min: 932, max: 1957, baseAmount: 220.36, rate: 0.3477 },
  { min: 1957, max: 3111, baseAmount: 576.65, rate: 0.345 },
  { min: 3111, max: Infinity, baseAmount: 974.78, rate: 0.47 },
];

// ============================================================================
// Financial Year Utilities
// ============================================================================

/**
 * Get financial year from date
 * Australian FY: July 1 to June 30
 * FY 2025-26 = 2026
 */
export function getFinancialYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // If month is July (6) or later, FY is next year
  // If month is Jan-Jun (0-5), FY is current year
  return month >= 6 ? year + 1 : year;
}

/**
 * Get financial year start/end dates
 */
export function getFinancialYearDates(financialYear: number): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = new Date(financialYear - 1, 6, 1); // July 1 of previous calendar year
  const endDate = new Date(financialYear, 5, 30, 23, 59, 59); // June 30 of current calendar year

  return { startDate, endDate };
}

// ============================================================================
// Tax Withholding (PAYG) Calculations
// ============================================================================

/**
 * Convert annual salary to weekly earnings
 */
export function annualToWeekly(annualAmount: number): number {
  return annualAmount / 52;
}

/**
 * Convert weekly earnings to annual salary
 */
export function weeklyToAnnual(weeklyAmount: number): number {
  return weeklyAmount * 52;
}

/**
 * Calculate PAYG tax withholding for weekly pay
 * Based on ATO tax scales
 */
export function calculatePAYGWithholding(
  weeklyGrossPay: number,
  hasTaxFreeThreshold: boolean,
  hasHECSDebt: boolean = false,
  taxScale: TaxScale = 'regular'
): number {
  // Use appropriate scale
  const scale = hasTaxFreeThreshold
    ? PAYG_TAX_SCALE_WEEKLY
    : PAYG_TAX_SCALE_WEEKLY_NO_TFT;

  // Find applicable bracket
  const bracket = scale.find(
    (b) => weeklyGrossPay >= b.min && weeklyGrossPay <= b.max
  );

  if (!bracket) {
    // Should not happen with Infinity max, but fallback to highest rate
    const highestBracket = scale[scale.length - 1];
    return (
      highestBracket.baseAmount +
      (weeklyGrossPay - highestBracket.min) * highestBracket.rate
    );
  }

  let taxWithheld = bracket.baseAmount + (weeklyGrossPay - bracket.min) * bracket.rate;

  // Add HECS/HELP levy if applicable (2% of gross)
  if (hasHECSDebt) {
    taxWithheld += weeklyGrossPay * 0.02;
  }

  return Math.round(taxWithheld * 100) / 100; // Round to cents
}

/**
 * Calculate PAYG for any pay period
 * Converts to weekly, calculates tax, then scales to period
 */
export function calculatePAYGForPeriod(
  grossPay: number,
  periodDays: number,
  hasTaxFreeThreshold: boolean,
  hasHECSDebt: boolean = false
): number {
  // Convert to weekly equivalent
  const weeklyEquivalent = (grossPay / periodDays) * 7;

  // Calculate weekly tax
  const weeklyTax = calculatePAYGWithholding(
    weeklyEquivalent,
    hasTaxFreeThreshold,
    hasHECSDebt
  );

  // Scale back to period
  const periodTax = (weeklyTax / 7) * periodDays;

  return Math.round(periodTax * 100); // Return cents
}

// ============================================================================
// Superannuation Calculations
// ============================================================================

/**
 * Calculate employer superannuation guarantee
 * 11.5% from July 1, 2024
 */
export function calculateSuperGuarantee(grossEarnings: number): number {
  return Math.round(grossEarnings * SUPER_GUARANTEE_RATE);
}

// ============================================================================
// Pay Run Processing
// ============================================================================

/**
 * Calculate complete pay run with tax and super
 */
export function calculatePayRun(
  input: PayRunInput,
  employee: Employee
): Omit<PayRun, 'id' | 'workspace_id' | 'status'> {
  // Calculate period length
  const periodStart = new Date(input.pay_period_start);
  const periodEnd = new Date(input.pay_period_end);
  const periodDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Convert dollars to cents
  const grossEarningsCents = Math.round(input.gross_earnings * 100);
  const allowancesCents = Math.round((input.allowances || 0) * 100);
  const bonusesCents = Math.round((input.bonuses || 0) * 100);
  const overtimeCents = Math.round((input.overtime || 0) * 100);

  // Total gross for tax calculation
  const totalGross = grossEarningsCents + allowancesCents + bonusesCents + overtimeCents;

  // Calculate PAYG withholding
  const taxWithheld = calculatePAYGForPeriod(
    totalGross / 100, // Back to dollars for calculation
    periodDays,
    employee.tax_free_threshold,
    employee.hecs_help_debt || employee.student_loan_debt
  );

  // Calculate super guarantee
  const superEmployer = calculateSuperGuarantee(totalGross);

  // Other deductions
  const superEmployeeCents = Math.round((input.super_employee_contribution || 0) * 100);
  const unionFeesCents = Math.round((input.union_fees || 0) * 100);
  const otherDeductionsCents = Math.round((input.other_deductions || 0) * 100);

  // Net pay = gross - tax - employee super - other deductions
  const netPay =
    totalGross - taxWithheld - superEmployeeCents - unionFeesCents - otherDeductionsCents;

  // Determine financial year
  const financialYear = getFinancialYear(periodEnd);

  return {
    employee_id: input.employee_id,
    pay_period_start: periodStart,
    pay_period_end: periodEnd,
    payment_date: new Date(input.payment_date),
    financial_year: financialYear,
    gross_earnings: grossEarningsCents,
    allowances: allowancesCents,
    bonuses: bonusesCents,
    overtime: overtimeCents,
    tax_withheld: taxWithheld,
    super_employee_contribution: superEmployeeCents,
    union_fees: unionFeesCents,
    other_deductions: otherDeductionsCents,
    super_employer_contribution: superEmployer,
    net_pay: netPay,
    ordinary_hours: input.ordinary_hours,
    overtime_hours: input.overtime_hours,
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Create employee record
 */
export async function createEmployee(
  workspaceId: string,
  employee: Omit<Employee, 'id' | 'workspace_id' | 'is_active'>
): Promise<Employee> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_employees')
    .insert({
      workspace_id: workspaceId,
      ...employee,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create employee: ${error.message}`);
  return data as Employee;
}

/**
 * Get employee by ID
 */
export async function getEmployee(
  workspaceId: string,
  employeeId: string
): Promise<Employee | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_employees')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', employeeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get employee: ${error.message}`);
  }

  return data as Employee;
}

/**
 * List all active employees
 */
export async function listActiveEmployees(workspaceId: string): Promise<Employee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_employees')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  if (error) throw new Error(`Failed to list employees: ${error.message}`);
  return (data as Employee[]) || [];
}

/**
 * Create pay run
 */
export async function createPayRun(
  workspaceId: string,
  input: PayRunInput,
  employee: Employee
): Promise<PayRun> {
  const supabase = await createClient();

  const payRunData = calculatePayRun(input, employee);

  const { data, error } = await supabase
    .from('stp_pay_runs')
    .insert({
      workspace_id: workspaceId,
      ...payRunData,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create pay run: ${error.message}`);
  return data as PayRun;
}

/**
 * Finalize pay run (mark as ready for submission)
 */
export async function finalizePayRun(
  workspaceId: string,
  payRunId: string
): Promise<PayRun> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_pay_runs')
    .update({ status: 'finalized' })
    .eq('workspace_id', workspaceId)
    .eq('id', payRunId)
    .eq('status', 'draft') // Only finalize drafts
    .select()
    .single();

  if (error) throw new Error(`Failed to finalize pay run: ${error.message}`);
  return data as PayRun;
}

/**
 * Get YTD summary for employee
 */
export async function getYTDSummary(
  workspaceId: string,
  employeeId: string,
  financialYear: number
): Promise<YTDSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_ytd_summaries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('employee_id', employeeId)
    .eq('financial_year', financialYear)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get YTD summary: ${error.message}`);
  }

  return data as YTDSummary;
}

/**
 * Update YTD summary after pay run
 */
export async function updateYTDSummary(
  workspaceId: string,
  employeeId: string,
  payRun: PayRun
): Promise<YTDSummary> {
  const supabase = await createClient();

  // Get existing summary or create new
  let existingSummary = await getYTDSummary(workspaceId, employeeId, payRun.financial_year);

  const newTotals = {
    ytd_gross_earnings: (existingSummary?.ytd_gross_earnings || 0) + payRun.gross_earnings,
    ytd_tax_withheld: (existingSummary?.ytd_tax_withheld || 0) + payRun.tax_withheld,
    ytd_super_employer:
      (existingSummary?.ytd_super_employer || 0) + payRun.super_employer_contribution,
    ytd_super_employee:
      (existingSummary?.ytd_super_employee || 0) + payRun.super_employee_contribution,
    ytd_allowances: (existingSummary?.ytd_allowances || 0) + payRun.allowances,
    ytd_bonuses: (existingSummary?.ytd_bonuses || 0) + payRun.bonuses,
    last_pay_run_date: payRun.payment_date,
    last_calculated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('stp_ytd_summaries')
    .upsert({
      workspace_id: workspaceId,
      employee_id: employeeId,
      financial_year: payRun.financial_year,
      ...newTotals,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to update YTD summary: ${error.message}`);
  return data as YTDSummary;
}

/**
 * Create STP submission
 */
export async function createSTPSubmission(
  workspaceId: string,
  submission: STPSubmission
): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stp_submissions')
    .insert({
      ...submission,
      status: 'draft',
      submission_date: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create STP submission: ${error.message}`);
  return { id: data.id };
}

/**
 * Aggregate pay runs for STP submission
 */
export async function aggregatePayRunsForSubmission(
  workspaceId: string,
  payEventDate: Date,
  financialYear: number
): Promise<{
  employee_count: number;
  total_gross_earnings: number;
  total_tax_withheld: number;
  total_super_employer: number;
  pay_run_ids: string[];
}> {
  const supabase = await createClient();

  // Get all finalized pay runs for this pay event date
  const { data: payRuns, error } = await supabase
    .from('stp_pay_runs')
    .select('id, gross_earnings, tax_withheld, super_employer_contribution, employee_id')
    .eq('workspace_id', workspaceId)
    .eq('financial_year', financialYear)
    .eq('payment_date', payEventDate.toISOString().split('T')[0])
    .eq('status', 'finalized');

  if (error) throw new Error(`Failed to aggregate pay runs: ${error.message}`);

  const payRunsList = payRuns || [];
  const uniqueEmployees = new Set(payRunsList.map((pr) => pr.employee_id));

  return {
    employee_count: uniqueEmployees.size,
    total_gross_earnings: payRunsList.reduce((sum, pr) => sum + (pr.gross_earnings || 0), 0),
    total_tax_withheld: payRunsList.reduce((sum, pr) => sum + (pr.tax_withheld || 0), 0),
    total_super_employer: payRunsList.reduce(
      (sum, pr) => sum + (pr.super_employer_contribution || 0),
      0
    ),
    pay_run_ids: payRunsList.map((pr) => pr.id),
  };
}
