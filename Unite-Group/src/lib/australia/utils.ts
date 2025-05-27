/**
 * Australian Business Utilities
 * Unite Group - Helper Functions for Australian Operations
 */

import { 
  AustralianTimezone, 
  AustralianState
} from './types';
import { 
  AUSTRALIAN_CITIES, 
  AUSTRALIAN_TIMEZONE_OFFSETS,
  AUSTRALIAN_STATES,
  AUSTRALIAN_HOLIDAY_CALENDAR_2025 
} from './constants';

export class AustralianUtils {
  /**
   * Convert time between Australian timezones
   */
  static convertTimezone(
    date: Date,
    fromTimezone: AustralianTimezone,
    toTimezone: AustralianTimezone
  ): Date {
    const fromOffset = AUSTRALIAN_TIMEZONE_OFFSETS[fromTimezone];
    const toOffset = AUSTRALIAN_TIMEZONE_OFFSETS[toTimezone];
    
    // Calculate offset difference in milliseconds
    const fromHours = parseInt(fromOffset.standard.replace('+', '').split(':')[0]);
    const toHours = parseInt(toOffset.standard.replace('+', '').split(':')[0]);
    const offsetDiff = (fromHours - toHours) * 60 * 60 * 1000;
    
    return new Date(date.getTime() + offsetDiff);
  }

  /**
   * Get current time in specific Australian timezone
   */
  static getCurrentTimeInTimezone(timezone: AustralianTimezone): Date {
    const now = new Date();
    return this.convertTimezone(now, 'Australia/Sydney', timezone);
  }

  /**
   * Check if current time is within Australian business hours
   */
  static isAustralianBusinessHours(timezone: AustralianTimezone = 'Australia/Sydney'): boolean {
    const currentTime = this.getCurrentTimeInTimezone(timezone);
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    
    // Monday = 1, Friday = 5
    const isWeekday = day >= 1 && day <= 5;
    const isBusinessHour = hour >= 9 && hour < 17;
    
    return isWeekday && isBusinessHour;
  }

  /**
   * Calculate distance between Australian cities (approximate)
   */
  static calculateCityDistance(city1: string, city2: string): number {
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Melbourne': { lat: -37.8136, lng: 144.9631 },
      'Brisbane': { lat: -27.4698, lng: 153.0251 },
      'Perth': { lat: -31.9505, lng: 115.8605 },
      'Adelaide': { lat: -34.9285, lng: 138.6007 },
      'Canberra': { lat: -35.2809, lng: 149.1300 },
      'Darwin': { lat: -12.4634, lng: 130.8456 },
      'Hobart': { lat: -42.8821, lng: 147.3272 }
    };

    const coord1 = cityCoordinates[city1];
    const coord2 = cityCoordinates[city2];
    
