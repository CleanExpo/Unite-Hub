/**
 * Australian Context Utilities
 *
 * Provides formatting functions for Australian locale (en-AU).
 * All functions enforce Australian defaults:
 * - Dates: DD/MM/YYYY
 * - Currency: AUD with proper formatting
 * - Phone: 04XX XXX XXX (mobile), (0X) XXXX XXXX (landline)
 * - ABN: 11 digits with validation
 */

/**
 * Format date in Australian DD/MM/YYYY format
 * @param date - Date to format
 * @returns Formatted date string (e.g., "05/01/2025")
 */
export function formatDateAU(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format date with time in Australian format
 * @param date - Date to format
 * @returns Formatted datetime string (e.g., "05/01/2025, 2:30 pm")
 */
export function formatDateTimeAU(date: Date): string {
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format currency in AUD with proper Australian formatting
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrencyAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate GST (10% in Australia)
 * @param amount - Amount excluding GST
 * @returns GST amount
 */
export function calculateGST(amount: number): number {
  return amount * 0.10;
}

/**
 * Calculate total including GST
 * @param amount - Amount excluding GST
 * @returns Total including GST
 */
export function calculateTotalWithGST(amount: number): number {
  return amount + calculateGST(amount);
}

/**
 * Format phone number in Australian format
 * @param phone - Phone number (with or without spaces)
 * @returns Formatted phone string
 *
 * Mobile: 0412 345 678
 * Landline: (02) 1234 5678
 */
export function formatPhoneAU(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Mobile: 04XX XXX XXX
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Landline: (0X) XXXX XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }

  // Return as-is if format not recognized
  return phone;
}

/**
 * Validate Australian mobile phone number
 * @param phone - Phone number to validate
 * @returns true if valid Australian mobile format
 */
export function isValidAustralianMobile(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^04\d{8}$/.test(cleaned);
}

/**
 * Validate Australian landline phone number
 * @param phone - Phone number to validate
 * @returns true if valid Australian landline format
 */
export function isValidAustralianLandline(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^0[2-8]\d{8}$/.test(cleaned);
}

/**
 * Validate Australian phone number (mobile or landline)
 * @param phone - Phone number to validate
 * @returns true if valid Australian phone format
 */
export function isValidAustralianPhone(phone: string): boolean {
  return isValidAustralianMobile(phone) || isValidAustralianLandline(phone);
}

/**
 * Format Australian postcode
 * @param postcode - Postcode (3 or 4 digits)
 * @returns Formatted 4-digit postcode
 */
export function formatPostcode(postcode: string | number): string {
  const code = postcode.toString().padStart(4, '0');
  return code.slice(0, 4);
}

/**
 * Validate Australian postcode
 * @param postcode - Postcode to validate
 * @returns true if valid (4 digits)
 */
export function isValidPostcode(postcode: string | number): boolean {
  const code = postcode.toString();
  return /^\d{4}$/.test(code);
}

/**
 * Get Australian state name from code
 * @param code - State code (QLD, NSW, etc.)
 * @returns Full state name
 */
export function getStateName(code: string): string {
  const states: Record<string, string> = {
    QLD: 'Queensland',
    NSW: 'New South Wales',
    VIC: 'Victoria',
    SA: 'South Australia',
    WA: 'Western Australia',
    TAS: 'Tasmania',
    NT: 'Northern Territory',
    ACT: 'Australian Capital Territory'
  };

  return states[code.toUpperCase()] || code;
}

/**
 * Get Australian timezone for state
 * @param state - State code
 * @returns IANA timezone string
 */
export function getAustralianTimezone(state: string): string {
  const timezones: Record<string, string> = {
    QLD: 'Australia/Brisbane',
    NSW: 'Australia/Sydney',
    VIC: 'Australia/Melbourne',
    SA: 'Australia/Adelaide',
    WA: 'Australia/Perth',
    TAS: 'Australia/Hobart',
    NT: 'Australia/Darwin',
    ACT: 'Australia/Sydney'
  };

  return timezones[state.toUpperCase()] || 'Australia/Brisbane';
}

/**
 * Format ABN (Australian Business Number)
 * @param abn - ABN as string or number
 * @returns Formatted ABN (XX XXX XXX XXX)
 */
export function formatABN(abn: string | number): string {
  const cleaned = abn.toString().replace(/\s/g, '');

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return cleaned;
}

/**
 * Validate ABN (Australian Business Number) with checksum
 * @param abn - ABN to validate
 * @returns true if valid ABN
 */
export function validateABN(abn: string | number): boolean {
  const cleaned = abn.toString().replace(/\s/g, '');

  // Must be 11 digits
  if (cleaned.length !== 11 || !/^\d+$/.test(cleaned)) {
    return false;
  }

  // ABN checksum validation
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);

  // Subtract 1 from first digit
  digits[0] -= 1;

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);

  // Valid if sum is divisible by 89
  return sum % 89 === 0;
}

/**
 * Format ACN (Australian Company Number)
 * @param acn - ACN as string or number
 * @returns Formatted ACN (XXX XXX XXX)
 */
export function formatACN(acn: string | number): string {
  const cleaned = acn.toString().replace(/\s/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return cleaned;
}

/**
 * Validate ACN (Australian Company Number)
 * @param acn - ACN to validate
 * @returns true if valid (9 digits)
 */
export function validateACN(acn: string | number): boolean {
  const cleaned = acn.toString().replace(/\s/g, '');
  return /^\d{9}$/.test(cleaned);
}

/**
 * Format full Australian address
 * @param address - Address components
 * @returns Formatted address string
 */
export function formatAustralianAddress({
  street,
  suburb,
  state,
  postcode
}: {
  street: string;
  suburb: string;
  state: string;
  postcode: string | number;
}): string {
  return `${street}, ${suburb} ${state.toUpperCase()} ${formatPostcode(postcode)}`;
}
