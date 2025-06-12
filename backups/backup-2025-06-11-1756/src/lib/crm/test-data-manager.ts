/**
 * Test Data Manager for CRM
 * Handles detection, filtering, and bulk operations for test/fake data
 */

export interface TestDataFlags {
  name_pattern?: boolean;
  email_pattern?: boolean;
  phone_pattern?: boolean;
  inactive_zero_revenue?: boolean;
  incomplete_profile?: boolean;
  duplicate?: boolean;
}

export interface TestDataRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  revenue?: number;
  lastContact?: Date;
  createdAt?: Date;
  testDataFlags?: string[];
}

// Test data detection patterns
export const testDataPatterns = {
  namePatterns: [
    /test/i,
    /demo/i,
    /fake/i,
    /sample/i,
    /dummy/i,
    /example/i,
    /temp/i,
    /delete/i,
    /lorem/i,
    /ipsum/i,
  ],
  emailPatterns: [
    /test@/i,
    /demo@/i,
    /noreply@/i,
    /fake@/i,
    /example\./i,
    /dummy@/i,
    /temp@/i,
    /no-?reply/i,
    /mailinator/i,
    /guerrillamail/i,
  ],
  phonePatterns: [
    /^0{7,}$/,
    /^1{7,}$/,
    /^123456/,
    /^555-/,
    /^000-/,
    /^111-/,
    /^999-/,
    /^(\d)\1{6,}/, // Repeated digits
  ],
  revenueThresholds: {
    zeroRevenue: true,
    noActivity90Days: true,
    incompleteProfile: true,
  },
};

/**
 * Calculate days since last contact
 */
