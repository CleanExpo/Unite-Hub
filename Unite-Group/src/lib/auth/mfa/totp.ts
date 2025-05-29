/**
 * Time-based One-Time Password (TOTP) implementation for multi-factor authentication
 * Based on RFC 6238 (TOTP) and RFC 4226 (HOTP)
 */

import * as crypto from 'crypto';

// Default settings based on RFC recommendations
const DEFAULT_ALGORITHM = 'sha1';
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30; // seconds
const DEFAULT_WINDOW = 1; // 1 step before and after current time

/**
 * Generate a secret key for TOTP
 * @param length The length of the secret key in bytes (default: 20 bytes / 160 bits as recommended)
 * @returns Base32 encoded secret key
 */
export function generateSecret(length: number = 20): string {
  const randomBytes = crypto.randomBytes(length);
  return base32Encode(randomBytes);
}

/**
 * Generate a TOTP code based on the secret and current time
 * @param secret Base32 encoded secret key
 * @param options Configuration options
 * @returns The generated TOTP code
 */
export function generateTOTP(
  secret: string,
  options: {
    algorithm?: string;
    digits?: number;
    period?: number;
    timestamp?: number;
  } = {}
): string {
  const { 
    algorithm = DEFAULT_ALGORITHM, 
    digits = DEFAULT_DIGITS, 
    period = DEFAULT_PERIOD,
    timestamp = Math.floor(Date.now() / 1000)
  } = options;
  
  // Calculate the counter value (number of time steps since Unix epoch)
  const counter = Math.floor(timestamp / period);
  
  return generateHOTP(secret, counter, algorithm, digits);
}

/**
 * Validate a TOTP code against the secret
 * @param token The TOTP code to validate
 * @param secret Base32 encoded secret key
 * @param options Configuration options
 * @returns True if the token is valid, false otherwise
 */
export function validateTOTP(
  token: string,
  secret: string,
  options: {
    algorithm?: string;
    digits?: number;
    period?: number;
    timestamp?: number;
    window?: number;
  } = {}
): boolean {
  const { 
    algorithm = DEFAULT_ALGORITHM, 
    digits = DEFAULT_DIGITS, 
    period = DEFAULT_PERIOD,
    timestamp = Math.floor(Date.now() / 1000),
    window = DEFAULT_WINDOW
  } = options;

  // Calculate the counter value (number of time steps since Unix epoch)
  const counter = Math.floor(timestamp / period);
  
  // Check tokens in the window (e.g., -1, 0, +1 time steps)
  for (let i = -window; i <= window; i++) {
    const currentCounter = counter + i;
    const generatedToken = generateHOTP(secret, currentCounter, algorithm, digits);
    
    if (generatedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate an HMAC-based One-time Password (HOTP)
 * @param secret Base32 encoded secret key
 * @param counter Counter value
 * @param algorithm Hash algorithm to use
 * @param digits Number of digits in the output
 * @returns The generated HOTP code
 */
function generateHOTP(
  secret: string,
  counter: number,
  algorithm: string = DEFAULT_ALGORITHM,
  digits: number = DEFAULT_DIGITS
): string {
  // Decode the base32 secret
  const decodedSecret = base32Decode(secret);
  
  // Convert counter to buffer (8 bytes, big-endian)
  const counterBuffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    counterBuffer[7 - i] = counter & 0xff;
    counter = counter >> 8;
  }
  
  // Calculate HMAC
  const hmac = crypto.createHmac(algorithm, decodedSecret.toString('utf8'));
  hmac.update(counterBuffer.toString('binary'), 'binary');
  const hmacResult = hmac.digest();
  
  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
  
  // Truncate to the specified number of digits
  const mod = 10 ** digits;
  const otp = binary % mod;
  
  // Pad with leading zeros if necessary
  return otp.toString().padStart(digits, '0');
}

/**
 * Generate a QR code URL for TOTP setup
 * @param secret Base32 encoded secret key
 * @param accountName User's account name/email
 * @param issuer Name of the service/application
 * @param options Additional options
 * @returns URL for QR code generation
 */
export function generateTOTPQRCodeURL(
  secret: string,
  accountName: string,
  issuer: string = 'UNITE Group',
  options: {
    algorithm?: string;
    digits?: number;
    period?: number;
  } = {}
): string {
  const { 
    algorithm = DEFAULT_ALGORITHM, 
    digits = DEFAULT_DIGITS, 
    period = DEFAULT_PERIOD
  } = options;
  
  // URL-encode parameters
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccountName = encodeURIComponent(accountName);
  const encodedSecret = encodeURIComponent(secret);
  
  // Construct otpauth URL
  const url = `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=${algorithm.toUpperCase()}&digits=${digits}&period=${period}`;
  
  return url;
}

/**
 * Base32 encode a buffer
 * @param buffer Input buffer
 * @returns Base32 encoded string
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

/**
 * Base32 decode a string
 * @param str Base32 encoded string
 * @returns Decoded buffer
 */
function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  let result = Buffer.alloc(Math.ceil(str.length * 5 / 8));
  let bits = 0;
  let value = 0;
  let index = 0;
  
  for (let i = 0; i < str.length; i++) {
    const charValue = alphabet.indexOf(str[i]);
    if (charValue < 0) {
      throw new Error('Invalid character in base32 string');
    }
    
    value = (value << 5) | charValue;
    bits += 5;
    
    if (bits >= 8) {
      result[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  
  return result.slice(0, index);
}
