import { validateAddress } from './addressValidator';

export function validateAustralianAddress(address: string): boolean {
  try {
    const isValid = validateAddress(address);
    return isValid;
  } catch (error) {
    console.error('Error validating Australian address:', error);
    return false;
  }
}