const daysSinceLastContact = (lastContact?: Date): number => {
  if (!lastContact) return Infinity;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastContact.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Test Data Manager Class
 */
export class TestDataManager {
  /**
   * Identify potential test records
   */
  static identifyTestData(records: TestDataRecord[]): TestDataRecord[] {
    return records
      .map((record) => {
        const flags: string[] = [];

        // Check name patterns
        if (
          record.name &&
          testDataPatterns.namePatterns.some((pattern) =>
            pattern.test(record.name!)
          )
        ) {
          flags.push('name_pattern');
        }

        // Check email patterns
        if (
          record.email &&
          testDataPatterns.emailPatterns.some((pattern) =>
            pattern.test(record.email!)
          )
        ) {
          flags.push('email_pattern');
        }

        // Check phone patterns
        if (
          record.phone &&
          testDataPatterns.phonePatterns.some((pattern) =>
            pattern.test(record.phone!)
          )
        ) {
          flags.push('phone_pattern');
        }

        // Check for zero revenue with old dates
        if (
          record.revenue === 0 &&
          daysSinceLastContact(record.lastContact) > 90
        ) {
          flags.push('inactive_zero_revenue');
        }

        // Check for incomplete profiles
        const hasIncompleteProfile = !record.email || !record.phone;
        if (hasIncompleteProfile) {
          flags.push('incomplete_profile');
        }

        // Check if created more than 90 days ago with no activity
        if (
          record.createdAt &&
          daysSinceLastContact(record.createdAt) > 90 &&
          !record.revenue
        ) {
          flags.push('old_inactive_record');
        }

        return flags.length > 0 ? { ...record, testDataFlags: flags } : null;
      })
      .filter(Boolean) as TestDataRecord[];
  }

  /**
   * Get confidence score for test data (0-100)
   */
  static getTestDataConfidence(record: TestDataRecord): number {
    if (!record.testDataFlags || record.testDataFlags.length === 0) return 0;

    const weights = {
      name_pattern: 30,
      email_pattern: 25,
      phone_pattern: 20,
      inactive_zero_revenue: 15,
      incomplete_profile: 10,
      old_inactive_record: 10,
    };

    let score = 0;
    record.testDataFlags.forEach((flag) => {
      score += weights[flag as keyof typeof weights] || 0;
    });

    return Math.min(score, 100);
  }

  /**
   * Group records by test data confidence
   */
  static groupByConfidence(records: TestDataRecord[]) {
    return {
      high: records.filter((r) => this.getTestDataConfidence(r) >= 70),
      medium: records.filter(
        (r) =>
          this.getTestDataConfidence(r) >= 40 &&
          this.getTestDataConfidence(r) < 70
      ),
      low: records.filter(
        (r) =>
          this.getTestDataConfidence(r) > 0 &&
          this.getTestDataConfidence(r) < 40
      ),
    };
  }

  /**
   * Get summary statistics
   */
  static getTestDataSummary(records: TestDataRecord[]) {
    const testRecords = this.identifyTestData(records);
    const grouped = this.groupByConfidence(testRecords);

    return {
      total: records.length,
      testDataCount: testRecords.length,
      percentage: ((testRecords.length / records.length) * 100).toFixed(2),
      byConfidence: {
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length,
      },
      byFlag: testRecords.reduce((acc, record) => {
        record.testDataFlags?.forEach((flag) => {
          acc[flag] = (acc[flag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Bulk actions
   */
  static bulkActions = {
    /**
     * Archive records
     */
    archive: async (ids: string[]) => {
      // Implementation would move records to archive table
      console.log(`Archiving ${ids.length} records`);
      // Add actual implementation here
    },

    /**
     * Delete records permanently
     */
    delete: async (ids: string[]) => {
      // Implementation would delete records with audit log
      console.log(`Deleting ${ids.length} records`);
      // Add actual implementation here
    },

    /**
     * Mark as test data
     */
    markAsTest: async (ids: string[]) => {
      // Implementation would flag records as test data
      console.log(`Marking ${ids.length} records as test data`);
      // Add actual implementation here
    },

    /**
     * Export records
     */
    export: async (records: TestDataRecord[], format: 'csv' | 'json') => {
      if (format === 'csv') {
        return TestDataManager.exportToCSV(records);
      } else {
        return TestDataManager.exportToJSON(records);
      }
    },
  };

  /**
   * Export to CSV
   */
  private static exportToCSV(records: TestDataRecord[]): string {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Revenue', 'Last Contact', 'Test Data Flags'];
    const rows = records.map((record) => [
      record.id,
      record.name || '',
      record.email || '',
      record.phone || '',
      record.revenue || 0,
      record.lastContact || '',
      record.testDataFlags?.join('; ') || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export to JSON
   */
  private static exportToJSON(records: TestDataRecord[]): string {
    return JSON.stringify(records, null, 2);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Find duplicate records
   */
  static findDuplicates(records: TestDataRecord[]): Map<string, TestDataRecord[]> {
    const duplicates = new Map<string, TestDataRecord[]>();

    // Group by email
    const emailGroups = new Map<string, TestDataRecord[]>();
    records.forEach((record) => {
      if (record.email && this.isValidEmail(record.email)) {
        const email = record.email.toLowerCase();
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email)!.push(record);
      }
    });

    // Find duplicates
    emailGroups.forEach((group, email) => {
      if (group.length > 1) {
        duplicates.set(`email:${email}`, group);
      }
    });

    return duplicates;
  }
}

/**
 * React hook for test data management
 */
export function useTestDataManager() {
  const identifyTestData = (records: TestDataRecord[]) => {
    return TestDataManager.identifyTestData(records);
  };

  const getTestDataSummary = (records: TestDataRecord[]) => {
    return TestDataManager.getTestDataSummary(records);
  };

  const bulkDelete = async (ids: string[]) => {
    return TestDataManager.bulkActions.delete(ids);
  };

  const bulkArchive = async (ids: string[]) => {
    return TestDataManager.bulkActions.archive(ids);
  };

  const exportData = async (records: TestDataRecord[], format: 'csv' | 'json') => {
    return TestDataManager.bulkActions.export(records, format);
  };

  return {
    identifyTestData,
    getTestDataSummary,
    bulkDelete,
    bulkArchive,
    exportData,
    findDuplicates: TestDataManager.findDuplicates,
  };
}