    if (!coord1 || !coord2) return 0;

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
  }

  /**
   * Get state information from city name
   */
  static getStateFromCity(city: string): { state: AustralianState; stateName: string } | null {
    const cityData = AUSTRALIAN_CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
    if (!cityData) return null;

    const stateInfo = AUSTRALIAN_STATES[cityData.state as AustralianState];
    if (!stateInfo) return null;

    return {
      state: cityData.state as AustralianState,
      stateName: stateInfo.name
    };
  }

  /**
   * Format Australian phone number
   */
  static formatAustralianPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digitsOnly.startsWith('61')) {
      // International format
      const withoutCountryCode = digitsOnly.substring(2);
      return `+61 ${this.formatLocalNumber(withoutCountryCode)}`;
    } else if (digitsOnly.startsWith('0')) {
      // National format
      const withoutLeadingZero = digitsOnly.substring(1);
      return `+61 ${this.formatLocalNumber(withoutLeadingZero)}`;
    } else {
      // Assume local format
      return `+61 ${this.formatLocalNumber(digitsOnly)}`;
    }
  }

  /**
   * Format Australian Business Number (ABN)
   */
  static formatABN(abn: string): string {
    const digitsOnly = abn.replace(/\D/g, '');
    if (digitsOnly.length !== 11) return abn;
    
    return `${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5, 8)} ${digitsOnly.substring(8)}`;
  }

  /**
   * Format Australian currency
   */
  static formatAustralianCurrency(
    amount: number, 
    options: { includeGST?: boolean; showCents?: boolean } = {}
  ): string {
    const { includeGST = false, showCents = true } = options;
    
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0
    });
    
    const formatted = formatter.format(amount);
    
    if (includeGST) {
      return `${formatted} (inc. GST)`;
    }
    
    return formatted;
  }

  /**
   * Calculate GST amount
   */
  static calculateGST(amount: number, includeGST: boolean = false): {
    gstAmount: number;
    totalAmount: number;
    baseAmount: number;
  } {
    const GST_RATE = 0.10; // 10%
    
    if (includeGST) {
      // Amount already includes GST, extract it
      const baseAmount = amount / (1 + GST_RATE);
      const gstAmount = amount - baseAmount;
      return {
        gstAmount,
        totalAmount: amount,
        baseAmount
      };
    } else {
      // Amount excludes GST, add it
      const gstAmount = amount * GST_RATE;
      const totalAmount = amount + gstAmount;
      return {
        gstAmount,
        totalAmount,
        baseAmount: amount
      };
    }
  }

  /**
   * Check if date is an Australian public holiday
   */
  static isAustralianPublicHoliday(date: Date, state?: AustralianState): boolean {
    const dateStr = date.toISOString().split('T')[0];
    
    const holiday = AUSTRALIAN_HOLIDAY_CALENDAR_2025.holidays.find(h => 
      h.date === dateStr && (
        h.type === 'national' || 
        (h.type === 'state' && state && h.states?.includes(state))
      )
    );
    
    return !!holiday;
  }

  /**
   * Get next business day in Australia
   */
  static getNextAustralianBusinessDay(
    fromDate: Date = new Date(), 
    state?: AustralianState
  ): Date {
    const nextDay = new Date(fromDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (
      nextDay.getDay() === 0 || // Sunday
      nextDay.getDay() === 6 || // Saturday
      this.isAustralianPublicHoliday(nextDay, state)
    ) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  /**
   * Generate Australian business greeting based on time
   */
  static generateAustralianGreeting(
    timezone: AustralianTimezone = 'Australia/Sydney',
    style: 'formal' | 'casual' | 'professional' = 'professional'
  ): string {
    const currentTime = this.getCurrentTimeInTimezone(timezone);
    const hour = currentTime.getHours();
    
    const greetings = {
      formal: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening'
      },
      casual: {
        morning: 'G\'day',
        afternoon: 'Good arvo',
        evening: 'G\'day'
      },
      professional: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening'
      }
    };
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }
    
    return greetings[style][timeOfDay];
  }

  /**
   * Calculate business days between two dates
   */
  static calculateAustralianBusinessDays(
    startDate: Date,
    endDate: Date,
    state?: AustralianState
  ): number {
    let businessDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      if (
        currentDate.getDay() !== 0 && // Not Sunday
        currentDate.getDay() !== 6 && // Not Saturday
        !this.isAustralianPublicHoliday(currentDate, state)
      ) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return businessDays;
  }

  /**
   * Get optimal meeting time suggestions for Australian business
   */
  static getOptimalMeetingTimes(
    date: Date,
    timezone: AustralianTimezone = 'Australia/Sydney',
    duration: number = 60 // minutes
  ): string[] {
    const suggestions: string[] = [];
    const targetDate = this.convertTimezone(date, 'Australia/Sydney', timezone);
    
    // Optimal times: 9:00 AM, 10:00 AM, 2:00 PM, 3:00 PM
    const optimalHours = [9, 10, 14, 15];
    
    optimalHours.forEach(hour => {
      const meetingTime = new Date(targetDate);
      meetingTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(meetingTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      const timeString = meetingTime.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });
      
      const endTimeString = endTime.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });
      
      suggestions.push(`${timeString} - ${endTimeString} ${timezone.split('/')[1]}`);
    });
    
    return suggestions;
  }

  /**
   * Validate Australian postcode
   */
  static validateAustralianPostcode(postcode: string): {
    isValid: boolean;
    state?: AustralianState;
    region?: string;
  } {
    const pc = parseInt(postcode);
    
    if (isNaN(pc) || postcode.length !== 4) {
      return { isValid: false };
    }
    
    // Australian postcode ranges
    const postcodeRanges: Record<string, { min: number; max: number; region: string }> = {
      'NSW': { min: 1000, max: 2999, region: 'New South Wales' },
      'ACT': { min: 2600, max: 2618, region: 'Australian Capital Territory' },
      'VIC': { min: 3000, max: 3999, region: 'Victoria' },
      'QLD': { min: 4000, max: 4999, region: 'Queensland' },
      'SA': { min: 5000, max: 5999, region: 'South Australia' },
      'WA': { min: 6000, max: 6999, region: 'Western Australia' },
      'TAS': { min: 7000, max: 7999, region: 'Tasmania' },
      'NT': { min: 800, max: 999, region: 'Northern Territory' }
    };
    
    for (const [state, range] of Object.entries(postcodeRanges)) {
      if (pc >= range.min && pc <= range.max) {
        return {
          isValid: true,
          state: state as AustralianState,
          region: range.region
        };
      }
    }
    
    return { isValid: false };
  }

  /**
   * Private helper methods
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static formatLocalNumber(number: string): string {
    if (number.length === 9) {
      // Mobile number: X XXXX XXXX
      return `${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    } else if (number.length === 8) {
      // Landline: X XXXX XXXX
      return `${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    } else {
      // Unknown format, return as is
      return number;
    }
  }
}

export default AustralianUtils;
