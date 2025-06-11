// Unite Group + CARSI Email Marketing Automation

import { createClient } from '@/lib/supabase/server';
import { UnifiedCustomer, CourseEnrollment, Project } from '@/lib/types/crm-integration';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email Campaign Types
export type CampaignType = 
  | 'welcome-series'
  | 'project-milestone'
  | 'course-recommendation'
  | 'bundle-promotion'
  | 'certification-reminder'
  | 're-engagement'
  | 'cross-sell';

// Email Template Configuration
export interface EmailCampaign {
  id: string;
  name: string;
  type: CampaignType;
  subject: string;
  previewText?: string;
  segments: CustomerSegment[];
  triggers: CampaignTrigger[];
  content: EmailContent;
  schedule?: CampaignSchedule;
  active: boolean;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
}

export interface SegmentCriteria {
  hasCompletedProject?: boolean;
  hasEnrolledInCourse?: boolean;
  lifetimeValue?: { min?: number; max?: number };
  lastActivityDays?: number;
  tags?: string[];
  bundleCustomer?: boolean;
  certificationExpiring?: boolean;
}

export interface CampaignTrigger {
  event: string;
  conditions?: Record<string, any>;
  delayMinutes?: number;
}

export interface EmailContent {
  templateId: string;
  dynamicFields: Record<string, string>;
  personalization: PersonalizationRule[];
}

