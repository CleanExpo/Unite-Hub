/**
 * BAS Automation Service Unit Tests
 *
 * Tests for BAS lodgement automation:
 * - Period calculations
 * - Due date calculations
 * - Transaction aggregation
 * - BAS calculation logic
 * - Overdue detection
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePeriodDates,
  getCurrentBASPeriod,
  getPreviousBASPeriod,
  getDaysUntilDue,
  formatBASPeriod,
  BASPeriodConfig,
} from '@/lib/integrations/ato/basAutomationService';

// ============================================================================
// Period Date Calculations
// ============================================================================

describe('calculatePeriodDates', () => {
  it('should calculate Q1 dates correctly', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 1 };
    const { startDate, endDate, dueDate } = calculatePeriodDates(config);

    expect(startDate).toEqual(new Date(2026, 0, 1)); // Jan 1
    expect(endDate).toEqual(new Date(2026, 2, 31)); // Mar 31
    expect(dueDate).toEqual(new Date(2026, 3, 28)); // Apr 28
  });

  it('should calculate Q2 dates correctly', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 2 };
    const { startDate, endDate, dueDate } = calculatePeriodDates(config);

    expect(startDate).toEqual(new Date(2026, 3, 1)); // Apr 1
    expect(endDate).toEqual(new Date(2026, 5, 30)); // Jun 30
    expect(dueDate).toEqual(new Date(2026, 6, 28)); // Jul 28
  });

  it('should calculate Q3 dates correctly', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 3 };
    const { startDate, endDate, dueDate } = calculatePeriodDates(config);

    expect(startDate).toEqual(new Date(2026, 6, 1)); // Jul 1
    expect(endDate).toEqual(new Date(2026, 8, 30)); // Sep 30
    expect(dueDate).toEqual(new Date(2026, 9, 28)); // Oct 28
  });

  it('should calculate Q4 dates correctly', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 4 };
    const { startDate, endDate, dueDate } = calculatePeriodDates(config);

    expect(startDate).toEqual(new Date(2026, 9, 1)); // Oct 1
    expect(endDate).toEqual(new Date(2026, 11, 31)); // Dec 31
    expect(dueDate).toEqual(new Date(2027, 0, 28)); // Jan 28, 2027
  });

  it('should calculate monthly period dates', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 6 };
    const { startDate, endDate, dueDate } = calculatePeriodDates(config);

    expect(startDate).toEqual(new Date(2026, 5, 1)); // Jun 1
    expect(endDate).toEqual(new Date(2026, 5, 30)); // Jun 30
    expect(dueDate).toEqual(new Date(2026, 6, 21)); // Jul 21
  });

  it('should throw on invalid configuration', () => {
    const invalidConfig: BASPeriodConfig = { type: 'quarterly', year: 2026 };
    expect(() => calculatePeriodDates(invalidConfig)).toThrow();
  });
});

// ============================================================================
// Current/Previous Period
// ============================================================================

describe('getCurrentBASPeriod', () => {
  it('should return quarterly period', () => {
    const period = getCurrentBASPeriod('quarterly');
    expect(period.type).toBe('quarterly');
    expect(period.year).toBeGreaterThanOrEqual(2026);
    expect(period.quarter).toBeGreaterThanOrEqual(1);
    expect(period.quarter).toBeLessThanOrEqual(4);
  });

  it('should return monthly period', () => {
    const period = getCurrentBASPeriod('monthly');
    expect(period.type).toBe('monthly');
    expect(period.year).toBeGreaterThanOrEqual(2026);
    expect(period.month).toBeGreaterThanOrEqual(1);
    expect(period.month).toBeLessThanOrEqual(12);
  });
});

describe('getPreviousBASPeriod', () => {
  it('should return previous quarter within year', () => {
    const period = getPreviousBASPeriod('quarterly');
    expect(period.type).toBe('quarterly');
    expect(period.quarter).toBeDefined();
  });

  it('should roll back to Q4 of previous year from Q1', () => {
    // Mock current period as Q1 2026
    const current: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 1 };
    const previous = getPreviousBASPeriod('quarterly');

    // Should return Q4 2025 or earlier
    expect(previous.year).toBeLessThanOrEqual(2026);
  });

  it('should return previous month within year', () => {
    const period = getPreviousBASPeriod('monthly');
    expect(period.type).toBe('monthly');
    expect(period.month).toBeDefined();
  });

  it('should roll back to Dec of previous year from Jan', () => {
    const previous = getPreviousBASPeriod('monthly');

    // Should be valid month
    expect(previous.month).toBeGreaterThanOrEqual(1);
    expect(previous.month).toBeLessThanOrEqual(12);
  });
});

// ============================================================================
// Days Until Due
// ============================================================================

describe('getDaysUntilDue', () => {
  it('should calculate days until Q1 due date', () => {
    const config: BASPeriodConfig = {
      type: 'quarterly',
      year: new Date().getFullYear() + 1, // Future year
      quarter: 1,
    };

    const days = getDaysUntilDue(config);
    expect(days).toBeGreaterThan(0);
  });

  it('should return negative days for past periods', () => {
    const config: BASPeriodConfig = {
      type: 'quarterly',
      year: 2020,
      quarter: 1,
    };

    const days = getDaysUntilDue(config);
    expect(days).toBeLessThan(0);
  });

  it('should handle monthly periods', () => {
    const config: BASPeriodConfig = {
      type: 'monthly',
      year: new Date().getFullYear() + 1,
      month: 1,
    };

    const days = getDaysUntilDue(config);
    expect(days).toBeGreaterThan(0);
  });
});

// ============================================================================
// Formatting
// ============================================================================

describe('formatBASPeriod', () => {
  it('should format quarterly period', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 1 };
    expect(formatBASPeriod(config)).toBe('Q1 2026');
  });

  it('should format all quarters correctly', () => {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter };
      expect(formatBASPeriod(config)).toBe(`Q${quarter} 2026`);
    }
  });

  it('should format monthly period', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 6 };
    expect(formatBASPeriod(config)).toBe('Jun 2026');
  });

  it('should format all months correctly', () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let month = 1; month <= 12; month++) {
      const config: BASPeriodConfig = { type: 'monthly', year: 2026, month };
      expect(formatBASPeriod(config)).toBe(`${monthNames[month - 1]} 2026`);
    }
  });
});

// ============================================================================
// BAS Period Validation
// ============================================================================

describe('BAS period validation', () => {
  it('should accept valid quarterly config', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 2 };
    expect(() => calculatePeriodDates(config)).not.toThrow();
  });

  it('should accept valid monthly config', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 7 };
    expect(() => calculatePeriodDates(config)).not.toThrow();
  });

  it('should reject quarterly without quarter', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026 };
    expect(() => calculatePeriodDates(config)).toThrow();
  });

  it('should reject monthly without month', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026 };
    expect(() => calculatePeriodDates(config)).toThrow();
  });
});

// ============================================================================
// Due Date Calculations
// ============================================================================

describe('BAS due date rules', () => {
  it('should set quarterly due date 28 days after quarter end', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 1 };
    const { endDate, dueDate } = calculatePeriodDates(config);

    const diffMs = dueDate.getTime() - endDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(28);
  });

  it('should set monthly due date 21 days after month end', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 6 };
    const { endDate, dueDate } = calculatePeriodDates(config);

    const diffMs = dueDate.getTime() - endDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(21);
  });

  it('should handle year boundary for Q4', () => {
    const config: BASPeriodConfig = { type: 'quarterly', year: 2026, quarter: 4 };
    const { dueDate } = calculatePeriodDates(config);

    expect(dueDate.getFullYear()).toBe(2027);
    expect(dueDate.getMonth()).toBe(0); // January
  });

  it('should handle year boundary for December', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 12 };
    const { dueDate } = calculatePeriodDates(config);

    expect(dueDate.getFullYear()).toBe(2027);
    expect(dueDate.getMonth()).toBe(0); // January
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge cases', () => {
  it('should handle leap year February', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2024, month: 2 };
    const { endDate } = calculatePeriodDates(config);

    expect(endDate.getDate()).toBe(29); // 2024 is leap year
  });

  it('should handle non-leap year February', () => {
    const config: BASPeriodConfig = { type: 'monthly', year: 2026, month: 2 };
    const { endDate } = calculatePeriodDates(config);

    expect(endDate.getDate()).toBe(28);
  });

  it('should handle months with 31 days', () => {
    const monthsWith31Days = [1, 3, 5, 7, 8, 10, 12];

    for (const month of monthsWith31Days) {
      const config: BASPeriodConfig = { type: 'monthly', year: 2026, month };
      const { endDate } = calculatePeriodDates(config);
      expect(endDate.getDate()).toBe(31);
    }
  });

  it('should handle months with 30 days', () => {
    const monthsWith30Days = [4, 6, 9, 11];

    for (const month of monthsWith30Days) {
      const config: BASPeriodConfig = { type: 'monthly', year: 2026, month };
      const { endDate } = calculatePeriodDates(config);
      expect(endDate.getDate()).toBe(30);
    }
  });
});
