/**
 * Australian AI Communication System
 * Unite Group - AI-Powered Australian Business Communication
 */

import { AustralianPersonalizationEngine, AustralianUserProfile, AustralianPersonalizationContext } from './personalization-engine';
import { AustralianBusinessService } from './business-config';

export interface AustralianCommunicationSettings {
  tone: 'formal' | 'casual' | 'professional';
  urgency: 'low' | 'medium' | 'high';
  businessContext: 'initial_contact' | 'follow_up' | 'proposal' | 'support' | 'partnership';
  includeCulturalElements: boolean;
  respectBusinessHours: boolean;
  includeLocalReferences: boolean;
}

export interface AustralianMessageTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  culturalAdaptations: string[];
  appropriateTiming: string[];
  businessContexts: string[];
}

export interface AustralianCommunicationResponse {
  optimizedMessage: string;
  subject?: string;
  timing: {
    optimal: boolean;
    recommendedTime: string;
    reasoning: string;
  };
  culturalNotes: string[];
  followUpSuggestions: string[];
  compliance: {
    privacyCompliant: boolean;
    gstMentioned: boolean;
    businessHoursRespected: boolean;
  };
}

export interface AustralianEmailSignature {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  disclaimer: string;
  australianBusinessNumber?: string;
}

// Australian Communication Templates
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
  }
];

export class AustralianAICommunication {
  private personalizationEngine: AustralianPersonalizationEngine;
  private businessService: AustralianBusinessService;
  private messageTemplates: AustralianMessageTemplate[];

  constructor() {
    this.personalizationEngine = new AustralianPersonalizationEngine();
    this.businessService = new AustralianBusinessService();
    this.messageTemplates = AUSTRALIAN_MESSAGE_TEMPLATES;
  }

  /**
   * Optimize communication for Australian business culture
   */
  async optimizeCommunication(
    content: string,
    userProfile: AustralianUserProfile,
    settings: AustralianCommunicationSettings
  ): Promise<AustralianCommunicationResponse> {
    // Generate personalization context
    const context = await this.personalizationEngine.generatePersonalizationContext(userProfile);
    
    // Optimize message content
    const optimizedMessage = await this.optimizeMessageContent(content, userProfile, context, settings);
    
    // Generate timing recommendations
    const timing = this.optimizeTiming(userProfile, settings);
    
    // Extract cultural insights
    const culturalNotes = this.generateCulturalNotes(userProfile, settings);
    
    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(settings);
    
    // Check compliance
    const compliance = this.checkCompliance(optimizedMessage, settings);

    return {
      optimizedMessage,
      timing,
      culturalNotes,
      followUpSuggestions,
      compliance
    };
  }

