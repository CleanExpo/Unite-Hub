/**
 * Contact Verification Agent - V1.3
 * Task-007: Verification System - Phased Implementation
 *
 * Verifies contact information:
 * - Email: format, domain existence, disposable check
 * - Phone: Australian format validation and normalization
 * - ABN: Format validation and ABR lookup
 */

import {
  VerificationResult,
  ContactValidationResult,
  VerificationError,
} from './types';

// ============================================================================
// Disposable Email Domains (commonly used for spam/throwaway)
// ============================================================================

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'yopmail.com',
  'sharklasers.com',
  'discard.email',
  'mailnesia.com',
  'tempail.com',
  'throwawaymail.com',
  'emailondeck.com',
  'tempr.email',
  'spamgourmet.com',
  'mytemp.email',
]);

// ============================================================================
// Phone Validation Patterns
// ============================================================================

// Australian mobile: 04XX XXX XXX
const AU_MOBILE_REGEX = /^(?:\+61|0)4\d{8}$/;

// Australian landline: (0X) XXXX XXXX
const AU_LANDLINE_REGEX = /^(?:\+61|0)[2-9]\d{8}$/;

// ============================================================================
// Email Validation
// ============================================================================

interface EmailValidation {
  valid: boolean;
  format_valid: boolean;
  domain_exists: boolean;
  is_disposable: boolean;
  message?: string;
}

/**
 * Validate email format
 */
function validateEmailFormat(email: string): boolean {
  // RFC 5322 simplified
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain is disposable
 */
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
return false;
}
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Check if domain has MX records (async DNS lookup)
 */
async function checkDomainExists(domain: string): Promise<boolean> {
  try {
    // In browser environment, we can't do DNS lookups directly
    // Use a simple fetch to check if domain resolves
    // In production, this would be a server-side check
    if (typeof window !== 'undefined') {
      // Client-side: assume domain exists if format is valid
      return true;
    }

    // Server-side: use DNS lookup
    const dns = await import('dns').then((m) => m.promises);
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    // If DNS lookup fails, assume domain doesn't exist
    return false;
  }
}

/**
 * Full email validation
 */
async function validateEmail(email: string): Promise<EmailValidation> {
  const trimmed = email.trim().toLowerCase();

  // Check format
  const formatValid = validateEmailFormat(trimmed);
  if (!formatValid) {
    return {
      valid: false,
      format_valid: false,
      domain_exists: false,
      is_disposable: false,
      message: 'Invalid email format',
    };
  }

  // Check disposable
  const isDisposable = isDisposableEmail(trimmed);
  if (isDisposable) {
    return {
      valid: false,
      format_valid: true,
      domain_exists: true, // Disposable domains exist
      is_disposable: true,
      message: 'Disposable email addresses are not allowed',
    };
  }

  // Check domain exists
  const domain = trimmed.split('@')[1];
  const domainExists = await checkDomainExists(domain);

  if (!domainExists) {
    return {
      valid: false,
      format_valid: true,
      domain_exists: false,
      is_disposable: false,
      message: `Email domain '${domain}' does not appear to exist`,
    };
  }

  return {
    valid: true,
    format_valid: true,
    domain_exists: true,
    is_disposable: false,
  };
}

// ============================================================================
// Phone Validation
// ============================================================================

interface PhoneValidation {
  valid: boolean;
  format_valid: boolean;
  formatted: string;
  type: 'mobile' | 'landline' | 'unknown';
  message?: string;
}

/**
 * Normalize and validate Australian phone number
 */
