/**
 * Australian Business Intelligence Constants
 * Unite Group - Centralized Australian Data Constants
 */

import { 
  AustralianCityData, 
  AustralianBusinessEtiquette, 
  AustralianMessageTemplate,
  AustralianHolidayCalendar,
  AustralianFinancialConfig,
  AustralianComplianceFramework 
} from './types';

// === CORE AUSTRALIAN CITIES DATA ===

export const AUSTRALIAN_CITIES: AustralianCityData[] = [
  {
    name: 'Sydney',
    state: 'NSW',
    population: 5400000,
    averageIncome: 95000,
    businessSectors: ['Technology', 'Finance', 'Tourism', 'Education', 'Healthcare'],
    timezone: 'Australia/Sydney',
    economicIndicators: {
      gdp: 400000000000, // $400B AUD
      unemploymentRate: 3.8,
      businessGrowthRate: 4.2
    }
  },
  {
    name: 'Melbourne',
    state: 'VIC',
    population: 5200000,
    averageIncome: 88000,
    businessSectors: ['Creative Industries', 'Technology', 'Manufacturing', 'Education', 'Sports'],
    timezone: 'Australia/Melbourne',
    economicIndicators: {
      gdp: 380000000000, // $380B AUD
      unemploymentRate: 4.1,
      businessGrowthRate: 3.9
    }
  },
  {
    name: 'Brisbane',
    state: 'QLD',
    population: 2600000,
    averageIncome: 82000,
    businessSectors: ['Mining', 'Tourism', 'Agriculture', 'Technology', 'Logistics'],
    timezone: 'Australia/Brisbane',
    economicIndicators: {
      gdp: 170000000000, // $170B AUD
      unemploymentRate: 4.3,
      businessGrowthRate: 4.8
    }
  },
  {
    name: 'Perth',
    state: 'WA',
    population: 2200000,
    averageIncome: 89000,
    businessSectors: ['Mining', 'Energy', 'Maritime', 'Technology', 'Agriculture'],
    timezone: 'Australia/Perth',
    economicIndicators: {
      gdp: 160000000000, // $160B AUD
      unemploymentRate: 3.5,
      businessGrowthRate: 3.2
    }
  }
];

// === AUSTRALIAN BUSINESS ETIQUETTE ===

export const AUSTRALIAN_BUSINESS_ETIQUETTE: AustralianBusinessEtiquette = {
  greetings: {
    formal: [
      'Good morning',
      'Good afternoon', 
      'Good evening',
      'I hope this message finds you well',
      'Thank you for your time'
    ],
    casual: [
      'G\'day',
      'Hi there',
      'Hope you\'re having a great day',
      'Thanks for reaching out',
      'Cheers'
    ],
    professional: [
      'Good day',
      'I trust you are well',
      'Thank you for your inquiry',
      'I appreciate your interest',
      'Looking forward to connecting'
    ]
  },
  communication: {
    emailStyle: [
      'Direct and to the point',
      'Friendly but professional tone',
      'Clear subject lines',
      'Proper salutations and closings',
      'Include contact details'
    ],
    phoneStyle: [
      'Warm and approachable',
      'Clear articulation',
      'Respectful of time',
      'Follow up with email summary',
      'Professional but not stuffy'
    ],
    meetingStyle: [
      'Punctual arrival',
      'Prepared agenda',
      'Collaborative discussion',
      'Clear action items',
      'Follow-up communication'
    ]
  },
  culturalReferences: {
    businessMetaphors: [
      'Fair dinkum approach to business',
      'Going the extra mile',
      'Straight shooting communication',
      'No worries attitude to problem-solving',
      'True blue partnership'
    ],
    localSayings: [
      'She\'ll be right',
      'Good on ya',
      'Too right',
      'Spot on',
      'Give it a burl'
    ],
    industryTerms: {
      technology: ['cutting-edge', 'innovative solutions', 'digital transformation', 'future-ready'],
      finance: ['sound investment', 'financial security', 'smart money', 'value proposition'],
      healthcare: ['patient-centered', 'quality care', 'health outcomes', 'wellness focus'],
      government: ['public service', 'community benefit', 'transparent processes', 'accountable governance']
    }
  },
  timeReferences: {
    businessHours: [
      'during business hours (9 AM - 5 PM AEST/AEDT)',
      'within the business day',
      'at your earliest convenience',
      'when it suits your schedule'
    ],
    holidays: [
      'before the Australia Day long weekend',
      'after the Easter holidays',
      'during the Christmas/New Year period',
      'over the Queen\'s Birthday weekend'
    ],
    seasons: [
      'as we head into summer',
      'during the autumn period',
      'throughout the winter months',
      'with spring approaching'
    ]
  }
};

