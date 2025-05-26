/**
 * Email Marketing Types
 * Type definitions for email marketing capabilities
 */

/**
 * Email template types supported by the system
 */
export type EmailTemplateType = 
  | 'newsletter'
  | 'welcome'
  | 'announcement'
  | 'promotion'
  | 'blog-update'
  | 'event-invitation'
  | 'survey'
  | 'follow-up'
  | 'custom';

/**
 * Basic email template structure
 */
export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
  htmlContent?: string;
  preheader?: string;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
  sendCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Email subscription status
 */
export type SubscriptionStatus = 
  | 'subscribed'
  | 'unsubscribed'
  | 'pending'
  | 'cleaned'
  | 'bounced';

/**
 * Subscriber information
 */
export interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: SubscriptionStatus;
  subscribedAt: string;
  unsubscribedAt?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  lastEmailSentAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Email list or segment
 */
export interface EmailList {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Email campaign types
 */
export type CampaignType = 
  | 'regular'
  | 'automated'
  | 'ab-test'
  | 'rss'
  | 'transactional';

/**
 * Email campaign status
 */
export type CampaignStatus = 
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'canceled'
  | 'failed';

/**
 * Email campaign tracking metrics
 */
export interface CampaignMetrics {
  recipients: number;
  opens: number;
  uniqueOpens: number;
  openRate: number;
  clicks: number;
  uniqueClicks: number;
  clickRate: number;
  bounces: number;
  bounceRate: number;
  unsubscribes: number;
  unsubscribeRate: number;
  complaints: number;
}

/**
 * Email campaign information
 */
export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  subject: string;
  preheader?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  templateId?: string;
  content?: string;
  htmlContent?: string;
  listIds: string[];
  segmentIds?: string[];
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  metrics?: CampaignMetrics;
  metadata?: Record<string, any>;
}

/**
 * AB Testing variant
 */
export interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  content?: string;
  htmlContent?: string;
  metrics?: CampaignMetrics;
}

/**
 * AB Test campaign settings
 */
export interface ABTestCampaign extends Campaign {
  type: 'ab-test';
  variants: ABTestVariant[];
  testSize: number; // Percentage of recipients for testing (e.g., 20%)
  winningCriteria: 'opens' | 'clicks';
  testDuration: number; // Hours
}

/**
 * Email provider-specific settings
 */
export interface EmailProviderSettings {
  provider: 'sendgrid' | 'mailchimp' | 'ses' | 'custom';
  apiKey?: string;
  apiEndpoint?: string;
  defaultFromName?: string;
  defaultFromEmail?: string;
  defaultReplyTo?: string;
  webhookUrl?: string;
  ipPool?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  footerEnabled?: boolean;
  footerText?: string;
}
