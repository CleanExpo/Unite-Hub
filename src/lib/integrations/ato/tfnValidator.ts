/**
 * TFN (Tax File Number) Validator
 *
 * Validates Australian Tax File Numbers using:
 * - Format validation (8 or 9 digits)
 * - Check digit algorithm
 *
 * Note: TFNs are private and there is no public API for validation
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

export interface TFNValidationResult {
  isValid: boolean;
  tfn: string; // Formatted TFN (XXX XXX XXX)
  error?: string;
}

export class TFNValidator {
  /**
   * Format TFN with spaces (XXX XXX XXX)
   */
  formatTFN(tfn: string): string {
    const digits = tfn.replace(/\s/g, '');

    if (digits.length === 8) {
      // 8-digit TFN: XXX XXX XX
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)}`;
    }

    if (digits.length === 9) {
      // 9-digit TFN: XXX XXX XXX
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }

    return tfn;
  }

  /**
   * Validate TFN format (8 or 9 digits)
   */
  validateFormat(tfn: string): boolean {
    const digits = tfn.replace(/\s/g, '');
    return /^\d{8,9}$/.test(digits);
  }

  /**
   * Validate TFN check digit
   *
   * Algorithm for 8-digit TFN:
   * 1. Multiply each of the first 7 digits by its weighting factor (1, 4, 3, 7, 5, 8, 6)
   * 2. Sum all results
   * 3. Divide by 11
   * 4. Multiply remainder by 10
   * 5. If result > 9, subtract 9
   * 6. Compare with 8th digit
   *
   * Algorithm for 9-digit TFN:
   * 1. Multiply each of the first 8 digits by its weighting factor (1, 4, 3, 7, 5, 8, 6, 9)
   * 2. Sum all results
   * 3. Divide by 11
   * 4. Multiply remainder by 10
   * 5. If result > 9, subtract 9
   * 6. Compare with 9th digit
   */
  validateCheckDigit(tfn: string): boolean {
    const digits = tfn.replace(/\s/g, '');

    if (!this.validateFormat(tfn)) {
      return false;
    }

    const tfnDigits = digits.split('').map(d => parseInt(d, 10));
    const length = digits.length;

    // Weighting factors
    const weights8 = [1, 4, 3, 7, 5, 8, 6];
    const weights9 = [1, 4, 3, 7, 5, 8, 6, 9];

    const weights = length === 8 ? weights8 : weights9;
    const checkDigitIndex = length - 1;

    // Calculate weighted sum (excluding check digit)
    let sum = 0;
    for (let i = 0; i < length - 1; i++) {
      sum += tfnDigits[i] * weights[i];
    }

    // Calculate check digit
    let remainder = sum % 11;
    let calculatedCheckDigit = remainder * 10;

    // If > 9, subtract 9
    if (calculatedCheckDigit > 9) {
      calculatedCheckDigit = calculatedCheckDigit - 9;
    }

    // Compare with actual check digit
    return calculatedCheckDigit === tfnDigits[checkDigitIndex];
  }

  /**
   * Validate TFN (format + check digit)
   */
  async validate(tfn: string): Promise<TFNValidationResult> {
    const digits = tfn.replace(/\s/g, '');

    // Format validation
    if (!this.validateFormat(tfn)) {
      return {
        isValid: false,
        tfn: tfn,
        error: 'Invalid TFN format. Must be 8 or 9 digits.',
      };
    }

    // Check digit validation
    if (!this.validateCheckDigit(tfn)) {
      return {
        isValid: false,
        tfn: this.formatTFN(digits),
        error: 'Invalid TFN check digit.',
      };
    }

    return {
      isValid: true,
      tfn: this.formatTFN(digits),
    };
  }

  /**
   * Validate multiple TFNs
   */
  async validateBatch(tfns: string[]): Promise<TFNValidationResult[]> {
    return Promise.all(tfns.map(tfn => this.validate(tfn)));
  }
}

// Singleton instance
export const tfnValidator = new TFNValidator();