export interface PersonalizationRule {
  field: string;
  type: 'customer-name' | 'company-name' | 'course-recommendation' | 'project-status' | 'custom';
  fallback?: string;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  sendTime?: string; // HH:MM format
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

// Predefined Email Campaigns
export const DEFAULT_CAMPAIGNS: EmailCampaign[] = [
  {
    id: 'welcome-unite-carsi',
    name: 'Welcome Series - Unite + CARSI',
    type: 'welcome-series',
    subject: 'Welcome to Unite Group & CARSI - Your Journey Starts Here',
    previewText: 'Discover how to maximize your partnership benefits',
    segments: [
      {
        id: 'new-customers',
        name: 'New Customers',
        criteria: {
          lastActivityDays: 7,
        },
      },
    ],
    triggers: [
      {
        event: 'customer-created',
        delayMinutes: 0,
      },
    ],
    content: {
      templateId: 'welcome-series-1',
      dynamicFields: {
        ctaUrl: '{{dashboardUrl}}',
        bundleUrl: '{{bundlePageUrl}}',
      },
      personalization: [
        {
          field: 'customerName',
          type: 'customer-name',
          fallback: 'Valued Customer',
        },
        {
          field: 'companyName',
          type: 'company-name',
          fallback: 'Your Organization',
        },
      ],
    },
    active: true,
  },
  {
    id: 'project-complete-training',
    name: 'Project Complete - Training Recommendations',
    type: 'course-recommendation',
    subject: '{{customerName}}, Enhance Your {{projectType}} Skills with CARSI',
    segments: [
      {
        id: 'completed-projects',
        name: 'Completed Projects',
        criteria: {
          hasCompletedProject: true,
          hasEnrolledInCourse: false,
        },
      },
    ],
    triggers: [
      {
        event: 'project-completed',
        delayMinutes: 1440, // 24 hours
      },
    ],
    content: {
      templateId: 'course-recommendations',
      dynamicFields: {
        recommendedCourses: '{{dynamicCourseList}}',
        discountCode: 'UNITE20',
      },
      personalization: [
        {
          field: 'customerName',
          type: 'customer-name',
        },
        {
          field: 'projectType',
          type: 'project-status',
        },
        {
          field: 'courseRecommendations',
          type: 'course-recommendation',
        },
      ],
    },
    active: true,
  },
  {
    id: 'bundle-vip-promotion',
    name: 'VIP Bundle Promotion',
    type: 'bundle-promotion',
    subject: 'Exclusive: Save ${{savings}} on Our Premium Bundles',
    segments: [
      {
        id: 'high-value-customers',
        name: 'High Value Customers',
        criteria: {
          lifetimeValue: { min: 50000 },
          bundleCustomer: false,
        },
      },
    ],
    triggers: [
      {
        event: 'manual',
      },
    ],
    content: {
      templateId: 'bundle-promotion-vip',
      dynamicFields: {
        bundleOptions: '{{personalizedBundles}}',
        expiryDate: '{{promotionExpiry}}',
      },
      personalization: [
        {
          field: 'savings',
          type: 'custom',
        },
      ],
    },
    schedule: {
      startDate: new Date(),
      frequency: 'monthly',
      sendTime: '10:00',
      timezone: 'Australia/Brisbane',
    },
    active: true,
  },
  {
    id: 'certification-expiry-series',
    name: 'Certification Expiry Reminder Series',
    type: 'certification-reminder',
    subject: 'Important: Your {{certificationType}} Certification Expires Soon',
    segments: [
      {
        id: 'expiring-certifications',
        name: 'Expiring Certifications',
        criteria: {
          certificationExpiring: true,
        },
      },
    ],
    triggers: [
      {
        event: 'certification-expiring-90-days',
        delayMinutes: 0,
      },
      {
        event: 'certification-expiring-30-days',
        delayMinutes: 0,
      },
      {
        event: 'certification-expiring-7-days',
        delayMinutes: 0,
      },
    ],
    content: {
      templateId: 'certification-reminder',
      dynamicFields: {
        renewalUrl: '{{carsiRenewalUrl}}',
        supportEmail: 'support@carsi.au',
      },
      personalization: [
        {
          field: 'certificationType',
          type: 'custom',
        },
      ],
    },
    active: true,
  },
  {
    id: 're-engagement-campaign',
    name: 'Win Back Campaign',
    type: 're-engagement',
    subject: "We've Missed You at Unite Group & CARSI",
    segments: [
      {
        id: 'inactive-customers',
        name: 'Inactive Customers',
        criteria: {
          lastActivityDays: 90,
          lifetimeValue: { min: 10000 },
        },
      },
    ],
    triggers: [
      {
        event: 'customer-inactive-90-days',
      },
    ],
    content: {
      templateId: 're-engagement',
      dynamicFields: {
        specialOfferCode: 'COMEBACK25',
        expiryDate: '{{offerExpiry}}',
      },
      personalization: [
        {
          field: 'lastProjectName',
          type: 'project-status',
        },
      ],
    },
    active: true,
  },
];

/**
 * Send marketing email to customer
 */
export async function sendMarketingEmail(
  customer: UnifiedCustomer,
  campaign: EmailCampaign,
  data?: Record<string, any>
): Promise<EmailResult> {
  try {
    // Check if customer has opted in
    if (!customer.engagementAnalytics.communicationPreferences.marketingEmails) {
      return {
        success: false,
        message: 'Customer has opted out of marketing emails',
      };
    }

    // Personalize content
    const personalizedContent = await personalizeContent(customer, campaign.content, data);
    const personalizedSubject = await personalizeText(campaign.subject, customer, data);

    // Send email via Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Unite Group & CARSI <noreply@unitegroup.com.au>',
      to: customer.basicInfo.email,
      subject: personalizedSubject,
      html: personalizedContent,
      tags: [
        { name: 'campaign', value: campaign.id },
        { name: 'customer', value: customer.customerId },
        { name: 'type', value: campaign.type },
      ],
    });

    if (error) {
      throw error;
    }

    // Record email sent
    await recordEmailSent(customer.customerId, campaign.id, emailData?.id);