function validatePhone(phone: string): PhoneValidation {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Convert +61 to 0
  const normalized = cleaned.startsWith('+61')
    ? '0' + cleaned.slice(3)
    : cleaned.startsWith('61') && cleaned.length === 11
      ? '0' + cleaned.slice(2)
      : cleaned;

  // Check if valid length
  if (normalized.length !== 10) {
    return {
      valid: false,
      format_valid: false,
      formatted: phone,
      type: 'unknown',
      message: 'Australian phone numbers must be 10 digits',
    };
  }

  // Check mobile
  if (AU_MOBILE_REGEX.test(normalized)) {
    const formatted = `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
    return {
      valid: true,
      format_valid: true,
      formatted,
      type: 'mobile',
    };
  }

  // Check landline
  if (AU_LANDLINE_REGEX.test(normalized)) {
    const formatted = `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)} ${normalized.slice(6)}`;
    return {
      valid: true,
      format_valid: true,
      formatted,
      type: 'landline',
    };
  }

  return {
    valid: false,
    format_valid: false,
    formatted: phone,
    type: 'unknown',
    message: 'Invalid Australian phone number. Use 04XX XXX XXX (mobile) or (0X) XXXX XXXX (landline)',
  };
}

// ============================================================================
// ABN Validation
// ============================================================================

interface ABNValidation {
  valid: boolean;
  format_valid: boolean;
  verified: boolean;
  business_name?: string;
  message?: string;
}

/**
 * Validate ABN format (11 digits with checksum)
 */
function validateABNFormat(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // ABN checksum algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map((d) => parseInt(d, 10));

  // Subtract 1 from first digit
  digits[0] -= 1;

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, idx) => acc + digit * weights[idx], 0);

  return sum % 89 === 0;
}

// formatABN function available if needed for ABN display formatting

/**
 * Lookup ABN via ABR API
 * Note: In production, this would call the actual ABR API
 * https://abr.business.gov.au/abrxmlsearch/
 */
async function lookupABN(abn: string): Promise<{ verified: boolean; business_name?: string }> {
  const cleaned = abn.replace(/\s/g, '');

  // Check if ABR API key is available
  const abrGuid = process.env.ABR_GUID;

  if (!abrGuid) {
    // No API key - can only do format validation
    return { verified: false };
  }

  try {
    // ABR XML Search API
    const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN?searchString=${cleaned}&includeHistoricalDetails=N&authenticationGuid=${abrGuid}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('ABR API error:', response.status);
      return { verified: false };
    }

    const xml = await response.text();

    // Parse XML response (simplified - in production use proper XML parser)
    if (xml.includes('<entityStatusCode>Active</entityStatusCode>')) {
      // Extract business name
      const nameMatch = xml.match(/<mainName[^>]*>([^<]+)<\/mainName>/i);
      const businessName = nameMatch ? nameMatch[1] : undefined;

      return {
        verified: true,
        business_name: businessName,
      };
    }

    return { verified: false };
  } catch (error) {
    console.error('ABR lookup error:', error);
    return { verified: false };
  }
}

/**
 * Full ABN validation
 */
async function validateABN(abn: string): Promise<ABNValidation> {
  const cleaned = abn.replace(/\s/g, '');

  // Check format first
  if (!validateABNFormat(cleaned)) {
    return {
      valid: false,
      format_valid: false,
      verified: false,
      message: 'Invalid ABN format. Must be 11 digits with valid checksum.',
    };
  }

  // Try ABR lookup
  const lookup = await lookupABN(cleaned);

  return {
    valid: lookup.verified || true, // Format is valid even if not verified
    format_valid: true,
    verified: lookup.verified,
    business_name: lookup.business_name,
    message: lookup.verified
      ? undefined
      : lookup.business_name
        ? undefined
        : 'ABN format is valid but could not be verified with ABR',
  };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate contact information (email, phone, optional ABN)
 */
export async function validateContact(
  contact: {
    email: string;
    phone: string;
    abn?: string;
  },
  options: {
    require_abn?: boolean;
    strict_email?: boolean;
  } = {}
): Promise<VerificationResult<ContactValidationResult>> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate email
  const emailResult = await validateEmail(contact.email);

  if (!emailResult.valid) {
    errors.push({
      code: 'INVALID_EMAIL',
      field: 'email',
      message: emailResult.message || 'Invalid email',
      severity: emailResult.is_disposable ? 'error' : 'critical',
    });
  }

  if (options.strict_email && emailResult.valid && !emailResult.domain_exists) {
    errors.push({
      code: 'EMAIL_DOMAIN_NOT_FOUND',
      field: 'email',
      message: 'Email domain could not be verified',
      severity: 'warning',
    });
  }

  // Validate phone
  const phoneResult = validatePhone(contact.phone);

  if (!phoneResult.valid) {
    errors.push({
      code: 'INVALID_PHONE',
      field: 'phone',
      message: phoneResult.message || 'Invalid phone number',
      severity: 'error',
    });
    suggestions.push('Australian phone formats: 04XX XXX XXX (mobile) or (0X) XXXX XXXX (landline)');
  }

  // Validate ABN (if provided or required)
  let abnResult: ABNValidation | undefined;

  if (contact.abn) {
    abnResult = await validateABN(contact.abn);

    if (!abnResult.format_valid) {
      errors.push({
        code: 'INVALID_ABN',
        field: 'abn',
        message: abnResult.message || 'Invalid ABN',
        severity: 'error',
      });
    } else if (!abnResult.verified) {
      warnings.push('ABN could not be verified with ABR. Please ensure it is correct.');
    }
  } else if (options.require_abn) {
    errors.push({
      code: 'MISSING_ABN',
      field: 'abn',
      message: 'ABN is required',
      severity: 'error',
    });
  }

  // Build result
  const overallValid =
    emailResult.valid &&
    phoneResult.valid &&
    (!options.require_abn || (contact.abn && abnResult?.format_valid));

  const result: ContactValidationResult = {
    email: emailResult,
    phone: phoneResult,
    abn: abnResult
      ? {
          valid: abnResult.valid,
          format_valid: abnResult.format_valid,
          verified: abnResult.verified,
          business_name: abnResult.business_name,
          message: abnResult.message,
        }
      : undefined,
    overall_valid: overallValid,
  };

  return {
    status: overallValid ? 'passed' : errors.some((e) => e.severity === 'critical') ? 'failed' : 'warning',
    passed: overallValid,
    message: overallValid
      ? 'Contact information validated successfully'
      : errors[0]?.message || 'Contact validation failed',
    data: result,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Quick contact validation (format only, no async checks)
 */
export function quickValidateContact(contact: {
  email: string;
  phone: string;
  abn?: string;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Email format check
  if (!validateEmailFormat(contact.email)) {
    issues.push('Invalid email format');
  }

  // Phone format check
  const phoneResult = validatePhone(contact.phone);
  if (!phoneResult.valid) {
    issues.push('Invalid phone format');
  }

  // ABN format check
  if (contact.abn && !validateABNFormat(contact.abn)) {
    issues.push('Invalid ABN format');
  }

  return { valid: issues.length === 0, issues };
}

export default {
  validateContact,
  quickValidateContact,
};
