/**
 * Australian Business Formatters
 * Unite Group - Formatting Functions for Australian Data Display
 */

import { 
  AustralianUserProfile,
  AustralianTimezone,
  AustralianState,
  AustralianMarketInsights,
  AustralianCommunicationResponse
} from './types';
import { AustralianUtils } from './utils';

export class AustralianFormatters {
  /**
   * Format Australian business address
   */
  static formatAustralianAddress(address: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
  }): string {
    const parts: string[] = [];
    
    if (address.street) parts.push(address.street);
    if (address.suburb) parts.push(address.suburb);
    
    // Australian format: STATE POSTCODE
    if (address.state && address.postcode) {
      parts.push(`${address.state} ${address.postcode}`);
    } else if (address.state) {
      parts.push(address.state);
    } else if (address.postcode) {
      parts.push(address.postcode);
    }
    
    if (address.country && address.country !== 'Australia') {
      parts.push(address.country);
    } else if (!address.country) {
      parts.push('Australia');
    }
    
    return parts.join(', ');
  }

  /**
   * Format Australian business name with compliance info
   */
  static formatBusinessName(name: string, options: {
    abn?: string;
    acn?: string;
    gstRegistered?: boolean;
    includeCompliance?: boolean;
  } = {}): string {
    let formatted = name;
    
    if (options.includeCompliance) {
      const compliance: string[] = [];
      
      if (options.abn) {
        compliance.push(`ABN: ${AustralianUtils.formatABN(options.abn)}`);
      }
      
      if (options.acn) {
        const formattedACN = options.acn.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        compliance.push(`ACN: ${formattedACN}`);
      }
      
      if (options.gstRegistered) {
        compliance.push('GST Registered');
      }
      
      if (compliance.length > 0) {
        formatted += ` (${compliance.join(', ')})`;
      }
    }
    
    return formatted;
  }

  /**
   * Format Australian date and time
   */
  static formatAustralianDateTime(
    date: Date,
    timezone: AustralianTimezone = 'Australia/Sydney',
    options: {
      includeTime?: boolean;
      includeTimezone?: boolean;
      format?: 'short' | 'medium' | 'long' | 'full';
    } = {}
  ): string {
    const { includeTime = true, includeTimezone = true, format = 'medium' } = options;
    
    const australianDate = AustralianUtils.convertTimezone(date, 'Australia/Sydney', timezone);
    
    const dateFormatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
      day: 'numeric'
    };
    
    if (includeTime) {
      dateFormatOptions.hour = '2-digit';
      dateFormatOptions.minute = '2-digit';
      dateFormatOptions.hour12 = false; // 24-hour format common in Australia
    }
    
    let formatted = australianDate.toLocaleDateString('en-AU', dateFormatOptions);
    
    if (includeTime && !dateFormatOptions.hour) {
      const timeString = australianDate.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });
      formatted += ` ${timeString}`;
    }
    
    if (includeTimezone) {
      const timezoneAbbr = timezone.split('/')[1]; // Sydney, Melbourne, etc.
      formatted += ` ${timezoneAbbr}`;
    }
    
    return formatted;
  }

  /**
   * Format Australian business hours
   */
  static formatBusinessHours(hours: {
    start: string;
    end: string;
    timezone?: AustralianTimezone;
    days?: string[];
  }): string {
    const { start, end, timezone = 'Australia/Sydney', days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] } = hours;
    
    const startTime = this.formatTime(start);
    const endTime = this.formatTime(end);
    const timezoneAbbr = timezone.split('/')[1];
    
    const daysFormatted = this.formatDaysRange(days);
    
    return `${daysFormatted}: ${startTime} - ${endTime} (${timezoneAbbr} time)`;
  }

  /**
   * Format user profile summary
   */
  static formatUserProfileSummary(profile: AustralianUserProfile): string {
    const location = `${profile.location.city}, ${profile.location.state}`;
    const businessSize = profile.preferences.businessSize || 'Unknown size';
    const industry = profile.demographics?.industry || 'Unknown industry';
    
    return `${businessSize} ${industry} business in ${location}`;
  }

  /**
   * Format market insights summary
   */
  static formatMarketInsightsSummary(insights: AustralianMarketInsights): string {
    const city = insights.cityData.name;
    const population = this.formatNumber(insights.cityData.population);
    const trendsCount = insights.trends.length;
    const opportunitiesCount = insights.opportunities.length;
    
    return `${city} (${population} people) has ${trendsCount} market trends and ${opportunitiesCount} opportunities identified`;
  }

  /**
   * Format communication response
   */
  static formatCommunicationResponse(response: AustralianCommunicationResponse): {
    preview: string;
    fullMessage: string;
    metadata: string;
  } {
    const preview = response.optimizedMessage.length > 100 
      ? `${response.optimizedMessage.substring(0, 97)}...`
      : response.optimizedMessage;
    
    const culturalNotes = response.culturalNotes.length > 0 
      ? ` • Cultural adaptations: ${response.culturalNotes.join(', ')}`
      : '';
    
    const timing = response.timing.optimal 
      ? '✓ Optimal timing' 
      : `⚠ Consider sending ${response.timing.recommendedTime}`;
    
    const metadata = `${timing}${culturalNotes}`;
    
    return {
      preview,
      fullMessage: response.optimizedMessage,
      metadata
    };
  }

  /**
   * Format financial amount in Australian context
   */
  static formatFinancialAmount(
    amount: number,
    options: {
      includeGST?: boolean;
      showBreakdown?: boolean;
      format?: 'compact' | 'standard' | 'detailed';
    } = {}
  ): string {
    const { includeGST = false, showBreakdown = false, format = 'standard' } = options;
    
    let baseAmount = amount;
    let gstAmount = 0;
    let totalAmount = amount;
    
    if (includeGST) {
      const gstCalc = AustralianUtils.calculateGST(amount, false);
      baseAmount = gstCalc.baseAmount;
      gstAmount = gstCalc.gstAmount;
      totalAmount = gstCalc.totalAmount;
    }
    
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: format === 'compact' ? 0 : 2,
      maximumFractionDigits: format === 'detailed' ? 2 : format === 'compact' ? 0 : 2
    };
    
    if (format === 'compact' && totalAmount >= 1000) {
      formatOptions.notation = 'compact';
      formatOptions.compactDisplay = 'short';
    }
    
    const formatted = new Intl.NumberFormat('en-AU', formatOptions).format(totalAmount);
    
    if (showBreakdown && includeGST && gstAmount > 0) {
      const baseFormatted = new Intl.NumberFormat('en-AU', formatOptions).format(baseAmount);
      const gstFormatted = new Intl.NumberFormat('en-AU', formatOptions).format(gstAmount);
      return `${formatted} (${baseFormatted} + ${gstFormatted} GST)`;
    } else if (includeGST) {
      return `${formatted} (inc. GST)`;
    }
    
    return formatted;
  }

  /**
   * Format large numbers (population, revenue, etc.)
   */
  static formatNumber(
    num: number,
    options: {
      style?: 'decimal' | 'compact' | 'scientific';
      precision?: number;
      unit?: string;
    } = {}
  ): string {
    const { style = 'decimal', precision, unit } = options;
    
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'decimal',
      useGrouping: true
    };
    
    if (style === 'compact') {
      formatOptions.notation = 'compact';
      formatOptions.compactDisplay = 'short';
    } else if (style === 'scientific') {
      formatOptions.notation = 'scientific';
    }
    
    if (precision !== undefined) {
      formatOptions.minimumFractionDigits = precision;
      formatOptions.maximumFractionDigits = precision;
    }
    
    let formatted = new Intl.NumberFormat('en-AU', formatOptions).format(num);
    
    if (unit) {
      formatted += ` ${unit}`;
    }
    
    return formatted;
  }

  /**
   * Format percentage for Australian context
   */
  static formatPercentage(
    value: number,
    options: {
      decimals?: number;
      style?: 'percent' | 'decimal';
      showSign?: boolean;
    } = {}
  ): string {
    const { decimals = 1, style = 'percent', showSign = false } = options;
    
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    };
    
    const inputValue = style === 'percent' ? value / 100 : value;
    let formatted = new Intl.NumberFormat('en-AU', formatOptions).format(inputValue);
    
    if (showSign && value > 0) {
      formatted = `+${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format list of items with Australian English conventions
   */
  static formatList(
    items: string[],
    options: {
      style?: 'long' | 'short' | 'narrow';
      type?: 'conjunction' | 'disjunction';
    } = {}
  ): string {
    const { type = 'conjunction' } = options;
    
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) {
      const connector = type === 'conjunction' ? ' and ' : ' or ';
      return `${items[0]}${connector}${items[1]}`;
    }
    
    // For more than 2 items
    const connector = type === 'conjunction' ? ', and ' : ', or ';
    const lastItem = items[items.length - 1];
    const firstItems = items.slice(0, -1);
    
    return `${firstItems.join(', ')}${connector}${lastItem}`;
  }

  /**
   * Format state name
   */
  static formatStateName(state: AustralianState, format: 'short' | 'long' = 'short'): string {
    const stateMap: Record<AustralianState, { short: string; long: string }> = {
      'NSW': { short: 'NSW', long: 'New South Wales' },
      'VIC': { short: 'VIC', long: 'Victoria' },
      'QLD': { short: 'QLD', long: 'Queensland' },
      'WA': { short: 'WA', long: 'Western Australia' },
      'SA': { short: 'SA', long: 'South Australia' },
      'TAS': { short: 'TAS', long: 'Tasmania' },
      'NT': { short: 'NT', long: 'Northern Territory' },
      'ACT': { short: 'ACT', long: 'Australian Capital Territory' }
    };
    
    return stateMap[state]?.[format] || state;
  }

  /**
   * Format timezone display
   */
  static formatTimezone(timezone: AustralianTimezone, includeOffset: boolean = false): string {
    const timezoneMap: Record<AustralianTimezone, string> = {
      'Australia/Sydney': 'AEDT/AEST (Sydney)',
      'Australia/Melbourne': 'AEDT/AEST (Melbourne)',
      'Australia/Brisbane': 'AEST (Brisbane)',
      'Australia/Perth': 'AWST (Perth)'
    };
    
    let formatted = timezoneMap[timezone] || timezone;
    
    if (includeOffset) {
      const offset = AustralianUtils.getCurrentTimeInTimezone(timezone).getTimezoneOffset();
      const sign = offset <= 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(offset) / 60);
      formatted += ` (UTC${sign}${hours.toString().padStart(2, '0')}:00)`;
    }
    
    return formatted;
  }

  /**
   * Private helper methods
   */
  private static formatTime(time: string): string {
    // Convert 24-hour to 12-hour format if needed, or keep 24-hour
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  private static formatDaysRange(days: string[]): string {
    if (days.length === 0) return '';
    
    const allWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const allWeekend = ['Saturday', 'Sunday'];
    
    // Check for common patterns
    if (days.length === 5 && allWeekdays.every(day => days.includes(day))) {
      return 'Monday - Friday';
    }
    
    if (days.length === 2 && allWeekend.every(day => days.includes(day))) {
      return 'Saturday - Sunday';
    }
    
    if (days.length === 7) {
      return 'Monday - Sunday';
    }
    
    // For custom ranges, show first and last
    if (days.length > 2) {
      const sortedDays = [...days].sort((a, b) => {
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return order.indexOf(a) - order.indexOf(b);
      });
      
      // Check if it's a continuous range
      const firstIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(sortedDays[0]);
      const lastIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(sortedDays[sortedDays.length - 1]);
      
      if (lastIndex - firstIndex + 1 === sortedDays.length) {
        return `${sortedDays[0]} - ${sortedDays[sortedDays.length - 1]}`;
      }
    }
    
    // Fall back to list format
    return this.formatList(days);
  }
}

export default AustralianFormatters;
