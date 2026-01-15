/**
 * NZBN (New Zealand Business Number) Validator
 *
 * Validates New Zealand Business Numbers using:
 * - Format validation (13 digits)
 * - Check digit algorithm (mod 97)
 * - Companies Office API integration for live validation
 */

export interface NZBNValidationResult {
  isValid: boolean;
  nzbn: string;
  entityName?: string;
  status?: 'active' | 'inactive' | 'cancelled';
  gstRegistered?: boolean;
  registeredDate?: string;
  companyNumber?: string;
  entityType?: string;
  error?: string;
}

export interface CompaniesOfficeResponse {
  nzbn: string;
  entityName?: string;
  entityStatus?: string;
  registrationDate?: string;
  entityTypeDescription?: string;
  sourceRegisterUniqueIdentifier?: string; // Company number
  addresses?: any[];
}

export class NZBNValidator {
  private readonly COMPANIES_OFFICE_API_URL = 'https://api.business.govt.nz/services/v4';

  /**
   * Get Companies Office API key from environment
   */
  private getAPIKey(): string | null {
    return process.env.NZBN_API_KEY || null;
  }

  /**
   * Validate NZBN format (13 digits)
   */
  validateFormat(nzbn: string): boolean {
    const digits = nzbn.replace(/\s/g, '');
    return /^\d{13}$/.test(digits);
  }

  /**
   * Validate NZBN check digit using mod 97 algorithm
   *
   * Algorithm:
   * 1. Take first 11 digits
   * 2. Calculate: 98 - (first11 mod 97)
   * 3. Compare with last 2 digits (check digits)
   */
  validateCheckDigit(nzbn: string): boolean {
    const digits = nzbn.replace(/\s/g, '');

    if (!this.validateFormat(nzbn)) {
      return false;
    }

    // Get first 11 digits and last 2 check digits
    const first11 = digits.substring(0, 11);
    const checkDigits = digits.substring(11, 13);

    // Calculate expected check digits
    const remainder = parseInt(first11) % 97;
    const calculatedCheck = 98 - remainder;

    // Pad to 2 digits (e.g., 5 becomes "05")
    const expectedCheck = calculatedCheck.toString().padStart(2, '0');

    return expectedCheck === checkDigits;
  }

  /**
   * Validate NZBN locally (format + check digit)
   */
  async validateLocal(nzbn: string): Promise<NZBNValidationResult> {
    const digits = nzbn.replace(/\s/g, '');

    // Format validation
    if (!this.validateFormat(nzbn)) {
      return {
        isValid: false,
        nzbn: nzbn,
        error: 'Invalid NZBN format. Must be 13 digits.',
      };
    }

    // Check digit validation
    if (!this.validateCheckDigit(nzbn)) {
      return {
        isValid: false,
        nzbn: digits,
        error: 'Invalid NZBN check digit.',
      };
    }

    return {
      isValid: true,
      nzbn: digits,
    };
  }

  /**
   * Validate NZBN with Companies Office API
   */
  async validateWithAPI(nzbn: string): Promise<NZBNValidationResult> {
    const apiKey = this.getAPIKey();

    if (!apiKey) {
      // Fall back to local validation if no API key
      const localResult = await this.validateLocal(nzbn);
      if (localResult.isValid) {
        localResult.error = 'NZBN API key not configured. Only local validation performed.';
      }
      return localResult;
    }

    const digits = nzbn.replace(/\s/g, '');

    // First do local validation
    const localResult = await this.validateLocal(nzbn);
    if (!localResult.isValid) {
      return localResult;
    }

    try {
      // Call Companies Office API
      const url = `${this.COMPANIES_OFFICE_API_URL}/nzbn/entities/${digits}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            isValid: false,
            nzbn: digits,
            error: 'NZBN not found in Companies Office database',
          };
        }

        throw new Error(`Companies Office API returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as CompaniesOfficeResponse;

      return {
        isValid: true,
        nzbn: digits,
        entityName: data.entityName,
        status: this.mapStatus(data.entityStatus),
        registeredDate: data.registrationDate,
        companyNumber: data.sourceRegisterUniqueIdentifier,
        entityType: data.entityTypeDescription,
      };
    } catch (error) {
      return {
        isValid: true, // Local validation passed
        nzbn: digits,
        error: `Companies Office API error: ${error instanceof Error ? error.message : error}`,
      };
    }
  }

  /**
   * Map Companies Office status to our status enum
   */
  private mapStatus(status?: string): 'active' | 'inactive' | 'cancelled' {
    if (!status) return 'inactive';

    const statusUpper = status.toUpperCase();

    if (statusUpper.includes('ACTIVE') || statusUpper === 'REGISTERED') {
      return 'active';
    } else if (statusUpper.includes('REMOVED') || statusUpper.includes('LIQUIDAT')) {
      return 'cancelled';
    }

    return 'inactive';
  }

  /**
   * Get Companies Office register URL
   */
  getCompaniesOfficeUrl(companyNumber?: string): string {
    if (companyNumber) {
      return `https://companies-register.companiesoffice.govt.nz/companies/${companyNumber}`;
    }
    return 'https://companies-register.companiesoffice.govt.nz/';
  }

  /**
   * Validate multiple NZBNs
   */
  async validateBatch(nzbns: string[]): Promise<NZBNValidationResult[]> {
    return Promise.all(nzbns.map(nzbn => this.validateWithAPI(nzbn)));
  }

  /**
   * Format NZBN for display
   */
  formatNZBN(nzbn: string): string {
    const digits = nzbn.replace(/\s/g, '');
    // NZBNs are typically displayed without spaces
    return digits;
  }
}

// Singleton instance
export const nzbnValidator = new NZBNValidator();
