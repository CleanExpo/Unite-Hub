/**
 * SendGrid Email Marketing Client
 * Integration with SendGrid API for email marketing capabilities
 */

import { ApiClient, ApiKeyAuthStrategy, RetryStrategy } from '@/lib/api';
import {
  EmailTemplate,
  Subscriber,
  EmailList,
  Campaign,
  CampaignMetrics,
  SubscriptionStatus,
  CampaignStatus
} from './types';
import { nanoid } from 'nanoid';

/**
 * SendGrid client configuration
 */
interface SendGridConfig {
  apiKey: string;
  defaultFromName?: string;
  defaultFromEmail?: string;
  defaultReplyTo?: string;
  apiVersion?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * SendGrid client for email marketing
 */
export class SendGridClient {
  private client: ApiClient;
  private defaultFromName: string;
  private defaultFromEmail: string;
  private defaultReplyTo: string;

  constructor(config: SendGridConfig) {
    // Set up auth strategy with SendGrid API key
    const authStrategy = new ApiKeyAuthStrategy(
      config.apiKey,
      'Authorization',
      'Bearer'
    );

    // Create retry strategy
    const retryStrategy = new RetryStrategy({
      maxRetries: config.maxRetries || 5,
      initialDelay: 100,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: true,
      retryableStatuses: [429, 500, 503, 504],
      nonRetryableStatuses: [400, 401, 403, 404],
    });

    // Create API client
    this.client = new ApiClient({
      baseUrl: 'https://api.sendgrid.com/v3',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000,
      authStrategy,
      retryStrategy,
    });

    // Store default sender info
    this.defaultFromName = config.defaultFromName || 'UNITE Group';
    this.defaultFromEmail = config.defaultFromEmail || 'noreply@unite-group.com';
    this.defaultReplyTo = config.defaultReplyTo || this.defaultFromEmail;
  }

  /**
   * Get the API client for direct access if needed
   */
  public getClient(): ApiClient {
    return this.client;
  }

  /**
   * Create a new email template
   */
  public async createTemplate(params: {
    name: string;
    type: EmailTemplate['type'];
    subject: string;
    content: string;
    htmlContent?: string;
    preheader?: string;
  }): Promise<EmailTemplate> {
    try {
      // SendGrid API doesn't exactly match our types, so we need to transform
      const response = await this.client.post('/templates', {
        name: params.name,
        generation: 'dynamic',
      });

      const templateId = response.id;

      // Create a template version
      await this.client.post(`/templates/${templateId}/versions`, {
        name: params.name,
        subject: params.subject,
        html_content: params.htmlContent || this.convertToHtml(params.content),
        plain_content: params.content,
        active: 1,
      });

      // Format the response to match our EmailTemplate type
      return {
        id: templateId,
        name: params.name,
        type: params.type,
        subject: params.subject,
        content: params.content,
        htmlContent: params.htmlContent || this.convertToHtml(params.content),
        preheader: params.preheader,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sendCount: 0,
      };
    } catch (error) {
      console.error('Error creating template in SendGrid:', error);
      throw error;
    }
  }

  /**
   * Retrieve all templates
   */
  public async getTemplates(params?: {
    limit?: number;
    offset?: number;
  }): Promise<EmailTemplate[]> {
    try {
      const response = await this.client.get('/templates', {
        params: {
          generations: 'dynamic',
          page_size: params?.limit || 100,
          page_token: params?.offset || undefined,
        },
      });

      // Transform the response to match our EmailTemplate type
      return response.result.map((template: any) => ({
        id: template.id,
        name: template.name,
        type: this.determineTemplateType(template.name),
        subject: template.versions?.[0]?.subject || '',
        content: template.versions?.[0]?.plain_content || '',
        htmlContent: template.versions?.[0]?.html_content || '',
        createdAt: new Date(template.versions?.[0]?.updated_at * 1000).toISOString(),
        updatedAt: new Date(template.versions?.[0]?.updated_at * 1000).toISOString(),
      }));
    } catch (error) {
      console.error('Error retrieving templates from SendGrid:', error);
      throw error;
    }
  }

