/**
 * Claim Information Validator - V1.2
 * Task-007: Verification System - Phased Implementation
 *
 * Validates claim data with Australian-specific rules:
 * - Phone formats (04XX XXX XXX mobile, landline patterns)
 * - Postcodes (4-digit with state validation)
 * - ABN validation (11-digit with checksum)
 * - Date validation (not future, not >2 years old)
 * - Required field validation
 */

import { z } from 'zod';
import {
  VerificationResult,
  ClaimData,
  ClaimValidationResult,
  AustralianState,
  PropertyType,
  DamageType,
  VerificationError,
} from './types';

// ============================================================================
// Australian-Specific Validation Patterns
// ============================================================================

// Australian mobile: 04XX XXX XXX or 04XXXXXXXX
const MOBILE_REGEX = /^(?:\+61|0)4\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;

// Australian landline: (0X) XXXX XXXX or 0X XXXX XXXX
const LANDLINE_REGEX = /^(?:\+61|0)[2-9]\d{1}[\s-]?\d{4}[\s-]?\d{4}$/;

// Australian postcode: 4 digits
const POSTCODE_REGEX = /^\d{4}$/;

// Email regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ABN: 11 digits
const ABN_REGEX = /^\d{11}$/;

// State postcode ranges
const STATE_POSTCODE_RANGES: Record<AustralianState, [number, number][]> = {
  NSW: [[1000, 2599], [2619, 2899], [2921, 2999]],
  VIC: [[3000, 3999], [8000, 8999]],
  QLD: [[4000, 4999], [9000, 9999]],
  SA: [[5000, 5799], [5800, 5999]],
  WA: [[6000, 6797], [6800, 6999]],
  TAS: [[7000, 7799], [7800, 7999]],
  NT: [[800, 899], [900, 999]],
  ACT: [[200, 299], [2600, 2618], [2900, 2920]],
};

const VALID_STATES: AustralianState[] = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

const VALID_PROPERTY_TYPES: PropertyType[] = [
  'residential_house',
  'residential_unit',
  'commercial',
  'industrial',
  'retail',
  'other',
];

