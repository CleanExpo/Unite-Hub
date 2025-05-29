/**
 * Australian Personalization Engine
 * Unite Group - Australian Customer Experience Focus
 */

import { AustralianBusinessService } from './business-config';
import { AustralianMarketAnalyzer } from './market-analysis';

export interface AustralianUserProfile {
  id: string;
  location: {
    city: string;
    state: string;
    postcode: string;
    timezone: 'Australia/Sydney' | 'Australia/Melbourne' | 'Australia/Brisbane' | 'Australia/Perth';
  };
  preferences: {
    language: 'en-AU';
    communicationStyle: 'formal' | 'casual' | 'professional';
    contactHours: {
      start: string;
      end: string;
      days: string[];
    };
    industries: string[];
    businessSize: 'startup' | 'sme' | 'enterprise' | 'government';
  };
  behavior: {
    lastActive: Date;
    sessionCount: number;
    averageSessionDuration: number; // minutes
    preferredContent: string[];
    engagementScore: number; // 0-1
  };
  demographics: {
    businessRole: string;
    companySize: number;
    industry: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
  };
}

export interface AustralianPersonalizationContext {
  currentTime: Date;
  isBusinessHours: boolean;
  optimalContactTime: string;
  localWeather?: string;
  marketTrends: string[];
  competitiveInsights: string[];
  recommendations: string[];
  culturalContext: {
    greetingStyle: string;
    communicationTone: string;
    localReferences: string[];
    businessEtiquette: string[];
  };
}

export interface PersonalizedContent {
  greeting: string;
  mainContent: string;
  callToAction: string;
  additionalInfo: string[];
  localContext: string;
  culturalAdaptation: string;
}

export interface AustralianBusinessEtiquette {
  greetings: {
    formal: string[];
    casual: string[];
    professional: string[];
  };
  communication: {
    emailStyle: string[];
    phoneStyle: string[];
    meetingStyle: string[];
  };
  culturalReferences: {
    businessMetaphors: string[];
    localSayings: string[];
    industryTerms: Record<string, string[]>;
  };
  timeReferences: {
    businessHours: string[];
    holidays: string[];
    seasons: string[];
  };
}

interface StateCustomization {
  services: string[];
  regulations: string[];
  opportunities: string[];
  events: string[];
}

// Australian Business Etiquette Configuration
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

export class AustralianPersonalizationEngine {
  private businessService: AustralianBusinessService;
  private marketAnalyzer: AustralianMarketAnalyzer;
  private etiquette: AustralianBusinessEtiquette;

  constructor() {
    this.businessService = new AustralianBusinessService();
    this.marketAnalyzer = new AustralianMarketAnalyzer();
    this.etiquette = AUSTRALIAN_BUSINESS_ETIQUETTE;
  }

  /**
   * Generate personalized context for Australian users
   */
  async generatePersonalizationContext(
    userProfile: AustralianUserProfile
  ): Promise<AustralianPersonalizationContext> {
    const currentTime = new Date();
    const isBusinessHours = this.businessService.isBusinessHours();
    const optimalContactTime = this.businessService.getOptimalContactTime();
    
    // Get market insights for user's city
    const marketInsights = await this.marketAnalyzer.getMarketInsights(userProfile.location.city);
    
    // Generate cultural context
    const culturalContext = this.generateCulturalContext(userProfile);
    
    return {
      currentTime,
      isBusinessHours,
      optimalContactTime,
      marketTrends: marketInsights.trends.map(t => t.description),
      competitiveInsights: marketInsights.competitors.map(c => 
        `${c.name} focuses on ${c.targetMarket.join(', ')} with ${c.pricingStrategy} pricing`
      ),
      recommendations: marketInsights.recommendations,
      culturalContext
    };
  }

  /**
   * Personalize content for Australian audience
   */
  personalizeContent(
    baseContent: string,
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext
  ): PersonalizedContent {
    const greeting = this.generatePersonalizedGreeting(userProfile, context);
    const localizedContent = this.localizeContent(baseContent, userProfile, context);
    const callToAction = this.generateLocalizedCTA(userProfile, context);
    const additionalInfo = this.generateLocalInformation(userProfile, context);
    const localContext = this.generateLocalContext(userProfile);
    const culturalAdaptation = this.applyCulturalAdaptation();

    return {
      greeting,
      mainContent: localizedContent,
      callToAction,
      additionalInfo,
      localContext,
      culturalAdaptation
    };
  }

