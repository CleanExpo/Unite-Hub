/**
 * Australian Business Validators
 * Unite Group - Validation Functions for Australian Data
 */

import { 
  AustralianUserProfile,
  AustralianState,
  AustralianDataValidation,
  AustralianTimezone,
  AustralianCommunicationSettings,
  AustralianBusinessSize
} from './types';
import { AustralianUtils } from './utils';

export class AustralianValidators {
  /**
   * Validate Australian Business Number (ABN)
   */
  static validateABN(abn: string): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!abn) {
      validation.isValid = false;
      validation.errors.push('ABN is required');
      return validation;
    }

    // Remove spaces and check format
    const cleanABN = abn.replace(/\s/g, '');
    
    if (!/^\d{11}$/.test(cleanABN)) {
      validation.isValid = false;
      validation.errors.push('ABN must be 11 digits');
      validation.suggestions.push('Format: XX XXX XXX XXX');
      return validation;
    }

    // ABN checksum validation (simplified)
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = cleanABN.split('').map(Number);
    
    // Subtract 1 from first digit
    digits[0] -= 1;
    
    const sum = digits.reduce((acc, digit, index) => acc + (digit * weights[index]), 0);
    
    if (sum % 89 !== 0) {
      validation.isValid = false;
      validation.errors.push('Invalid ABN checksum');
      validation.suggestions.push('Please verify the ABN with the Australian Business Register');
    }

    return validation;
  }

  /**
   * Validate Australian Company Number (ACN)
   */
  static validateACN(acn: string): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!acn) {
      validation.isValid = false;
      validation.errors.push('ACN is required');
      return validation;
    }

    const cleanACN = acn.replace(/\s/g, '');
    
    if (!/^\d{9}$/.test(cleanACN)) {
      validation.isValid = false;
      validation.errors.push('ACN must be 9 digits');
      validation.suggestions.push('Format: XXX XXX XXX');
      return validation;
    }

    // ACN checksum validation
    const weights = [8, 7, 6, 5, 4, 3, 2, 1];
    const digits = cleanACN.substring(0, 8).split('').map(Number);
    const checkDigit = parseInt(cleanACN.charAt(8));
    
    const sum = digits.reduce((acc, digit, index) => acc + (digit * weights[index]), 0);
    const remainder = sum % 10;
    const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder;
    
    if (calculatedCheckDigit !== checkDigit) {
      validation.isValid = false;
      validation.errors.push('Invalid ACN checksum');
    }

    return validation;
  }

  /**
   * Validate Australian phone number
   */
  static validateAustralianPhoneNumber(phone: string): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!phone) {
      validation.isValid = false;
      validation.errors.push('Phone number is required');
      return validation;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check various Australian phone number formats
    const patterns = [
      /^61[2-478]\d{8}$/, // International mobile/landline
      /^0[2-478]\d{8}$/, // National mobile/landline
      /^[2-478]\d{8}$/, // Local mobile/landline
      /^1[38]\d{4}$/, // Short numbers (13xx, 18xx)
      /^1800\d{6}$/, // Free call
      /^1900\d{6}$/ // Premium rate
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
      validation.isValid = false;
      validation.errors.push('Invalid Australian phone number format');
      validation.suggestions.push('Use format: +61 X XXXX XXXX or 0X XXXX XXXX');
    } else {
      // Check specific number types
      if (cleanPhone.startsWith('04') || cleanPhone.startsWith('6104')) {
        validation.suggestions.push('Mobile number detected');
      } else if (cleanPhone.startsWith('02') || cleanPhone.startsWith('03') || 
                 cleanPhone.startsWith('07') || cleanPhone.startsWith('08')) {
        validation.suggestions.push('Landline number detected');
      }
    }

    return validation;
  }

  /**
   * Validate Australian postcode
   */
  static validateAustralianPostcode(postcode: string, expectedState?: AustralianState): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!postcode) {
      validation.isValid = false;
      validation.errors.push('Postcode is required');
      return validation;
    }

    const postcodeValidation = AustralianUtils.validateAustralianPostcode(postcode);
    
    if (!postcodeValidation.isValid) {
      validation.isValid = false;
      validation.errors.push('Invalid Australian postcode');
      validation.suggestions.push('Australian postcodes are 4 digits');
      return validation;
    }

    if (expectedState && postcodeValidation.state !== expectedState) {
      validation.warnings.push(
        `Postcode ${postcode} is in ${postcodeValidation.state} but expected ${expectedState}`
      );
    }

    validation.suggestions.push(`${postcodeValidation.region} (${postcodeValidation.state})`);
    
    return validation;
  }

  /**
   * Validate Australian user profile
   */
  static validateAustralianUserProfile(profile: Partial<AustralianUserProfile>): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required fields
    if (!profile.id) {
      validation.isValid = false;
      validation.errors.push('User ID is required');
    }

    if (!profile.location) {
      validation.isValid = false;
      validation.errors.push('Location is required');
    } else {
      // Validate location fields
      if (!profile.location.city) {
        validation.isValid = false;
        validation.errors.push('City is required');
      }

      if (!profile.location.state) {
        validation.isValid = false;
        validation.errors.push('State is required');
      }

      if (!profile.location.postcode) {
        validation.isValid = false;
        validation.errors.push('Postcode is required');
      } else {
        const postcodeValidation = this.validateAustralianPostcode(
          profile.location.postcode, 
          profile.location.state as AustralianState
        );
        if (!postcodeValidation.isValid) {
          validation.errors.push(...postcodeValidation.errors);
        }
        validation.warnings.push(...postcodeValidation.warnings);
      }

      if (!profile.location.timezone) {
        validation.warnings.push('Timezone not specified, defaulting to Australia/Sydney');
      } else {
        const validTimezones: AustralianTimezone[] = [
          'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth'
        ];
        if (!validTimezones.includes(profile.location.timezone)) {
          validation.warnings.push('Invalid Australian timezone');
        }
      }
    }

    if (!profile.preferences) {
      validation.warnings.push('User preferences not specified');
    } else {
      // Validate preferences
      if (profile.preferences.language && profile.preferences.language !== 'en-AU') {
        validation.warnings.push('Language preference should be en-AU for Australian users');
      }

      if (!profile.preferences.communicationStyle) {
        validation.suggestions.push('Consider setting communication style preference');
      }

      if (!profile.preferences.businessSize) {
        validation.suggestions.push('Business size helps with personalization');
      }
    }

    return validation;
  }

  /**
   * Validate Australian business hours
   */
  static validateBusinessHours(
    hours: { start: string; end: string; timezone?: AustralianTimezone }
  ): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(hours.start)) {
      validation.isValid = false;
      validation.errors.push('Invalid start time format (use HH:MM)');
    }

    if (!timeRegex.test(hours.end)) {
      validation.isValid = false;
      validation.errors.push('Invalid end time format (use HH:MM)');
    }

    if (validation.isValid) {
      const startHour = parseInt(hours.start.split(':')[0]);
      const endHour = parseInt(hours.end.split(':')[0]);
      
      // Check reasonable business hours
      if (startHour < 6 || startHour > 11) {
        validation.warnings.push('Unusual business start time (typical: 7:00-10:00)');
      }

      if (endHour < 15 || endHour > 20) {
        validation.warnings.push('Unusual business end time (typical: 16:00-18:00)');
      }

      if (endHour <= startHour) {
        validation.isValid = false;
        validation.errors.push('End time must be after start time');
      }

      const businessHours = endHour - startHour;
      if (businessHours > 12) {
        validation.warnings.push('Business hours exceed 12 hours');
      } else if (businessHours < 6) {
        validation.warnings.push('Business hours less than 6 hours');
      }
    }

    return validation;
  }

  /**
   * Validate Australian communication settings
   */
  static validateCommunicationSettings(
    settings: Partial<AustralianCommunicationSettings>
  ): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!settings.tone) {
      validation.warnings.push('Communication tone not specified');
    } else {
      const validTones = ['formal', 'casual', 'professional'];
      if (!validTones.includes(settings.tone)) {
        validation.isValid = false;
        validation.errors.push('Invalid communication tone');
      }
    }

    if (!settings.urgency) {
      validation.suggestions.push('Consider setting urgency level');
    } else {
      const validUrgency = ['low', 'medium', 'high'];
      if (!validUrgency.includes(settings.urgency)) {
        validation.isValid = false;
        validation.errors.push('Invalid urgency level');
      }
    }

    if (!settings.businessContext) {
      validation.suggestions.push('Business context helps with message optimization');
    } else {
      const validContexts = ['initial_contact', 'follow_up', 'proposal', 'support', 'partnership'];
      if (!validContexts.includes(settings.businessContext)) {
        validation.isValid = false;
        validation.errors.push('Invalid business context');
      }
    }

    return validation;
  }

  /**
   * Validate Australian business size
   */
  static validateBusinessSize(size: string): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validSizes: AustralianBusinessSize[] = ['startup', 'sme', 'enterprise', 'government'];
    
    if (!validSizes.includes(size as AustralianBusinessSize)) {
      validation.isValid = false;
      validation.errors.push('Invalid business size');
      validation.suggestions.push('Valid sizes: startup, sme, enterprise, government');
    }

    return validation;
  }

  /**
   * Validate email address (Australian context)
   */
  static validateEmailAddress(email: string): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!email) {
      validation.isValid = false;
      validation.errors.push('Email address is required');
      return validation;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      validation.isValid = false;
      validation.errors.push('Invalid email format');
      return validation;
    }

    // Check for Australian domains
    const australianDomains = ['.com.au', '.net.au', '.org.au', '.edu.au', '.gov.au', '.asn.au'];
    const hasAustralianDomain = australianDomains.some(domain => email.toLowerCase().endsWith(domain));
    
    if (hasAustralianDomain) {
      validation.suggestions.push('Australian domain detected');
    } else {
      validation.warnings.push('Consider using .com.au domain for Australian business');
    }

    return validation;
  }

  /**
   * Validate Australian address
   */
  static validateAustralianAddress(address: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  }): AustralianDataValidation {
    const validation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!address.street) {
      validation.isValid = false;
      validation.errors.push('Street address is required');
    }

    if (!address.suburb) {
      validation.isValid = false;
      validation.errors.push('Suburb is required');
    }

    if (!address.state) {
      validation.isValid = false;
      validation.errors.push('State is required');
    } else {
      const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];
      if (!validStates.includes(address.state)) {
        validation.isValid = false;
        validation.errors.push('Invalid Australian state');
      }
    }

    if (!address.postcode) {
      validation.isValid = false;
      validation.errors.push('Postcode is required');
    } else if (address.state) {
      const postcodeValidation = this.validateAustralianPostcode(
        address.postcode, 
        address.state as AustralianState
      );
      if (!postcodeValidation.isValid) {
        validation.errors.push(...postcodeValidation.errors);
      }
      validation.warnings.push(...postcodeValidation.warnings);
    }

    return validation;
  }

  /**
   * Batch validate multiple fields
   */
  static validateBatch(validations: Array<{
    field: string;
    validator: () => AustralianDataValidation;
  }>): AustralianDataValidation {
    const batchValidation: AustralianDataValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    validations.forEach(({ field, validator }) => {
      try {
        const result = validator();
        
        if (!result.isValid) {
          batchValidation.isValid = false;
          batchValidation.errors.push(...result.errors.map(error => `${field}: ${error}`));
        }
        
        batchValidation.warnings.push(...result.warnings.map(warning => `${field}: ${warning}`));
        batchValidation.suggestions.push(...result.suggestions.map(suggestion => `${field}: ${suggestion}`));
      } catch {
        batchValidation.isValid = false;
        batchValidation.errors.push(`${field}: Validation error occurred`);
      }
    });

    return batchValidation;
  }
}

export default AustralianValidators;
