/**
 * ABN (Australian Business Number) Validator
 *
 * Validates Australian Business Numbers using:
 * - Format validation (11 digits)
 * - Check digit algorithm (mod 89)
 * - ABR API integration for live validation
 */

import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

export interface ABNValidationResult {
  isValid: boolean;
  abn: string; // Formatted ABN (XX XXX XXX XXX)
  entityName?: string;
  status?: 'active' | 'inactive' | 'cancelled';
  gstRegistered?: boolean;
  registeredDate?: string;
  abnStatus?: string;
  abnStatusEffectiveFrom?: string;
  error?: string;
}

export interface ABRAPIResponse {
  businessEntity?: {
    ABN?: string;
    entityName?: string;
    entityStatus?: string;
    entityStatusEffectiveFrom?: string;
    GST?: string;
    registrationDate?: string;
  };
  error?: string;
}

export class ABNValidator {
  private readonly ABR_API_URL = 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001';

  /**
   * Get ABR API GUID from environment
   */
  private getABRGuid(): string | null {
    return process.env.ABR_GUID || null;
  }

  /**
   * Format ABN with spaces (XX XXX XXX XXX)
   */
  formatABN(abn: string): string {
    const digits = abn.replace(/\s/g, '');
    if (digits.length !== 11) {
      return abn;
    }
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  }

  /**
   * Validate ABN format (11 digits)
   */
  validateFormat(abn: string): boolean {
    const digits = abn.replace(/\s/g, '');
    return /^\d{11}$/.test(digits);
  }

  /**
   * Validate ABN check digit using mod 89 algorithm
   *
   * Algorithm:
   * 1. Subtract 1 from the first digit
   * 2. Multiply each digit by its weighting factor (10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19)
   * 3. Sum all results
   * 4. Divide by 89
   * 5. Valid if remainder is 0
   */
  validateCheckDigit(abn: string): boolean {
    const digits = abn.replace(/\s/g, '');

    if (!this.validateFormat(abn)) {
      return false;
    }

    // Weighting factors
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    // Convert to array of numbers
    const abnDigits = digits.split('').map(d => parseInt(d, 10));

    // Subtract 1 from first digit
    abnDigits[0] = abnDigits[0] - 1;

    // Calculate weighted sum
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += abnDigits[i] * weights[i];
    }

