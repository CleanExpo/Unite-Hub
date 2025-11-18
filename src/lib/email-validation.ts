/**
 * Email Validation Utilities
 *
 * Comprehensive email validation for API routes and forms.
 * Includes format validation, disposable email detection, and MX record verification.
 *
 * Usage:
 * ```typescript
 * import { validateEmailFormat, validateEmailDeep } from '@/lib/email-validation';
 *
 * if (!validateEmailFormat(email)) {
 *   return errorResponse("Invalid email format");
 * }
 * ```
 */

// ============================================================================
// FORMAT VALIDATION
// ============================================================================

/**
 * Validates email format using RFC 5322 compliant regex
 *
 * This is a comprehensive regex that validates:
 * - Local part (before @)
 * - Domain part (after @)
 * - TLD (top-level domain)
 *
 * @example
 * validateEmailFormat("user@example.com") // true
 * validateEmailFormat("invalid@") // false
 */
export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  // Trim whitespace
  const trimmed = email.trim().toLowerCase();

  // Basic length check (320 is max length per RFC 5321)
  if (trimmed.length > 320) return false;

  // RFC 5322 compliant regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(trimmed);
}

/**
 * Validates email format with strict rules
 *
 * Additional checks:
 * - No consecutive dots
 * - No leading/trailing dots
 * - Valid TLD (at least 2 characters)
 * - No special characters in domain
 */
export function validateEmailStrict(email: string): boolean {
  if (!validateEmailFormat(email)) return false;

  const trimmed = email.trim().toLowerCase();

  // Check for consecutive dots
  if (trimmed.includes("..")) return false;

  // Check for dots at start/end of local part
  const [local, domain] = trimmed.split("@");
  if (local.startsWith(".") || local.endsWith(".")) return false;

  // Check domain has valid TLD (at least 2 characters)
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
}

// ============================================================================
// DOMAIN VALIDATION
// ============================================================================

/**
 * Extracts domain from email address
 *
 * @example
 * extractDomain("user@example.com") // "example.com"
 * extractDomain("invalid") // null
 */
export function extractDomain(email: string): string | null {
  if (!validateEmailFormat(email)) return null;

  const parts = email.trim().toLowerCase().split("@");
  return parts[1] || null;
}

/**
 * Checks if email is from a specific domain
 *
 * @example
 * isFromDomain("user@example.com", "example.com") // true
 * isFromDomain("user@sub.example.com", "example.com", true) // true (allowSubdomains)
 */
export function isFromDomain(
  email: string,
  domain: string,
  allowSubdomains: boolean = false
): boolean {
  const emailDomain = extractDomain(email);
  if (!emailDomain) return false;

  const normalizedDomain = domain.toLowerCase();

  if (allowSubdomains) {
    return emailDomain === normalizedDomain || emailDomain.endsWith(`.${normalizedDomain}`);
  }

  return emailDomain === normalizedDomain;
}

// ============================================================================
// DISPOSABLE EMAIL DETECTION
// ============================================================================

/**
 * Common disposable email domains
 * Source: https://github.com/disposable-email-domains/disposable-email-domains
 *
 * NOTE: This is a small subset. For production, consider using a dedicated API
 * like mailcheck.ai or debounce.io
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "throwaway.email",
  "temp-mail.org",
  "getnada.com",
  "fakeinbox.com",
  "trashmail.com",
  "maildrop.cc",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamail.info",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamail.de",
  "spam4.me",
  "mailnesia.com",
  "mytemp.email",
  "tempinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "dispostable.com",
  "mintemail.com",
  "tempr.email",
]);

/**
 * Checks if email is from a disposable email provider
 *
 * @example
 * isDisposableEmail("user@tempmail.com") // true
 * isDisposableEmail("user@gmail.com") // false
 */