const VALID_DAMAGE_TYPES: DamageType[] = [
  'water',
  'fire',
  'mould',
  'structural',
  'biohazard',
  'storm',
  'unknown',
  'none',
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate and format Australian phone number
 */
function validatePhone(phone: string): {
  valid: boolean;
  formatted: string;
  type: 'mobile' | 'landline' | 'unknown';
  message?: string;
} {
  // Remove all whitespace and dashes for processing
  const cleaned = phone.replace(/[\s-]/g, '');

  // Check mobile
  if (MOBILE_REGEX.test(phone) || /^(?:\+61|0)4\d{8}$/.test(cleaned)) {
    // Format as 04XX XXX XXX
    const digits = cleaned.replace(/^\+61/, '0');
    const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    return { valid: true, formatted, type: 'mobile' };
  }

  // Check landline
  if (LANDLINE_REGEX.test(phone) || /^(?:\+61|0)[2-9]\d{8}$/.test(cleaned)) {
    // Format as (0X) XXXX XXXX
    const digits = cleaned.replace(/^\+61/, '0');
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`;
    return { valid: true, formatted, type: 'landline' };
  }

  return {
    valid: false,
    formatted: phone,
    type: 'unknown',
    message: 'Invalid Australian phone number format. Use 04XX XXX XXX for mobile or (0X) XXXX XXXX for landline.',
  };
}

/**
 * Validate email address
 */
function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Check for common typos
  const domain = email.split('@')[1]?.toLowerCase();
  const typoWarnings: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };

  if (domain && typoWarnings[domain]) {
    return {
      valid: true,
      message: `Did you mean ${typoWarnings[domain]}?`,
    };
  }

  return { valid: true };
}

/**
 * Validate Australian postcode and check state match
 */
function validatePostcode(
  postcode: string,
  state: AustralianState
): { valid: boolean; message?: string } {
  if (!POSTCODE_REGEX.test(postcode)) {
    return { valid: false, message: 'Postcode must be 4 digits' };
  }

  const postcodeNum = parseInt(postcode, 10);
  const ranges = STATE_POSTCODE_RANGES[state];

  if (!ranges) {
    return { valid: false, message: `Invalid state: ${state}` };
  }

  const matchesState = ranges.some(([min, max]) => postcodeNum >= min && postcodeNum <= max);

  if (!matchesState) {
    // Find which state this postcode belongs to
    for (const [validState, stateRanges] of Object.entries(STATE_POSTCODE_RANGES)) {
      if (stateRanges.some(([min, max]) => postcodeNum >= min && postcodeNum <= max)) {
        return {
          valid: false,
          message: `Postcode ${postcode} appears to be in ${validState}, not ${state}`,
        };
      }
    }
    return { valid: false, message: `Postcode ${postcode} is not valid for ${state}` };
  }

  return { valid: true };
}

/**
 * Validate ABN with checksum
 */
function validateABN(abn: string): { valid: boolean; message?: string } {
  // Remove spaces
  const cleaned = abn.replace(/\s/g, '');

  if (!ABN_REGEX.test(cleaned)) {
    return { valid: false, message: 'ABN must be 11 digits' };
  }

  // ABN checksum algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map((d) => parseInt(d, 10));

  // Subtract 1 from first digit
  digits[0] -= 1;

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, idx) => acc + digit * weights[idx], 0);

  if (sum % 89 !== 0) {
    return { valid: false, message: 'Invalid ABN checksum' };
  }

  return { valid: true };
}

/**
 * Validate date of loss
 */
function validateDateOfLoss(dateStr: string): { valid: boolean; message?: string; formatted?: string } {
  const date = new Date(dateStr);
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' };
  }

  if (date > now) {
    return { valid: false, message: 'Date of loss cannot be in the future' };
  }

  if (date < twoYearsAgo) {
    return {
      valid: false,
      message: 'Date of loss is more than 2 years ago. Most insurance claims must be lodged within 2 years.',
    };
  }

  return {
    valid: true,
    formatted: date.toISOString().split('T')[0],
  };
}

/**
 * Validate a simple name (contact name)
 */
function validateName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 100) {
    return { valid: false, message: 'Name is too long (max 100 characters)' };
  }

  // Check for obviously invalid patterns
  if (/^\d+$/.test(name.trim())) {
    return { valid: false, message: 'Name cannot be only numbers' };
  }

  return { valid: true };
}

/**
 * Validate address
 */
function validateAddress(address: string): { valid: boolean; message?: string } {
  if (!address || address.trim().length < 5) {
    return { valid: false, message: 'Address must be at least 5 characters' };
  }

  if (address.trim().length > 200) {
    return { valid: false, message: 'Address is too long (max 200 characters)' };
  }

  return { valid: true };
}

// ============================================================================
// Zod Schema
// ============================================================================

const ClaimDataSchema = z.object({
  // Contact
  contact_name: z.string().min(2, 'Name must be at least 2 characters'),
  contact_email: z.string().email('Invalid email format'),
  contact_phone: z.string().min(8, 'Phone number too short'),

  // Property
  property_address: z.string().min(5, 'Address must be at least 5 characters'),
  property_suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  property_state: z.enum(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT']),
  property_postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits'),
  property_type: z.enum([
    'residential_house',
    'residential_unit',
    'commercial',
    'industrial',
    'retail',
    'other',
  ]),

  // Claim Details
  date_of_loss: z.string(),
  date_reported: z.string().optional(),
  damage_type: z.enum(['water', 'fire', 'mould', 'structural', 'biohazard', 'storm', 'unknown', 'none']),
  damage_description: z.string().optional(),

  // Optional
  insurance_company: z.string().optional(),
  claim_number: z.string().optional(),
  policy_number: z.string().optional(),
  abn: z.string().optional(),
});

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate claim data with comprehensive Australian-specific checks
 */
export function validateClaimData(
  data: Partial<ClaimData>,
  options: {
    strict_mode?: boolean;
    require_abn_for_commercial?: boolean;
  } = {}
): VerificationResult<ClaimValidationResult> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const fieldValidations: ClaimValidationResult['field_validations'] = {};
  const missingFields: (keyof ClaimData)[] = [];
  const invalidFields: (keyof ClaimData)[] = [];
  const formattedData: Partial<ClaimData> = {};

  // Required fields
  const requiredFields: (keyof ClaimData)[] = [
    'contact_name',
    'contact_email',
    'contact_phone',
    'property_address',
    'property_suburb',
    'property_state',
    'property_postcode',
    'property_type',
    'date_of_loss',
    'damage_type',
  ];

  // Check for missing required fields
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
      fieldValidations[field] = {
        valid: false,
        message: `${field.replace(/_/g, ' ')} is required`,
      };
    }
  }

  if (missingFields.length > 0) {
    errors.push({
      code: 'MISSING_REQUIRED_FIELDS',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      severity: 'critical',
    });
  }

  // Validate contact_name
  if (data.contact_name) {
    const nameResult = validateName(data.contact_name);
    fieldValidations.contact_name = {
      valid: nameResult.valid,
      message: nameResult.message,
      formatted_value: data.contact_name.trim(),
    };
    if (nameResult.valid) {
      formattedData.contact_name = data.contact_name.trim();
    } else {
      invalidFields.push('contact_name');
    }
  }

  // Validate contact_email
  if (data.contact_email) {
    const emailResult = validateEmail(data.contact_email);
    fieldValidations.contact_email = {
      valid: emailResult.valid,
      message: emailResult.message,
      formatted_value: data.contact_email.toLowerCase().trim(),
    };
    if (emailResult.valid) {
      formattedData.contact_email = data.contact_email.toLowerCase().trim();
      if (emailResult.message) {
        warnings.push(emailResult.message);
      }
    } else {
      invalidFields.push('contact_email');
    }
  }

  // Validate contact_phone
  if (data.contact_phone) {
    const phoneResult = validatePhone(data.contact_phone);
    fieldValidations.contact_phone = {
      valid: phoneResult.valid,
      message: phoneResult.message,
      formatted_value: phoneResult.formatted,
    };
    if (phoneResult.valid) {
      formattedData.contact_phone = phoneResult.formatted;
    } else {
      invalidFields.push('contact_phone');
      suggestions.push('Australian phone format: 04XX XXX XXX (mobile) or (0X) XXXX XXXX (landline)');
    }
  }

  // Validate property_address
  if (data.property_address) {
    const addressResult = validateAddress(data.property_address);
    fieldValidations.property_address = {
      valid: addressResult.valid,
      message: addressResult.message,
      formatted_value: data.property_address.trim(),
    };
    if (addressResult.valid) {
      formattedData.property_address = data.property_address.trim();
    } else {
      invalidFields.push('property_address');
    }
  }

  // Validate property_suburb
  if (data.property_suburb) {
    const suburbValid = data.property_suburb.trim().length >= 2;
    fieldValidations.property_suburb = {
      valid: suburbValid,
      message: suburbValid ? undefined : 'Suburb must be at least 2 characters',
      formatted_value: data.property_suburb.trim().toUpperCase(),
    };
    if (suburbValid) {
      formattedData.property_suburb = data.property_suburb.trim().toUpperCase();
    } else {
      invalidFields.push('property_suburb');
    }
  }

  // Validate property_state
  if (data.property_state) {
    const stateValid = VALID_STATES.includes(data.property_state);
    fieldValidations.property_state = {
      valid: stateValid,
      message: stateValid ? undefined : `Invalid state. Must be one of: ${VALID_STATES.join(', ')}`,
    };
    if (stateValid) {
      formattedData.property_state = data.property_state;
    } else {
      invalidFields.push('property_state');
    }
  }

  // Validate property_postcode (with state match)
  if (data.property_postcode && data.property_state && VALID_STATES.includes(data.property_state)) {
    const postcodeResult = validatePostcode(data.property_postcode, data.property_state);
    fieldValidations.property_postcode = {
      valid: postcodeResult.valid,
      message: postcodeResult.message,
      formatted_value: data.property_postcode,
    };
    if (postcodeResult.valid) {
      formattedData.property_postcode = data.property_postcode;
    } else {
      invalidFields.push('property_postcode');
    }
  } else if (data.property_postcode) {
    const basicValid = POSTCODE_REGEX.test(data.property_postcode);
    fieldValidations.property_postcode = {
      valid: basicValid,
      message: basicValid ? 'Cannot verify state match without valid state' : 'Postcode must be 4 digits',
    };
    if (!basicValid) {
      invalidFields.push('property_postcode');
    }
  }

  // Validate property_type
  if (data.property_type) {
    const typeValid = VALID_PROPERTY_TYPES.includes(data.property_type);
    fieldValidations.property_type = {
      valid: typeValid,
      message: typeValid ? undefined : `Invalid property type`,
    };
    if (typeValid) {
      formattedData.property_type = data.property_type;
    } else {
      invalidFields.push('property_type');
    }
  }

  // Validate date_of_loss
  if (data.date_of_loss) {
    const dateResult = validateDateOfLoss(data.date_of_loss);
    fieldValidations.date_of_loss = {
      valid: dateResult.valid,
      message: dateResult.message,
      formatted_value: dateResult.formatted,
    };
    if (dateResult.valid) {
      formattedData.date_of_loss = dateResult.formatted;
    } else {
      invalidFields.push('date_of_loss');
      if (dateResult.message?.includes('2 years')) {
        suggestions.push('For claims older than 2 years, contact your insurance provider directly');
      }
    }
  }

  // Validate damage_type
  if (data.damage_type) {
    const damageValid = VALID_DAMAGE_TYPES.includes(data.damage_type);
    fieldValidations.damage_type = {
      valid: damageValid,
      message: damageValid ? undefined : `Invalid damage type`,
    };
    if (damageValid) {
      formattedData.damage_type = data.damage_type;
    } else {
      invalidFields.push('damage_type');
    }
  }

  // Validate ABN (if provided or required for commercial)
  if (data.abn) {
    const abnResult = validateABN(data.abn);
    fieldValidations.abn = {
      valid: abnResult.valid,
      message: abnResult.message,
      formatted_value: data.abn.replace(/\s/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4'),
    };
    if (abnResult.valid) {
      formattedData.abn = data.abn.replace(/\s/g, '');
    } else {
      invalidFields.push('abn');
    }
  } else if (
    options.require_abn_for_commercial &&
    data.property_type &&
    ['commercial', 'industrial', 'retail'].includes(data.property_type)
  ) {
    missingFields.push('abn');
    fieldValidations.abn = {
      valid: false,
      message: 'ABN is required for commercial properties',
    };
    warnings.push('ABN is required for commercial, industrial, and retail properties');
  }

  // Add errors for invalid fields
  if (invalidFields.length > 0 && missingFields.length === 0) {
    errors.push({
      code: 'INVALID_FIELD_VALUES',
      message: `Invalid values in fields: ${invalidFields.join(', ')}`,
      severity: 'error',
    });
  }

  // Build result
  const isValid = missingFields.length === 0 && invalidFields.length === 0;

  const result: ClaimValidationResult = {
    is_valid: isValid,
    field_validations: fieldValidations,
    missing_fields: missingFields,
    invalid_fields: invalidFields,
    warnings,
    formatted_data: Object.keys(formattedData).length > 0 ? formattedData : undefined,
  };

  return {
    status: isValid ? 'passed' : errors.some((e) => e.severity === 'critical') ? 'failed' : 'warning',
    passed: isValid,
    message: isValid
      ? 'Claim data validated successfully'
      : missingFields.length > 0
        ? `Missing required fields: ${missingFields.join(', ')}`
        : `Invalid field values: ${invalidFields.join(', ')}`,
    data: result,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Quick validation (required fields only, no formatting)
 */
export function quickValidateClaim(data: Partial<ClaimData>): { valid: boolean; missing: string[] } {
  const requiredFields: (keyof ClaimData)[] = [
    'contact_name',
    'contact_email',
    'contact_phone',
    'property_address',
    'property_state',
    'property_postcode',
    'date_of_loss',
    'damage_type',
  ];

  const missing = requiredFields.filter(
    (field) => !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );

  return { valid: missing.length === 0, missing };
}

/**
 * Format claim data for display
 */
export function formatClaimData(data: ClaimData): ClaimData {
  const result = validateClaimData(data);
  if (result.data?.formatted_data) {
    return { ...data, ...result.data.formatted_data };
  }
  return data;
}

export default {
  validateClaimData,
  quickValidateClaim,
  formatClaimData,
};