    // Valid if divisible by 89
    return sum % 89 === 0;
  }

  /**
   * Validate ABN locally (format + check digit)
   */
  async validateLocal(abn: string): Promise<ABNValidationResult> {
    const digits = abn.replace(/\s/g, '');

    // Format validation
    if (!this.validateFormat(abn)) {
      return {
        isValid: false,
        abn: abn,
        error: 'Invalid ABN format. Must be 11 digits.',
      };
    }

    // Check digit validation
    if (!this.validateCheckDigit(abn)) {
      return {
        isValid: false,
        abn: this.formatABN(digits),
        error: 'Invalid ABN check digit.',
      };
    }

    return {
      isValid: true,
      abn: this.formatABN(digits),
    };
  }

  /**
   * Validate ABN with ABR API (requires ABR_GUID)
   */
  async validateWithABR(abn: string): Promise<ABNValidationResult> {
    const guid = this.getABRGuid();

    if (!guid) {
      // Fall back to local validation if no API key
      const localResult = await this.validateLocal(abn);
      if (localResult.isValid) {
        localResult.error = 'ABR API key not configured. Only local validation performed.';
      }
      return localResult;
    }

    const digits = abn.replace(/\s/g, '');

    // First do local validation
    const localResult = await this.validateLocal(abn);
    if (!localResult.isValid) {
      return localResult;
    }

    try {
      // Call ABR API
      const url = `${this.ABR_API_URL}?searchString=${digits}&includeHistoricalDetails=N&authenticationGuid=${guid}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`ABR API returned ${response.status}: ${response.statusText}`);
      }

      const xml = await response.text();
      const result = await this.parseABRResponse(xml);

      if (result.error) {
        return {
          isValid: false,
          abn: this.formatABN(digits),
          error: result.error,
        };
      }

      if (!result.businessEntity) {
        return {
          isValid: false,
          abn: this.formatABN(digits),
          error: 'ABN not found in ABR database',
        };
      }

      const entity = result.businessEntity;

      return {
        isValid: true,
        abn: this.formatABN(digits),
        entityName: entity.entityName,
        status: this.mapABRStatus(entity.entityStatus),
        gstRegistered: entity.GST === 'true' || entity.GST === 'Y',
        registeredDate: entity.registrationDate,
        abnStatus: entity.entityStatus,
        abnStatusEffectiveFrom: entity.entityStatusEffectiveFrom,
      };
    } catch (error) {
      return {
        isValid: true, // Local validation passed
        abn: this.formatABN(digits),
        error: `ABR API error: ${error instanceof Error ? error.message : error}`,
      };
    }
  }

  /**
   * Parse ABR XML response
   */
  private async parseABRResponse(xml: string): Promise<ABRAPIResponse> {
    try {
      const parsed: any = await parseXML(xml);

      // Check for exception
      if (parsed.ABRPayloadSearchResults?.response?.[0]?.exception) {
        const exception = parsed.ABRPayloadSearchResults.response[0].exception[0];
        return {
          error: exception.exceptionDescription?.[0] || 'Unknown ABR API error',
        };
      }

      // Extract business entity
      const businessEntity = parsed.ABRPayloadSearchResults?.response?.[0]?.businessEntity202001?.[0];

      if (!businessEntity) {
        return { error: 'No business entity found' };
      }

      // Extract main name
      let entityName = '';
      if (businessEntity.mainName?.[0]?.organisationName?.[0]) {
        entityName = businessEntity.mainName[0].organisationName[0];
      } else if (businessEntity.mainName?.[0]?.personName?.[0]) {
        const person = businessEntity.mainName[0].personName[0];
        const givenName = person.givenName?.[0] || '';
        const familyName = person.familyName?.[0] || '';
        entityName = `${givenName} ${familyName}`.trim();
      }

      // Extract ABN
      const abn = businessEntity.ABN?.[0]?.identifierValue?.[0] || '';

      // Extract GST
      const gst = businessEntity.goodsAndServicesTax?.[0]?.effectiveTo?.[0] ? 'Y' : 'N';

      // Extract status
      const entityStatus = businessEntity.entityStatus?.[0]?.entityStatusCode?.[0] || '';
      const entityStatusEffectiveFrom = businessEntity.entityStatus?.[0]?.effectiveFrom?.[0] || '';

      // Extract registration date (simplified - takes first date found)
      let registrationDate = '';
      if (businessEntity.ABN?.[0]?.effectiveFrom?.[0]) {
        registrationDate = businessEntity.ABN[0].effectiveFrom[0];
      }

      return {
        businessEntity: {
          ABN: abn,
          entityName,
          entityStatus,
          entityStatusEffectiveFrom,
          GST: gst,
          registrationDate,
        },
      };
    } catch (error) {
      return {
        error: `Failed to parse ABR response: ${error instanceof Error ? error.message : error}`,
      };
    }
  }

  /**
   * Map ABR status codes to our status enum
   */
  private mapABRStatus(status?: string): 'active' | 'inactive' | 'cancelled' {
    if (!status) return 'inactive';

    const statusUpper = status.toUpperCase();

    if (statusUpper.includes('ACTIVE') || statusUpper === 'ACT') {
      return 'active';
    } else if (statusUpper.includes('CANCEL') || statusUpper === 'CAN') {
      return 'cancelled';
    }

    return 'inactive';
  }

  /**
   * Get ABR record URL
   */
  getABRUrl(abn: string): string {
    const digits = abn.replace(/\s/g, '');
    return `https://abr.business.gov.au/ABN/View?abn=${digits}`;
  }

  /**
   * Validate multiple ABNs
   */
  async validateBatch(abns: string[]): Promise<ABNValidationResult[]> {
    return Promise.all(abns.map(abn => this.validateWithABR(abn)));
  }
}

// Singleton instance
export const abnValidator = new ABNValidator();