// === AUSTRALIAN MESSAGE TEMPLATES ===

export const AUSTRALIAN_MESSAGE_TEMPLATES: AustralianMessageTemplate[] = [
  {
    id: 'initial-contact-professional',
    name: 'Professional Initial Contact',
    category: 'First Contact',
    template: `Good {timeOfDay},

I hope this message finds you well. I'm {senderName} from {companyName}, and I'm reaching out regarding {purpose}.

{mainContent}

I understand how valuable your time is, particularly in today's business environment in {city}. Would you be available for a brief conversation during business hours (9 AM - 5 PM AEST/AEDT) to discuss how we might be able to assist your {businessType}?

All our services are delivered with Australian business practices in mind, including full compliance with local regulations and transparent pricing (including GST).

Looking forward to hearing from you.

Kind regards,
{senderName}`,
    variables: ['timeOfDay', 'senderName', 'companyName', 'purpose', 'mainContent', 'city', 'businessType'],
    culturalAdaptations: [
      'Respectful of time',
      'Clear business hours reference',
      'GST transparency',
      'Professional but approachable tone'
    ],
    appropriateTiming: ['Business hours', 'Tuesday-Thursday optimal'],
    businessContexts: ['B2B initial outreach', 'Service introduction', 'Partnership inquiry']
  },
  {
    id: 'follow-up-casual',
    name: 'Casual Follow-up',
    category: 'Follow-up',
    template: `G'day {recipientName},

Hope you're having a great week! Just wanted to circle back on our conversation about {topic}.

{mainContent}

No rush at all - I know how busy things can get. When you've got a moment, I'd love to chat further about how we can help your {businessType} in {city}.

Cheers,
{senderName}`,
    variables: ['recipientName', 'topic', 'mainContent', 'businessType', 'city', 'senderName'],
    culturalAdaptations: [
      'Australian greeting',
      'No pressure approach',
      'Casual but professional',
      'Respectful of busy schedules'
    ],
    appropriateTiming: ['Mid-week preferred', 'Avoid Friday afternoons'],
    businessContexts: ['Relationship building', 'Project follow-up', 'Service check-in']
  },
  {
    id: 'proposal-formal',
    name: 'Formal Proposal',
    category: 'Business Proposal',
    template: `Dear {recipientName},

Thank you for the opportunity to present our proposal for {projectName}.

{executiveSummary}

Our approach is designed specifically for the Australian market, taking into account:
• Local compliance requirements
• Australian business practices
• Transparent pricing (all amounts include GST)
• Support during Australian business hours

{detailedProposal}

We would welcome the opportunity to discuss this proposal in detail at your convenience. Our {city} team is available to meet during standard business hours or arrange a call that suits your schedule.

We look forward to the possibility of partnering with {companyName}.

Best regards,
{senderName}
{title}`,
    variables: ['recipientName', 'projectName', 'executiveSummary', 'detailedProposal', 'city', 'companyName', 'senderName', 'title'],
    culturalAdaptations: [
      'Formal structure',
      'Clear value proposition',
      'Australian compliance focus',
      'Partnership language'
    ],
    appropriateTiming: ['Monday-Wednesday optimal', 'Avoid holiday periods'],
    businessContexts: ['Formal proposals', 'Government submissions', 'Enterprise contracts']
  },
  {
    id: 'meeting-invitation',
    name: 'Meeting Invitation',
    category: 'Meeting Request',
    template: `Hi {recipientName},

I hope this email finds you well. Following our recent conversation about {topic}, I'd like to schedule a meeting to discuss {purpose} in more detail.

I'm available for the following times (all in {timezone}):
• {timeOption1}
• {timeOption2}
• {timeOption3}

The meeting should take approximately {duration} and we can conduct it via {meetingType}. I'll send through an agenda beforehand so we can make the most of our time together.

Please let me know which time works best for you, or feel free to suggest an alternative that better suits your schedule.

Looking forward to our discussion.

Best regards,
{senderName}`,
    variables: ['recipientName', 'topic', 'purpose', 'timezone', 'timeOption1', 'timeOption2', 'timeOption3', 'duration', 'meetingType', 'senderName'],
    culturalAdaptations: [
      'Flexible scheduling',
      'Respectful of time',
      'Clear agenda promise',
      'Professional courtesy'
    ],
    appropriateTiming: ['Business hours', 'Allow 2-3 days notice'],
    businessContexts: ['Client meetings', 'Partner discussions', 'Project kickoffs']
  }
];