  /**
   * Generate Australian business email using templates
   */
  generateEmailFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    userProfile: AustralianUserProfile,
    signature: AustralianEmailSignature
  ): {
    subject: string;
    body: string;
    signature: string;
  } {
    const template = this.messageTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Replace variables in template
    let body = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      body = body.replace(regex, value);
    });

    // Localize content for Australian English
    body = this.personalizationEngine.localizeToAustralianEnglish(body);

    // Generate subject line
    const subject = this.generateSubjectLine(template.category, variables, userProfile);

    // Format signature
    const formattedSignature = this.formatAustralianSignature(signature);

    return {
      subject,
      body,
      signature: formattedSignature
    };
  }

  /**
   * Optimize meeting scheduling for Australian time zones
   */
  optimizeMeetingScheduling(
    userProfile: AustralianUserProfile,
    meetingType: 'call' | 'video' | 'in-person',
    duration: number, // minutes
    urgency: 'low' | 'medium' | 'high'
  ): {
    recommendedTimes: string[];
    culturalConsiderations: string[];
    schedulingMessage: string;
  } {
    const timezone = userProfile.location.timezone;
    
    const recommendedTimes = this.generateMeetingTimes(timezone, duration, urgency);
    
    const culturalConsiderations = [
      'Australians value punctuality - arrive on time or slightly early',
      'Morning meetings (9-11 AM) are often preferred for important discussions',
      'Consider school pick-up times (3-4 PM) when scheduling with working parents',
      'Avoid scheduling during major Australian sporting events (AFL/NRL Grand Finals)',
      'Friday afternoons are traditionally more relaxed in Australian offices'
    ];

    if (timezone === 'Australia/Perth') {
      culturalConsiderations.push(
        'Perth is 2-3 hours behind eastern states - coordinate carefully for multi-city meetings'
      );
    }

    const schedulingMessage = this.generateSchedulingMessage(userProfile, meetingType, recommendedTimes);

    return {
      recommendedTimes,
      culturalConsiderations,
      schedulingMessage
    };
  }

  /**
   * Generate Australian business proposal structure
   */
  generateProposalStructure(
    proposalType: 'service' | 'partnership' | 'government' | 'enterprise',
    userProfile: AustralianUserProfile
  ): {
    structure: string[];
    requiredSections: string[];
    culturalAdaptations: string[];
    complianceRequirements: string[];
  } {
    const baseStructure = [
      'Executive Summary',
      'Understanding Your Requirements',
      'Proposed Solution',
      'Implementation Timeline',
      'Investment & Value',
      'Our Australian Presence',
      'Terms & Conditions',
      'Next Steps'
    ];

    let requiredSections: string[] = [];
    let culturalAdaptations: string[] = [];
    let complianceRequirements: string[] = [];

    switch (proposalType) {
      case 'government':
        requiredSections = [
          'Compliance with Australian Government procurement policies',
          'Local content requirements',
          'Security clearance information',
          'Previous government experience'
        ];
        complianceRequirements = [
          'Privacy Act 1988 compliance',
          'Government Information Security Manual (ISM) adherence',
          'Australian Government Procurement Rules compliance'
        ];
        break;

      case 'enterprise':
        requiredSections = [
          'Risk management approach',
          'Business continuity planning',
          'Australian regulatory compliance',
          'Local support structure'
        ];
        complianceRequirements = [
          'Corporations Act 2001 compliance',
          'Australian Consumer Law adherence',
          'Privacy Act 1988 compliance'
        ];
        break;

      case 'service':
        requiredSections = [
          'Service level agreements',
          'Australian business hours support',
          'Local escalation procedures',
          'GST and pricing transparency'
        ];
        break;

      case 'partnership':
        requiredSections = [
          'Mutual value proposition',
          'Australian market strategy',
          'Revenue sharing model',
          'Joint marketing approach'
        ];
        break;
    }

    culturalAdaptations = [
      'Direct, honest communication style',
      'Emphasis on practical benefits',
      'Recognition of Australian business values',
      'Fair dinkum approach to partnership',
      'Respect for Australian regulatory environment'
    ];

    return {
      structure: baseStructure,
      requiredSections,
      culturalAdaptations,
      complianceRequirements
    };
  }

  /**
   * Private helper methods
   */
  private async optimizeMessageContent(
    content: string,
    userProfile: AustralianUserProfile,
    context: AustralianPersonalizationContext,
    settings: AustralianCommunicationSettings
  ): Promise<string> {
    // Apply personalization
    const personalizedContent = this.personalizationEngine.personalizeContent(
      content,
      userProfile,
      context
    );

    let optimizedContent = personalizedContent.mainContent;

    // Add cultural elements if requested
    if (settings.includeCulturalElements) {
      optimizedContent = this.addCulturalElements(optimizedContent, userProfile, settings.tone);
    }

    // Add local references if requested
    if (settings.includeLocalReferences) {
      optimizedContent = this.addLocalReferences(optimizedContent, userProfile);
    }

    // Apply tone adjustments
    optimizedContent = this.adjustTone(optimizedContent, settings.tone, settings.urgency);

    return optimizedContent;
  }

  private optimizeTiming(
    userProfile: AustralianUserProfile,
    settings: AustralianCommunicationSettings
  ): {
    optimal: boolean;
    recommendedTime: string;
    reasoning: string;
  } {
    const isBusinessHours = this.businessService.isBusinessHours();
    const optimalTime = this.businessService.getOptimalContactTime();

    if (settings.respectBusinessHours && !isBusinessHours) {
      return {
        optimal: false,
        recommendedTime: optimalTime,
        reasoning: 'Outside business hours - recommend scheduling for business hours to respect work-life balance'
      };
    }

    const currentHour = new Date().getHours();
    let reasoning = '';

    if (currentHour >= 9 && currentHour <= 11) {
      reasoning = 'Optimal time - morning hours are preferred for important business communications in Australia';
    } else if (currentHour >= 14 && currentHour <= 16) {
      reasoning = 'Good time - afternoon hours work well for follow-ups and less urgent communications';
    } else if (currentHour >= 16 && currentHour <= 17) {
      reasoning = 'Fair time - late afternoon can work but consider urgency as people prepare to finish work';
    } else {
      reasoning = 'Consider rescheduling - this time may not be optimal for business communications';
    }

    return {
      optimal: currentHour >= 9 && currentHour <= 16,
      recommendedTime: optimalTime,
      reasoning
    };
  }

  private generateCulturalNotes(
    userProfile: AustralianUserProfile,
    settings: AustralianCommunicationSettings
  ): string[] {
    const notes: string[] = [];

    notes.push('Australians appreciate direct, honest communication without excessive formality');
    
    if (settings.tone === 'casual') {
      notes.push('Casual tone is acceptable in Australian business culture, but maintain professionalism');
    }

    if (userProfile.location.state === 'QLD') {
      notes.push('Queensland business culture tends to be more relaxed and relationship-focused');
    } else if (userProfile.location.state === 'NSW') {
      notes.push('Sydney business culture values efficiency and results-driven communication');
    } else if (userProfile.location.state === 'VIC') {
      notes.push('Melbourne business culture appreciates cultural awareness and innovation focus');
    }

    notes.push('Always include GST in pricing and respect Australian business hours');
    notes.push('Use Australian English spelling and terminology for professional credibility');

    return notes;
  }

  private generateFollowUpSuggestions(settings: AustralianCommunicationSettings): string[] {
    const suggestions: string[] = [];

    switch (settings.businessContext) {
      case 'initial_contact':
        suggestions.push('Follow up within 3-5 business days if no response');
        suggestions.push('Provide additional value in follow-up (industry insights, case studies)');
        break;
      case 'proposal':
        suggestions.push('Send a brief check-in 1 week after proposal delivery');
        suggestions.push('Offer to clarify any questions about Australian compliance requirements');
        break;
      case 'follow_up':
        suggestions.push('Space follow-ups 1-2 weeks apart to avoid being pushy');
        suggestions.push('Always provide new value or information in each follow-up');
        break;
    }

    suggestions.push('Respect Australian public holidays in follow-up timing');
    suggestions.push('Consider quarterly business relationship check-ins');

    return suggestions;
  }

  private checkCompliance(
    content: string,
    settings: AustralianCommunicationSettings
  ): {
    privacyCompliant: boolean;
    gstMentioned: boolean;
    businessHoursRespected: boolean;
  } {
    return {
      privacyCompliant: !content.includes('personal information') || content.includes('Privacy Act'),
      gstMentioned: content.includes('GST') || content.includes('including tax'),
      businessHoursRespected: settings.respectBusinessHours
    };
  }

  private addCulturalElements(content: string, _userProfile: AustralianUserProfile, tone: string): string {
    const culturalPhrases: Record<string, string[]> = {
      formal: ['we appreciate your consideration', 'looking forward to your response'],
      casual: ['no worries', 'happy to chat', 'cheers'],
      professional: ['we value the opportunity', 'keen to discuss further']
    };

    const phrases = culturalPhrases[tone] || culturalPhrases.professional;
    return content + ` ${phrases[0]}.`;
  }

  private addLocalReferences(content: string, userProfile: AustralianUserProfile): string {
    const localRefs: Record<string, string> = {
      'Sydney': 'harbour city',
      'Melbourne': 'cultural capital',
      'Brisbane': 'river city',
      'Perth': 'western gateway'
    };

    const ref = localRefs[userProfile.location.city];
    if (ref) {
      return content.replace(userProfile.location.city, `${userProfile.location.city}, Australia's ${ref}`);
    }
    return content;
  }

  private adjustTone(content: string, tone: string, urgency: string): string {
    // Tone adjustments would be applied here
    if (urgency === 'high' && !content.includes('urgent')) {
      content = 'I hope this reaches you in time. ' + content;
    }
    return content;
  }

  private generateSubjectLine(
    category: string,
    variables: Record<string, string>,
    userProfile: AustralianUserProfile
  ): string {
    const templates: Record<string, string> = {
      'First Contact': `Partnership Opportunity - ${variables.companyName || 'Your Business'}`,
      'Follow-up': `Following up: ${variables.topic || 'Our Previous Discussion'}`,
      'Business Proposal': `Proposal: ${variables.projectName || 'Business Opportunity'}`
    };

    return templates[category] || `Business Communication - ${userProfile.location.city}`;
  }

  private formatAustralianSignature(signature: AustralianEmailSignature): string {
    let formatted = `${signature.name}\n${signature.title}\n${signature.company}\n\n`;
    formatted += `📞 ${signature.phone}\n✉️ ${signature.email}\n🌐 ${signature.website}\n\n`;
    
    if (signature.australianBusinessNumber) {
      formatted += `ABN: ${signature.australianBusinessNumber}\n`;
    }
    
    formatted += `${signature.disclaimer}\n\n`;
    formatted += `This email and any attachments are confidential and may be subject to legal privilege.`;
    
    return formatted;
  }

  private generateMeetingTimes(timezone: string, duration: number, urgency: string): string[] {
    const times: string[] = [];
    const now = new Date();
    
    // Generate next few business days
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const morning = new Date(date);
      morning.setHours(10, 0, 0); // 10 AM
      
      const afternoon = new Date(date);
      afternoon.setHours(14, 0, 0); // 2 PM
      
      times.push(morning.toLocaleString('en-AU', { timeZone: timezone }));
      times.push(afternoon.toLocaleString('en-AU', { timeZone: timezone }));
    }
    
    return times.slice(0, 6); // Return 6 options
  }

  private generateSchedulingMessage(
    userProfile: AustralianUserProfile,
    meetingType: string,
    recommendedTimes: string[]
  ): string {
    return `Hi there,

I'd love to schedule a ${meetingType} to discuss this further. Here are some times that work well in ${userProfile.location.timezone.split('/')[1]}:

${recommendedTimes.map((time, index) => `${index + 1}. ${time}`).join('\n')}

Feel free to suggest an alternative time that suits your schedule better. I'm flexible and understand how busy things can get.

Looking forward to our conversation!

Cheers`;
  }
}

export default AustralianAICommunication;
