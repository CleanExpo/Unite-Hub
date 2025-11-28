/**
 * Pre-Client Mapper Service
 *
 * Maps emails to pre-system client profiles and manages the conversion
 * of pre-clients to full CRM contacts.
 * Part of the Client Historical Email Identity Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface PreClientProfile {
  id?: string;
  workspaceId: string;
  name: string;
  email: string;
  company?: string;
  notes?: string;
  source: 'email_discovery' | 'manual' | 'import';
  status: PreClientStatus;
  totalThreads: number;
  totalMessages: number;
  firstContactDate?: Date;
  lastContactDate?: Date;
  relationshipSummary?: string;
  sentimentScore?: number;
  engagementLevel: 'cold' | 'warm' | 'hot' | 'active';
  convertedToContactId?: string;
  convertedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PreClientStatus =
  | 'discovered'
  | 'ingesting'
  | 'analyzed'
  | 'converted'
  | 'archived';

export interface EmailIdentity {
  email: string;
  name?: string;
  company?: string;
  domain?: string;
}

export interface DiscoveryResult {
  discovered: PreClientProfile[];
  existing: PreClientProfile[];
  skipped: string[];
}

export interface ConversionResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

class PreClientMapperService {
  private anthropic: Anthropic | null = null;

  private getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * Discover pre-clients from email addresses
   */
  async discoverFromEmails(
    emails: EmailIdentity[],
    workspaceId: string,
    excludeDomains: string[] = []
  ): Promise<DiscoveryResult> {
    const supabase = await getSupabaseServer();

    const discovered: PreClientProfile[] = [];
    const existing: PreClientProfile[] = [];
    const skipped: string[] = [];

    // Get workspace owner domain to exclude
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspaceId)
      .single();

    // Add common internal domains to exclude
    const domainsToExclude = new Set([
      ...excludeDomains,
      'gmail.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com',
      // Add workspace domain if available
    ]);

    for (const identity of emails) {
      const email = identity.email.toLowerCase().trim();
      const domain = email.split('@')[1];

      // Skip if internal or common personal domain
      if (domain && domainsToExclude.has(domain)) {
        skipped.push(email);
        continue;
      }

      // Check if pre-client already exists
      const { data: existingClient } = await supabase
        .from('pre_clients')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('email', email)
        .single();

      if (existingClient) {
        existing.push(this.mapToProfile(existingClient));
        continue;
      }

      // Create new pre-client
      const profile: PreClientProfile = {
        workspaceId,
        name: identity.name || this.extractNameFromEmail(email),
        email,
        company: identity.company || this.extractCompanyFromDomain(domain),
        source: 'email_discovery',
        status: 'discovered',
        totalThreads: 0,
        totalMessages: 0,
        engagementLevel: 'cold',
      };

      const { data: created, error } = await supabase
        .from('pre_clients')
        .insert({
          workspace_id: profile.workspaceId,
          name: profile.name,
          email: profile.email,
          company: profile.company,
          source: profile.source,
          status: profile.status,
          engagement_level: profile.engagementLevel,
        })
        .select()
        .single();

      if (error) {
        console.error(`[PreClientMapper] Failed to create pre-client for ${email}:`, error);
        continue;
      }

      discovered.push(this.mapToProfile(created));
    }

    return { discovered, existing, skipped };
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    // Convert "john.doe" or "john_doe" to "John Doe"
    return localPart
      .replace(/[._]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract company name from domain
   */
  private extractCompanyFromDomain(domain?: string): string | undefined {
    if (!domain) return undefined;

    // Remove common TLDs and convert to company name
    const companyPart = domain
      .replace(/\.(com|org|net|io|co|au|uk|nz)(\..+)?$/i, '')
      .split('.')
      .pop();

    if (!companyPart) return undefined;

    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
  }

  /**
   * Map database record to profile type
   */
  private mapToProfile(record: Record<string, unknown>): PreClientProfile {
    return {
      id: record.id as string,
      workspaceId: record.workspace_id as string,
      name: record.name as string,
      email: record.email as string,
      company: record.company as string | undefined,
      notes: record.notes as string | undefined,
      source: record.source as 'email_discovery' | 'manual' | 'import',
      status: record.status as PreClientStatus,
      totalThreads: (record.total_threads as number) || 0,
      totalMessages: (record.total_messages as number) || 0,
      firstContactDate: record.first_contact_date
        ? new Date(record.first_contact_date as string)
        : undefined,
      lastContactDate: record.last_contact_date
        ? new Date(record.last_contact_date as string)
        : undefined,
      relationshipSummary: record.relationship_summary as string | undefined,
      sentimentScore: record.sentiment_score
        ? parseFloat(record.sentiment_score as string)
        : undefined,
      engagementLevel: (record.engagement_level as 'cold' | 'warm' | 'hot' | 'active') || 'cold',
      convertedToContactId: record.converted_to_contact_id as string | undefined,
      convertedAt: record.converted_at
        ? new Date(record.converted_at as string)
        : undefined,
      createdAt: record.created_at
        ? new Date(record.created_at as string)
        : undefined,
      updatedAt: record.updated_at
        ? new Date(record.updated_at as string)
        : undefined,
    };
  }

  /**
   * Get pre-client by ID
   */
  async getPreClient(
    preClientId: string,
    workspaceId: string
  ): Promise<PreClientProfile | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('pre_clients')
      .select('*')
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToProfile(data);
  }

  /**
   * Get pre-client by email
   */
  async getPreClientByEmail(
    email: string,
    workspaceId: string
  ): Promise<PreClientProfile | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('pre_clients')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToProfile(data);
  }

  /**
   * List pre-clients with filters
   */
  async listPreClients(
    workspaceId: string,
    options: {
      status?: PreClientStatus[];
      engagementLevel?: ('cold' | 'warm' | 'hot' | 'active')[];
      search?: string;
      sortBy?: 'name' | 'last_contact_date' | 'total_messages' | 'sentiment_score';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ profiles: PreClientProfile[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('pre_clients')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (options.status?.length) {
      query = query.in('status', options.status);
    }

    if (options.engagementLevel?.length) {
      query = query.in('engagement_level', options.engagementLevel);
    }

    if (options.search) {
      query = query.or(
        `name.ilike.%${options.search}%,email.ilike.%${options.search}%,company.ilike.%${options.search}%`
      );
    }

    // Sorting
    const sortColumn = options.sortBy || 'last_contact_date';
    const sortOrder = options.sortOrder === 'asc' ? true : false;
    query = query.order(sortColumn, { ascending: sortOrder, nullsFirst: false });

    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[PreClientMapper] Failed to list pre-clients:', error);
      throw new Error(`Failed to list pre-clients: ${error.message}`);
    }

    return {
      profiles: (data || []).map(this.mapToProfile),
      total: count || 0,
    };
  }

  /**
   * Update pre-client profile
   */
  async updatePreClient(
    preClientId: string,
    workspaceId: string,
    updates: Partial<
      Pick<PreClientProfile, 'name' | 'company' | 'notes' | 'status'>
    >
  ): Promise<PreClientProfile | null> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('pre_clients')
      .update(updateData)
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('[PreClientMapper] Failed to update pre-client:', error);
      return null;
    }

    return this.mapToProfile(data);
  }

  /**
   * Update pre-client stats after ingestion
   */
  async updateStats(preClientId: string, workspaceId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Count threads
    const { count: threadCount } = await supabase
      .from('pre_client_threads')
      .select('*', { count: 'exact', head: true })
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId);

    // Count messages
    const { count: messageCount } = await supabase
      .from('pre_client_messages')
      .select('*', { count: 'exact', head: true })
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId);

    // Get date range
    const { data: dateRange } = await supabase
      .from('pre_client_messages')
      .select('message_timestamp')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('message_timestamp', { ascending: true })
      .limit(1);

    const { data: lastDate } = await supabase
      .from('pre_client_messages')
      .select('message_timestamp')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('message_timestamp', { ascending: false })
      .limit(1);

    // Update pre-client
    await supabase
      .from('pre_clients')
      .update({
        total_threads: threadCount || 0,
        total_messages: messageCount || 0,
        first_contact_date: dateRange?.[0]?.message_timestamp,
        last_contact_date: lastDate?.[0]?.message_timestamp,
        status: 'analyzed',
      })
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId);
  }

  /**
   * Calculate and update sentiment score
   */
  async calculateSentimentScore(
    preClientId: string,
    workspaceId: string
  ): Promise<number> {
    const supabase = await getSupabaseServer();

    // Get thread sentiments
    const { data: threads } = await supabase
      .from('pre_client_threads')
      .select('sentiment')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId);

    if (!threads?.length) {
      return 0.5; // Neutral
    }

    const sentimentValues: Record<string, number> = {
      positive: 1.0,
      neutral: 0.5,
      negative: 0.0,
      mixed: 0.5,
    };

    const scores = threads
      .filter((t) => t.sentiment)
      .map((t) => sentimentValues[t.sentiment] || 0.5);

    if (!scores.length) {
      return 0.5;
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Update pre-client
    await supabase
      .from('pre_clients')
      .update({ sentiment_score: avgScore })
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId);

    return avgScore;
  }

  /**
   * Convert pre-client to full CRM contact
   */
  async convertToContact(
    preClientId: string,
    workspaceId: string,
    additionalData?: {
      tags?: string[];
      customFields?: Record<string, unknown>;
    }
  ): Promise<ConversionResult> {
    const supabase = await getSupabaseServer();

    // Get pre-client
    const preClient = await this.getPreClient(preClientId, workspaceId);
    if (!preClient) {
      return { success: false, error: 'Pre-client not found' };
    }

    if (preClient.status === 'converted') {
      return {
        success: true,
        contactId: preClient.convertedToContactId,
        error: 'Already converted',
      };
    }

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', preClient.email)
      .eq('workspace_id', workspaceId)
      .single();

    if (existingContact) {
      // Link to existing contact
      await supabase
        .from('pre_clients')
        .update({
          status: 'converted',
          converted_to_contact_id: existingContact.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', preClientId);

      return { success: true, contactId: existingContact.id };
    }

    // Create new contact
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        workspace_id: workspaceId,
        name: preClient.name,
        email: preClient.email,
        company: preClient.company,
        notes: preClient.relationshipSummary || preClient.notes,
        status: 'lead',
        ai_score: this.calculateInitialScore(preClient),
        tags: additionalData?.tags || ['pre-client-converted'],
        source: 'historical_email',
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[PreClientMapper] Failed to create contact:', createError);
      return { success: false, error: createError.message };
    }

    // Update pre-client
    await supabase
      .from('pre_clients')
      .update({
        status: 'converted',
        converted_to_contact_id: newContact.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', preClientId);

    return { success: true, contactId: newContact.id };
  }

  /**
   * Calculate initial AI score for converted contact
   */
  private calculateInitialScore(preClient: PreClientProfile): number {
    let score = 30; // Base score

    // Engagement level bonus
    const engagementBonus: Record<string, number> = {
      cold: 0,
      warm: 15,
      hot: 30,
      active: 40,
    };
    score += engagementBonus[preClient.engagementLevel] || 0;

    // Sentiment bonus
    if (preClient.sentimentScore !== undefined) {
      score += Math.round(preClient.sentimentScore * 20);
    }

    // Communication volume bonus (up to 10 points)
    score += Math.min(preClient.totalMessages, 10);

    return Math.min(score, 100);
  }

  /**
   * Merge duplicate pre-clients
   */
  async mergeDuplicates(
    primaryId: string,
    duplicateIds: string[],
    workspaceId: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServer();

    // Update all threads to primary
    for (const duplicateId of duplicateIds) {
      await supabase
        .from('pre_client_threads')
        .update({ pre_client_id: primaryId })
        .eq('pre_client_id', duplicateId)
        .eq('workspace_id', workspaceId);

      await supabase
        .from('pre_client_messages')
        .update({ pre_client_id: primaryId })
        .eq('pre_client_id', duplicateId)
        .eq('workspace_id', workspaceId);

      await supabase
        .from('pre_client_insights')
        .update({ pre_client_id: primaryId })
        .eq('pre_client_id', duplicateId)
        .eq('workspace_id', workspaceId);

      await supabase
        .from('pre_client_timeline')
        .update({ pre_client_id: primaryId })
        .eq('pre_client_id', duplicateId)
        .eq('workspace_id', workspaceId);

      // Archive duplicate
      await supabase
        .from('pre_clients')
        .update({ status: 'archived' })
        .eq('id', duplicateId)
        .eq('workspace_id', workspaceId);
    }

    // Update stats on primary
    await this.updateStats(primaryId, workspaceId);

    return true;
  }

  /**
   * Archive pre-client
   */
  async archive(preClientId: string, workspaceId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('pre_clients')
      .update({ status: 'archived' })
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Delete pre-client and all associated data
   */
  async delete(preClientId: string, workspaceId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    // Cascade delete handles most, but let's be explicit
    const { error } = await supabase
      .from('pre_clients')
      .delete()
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Enrich pre-client profile using AI
   */
  async enrichProfile(
    preClientId: string,
    workspaceId: string
  ): Promise<PreClientProfile | null> {
    const preClient = await this.getPreClient(preClientId, workspaceId);
    if (!preClient) {
      return null;
    }

    const supabase = await getSupabaseServer();
    const anthropic = this.getAnthropicClient();

    // Fetch sample messages
    const { data: messages } = await supabase
      .from('pre_client_messages')
      .select('from_name, subject, body_plain')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .limit(10);

    if (!messages?.length) {
      return preClient;
    }

    const context = messages
      .map((m) => `From: ${m.from_name || 'Unknown'}\nSubject: ${m.subject}\nContent: ${(m.body_plain || '').slice(0, 200)}`)
      .join('\n---\n');

    const prompt = `Analyze these emails and extract information about the sender.

Emails:
${context}

Current known info:
- Name: ${preClient.name}
- Email: ${preClient.email}
- Company: ${preClient.company || 'Unknown'}

Extract and infer:
1. Full name (if different/better than current)
2. Company name
3. Job title/role (if evident)
4. Industry

Respond with JSON:
{
  "name": "best name",
  "company": "company name",
  "title": "job title if found",
  "industry": "industry if evident",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return preClient;
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return preClient;
      }

      const enrichment = JSON.parse(jsonMatch[0]);

      // Update if high confidence
      if (enrichment.confidence >= 0.7) {
        const updates: Record<string, unknown> = {};

        if (enrichment.name && enrichment.name !== preClient.name) {
          updates.name = enrichment.name;
        }
        if (enrichment.company && !preClient.company) {
          updates.company = enrichment.company;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('pre_clients')
            .update(updates)
            .eq('id', preClientId)
            .eq('workspace_id', workspaceId);

          return { ...preClient, ...updates } as PreClientProfile;
        }
      }

      return preClient;
    } catch (error) {
      console.error('[PreClientMapper] Enrichment error:', error);
      return preClient;
    }
  }
}

export const preClientMapperService = new PreClientMapperService();