// === AUSTRALIAN HOLIDAY CALENDAR 2025 ===

export const AUSTRALIAN_HOLIDAY_CALENDAR_2025: AustralianHolidayCalendar = {
  year: 2025,
  holidays: [
    {
      name: 'New Year\'s Day',
      date: '2025-01-01',
      type: 'national'
    },
    {
      name: 'Australia Day',
      date: '2025-01-27',
      type: 'national'
    },
    {
      name: 'Labour Day',
      date: '2025-03-10',
      type: 'state',
      states: ['VIC', 'TAS', 'WA']
    },
    {
      name: 'Good Friday',
      date: '2025-04-18',
      type: 'national'
    },
    {
      name: 'Easter Saturday',
      date: '2025-04-19',
      type: 'national'
    },
    {
      name: 'Easter Monday',
      date: '2025-04-21',
      type: 'national'
    },
    {
      name: 'ANZAC Day',
      date: '2025-04-25',
      type: 'national'
    },
    {
      name: 'Queen\'s Birthday',
      date: '2025-06-09',
      type: 'state',
      states: ['NSW', 'VIC', 'SA', 'TAS', 'NT', 'ACT']
    },
    {
      name: 'Queen\'s Birthday (WA)',
      date: '2025-09-29',
      type: 'state',
      states: ['WA']
    },
    {
      name: 'Queen\'s Birthday (QLD)',
      date: '2025-10-06',
      type: 'state',
      states: ['QLD']
    },
    {
      name: 'Melbourne Cup',
      date: '2025-11-04',
      type: 'state',
      states: ['VIC']
    },
    {
      name: 'Christmas Day',
      date: '2025-12-25',
      type: 'national'
    },
    {
      name: 'Boxing Day',
      date: '2025-12-26',
      type: 'national'
    }
  ]
};

// === AUSTRALIAN FINANCIAL CONFIGURATION ===

export const AUSTRALIAN_FINANCIAL_CONFIG: AustralianFinancialConfig = {
  currency: 'AUD',
  gstRate: 0.10, // 10% GST
  financialYearStart: '07-01', // July 1st
  quarterDefinitions: {
    Q1: { start: '07-01', end: '09-30' }, // July - September
    Q2: { start: '10-01', end: '12-31' }, // October - December
    Q3: { start: '01-01', end: '03-31' }, // January - March
    Q4: { start: '04-01', end: '06-30' }  // April - June
  }
};

// === AUSTRALIAN COMPLIANCE FRAMEWORK ===

export const AUSTRALIAN_COMPLIANCE_FRAMEWORK: AustralianComplianceFramework = {
  privacyAct: {
    year: 1988,
    requirements: [
      'Collect personal information only when necessary',
      'Inform individuals about collection and use',
      'Store personal information securely',
      'Provide access to personal information on request',
      'Correct inaccurate personal information',
      'Handle complaints about privacy breaches'
    ]
  },
  consumerLaw: {
    requirements: [
      'Goods and services must be of acceptable quality',
      'Goods must match description and be fit for purpose',
      'Consumer guarantees cannot be excluded',
      'Clear pricing and terms must be provided',
      'Misleading and deceptive conduct is prohibited',
      'Unfair contract terms are void'
    ]
  },
  corporationsAct: {
    year: 2001,
    requirements: [
      'Directors must act in good faith',
      'Maintain adequate financial records',
      'Lodge annual financial reports',
      'Hold annual general meetings',
      'Comply with continuous disclosure obligations',
      'Meet capital adequacy requirements'
    ]
  }
};

