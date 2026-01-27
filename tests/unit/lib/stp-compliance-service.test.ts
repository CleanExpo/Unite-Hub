/**
 * STP Compliance Service Unit Tests
 *
 * Tests for payroll calculations:
 * - Financial year utilities
 * - PAYG tax withholding
 * - Superannuation calculations
 * - Pay run processing
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { describe, it, expect } from 'vitest';
import {
  getFinancialYear,
  getFinancialYearDates,
  annualToWeekly,
  weeklyToAnnual,
  calculatePAYGWithholding,
  calculatePAYGForPeriod,
  calculateSuperGuarantee,
  calculatePayRun,
  type Employee,
  type PayRunInput,
} from '@/lib/integrations/ato/stpComplianceService';

describe('STP Compliance Service', () => {
  // ============================================================================
  // Financial Year Utilities
  // ============================================================================

  describe('Financial Year Utilities', () => {
    it('should get FY from January date (first half)', () => {
      const date = new Date('2026-01-15');
      expect(getFinancialYear(date)).toBe(2026); // FY 2025-26
    });

    it('should get FY from June date (end of first half)', () => {
      const date = new Date('2026-06-30');
      expect(getFinancialYear(date)).toBe(2026); // FY 2025-26
    });

    it('should get FY from July date (start of second half)', () => {
      const date = new Date('2026-07-01');
      expect(getFinancialYear(date)).toBe(2027); // FY 2026-27
    });

    it('should get FY from December date (second half)', () => {
      const date = new Date('2026-12-31');
      expect(getFinancialYear(date)).toBe(2027); // FY 2026-27
    });

    it('should get FY date range', () => {
      const { startDate, endDate } = getFinancialYearDates(2026);

      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getMonth()).toBe(6); // July (0-indexed)
      expect(startDate.getDate()).toBe(1);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(5); // June (0-indexed)
      expect(endDate.getDate()).toBe(30);
    });
  });

  // ============================================================================
  // Salary Conversion
  // ============================================================================

  describe('Salary Conversion', () => {
    it('should convert annual to weekly', () => {
      expect(annualToWeekly(52000)).toBe(1000);
      expect(annualToWeekly(78000)).toBe(1500);
    });

    it('should convert weekly to annual', () => {
      expect(weeklyToAnnual(1000)).toBe(52000);
      expect(weeklyToAnnual(1500)).toBe(78000);
    });

    it('should round-trip correctly', () => {
      const annual = 65000;
      const weekly = annualToWeekly(annual);
      const backToAnnual = weeklyToAnnual(weekly);
      expect(backToAnnual).toBeCloseTo(annual, 0);
    });
  });

  // ============================================================================
  // PAYG Tax Withholding
  // ============================================================================

  describe('PAYG Tax Withholding', () => {
    describe('With tax-free threshold', () => {
      it('should withhold zero for low income (<$359/week)', () => {
        const tax = calculatePAYGWithholding(350, true);
        expect(tax).toBe(0);
      });

      it('should withhold 19% for $359-438 bracket', () => {
        const tax = calculatePAYGWithholding(400, true);
        // (400 - 359) * 0.19 = 7.79
        expect(tax).toBeCloseTo(7.79, 2);
      });

      it('should withhold correctly for $500/week', () => {
        const tax = calculatePAYGWithholding(500, true);
        // Base: $15.01, plus (500 - 438) * 0.29 = 15.01 + 17.98 = 32.99
        expect(tax).toBeCloseTo(32.99, 2);
      });

      it('should withhold correctly for $1000/week', () => {
        const tax = calculatePAYGWithholding(1000, true);
        // Base: $114.78, plus (1000 - 865) * 0.3477 = 114.78 + 46.94 = 161.72
        expect(tax).toBeCloseTo(161.72, 2);
      });

      it('should withhold correctly for $2000/week', () => {
        const tax = calculatePAYGWithholding(2000, true);
        // Base: $259.78, plus (2000 - 1282) * 0.345 = 259.78 + 247.71 = 507.49
        expect(tax).toBeCloseTo(507.49, 2);
      });
    });

    describe('Without tax-free threshold', () => {
      it('should withhold 19% from first dollar', () => {
        const tax = calculatePAYGWithholding(50, false);
        // (50 - 0) * 0.19 = 9.5
        expect(tax).toBeCloseTo(9.5, 2);
      });

      it('should withhold more than with TFT for same income', () => {
        const withTFT = calculatePAYGWithholding(500, true);
        const withoutTFT = calculatePAYGWithholding(500, false);
        expect(withoutTFT).toBeGreaterThan(withTFT);
      });

      it('should withhold correctly for $1000/week no TFT', () => {
        const tax = calculatePAYGWithholding(1000, false);
        // Base: $220.36, plus (1000 - 932) * 0.3477 = 220.36 + 23.64 = 244.00
        expect(tax).toBeCloseTo(244.00, 2);
      });
    });

    describe('HECS/HELP debt', () => {
      it('should add 2% levy for HECS debt', () => {
        const withoutHECS = calculatePAYGWithholding(1000, true, false);
        const withHECS = calculatePAYGWithholding(1000, true, true);

        // HECS levy = 2% of 1000 = 20
        expect(withHECS).toBeCloseTo(withoutHECS + 20, 2);
      });

      it('should apply HECS to low income earners', () => {
        const tax = calculatePAYGWithholding(300, true, true);
        // Base tax: 0, HECS: 300 * 0.02 = 6
        expect(tax).toBeCloseTo(6, 2);
      });
    });
  });

  // ============================================================================
  // PAYG for Different Pay Periods
  // ============================================================================

  describe('PAYG for Pay Periods', () => {
    it('should calculate tax for weekly period (7 days)', () => {
      const grossPay = 1000;
      const periodDays = 7;
      const tax = calculatePAYGForPeriod(grossPay, periodDays, true);

      // Should match weekly calculation in cents
      const weeklyTax = calculatePAYGWithholding(1000, true);
      expect(tax).toBeCloseTo(weeklyTax * 100, 0); // Convert to cents
    });

    it('should calculate tax for fortnightly period (14 days)', () => {
      const grossPay = 2000; // $2000 for 2 weeks
      const periodDays = 14;
      const tax = calculatePAYGForPeriod(grossPay, periodDays, true);

      // Weekly equivalent: $1000
      const weeklyTax = calculatePAYGWithholding(1000, true);
      const expectedTax = (weeklyTax / 7) * 14 * 100; // Scale to 14 days, convert to cents

      expect(tax).toBeCloseTo(expectedTax, 0);
    });

    it('should calculate tax for monthly period (30 days)', () => {
      const grossPay = 4333.33; // ~$1000/week * 4.33
      const periodDays = 30;
      const tax = calculatePAYGForPeriod(grossPay, periodDays, true);

      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(grossPay * 100); // Sanity check
    });

    it('should return tax in cents', () => {
      const tax = calculatePAYGForPeriod(1000, 7, true);
      expect(Number.isInteger(tax)).toBe(true);
    });
  });

  // ============================================================================
  // Superannuation Calculations
  // ============================================================================

  describe('Superannuation Calculations', () => {
    it('should calculate 11.5% super guarantee', () => {
      const gross = 100000; // Cents
      const super_ = calculateSuperGuarantee(gross);

      // 11.5% of 100000 = 11500
      expect(super_).toBe(11500);
    });

    it('should round to nearest cent', () => {
      const gross = 123456; // Cents
      const super_ = calculateSuperGuarantee(gross);

      // 11.5% of 123456 = 14197.44
      expect(super_).toBe(14197);
    });

    it('should handle zero gross', () => {
      expect(calculateSuperGuarantee(0)).toBe(0);
    });

    it('should handle large amounts', () => {
      const gross = 10000000; // $100,000 in cents
      const super_ = calculateSuperGuarantee(gross);

      // 11.5% of 10000000 = 1150000
      expect(super_).toBe(1150000);
    });
  });

  // ============================================================================
  // Complete Pay Run Calculation
  // ============================================================================

  describe('Complete Pay Run Calculation', () => {
    const mockEmployee: Employee = {
      id: 'emp-123',
      workspace_id: 'ws-456',
      employee_id: 'EMP001',
      tfn: '123456782',
      first_name: 'John',
      last_name: 'Smith',
      employment_type: 'full_time',
      employment_start_date: new Date('2024-01-01'),
      tax_free_threshold: true,
      hecs_help_debt: false,
      student_loan_debt: false,
      tax_scale: 'regular',
      is_active: true,
    };

    it('should calculate complete weekly pay run', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
        ordinary_hours: 38,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(100000); // $1000 in cents
      expect(result.tax_withheld).toBeGreaterThan(0);
      expect(result.super_employer_contribution).toBe(11500); // 11.5% of 100000
      expect(result.net_pay).toBeLessThan(result.gross_earnings);
      expect(result.financial_year).toBe(2026); // FY 2025-26
    });

    it('should include allowances in gross for tax calculation', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
        allowances: 200,
      };

      const result = calculatePayRun(input, mockEmployee);

      // Total gross = 1000 + 200 = 1200
      expect(result.gross_earnings).toBe(100000);
      expect(result.allowances).toBe(20000);

      // Super should be on total (120000)
      expect(result.super_employer_contribution).toBe(13800); // 11.5% of 120000
    });

    it('should include bonuses and overtime', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
        bonuses: 500,
        overtime: 300,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.bonuses).toBe(50000);
      expect(result.overtime).toBe(30000);

      // Total = 1000 + 500 + 300 = 1800
      expect(result.super_employer_contribution).toBe(20700); // 11.5% of 180000
    });

    it('should apply higher tax for employee without TFT', () => {
      const employeeNoTFT = { ...mockEmployee, tax_free_threshold: false };

      const inputWithTFT: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
      };

      const resultWithTFT = calculatePayRun(inputWithTFT, mockEmployee);
      const resultNoTFT = calculatePayRun(inputWithTFT, employeeNoTFT);

      expect(resultNoTFT.tax_withheld).toBeGreaterThan(resultWithTFT.tax_withheld);
    });

    it('should apply HECS levy', () => {
      const employeeHECS = { ...mockEmployee, hecs_help_debt: true };

      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
      };

      const resultNoHECS = calculatePayRun(input, mockEmployee);
      const resultWithHECS = calculatePayRun(input, employeeHECS);

      // HECS adds 2% = $20/week = 2000 cents
      expect(resultWithHECS.tax_withheld).toBeGreaterThan(resultNoHECS.tax_withheld);
      expect(resultWithHECS.tax_withheld - resultNoHECS.tax_withheld).toBeCloseTo(2000, 0);
    });

    it('should deduct employee super contributions', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
        super_employee_contribution: 100,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.super_employee_contribution).toBe(10000);
      expect(result.net_pay).toBe(
        result.gross_earnings -
          result.tax_withheld -
          result.super_employee_contribution -
          result.union_fees -
          result.other_deductions
      );
    });

    it('should calculate net pay correctly', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
        allowances: 100,
        super_employee_contribution: 50,
        union_fees: 10,
        other_deductions: 20,
      };

      const result = calculatePayRun(input, mockEmployee);

      const expectedNet =
        result.gross_earnings +
        result.allowances -
        result.tax_withheld -
        result.super_employee_contribution -
        result.union_fees -
        result.other_deductions;

      expect(result.net_pay).toBe(expectedNet);
    });

    it('should determine financial year from period end date', () => {
      const inputJan: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000,
      };

      const inputJul: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-07-06'),
        pay_period_end: new Date('2026-07-12'),
        payment_date: new Date('2026-07-13'),
        gross_earnings: 1000,
      };

      const resultJan = calculatePayRun(inputJan, mockEmployee);
      const resultJul = calculatePayRun(inputJul, mockEmployee);

      expect(resultJan.financial_year).toBe(2026); // FY 2025-26
      expect(resultJul.financial_year).toBe(2027); // FY 2026-27
    });

    it('should handle fortnightly pay run', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-12'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 2000,
        ordinary_hours: 76,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(200000);
      expect(result.ordinary_hours).toBe(76);
      expect(result.super_employer_contribution).toBe(23000); // 11.5% of 200000
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    const mockEmployee: Employee = {
      id: 'emp-123',
      workspace_id: 'ws-456',
      employee_id: 'EMP001',
      first_name: 'Jane',
      last_name: 'Doe',
      employment_type: 'full_time',
      employment_start_date: new Date('2024-01-01'),
      tax_free_threshold: true,
      hecs_help_debt: false,
      student_loan_debt: false,
      tax_scale: 'regular',
      is_active: true,
    };

    it('should handle zero gross earnings', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 0,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(0);
      expect(result.tax_withheld).toBe(0);
      expect(result.super_employer_contribution).toBe(0);
      expect(result.net_pay).toBe(0);
    });

    it('should handle very high income', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 10000,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(1000000);
      expect(result.tax_withheld).toBeGreaterThan(0);
      expect(result.super_employer_contribution).toBe(115000); // 11.5% of 1000000
      expect(result.net_pay).toBeGreaterThan(0);
    });

    it('should handle single-day pay period', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-20'),
        pay_period_end: new Date('2026-01-20'),
        payment_date: new Date('2026-01-21'),
        gross_earnings: 142.86, // ~$1000/week / 7
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(14286);
      expect(result.financial_year).toBe(2026);
    });

    it('should handle partial cent amounts (rounding)', () => {
      const input: PayRunInput = {
        employee_id: 'emp-123',
        pay_period_start: new Date('2026-01-19'),
        pay_period_end: new Date('2026-01-25'),
        payment_date: new Date('2026-01-26'),
        gross_earnings: 1000.15,
      };

      const result = calculatePayRun(input, mockEmployee);

      expect(result.gross_earnings).toBe(100015); // Rounded to cents
    });
  });
});
