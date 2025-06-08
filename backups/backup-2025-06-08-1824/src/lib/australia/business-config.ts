/**
 * Australian Business Configuration
 * Unite Group - Australian Market Focus
 */

export interface AustralianBusinessConfig {
  timezone: 'Australia/Sydney' | 'Australia/Melbourne';
  businessHours: {
    start: string;
    end: string;
    workDays: string[];
  };
  currency: 'AUD';
  gstRate: number;
  financialYear: {
    start: string;
    end: string;
  };
  holidays: string[];
  regions: {
    primary: string[];
    secondary: string[];
  };
}

export interface AustralianMarketData {
  location: string;
  population: number;
  businessDensity: number;
  averageIncome: number;
  industryFocus: string[];
  competitiveIndex: number;
}

export interface AustralianComplianceFramework {
  privacyAct: {
    enabled: boolean;
    version: string;
    requirements: string[];
  };
  acma: {
    enabled: boolean;
    communicationRules: string[];
  };
  consumerLaw: {
    enabled: boolean;
    protections: string[];
  };
}

// Australian Business Configuration
export const AUSTRALIAN_BUSINESS_CONFIG: AustralianBusinessConfig = {
  timezone: 'Australia/Sydney',
  businessHours: {
    start: '09:00',
    end: '17:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  currency: 'AUD',
  gstRate: 0.10, // 10% GST
  financialYear: {
    start: '07-01', // July 1st
    end: '06-30'    // June 30th
  },
  holidays: [
    '2025-01-01', // New Year's Day
    '2025-01-27', // Australia Day
    '2025-03-14', // Labour Day (VIC)
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-04-25', // ANZAC Day
    '2025-06-09', // Queen's Birthday
    '2025-12-25', // Christmas Day
    '2025-12-26'  // Boxing Day
  ],
  regions: {
    primary: ['Sydney', 'Melbourne'],
    secondary: ['Brisbane', 'Perth', 'Adelaide', 'Canberra']
  }
};

// Australian Market Data
export const AUSTRALIAN_MARKET_DATA: Record<string, AustralianMarketData> = {
  Sydney: {
    location: 'Sydney, NSW',
    population: 5400000,
    businessDensity: 0.85,
    averageIncome: 95000,
    industryFocus: ['Technology', 'Finance', 'Professional Services', 'Healthcare'],
    competitiveIndex: 0.92
  },
  Melbourne: {
    location: 'Melbourne, VIC',
    population: 5200000,
    businessDensity: 0.82,
    averageIncome: 88000,
    industryFocus: ['Creative Industries', 'Manufacturing', 'Education', 'Technology'],
    competitiveIndex: 0.89
  },
  Brisbane: {
    location: 'Brisbane, QLD',
    population: 2600000,
    businessDensity: 0.75,
    averageIncome: 82000,
    industryFocus: ['Mining', 'Tourism', 'Agriculture', 'Technology'],
    competitiveIndex: 0.78
  },
  Perth: {
    location: 'Perth, WA',
    population: 2200000,
    businessDensity: 0.71,
    averageIncome: 89000,
    industryFocus: ['Mining', 'Energy', 'Agriculture', 'Technology'],
    competitiveIndex: 0.74
  }
};

// Australian Compliance Framework
export const AUSTRALIAN_COMPLIANCE: AustralianComplianceFramework = {
  privacyAct: {
    enabled: true,
    version: 'Privacy Act 1988',
    requirements: [
      'Data collection notification',
      'Consent for data processing',
      'Right to access personal information',
      'Right to correction of personal information',
      'Data breach notification',
      'Privacy policy requirements'
    ]
  },
  acma: {
    enabled: true,
    communicationRules: [
      'Spam Act 2003 compliance',
      'Do Not Call Register compliance',
      'Marketing communication consent',
      'Unsubscribe mechanisms required',
      'Sender identification required'
    ]
  },
  consumerLaw: {
    enabled: true,
    protections: [
      'Australian Consumer Law compliance',
      'Fair trading practices',
      'Consumer guarantees',
      'Unfair contract terms protection',
      'Pricing and billing transparency'
    ]
  }
};

export class AustralianBusinessService {
  private config: AustralianBusinessConfig;

  constructor(config: AustralianBusinessConfig = AUSTRALIAN_BUSINESS_CONFIG) {
    this.config = config;
  }

  /**
   * Check if current time is within Australian business hours
   */
  isBusinessHours(): boolean {
    const now = new Date();
    const sydneyTime = new Intl.DateTimeFormat('en-AU', {
      timeZone: this.config.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const currentDay = new Intl.DateTimeFormat('en-AU', {
      timeZone: this.config.timezone,
      weekday: 'long'
    }).format(now);

    if (!this.config.businessHours.workDays.includes(currentDay)) {
      return false;
    }

    const [currentHour, currentMinute] = sydneyTime.split(':').map(Number);
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.config.businessHours.start.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;

    const [endHour, endMinute] = this.config.businessHours.end.split(':').map(Number);
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Format currency in Australian Dollars
   */
  formatCurrency(amount: number, includeGST: boolean = false): string {
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: this.config.currency,
      minimumFractionDigits: 2
    });

    const finalAmount = includeGST ? amount * (1 + this.config.gstRate) : amount;
    return formatter.format(finalAmount);
  }

  /**
   * Calculate GST for a given amount
   */
  calculateGST(amount: number): {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    gstRate: number;
  } {
    const gstAmount = amount * this.config.gstRate;
    return {
      baseAmount: amount,
      gstAmount,
      totalAmount: amount + gstAmount,
      gstRate: this.config.gstRate
    };
  }

  /**
   * Check if a date is an Australian public holiday
   */
  isPublicHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return this.config.holidays.includes(dateStr);
  }

  /**
   * Get next business day
   */
  getNextBusinessDay(date: Date = new Date()): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayName = new Intl.DateTimeFormat('en-AU', {
      timeZone: this.config.timezone,
      weekday: 'long'
    }).format(nextDay);

    if (!this.config.businessHours.workDays.includes(dayName) || this.isPublicHoliday(nextDay)) {
      return this.getNextBusinessDay(nextDay);
    }

    return nextDay;
  }

  /**
   * Get optimal contact time for Australian business
   */
  getOptimalContactTime(): string {
    if (this.isBusinessHours()) {
      return 'now';
    }

    const nextBusinessDay = this.getNextBusinessDay();
    const optimalTime = new Date(nextBusinessDay);
    optimalTime.setHours(10, 0, 0, 0); // 10 AM optimal contact time

    return optimalTime.toLocaleString('en-AU', {
      timeZone: this.config.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get financial year for a given date
   */
  getFinancialYear(date: Date = new Date()): {
    startDate: Date;
    endDate: Date;
    year: string;
  } {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-based

    let fyYear: number;
    if (month >= 7) {
      // July to December - current financial year
      fyYear = year;
    } else {
      // January to June - previous financial year
      fyYear = year - 1;
    }

    const startDate = new Date(`${fyYear}-07-01`);
    const endDate = new Date(`${fyYear + 1}-06-30`);

    return {
      startDate,
      endDate,
      year: `FY${fyYear.toString().slice(-2)}/${(fyYear + 1).toString().slice(-2)}`
    };
  }

  /**
   * Get market data for Australian cities
   */
  getMarketData(city: string): AustralianMarketData | null {
    return AUSTRALIAN_MARKET_DATA[city] || null;
  }

  /**
   * Get compliance requirements
   */
  getComplianceRequirements(): AustralianComplianceFramework {
    return AUSTRALIAN_COMPLIANCE;
  }

  /**
   * Validate Australian business context
   */
  validateBusinessContext(data: {
    timezone?: string;
    currency?: string;
    gstRate?: number;
    [key: string]: unknown;
  }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check timezone
    if (data.timezone && !['Australia/Sydney', 'Australia/Melbourne'].includes(data.timezone)) {
      warnings.push('Timezone not optimized for Australian business hours');
    }

    // Check currency
    if (data.currency && data.currency !== 'AUD') {
      errors.push('Currency must be AUD for Australian business');
    }

    // Check GST rate
    if (data.gstRate && data.gstRate !== 0.10) {
      errors.push('GST rate must be 10% for Australian business');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default AustralianBusinessService;