  /**
   * Optimize communication timing for Australian time zones
   */
  optimizeContactTiming(userProfile: AustralianUserProfile): {
    optimalTime: string;
    timeZone: string;
    businessDayRecommendation: string;
    culturalConsiderations: string[];
  } {
    const optimalTime = this.businessService.getOptimalContactTime();
    const nextBusinessDay = this.businessService.getNextBusinessDay();
    
    const culturalConsiderations = [
      'Respect for work-life balance is important in Australian business culture',
      'Morning meetings (9-11 AM) are often preferred for important discussions',
      'Friday afternoons are typically less formal in Australian offices',
      'Consider school holidays when scheduling with parents in business roles'
    ];

    if (userProfile.location.timezone === 'Australia/Perth') {
      culturalConsiderations.push(
        'Perth is 3 hours behind Sydney/Melbourne - coordinate timing carefully'
      );
    }

    return {
      optimalTime,
      timeZone: userProfile.location.timezone,
      businessDayRecommendation: nextBusinessDay.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      culturalConsiderations
    };
  }

  /**
   * Generate state-based service customization
   */
  customizeForState(
    userProfile: AustralianUserProfile
  ): {
    stateSpecificServices: string[];
    localRegulations: string[];
    marketOpportunities: string[];
    networkingEvents: string[];
  } {
    const stateCustomizations: Record<string, StateCustomization> = {
      'NSW': {
        services: ['NSW Government digital services', 'Sydney fintech solutions', 'Harbour city networking'],
        regulations: ['NSW Fair Trading compliance', 'Sydney council requirements', 'State planning laws'],
        opportunities: ['Government procurement opportunities', 'Financial services expansion', 'Tourism tech solutions'],
        events: ['Sydney Tech Week', 'NSW Business Chamber events', 'Startup Sydney meetups']
      },
      'VIC': {
        services: ['Victoria State Government solutions', 'Melbourne startup ecosystem', 'Creative industry focus'],
        regulations: ['Victorian Consumer Affairs', 'Melbourne city council', 'Creative industries regulations'],
        opportunities: ['Arts and culture tech', 'Education technology', 'Manufacturing innovation'],
        events: ['Melbourne Knowledge Week', 'Victorian Chamber events', 'Creative Victoria programs']
      },
      'QLD': {
        services: ['Queensland Government services', 'Brisbane business hub', 'Tourism and mining tech'],
        regulations: ['Queensland Fair Trading', 'Brisbane city council', 'Mining industry compliance'],
        opportunities: ['Tourism technology', 'Resource sector innovation', 'Agricultural tech'],
        events: ['Brisbane Innovation Festival', 'QLD Business events', 'Mining technology conferences']
      },
      'WA': {
        services: ['WA Government solutions', 'Perth mining tech', 'Energy sector innovation'],
        regulations: ['WA Consumer Protection', 'Perth council requirements', 'Mining regulations'],
        opportunities: ['Mining technology', 'Energy innovation', 'Maritime solutions'],
        events: ['Perth Tech events', 'WA Business Chamber', 'Mining conferences']
      }
    };

    const defaultCustomization: StateCustomization = {
      services: ['Australian Government services', 'National business solutions'],
      regulations: ['Australian Consumer Law', 'National compliance requirements'],
      opportunities: ['National market opportunities', 'Cross-state business expansion'],
      events: ['National business conferences', 'Industry associations']
    };

    const customization = stateCustomizations[userProfile.location.state] || defaultCustomization;

    return {
      stateSpecificServices: customization.services,
      localRegulations: customization.regulations,
      marketOpportunities: customization.opportunities,
      networkingEvents: customization.events
    };
  }

  /**
   * Apply Australian English localization
   */
  localizeToAustralianEnglish(content: string): string {
    const australianLocalization = {
      // Spelling corrections
      'optimize': 'optimise',
      'organize': 'organise',
      'analyze': 'analyse',
      'realize': 'realise',
      'center': 'centre',
      'color': 'colour',
      'labor': 'labour',
      'favor': 'favour',
      
      // Currency
      '$': 'AUD $',
      'dollars': 'Australian dollars',
      
      // Business terms
      'cell phone': 'mobile phone',
      'apartment': 'unit',
      'elevator': 'lift',
      'parking lot': 'car park',
      
      // Time references
      'vacation': 'holiday',
      'fall': 'autumn',
      
      // Business language
      'check': 'cheque',
      'license': 'licence'
    };

    let localizedContent = content;
    Object.entries(australianLocalization).forEach(([american, australian]) => {
      const regex = new RegExp(`\\b${american}\\b`, 'gi');
      localizedContent = localizedContent.replace(regex, australian);
    });

    return localizedContent;
  }