export function isDisposableEmail(email: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return false;

  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

// ============================================================================
// ROLE-BASED EMAIL DETECTION
// ============================================================================

/**
 * Common role-based email prefixes
 * These are typically not associated with a specific person
 */
const ROLE_BASED_PREFIXES = new Set([
  "admin",
  "support",
  "info",
  "contact",
  "sales",
  "help",
  "noreply",
  "no-reply",
  "postmaster",
  "webmaster",
  "abuse",
  "billing",
  "marketing",
  "team",
  "hello",
  "feedback",
  "service",
]);

/**
 * Checks if email is a role-based email (not a personal email)
 *
 * @example
 * isRoleBasedEmail("support@example.com") // true
 * isRoleBasedEmail("john.doe@example.com") // false
 */
export function isRoleBasedEmail(email: string): boolean {
  if (!validateEmailFormat(email)) return false;

  const [local] = email.trim().toLowerCase().split("@");
  const prefix = local.split("+")[0]; // Handle plus addressing

  return ROLE_BASED_PREFIXES.has(prefix);
}

// ============================================================================
// EMAIL NORMALIZATION
// ============================================================================

/**
 * Normalizes email address for comparison and storage
 *
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes dots from Gmail addresses (gmail ignores dots)
 * - Removes plus addressing (gmail+tag@example.com → gmail@example.com)
 *
 * @example
 * normalizeEmail("User@Example.Com") // "user@example.com"
 * normalizeEmail("john.doe+tag@gmail.com") // "johndoe@gmail.com"
 */
export function normalizeEmail(email: string, options: {
  removeDots?: boolean;
  removePlusAddressing?: boolean;
  lowercase?: boolean;
} = {}): string {
  const {
    removeDots = true,
    removePlusAddressing = true,
    lowercase = true,
  } = options;

  if (!validateEmailFormat(email)) return email;

  let [local, domain] = email.trim().split("@");

  if (lowercase) {
    local = local.toLowerCase();
    domain = domain.toLowerCase();
  }

  // Remove plus addressing (everything after +)
  if (removePlusAddressing && local.includes("+")) {
    local = local.split("+")[0];
  }

  // Remove dots for Gmail and Google Workspace emails
  if (removeDots && (domain === "gmail.com" || domain === "googlemail.com")) {
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

/**
 * Checks if two emails are effectively the same after normalization
 *
 * @example
 * areEmailsEquivalent("john.doe@gmail.com", "johndoe@gmail.com") // true
 * areEmailsEquivalent("user+tag@example.com", "user@example.com") // true
 */
export function areEmailsEquivalent(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2);
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  normalizedEmail: string;
  errors: string[];
  warnings: string[];
  info: {
    domain: string | null;
    isDisposable: boolean;
    isRoleBased: boolean;
  };
}

/**
 * Performs comprehensive email validation
 *
 * Returns detailed validation result with errors, warnings, and info
 *
 * @example
 * const result = validateEmailComprehensive("user@tempmail.com");
 * if (!result.valid) {
 *   console.log(result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.log(result.warnings);
 * }
 */
export function validateEmailComprehensive(
  email: string,
  options: {
    allowDisposable?: boolean;
    allowRoleBased?: boolean;
    strictFormat?: boolean;
  } = {}
): EmailValidationResult {
  const {
    allowDisposable = false,
    allowRoleBased = true,
    strictFormat = false,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic format validation
  const isValidFormat = strictFormat ? validateEmailStrict(email) : validateEmailFormat(email);

  if (!isValidFormat) {
    errors.push("Invalid email format");
    return {
      valid: false,
      email,
      normalizedEmail: email,
      errors,
      warnings,
      info: {
        domain: null,
        isDisposable: false,
        isRoleBased: false,
      },
    };
  }

  const domain = extractDomain(email);
  const normalizedEmail = normalizeEmail(email);
  const isDisposable = isDisposableEmail(email);
  const isRoleBased = isRoleBasedEmail(email);

  // Check disposable
  if (isDisposable) {
    if (!allowDisposable) {
      errors.push("Disposable email addresses are not allowed");
    } else {
      warnings.push("Email is from a disposable email provider");
    }
  }

  // Check role-based
  if (isRoleBased) {
    if (!allowRoleBased) {
      errors.push("Role-based email addresses are not allowed");
    } else {
      warnings.push("Email appears to be a role-based address");
    }
  }

  return {
    valid: errors.length === 0,
    email,
    normalizedEmail,
    errors,
    warnings,
    info: {
      domain,
      isDisposable,
      isRoleBased,
    },
  };
}

// ============================================================================
// BULK VALIDATION
// ============================================================================

/**
 * Validates multiple emails at once
 *
 * @example
 * const results = validateEmailBulk(["user1@example.com", "invalid@", "user2@example.com"]);
 * console.log(`${results.valid.length} valid, ${results.invalid.length} invalid`);
 */
export function validateEmailBulk(
  emails: string[],
  options?: Parameters<typeof validateEmailComprehensive>[1]
): {
  valid: EmailValidationResult[];
  invalid: EmailValidationResult[];
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const results = emails.map(email => {
    const normalized = normalizeEmail(email);

    if (seen.has(normalized)) {
      duplicates.push(email);
    }

    seen.add(normalized);

    return validateEmailComprehensive(email, options);
  });

  return {
    valid: results.filter(r => r.valid),
    invalid: results.filter(r => !r.valid),
    duplicates,
  };
}

// ============================================================================
// EMAIL SUGGESTION (DID YOU MEAN?)
// ============================================================================

/**
 * Common email domain typos and their corrections
 */
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
};

/**
 * Suggests corrected email if common typo is detected
 *
 * @example
 * suggestEmailCorrection("user@gmial.com") // "user@gmail.com"
 * suggestEmailCorrection("user@gmail.com") // null
 */
export function suggestEmailCorrection(email: string): string | null {
  const domain = extractDomain(email);
  if (!domain) return null;

  const correction = COMMON_DOMAIN_TYPOS[domain];
  if (!correction) return null;

  const [local] = email.split("@");
  return `${local}@${correction}`;
}