// === AUSTRALIAN BUSINESS HOURS ===

export const STANDARD_BUSINESS_HOURS = {
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  startTime: '09:00',
  endTime: '17:00',
  lunchBreak: {
    start: '12:00',
    end: '13:00'
  }
};

// === AUSTRALIAN TIMEZONE OFFSETS ===

export const AUSTRALIAN_TIMEZONE_OFFSETS = {
  'Australia/Sydney': { standard: '+10:00', daylight: '+11:00' },
  'Australia/Melbourne': { standard: '+10:00', daylight: '+11:00' },
  'Australia/Brisbane': { standard: '+10:00', daylight: '+10:00' }, // No DST
  'Australia/Perth': { standard: '+08:00', daylight: '+08:00' } // No DST
};

// === AUSTRALIAN STATES AND TERRITORIES ===

export const AUSTRALIAN_STATES = {
  'NSW': { name: 'New South Wales', capital: 'Sydney', timezone: 'Australia/Sydney' },
  'VIC': { name: 'Victoria', capital: 'Melbourne', timezone: 'Australia/Melbourne' },
  'QLD': { name: 'Queensland', capital: 'Brisbane', timezone: 'Australia/Brisbane' },
  'WA': { name: 'Western Australia', capital: 'Perth', timezone: 'Australia/Perth' },
  'SA': { name: 'South Australia', capital: 'Adelaide', timezone: 'Australia/Adelaide' },
  'TAS': { name: 'Tasmania', capital: 'Hobart', timezone: 'Australia/Hobart' },
  'NT': { name: 'Northern Territory', capital: 'Darwin', timezone: 'Australia/Darwin' },
  'ACT': { name: 'Australian Capital Territory', capital: 'Canberra', timezone: 'Australia/Sydney' }
};

// === AUSTRALIAN BUSINESS SECTORS ===

export const AUSTRALIAN_BUSINESS_SECTORS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Mining',
  'Tourism',
  'Agriculture',
  'Manufacturing',
  'Energy',
  'Construction',
  'Retail',
  'Transport',
  'Creative Industries',
  'Professional Services',
  'Government'
];

// === AUSTRALIAN MARKET OPPORTUNITIES ===

export const AUSTRALIAN_MARKET_OPPORTUNITIES = [
  {
    sector: 'Digital Transformation',
    estimatedValue: 15000000000, // $15B AUD
    growthRate: 12.5,
    keyDrivers: ['Cloud adoption', 'Remote work', 'Digital government initiatives']
  },
  {
    sector: 'Cybersecurity',
    estimatedValue: 8500000000, // $8.5B AUD
    growthRate: 15.2,
    keyDrivers: ['Increased cyber threats', 'Regulatory compliance', 'Remote work security']
  },
  {
    sector: 'AI and Machine Learning',
    estimatedValue: 12000000000, // $12B AUD
    growthRate: 22.8,
    keyDrivers: ['Automation demand', 'Data analytics', 'Predictive maintenance']
  },
  {
    sector: 'Clean Energy',
    estimatedValue: 45000000000, // $45B AUD
    growthRate: 8.9,
    keyDrivers: ['Net zero targets', 'Renewable energy transition', 'Battery storage']
  }
];

// === DEFAULT CONFIGURATION ===

export const DEFAULT_AUSTRALIAN_CONFIG = {
  timezone: 'Australia/Sydney' as const,
  currency: 'AUD' as const,
  businessHours: STANDARD_BUSINESS_HOURS,
  financialConfig: AUSTRALIAN_FINANCIAL_CONFIG,
  complianceFramework: AUSTRALIAN_COMPLIANCE_FRAMEWORK,
  holidayCalendar: AUSTRALIAN_HOLIDAY_CALENDAR_2025
};