  /**
   * Private helper methods
   */
  private generateCulturalContext(userProfile: AustralianUserProfile): {
    greetingStyle: string;
    communicationTone: string;
    localReferences: string[];
    businessEtiquette: string[];
  } {
    const style = userProfile.preferences.communicationStyle;
    
    return {
      greetingStyle: this.etiquette.greetings[style][0],
      communicationTone: style,
      localReferences: this.etiquette.culturalReferences.businessMetaphors.slice(0, 3),
      businessEtiquette: this.etiquette.communication.emailStyle.slice(0, 3)
    };
  }

  private generatePersonalizedGreeting(
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext
  ): string {
    const style = userProfile.preferences.communicationStyle;
    const timeOfDay = this.getTimeOfDayGreeting();
    const baseGreeting = this.etiquette.greetings[style][0];
    
    if (context.isBusinessHours) {
      return `${timeOfDay}! ${baseGreeting}`;
    } else {
      return `${baseGreeting} - I hope this message finds you well outside of business hours`;
    }
  }

  private localizeContent(
    content: string,
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext
  ): string {
    let localizedContent = this.localizeToAustralianEnglish(content);
    
    // Add local market context
    if (context.marketTrends.length > 0) {
      localizedContent += ` Given the current ${context.marketTrends[0].toLowerCase()} in ${userProfile.location.city}, this presents excellent opportunities for your business.`;
    }
    
    return localizedContent;
  }

  private generateLocalizedCTA(
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext
  ): string {
    const businessSize = userProfile.preferences.businessSize;
    const location = userProfile.location.city;
    
    if (context.isBusinessHours) {
      return `Ready to discuss how this can benefit your ${businessSize} in ${location}? Let's have a chat during business hours.`;
    } else {
      return `Interested in learning more? We'll be in touch during business hours (9 AM - 5 PM AEST/AEDT) or at your preferred time.`;
    }
  }

  private generateLocalInformation(
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext
  ): string[] {
    const info: string[] = [];
    
    // Add GST information for business context
    info.push('All pricing includes GST (10%) as per Australian tax requirements');
    
    // Add local business hours
    info.push(`Our ${userProfile.location.city} team is available during business hours (9 AM - 5 PM ${userProfile.location.timezone.split('/')[1]} time)`);
    
    // Add relevant market insights
    if (context.recommendations.length > 0) {
      info.push(`Local market insight: ${context.recommendations[0]}`);
    }
    
    return info;
  }

  private generateLocalContext(userProfile: AustralianUserProfile): string {
    return `Based in ${userProfile.location.city}, ${userProfile.location.state}, we understand the local business environment and can provide tailored solutions for the Australian market.`;
  }

  private applyCulturalAdaptation(): string {
    const adaptations = [
      'We value the Australian approach to business - direct, honest, and relationship-focused',
      'Our solutions are designed with Australian compliance and cultural considerations in mind',
      'We understand the importance of work-life balance in Australian business culture'
    ];
    
    return adaptations[Math.floor(Math.random() * adaptations.length)];
  }

  private getTimeOfDayGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Calculate engagement score based on Australian business patterns
   */
  calculateEngagementScore(userProfile: AustralianUserProfile): number {
    let score = 0;
    
    // Frequency of interaction
    const daysSinceLastActive = Math.floor(
      (Date.now() - userProfile.behavior.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActive <= 1) score += 0.3;
    else if (daysSinceLastActive <= 7) score += 0.2;
    else if (daysSinceLastActive <= 30) score += 0.1;
    
    // Session quality
    if (userProfile.behavior.averageSessionDuration > 5) score += 0.2;
    if (userProfile.behavior.sessionCount > 10) score += 0.2;
    
    // Business context relevance
    if (userProfile.preferences.industries.length > 0) score += 0.1;
    if (userProfile.demographics.businessRole.includes('decision') || userProfile.demographics.businessRole.includes('manager')) score += 0.2;
    
    return Math.min(score, 1);
  }
}

export default AustralianPersonalizationEngine;