    return {
      success: true,
      message: 'Email sent successfully',
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Marketing email error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Personalize email content
 */
async function personalizeContent(
  customer: UnifiedCustomer,
  content: EmailContent,
  data?: Record<string, any>
): Promise<string> {
  // In production, this would fetch and render the email template
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Hello ${customer.basicInfo.firstName}!</h1>
      <p>This is a personalized email for ${customer.basicInfo.company?.name || 'your organization'}.</p>
  `;

  // Apply personalization rules
  for (const rule of content.personalization) {
    switch (rule.type) {
      case 'customer-name':
        html = html.replace(`{{${rule.field}}}`, customer.basicInfo.firstName || rule.fallback || '');
        break;
      case 'company-name':
        html = html.replace(`{{${rule.field}}}`, customer.basicInfo.company?.name || rule.fallback || '');
        break;
      case 'course-recommendation':
        const recommendations = await getPersonalizedCourseRecommendations(customer);
        html = html.replace(`{{${rule.field}}}`, recommendations);
        break;
      case 'project-status':
        const projectInfo = getLatestProjectInfo(customer);
        html = html.replace(`{{${rule.field}}}`, projectInfo);
        break;
      case 'custom':
        html = html.replace(`{{${rule.field}}}`, data?.[rule.field] || rule.fallback || '');
        break;
    }
  }

  // Replace dynamic fields
  for (const [key, value] of Object.entries(content.dynamicFields)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  html += '</div>';
  return html;
}

/**
 * Personalize text (subject, preview, etc.)
 */
async function personalizeText(
  text: string,
  customer: UnifiedCustomer,
  data?: Record<string, any>
): Promise<string> {
  let personalizedText = text;

  // Replace customer fields
  personalizedText = personalizedText.replace(/{{customerName}}/g, customer.basicInfo.firstName);
  personalizedText = personalizedText.replace(/{{companyName}}/g, customer.basicInfo.company?.name || '');
  
  // Replace custom data fields
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      personalizedText = personalizedText.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  }

  return personalizedText;
}

/**
 * Get personalized course recommendations
 */
async function getPersonalizedCourseRecommendations(customer: UnifiedCustomer): Promise<string> {
  // Based on completed projects and current enrollments
  const recommendations: string[] = [];

  // Check recent projects
  const recentProjects = customer.uniteServices.activeProjects.filter(p => p.status === 'completed');
  
  for (const project of recentProjects) {
    switch (project.type) {
      case 'software':
        recommendations.push('Advanced Web Development Masterclass');
        recommendations.push('Cloud Architecture Fundamentals');
        break;
      case 'seo':
        recommendations.push('Digital Marketing Certification');
        recommendations.push('Content Strategy Workshop');
        break;
      case 'strategy':
        recommendations.push('Leadership Excellence Program');
        recommendations.push('Change Management Essentials');
        break;
    }
  }

  // Format as HTML list
  return recommendations.length > 0 
    ? `<ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`
    : '<p>Explore our full course catalog for options that match your interests.</p>';
}

/**
 * Get latest project information
 */
function getLatestProjectInfo(customer: UnifiedCustomer): string {
  const latestProject = customer.uniteServices.activeProjects
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];

  if (latestProject) {
    return `${latestProject.name} (${latestProject.type})`;
  }

  return 'your recent project';
}

/**
 * Record email sent for analytics
 */
async function recordEmailSent(
  customerId: string,
  campaignId: string,
  emailId?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from('email_analytics').insert({
      customer_id: customerId,
      campaign_id: campaignId,
      email_id: emailId,
      sent_at: new Date().toISOString(),
      status: 'sent',
    });
  } catch (error) {
    console.error('Failed to record email analytics:', error);
  }
}

/**
 * Process email campaign for a segment
 */
export async function processCampaignSegment(
  campaign: EmailCampaign,
  segment: CustomerSegment
): Promise<CampaignResult> {
  try {
    const supabase = await createClient();
    
    // Get customers matching segment criteria
    const customers = await getSegmentCustomers(segment);
    
    const results = {
      total: customers.length,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Send emails to each customer
    for (const customer of customers) {
      const result = await sendMarketingEmail(customer, campaign);
      
      if (result.success) {
        results.sent++;
      } else if (result.message?.includes('opted out')) {
        results.skipped++;
      } else {
        results.failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      campaign: campaign.name,
      segment: segment.name,
      results,
    };
  } catch (error) {
    console.error('Campaign processing error:', error);
    return {
      success: false,
      campaign: campaign.name,
      segment: segment.name,
      error: error instanceof Error ? error.message : 'Campaign failed',
    };
  }
}

/**
 * Get customers matching segment criteria
 */
async function getSegmentCustomers(segment: CustomerSegment): Promise<UnifiedCustomer[]> {
  // In production, this would query the database based on criteria
  // For now, return mock data
  return [];
}

// Type definitions
export interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

export interface CampaignResult {
  success: boolean;
  campaign: string;
  segment: string;
  results?: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  error?: string;
}