  /**
   * Get a specific template
   */
  public async getTemplate(id: string): Promise<EmailTemplate> {
    try {
      const response = await this.client.get(`/templates/${id}`);

      // Get the active version
      const versionsResponse = await this.client.get<{ versions: any[] }>(`/templates/${id}/versions`);
      const activeVersion = versionsResponse.versions.find((v: any) => v.active === 1) || versionsResponse.versions[0];

      return {
        id: response.id,
        name: response.name,
        type: this.determineTemplateType(response.name),
        subject: activeVersion?.subject || '',
        content: activeVersion?.plain_content || '',
        htmlContent: activeVersion?.html_content || '',
        createdAt: new Date(activeVersion?.updated_at * 1000).toISOString(),
        updatedAt: new Date(activeVersion?.updated_at * 1000).toISOString(),
      };
    } catch (error) {
      console.error(`Error retrieving template ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  public async updateTemplate(id: string, params: {
    name?: string;
    subject?: string;
    content?: string;
    htmlContent?: string;
    preheader?: string;
  }): Promise<EmailTemplate> {
    try {
      // First, get the existing template to find the active version
      const template = await this.getTemplate(id);

      // Get all versions
      const versionsResponse = await this.client.get<{ versions: any[] }>(`/templates/${id}/versions`);
      const activeVersion = versionsResponse.versions.find((v: any) => v.active === 1) || versionsResponse.versions[0];

      // Update the template
      if (params.name) {
        await this.client.patch(`/templates/${id}`, {
          name: params.name,
        });
      }

      // Update the version
      if (params.subject || params.content || params.htmlContent) {
        await this.client.patch(`/templates/${id}/versions/${activeVersion.id}`, {
          name: params.name || template.name,
          subject: params.subject || template.subject,
          html_content: params.htmlContent || template.htmlContent,
          plain_content: params.content || template.content,
        });
      }

      // Return the updated template
      return {
        ...template,
        name: params.name || template.name,
        subject: params.subject || template.subject,
        content: params.content || template.content,
        htmlContent: params.htmlContent || template.htmlContent,
        preheader: params.preheader || template.preheader,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error updating template ${id} in SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/templates/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting template ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Create a new list (in SendGrid terms, this is a "list")
   */
  public async createList(params: {
    name: string;
    description?: string;
  }): Promise<EmailList> {
    try {
      const response = await this.client.post('/marketing/lists', {
        name: params.name,
        description: params.description || '',
      });

      return {
        id: response.id,
        name: response.name,
        description: params?.description || '',
        subscriberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating list in SendGrid:', error);
      throw error;
    }
  }

  /**
   * Get all lists
   */
  public async getLists(params?: {
    limit?: number;
    offset?: number;
  }): Promise<EmailList[]> {
    try {
      const response = await this.client.get('/marketing/lists', {
        params: {
          page_size: params?.limit || 100,
          page_token: params?.offset || undefined,
        },
      });

      return response.result.map((list: any) => ({
        id: list.id,
        name: list.name,
        description: list.description || '',
        subscriberCount: list.contact_count || 0,
        createdAt: new Date(list.created_at).toISOString(),
        updatedAt: new Date(list.updated_at).toISOString(),
      }));
    } catch (error) {
      console.error('Error retrieving lists from SendGrid:', error);
      throw error;
    }
  }

  /**
   * Get a specific list
   */
  public async getList(id: string): Promise<EmailList> {
    try {
      const response = await this.client.get(`/marketing/lists/${id}`);

      return {
        id: response.id,
        name: response.name,
        description: response.description || '',
        subscriberCount: response.contact_count || 0,
        createdAt: new Date(response.created_at).toISOString(),
        updatedAt: new Date(response.updatedAt).toISOString(),
      };
    } catch (error) {
      console.error(`Error retrieving list ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Update a list
   */
  public async updateList(id: string, params: {
    name?: string;
    description?: string;
  }): Promise<EmailList> {
    try {
      const response = await this.client.patch(`/marketing/lists/${id}`, {
        name: params.name,
        description: params.description,
      });

      return {
        id: response.id,
        name: response.name,
        description:  params?.description || '',
        subscriberCount: response.contact_count || 0,
        createdAt: new Date(response.created_at).toISOString(),
        updatedAt: new Date(response.updatedAt).toISOString(),
      };
    } catch (error) {
      console.error(`Error updating list ${id} in SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Delete a list
   */
  public async deleteList(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/marketing/lists/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting list ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Add a subscriber to a list
   */
  public async addSubscriber(
    params: {
      email: string;
      firstName?: string;
      lastName?: string;
      listIds?: string[];
      customFields?: Record<string, any>;
    }
  ): Promise<Subscriber> {
    try {
      // Create contact in SendGrid
      await this.client.put('/marketing/contacts', {
        contacts: [
          {
            email: params.email,
            first_name: params.firstName || '',
            last_name: params.lastName || '',
            custom_fields: params.customFields || {},
          },
        ],
        list_ids: params.listIds || [],
      });

      // Retrieve the created contact
      const searchResponse = await this.client.post<{ result: any[] }>('/marketing/contacts/search', {
        query: `email = '${params.email}'`,
      });

      const contact = searchResponse.result?.[0];

      if (!contact) {
        throw new Error(`Failed to find newly created contact: ${params?.email}`);
      }

      return {
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name || undefined,
        lastName: contact.lastName || undefined,
        status: this.mapSendGridStatus(contact.contact_status),
        subscribedAt: new Date(contact.created_at).toISOString(),
        customFields: contact.custom_fields || {},
      };
    } catch (error: any) {
      console.error(`Error adding subscriber ${params?.email} to SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Get a subscriber by email
   */
  public async getSubscriber(email: string): Promise<Subscriber | null> {
    try {
      const response = await this.client.post<{ result: any[] }>('/marketing/contacts/search', {
        query: `email = '${email}'`,
      });

      const contact = response.result?.[0];

      if (!contact) {
        return null;
      }

      return {
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name || undefined,
        lastName: contact.last_name || undefined,
        status: this.mapSendGridStatus(contact.contact_status),
        subscribedAt: new Date(contact.created_at).toISOString(),
        unsubscribedAt: contact.last_unsubscribed_at
          ? new Date(contact.last_unsubscribed_at).toISOString()
          : undefined,
        customFields: contact.custom_fields || {},
      };
    } catch (error: any) {
      console.error(`Error retrieving subscriber ${email} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Update a subscriber
   */
  public async updateSubscriber(
    email: string,
    params: {
      firstName?: string;
      lastName?: string;
      status?: SubscriptionStatus;
      customFields?: Record<string, any>;
    }
  ): Promise<Subscriber> {
    try {
      // First, get the existing subscriber to get the ID
      const subscriber = await this.getSubscriber(email);

      if (!subscriber) {
        throw new Error(`Subscriber not found: ${email}`);
      }

      // Update the contact
      await this.client.put('/marketing/contacts', {
        contacts: [
          {
            email,
            firstName: params.firstName !== undefined ? params.firstName : subscriber.firstName,
            lastName: params.lastName !== undefined ? params.lastName : subscriber.lastName,
            custom_fields: params.customFields || subscriber.customFields || {},
          },
        ],
      });

      // If status is changing to unsubscribed, handle that separately
      if (params.status === 'unsubscribed' && subscriber.status !== 'unsubscribed') {
        await this.client.post('/marketing/contacts/unsubscribe', {
          emails: [email],
        });
      }

      // Get the updated subscriber
      const updatedSubscriber = await this.getSubscriber(email);

      if (!updatedSubscriber) {
        throw new Error(`Failed to retrieve updated subscriber: ${email}`);
      }

      return updatedSubscriber;
    } catch (error: any) {
      console.error(`Error updating subscriber ${email} in SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Delete a subscriber
   */
  public async deleteSubscriber(email: string): Promise<boolean> {
    try {
      // SendGrid requires the ID to delete a contact
      const subscriber = await this.getSubscriber(email);
      
      if (!subscriber) {
        // Already deleted, return success
        return true;
      }

      await this.client.delete('/marketing/contacts', {
        params: {
          ids: subscriber.id,
        },
      });

      return true;
    } catch (error) {
      console.error(`Error deleting subscriber ${email} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Create a campaign
   */
  public async createCampaign(params: {
    name: string;
    subject: string;
    content?: string;
    htmlContent?: string;
    preheader?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    listIds: string[];
    templateId?: string;
    scheduledAt?: Date;
  }): Promise<Campaign> {
    try {
      // If templateId is provided but not content, fetch the template
      let htmlContent = params.htmlContent;
      let content = params.content;
      
      if (params.templateId && !htmlContent) {
        const template = await this.getTemplate(params.templateId);
        htmlContent = template.htmlContent;
        content = template.content;
      }

      const fromName = params.fromName || this.defaultFromName;
      const fromEmail = params.fromEmail || this.defaultFromEmail;
      const replyTo = params.replyTo || this.defaultReplyTo;
      
      // Create the SendGrid campaign
      const response = await this.client.post<{ id: string }>('/marketing/singlesends', {
        name: params.name,
        send_to: {
          list_ids: params.listIds,
        },
        email_config: {
          subject: params.subject,
          html_content: htmlContent,
          plain_content: content,
          sender_id: 1, // This is usually required by SendGrid
          suppression_group_id: 1, // This is usually required by SendGrid
          custom_unsubscribe_url: '',
          ip_pool: '',
        },
        status: params.scheduledAt ? 'scheduled' : 'draft',
        send_at: params.scheduledAt ? params.scheduledAt.toISOString() : undefined,
      });

      // Format the response to match our Campaign type
      return {
        id: response.id,
        name: params.name,
        type: 'regular',
        status: params.scheduledAt ? 'scheduled' : 'draft',
        subject: params.subject,
        preheader: params.preheader,
        fromName: fromName,
        fromEmail: fromEmail,
        replyTo: replyTo,
        templateId: params.templateId,
        content: content,
        htmlContent: htmlContent,
        listIds: params.listIds,
        scheduledAt: params.scheduledAt ? params.scheduledAt.toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error creating campaign in SendGrid:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns
   */
  public async getCampaigns(params?: {
    limit?: number;
    offset?: number;
    status?: CampaignStatus;
  }): Promise<Campaign[]> {
    try {
      const response = await this.client.get('/marketing/singlesends', {
        params: {
          page_size: params?.limit || 100,
          page_token: params?.offset || undefined,
          status: this.mapToCampaignStatus(params?.status),
        },
      });

      return response.result.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: 'regular',
        status: this.mapFromSendGridCampaignStatus(campaign.status),
        subject: campaign.email_config?.subject || '',
        fromName: campaign.email_config?.sender?.name || this.defaultFromName,
        fromEmail: response.email_config?.sender?.email || this.defaultFromEmail,
        replyTo: response.email_config?.reply_to?.email || this.defaultReplyTo,
        content: response.email_config?.plain_content || '',
        htmlContent: response.email_config?.html_content || '',
        listIds: response.send_to?.list_ids || [],
        scheduledAt: campaign.send_at ? new Date(campaign.send_at).toISOString() : undefined,
        sentAt: campaign.status === 'sent' ? new Date(campaign.sent_at).toISOString() : undefined,
        createdAt: new Date(campaign.created_at).toISOString(),
        updatedAt: new Date(campaign.updatedAt).toISOString(),
      }));
    } catch (error) {
      console.error('Error retrieving campaigns from SendGrid:', error);
      throw error;
    }
  }

  /**
   * Get a specific campaign
   */
  public async getCampaign(id: string): Promise<Campaign> {
    try {
      const response = await this.client.get(`/marketing/singlesends/${id}`);

      return {
        id: response.id,
        name: response.name,
        type: 'regular',
        status: this.mapFromSendGridCampaignStatus(response.status),
        subject: response.email_config?.subject || '',
        fromName: response.email_config?.sender?.name || this.defaultFromName,
        fromEmail: response.email_config?.sender?.email || this.defaultFromEmail,
        replyTo: response.email_config?.reply_to?.email || this.defaultReplyTo,
        content: response.email_config?.plain_content || '',
        htmlContent: response.email_config?.html_content || '',
        listIds: response.send_to?.list_ids || [],
        scheduledAt: response.send_at ? new Date(response.send_at).toISOString() : undefined,
        sentAt: response.status === 'sent' ? new Date(response.sent_at).toISOString() : undefined,
        createdAt: new Date(response.created_at).toISOString(),
        updatedAt: new Date(response.updatedAt).toISOString(),
      };
    } catch (error) {
      console.error(`Error retrieving campaign ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Update a campaign
   */
  public async updateCampaign(id: string, params: {
    name?: string;
    subject?: string;
    content?: string;
    htmlContent?: string;
    preheader?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
  }): Promise<Campaign> {
    try {
      // Get the existing campaign
      const campaign = await this.getCampaign(id);

      // Update the campaign
      await this.client.patch(`/marketing/singlesends/${id}`, {
        name: params.name || campaign.name,
        send_to: {
          list_ids: campaign.listIds,
        },
        email_config: {
          subject: params.subject || campaign.subject,
          html_content: params.htmlContent || campaign.htmlContent,
          plain_content: params.content || campaign.content,
          sender_id: 1, // This is usually required by SendGrid
          suppression_group_id: 1, // This is usually required by SendGrid
          custom_unsubscribe_url: '',
          ip_pool: '',
        },
      });

      // Return the updated campaign
      return {
        ...campaign,
        name: params.name || campaign.name,
        subject: params.subject || campaign.subject,
        content: params.content || campaign.content,
        htmlContent: params.htmlContent || campaign.htmlContent,
        preheader: params.preheader || campaign.preheader,
        fromName: params.fromName || campaign.fromName,
        fromEmail: params.fromEmail || campaign.fromEmail,
        replyTo: params.replyTo || campaign.replyTo,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error updating campaign ${id} in SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Send a campaign
   */
  public async sendCampaign(id: string): Promise<Campaign> {
    try {
      // Schedule the campaign to be sent immediately
      await this.client.post(`/marketing/singlesends/${id}/schedule`, {
        send_at: 'now',
      });

      // Get the updated campaign
      const campaign = await this.getCampaign(id);
      
      return {
        ...campaign,
        status: 'sending',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error sending campaign ${id} in SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Delete a campaign
   */
  public async deleteCampaign(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/marketing/singlesends/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting campaign ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  public async getCampaignMetrics(id: string): Promise<CampaignMetrics> {
    try {
      const response = await this.client.get(`/marketing/stats/singlesends/${id}`);

      // Calculate rates
      const stats = response.stats?.[0] || {};
      const recipients = stats.recipients || 0;
      const opens = stats.opens || 0;
      const uniqueOpens = stats.unique_clicks || 0;
      const clicks = stats.clicks || 0;
      const uniqueClicks = stats.unique_clicks || 0;
      const bounces = stats.bounces || 0;
      const unsubscribes = stats.unsubscribes || 0;
      const complaints = stats.spam_reports || 0;

      return {
        recipients,
        opens,
        uniqueOpens,
        openRate: recipients > 0 ? uniqueOpens / recipients : 0,
        clicks,
        uniqueClicks,
        clickRate: recipients > 0 ? uniqueClicks / recipients : 0,
        bounces,
        bounceRate: recipients > 0 ? bounces / recipients : 0,
        unsubscribes,
        unsubscribeRate: recipients > 0 ? unsubscribes / recipients : 0,
        complaints,
      };
    } catch (error) {
      console.error(`Error retrieving metrics for campaign ${id} from SendGrid:`, error);
      throw error;
    }
  }

  /**
   * Simple converter from plain text to HTML
   */
  private convertToHtml(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  }

  /**
   * Determine template type from name
   */
  private determineTemplateType(name: string): EmailTemplate['type'] {
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('newsletter')) return 'newsletter';
    if (lowercaseName.includes('welcome')) return 'welcome';
    if (lowercaseName.includes('announcement')) return 'announcement';
    if (lowercaseName.includes('promotion')) return 'promotion';
    if (lowercaseName.includes('blog')) return 'blog-update';
    if (lowercaseName.includes('event')) return 'event-invitation';
    if (lowercaseName.includes('survey')) return 'survey';
    if (lowercaseName.includes('follow')) return 'follow-up';
    
    return 'custom';
  }

  /**
   * Map SendGrid contact status to our status
   */
  private mapSendGridStatus(status?: string): SubscriptionStatus {
    switch (status) {
      case 'subscribed':
        return 'subscribed';
      case 'unsubscribed':
        return 'unsubscribed';
      case 'pending':
        return 'pending';
      case 'bounced':
        return 'bounced';
      case 'opt_out':
        return 'unsubscribed';
      default:
        return 'subscribed';
    }
  }

  /**
   * Map our campaign status to SendGrid status
   */
  private mapToCampaignStatus(status?: CampaignStatus): string | undefined {
    if (!status) return undefined;
    
    switch (status) {
      case 'draft':
        return 'draft';
      case 'scheduled':
        return 'scheduled';
      case 'sending':
        return 'in_progress';
      case 'sent':
      case 'canceled':
      case 'failed':
      default:
        return 'draft';
    }
  }

  /**
   * Map SendGrid campaign status to our status
   */
  private mapFromSendGridCampaignStatus(status: string): CampaignStatus {
    switch (status) {
      case 'draft':
        return 'draft';
      case 'scheduled':
        return 'scheduled';
      case 'in_progress':
        return 'sending';
      case 'sent':
      case 'canceled':
      case 'failed':
      default:
        return 'draft';
    }
  }
}
