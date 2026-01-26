/**
 * Event Logger
 *
 * Logs campaign events for tracking and analytics
 *
 * @module lib/workflows/EventLogger
 */

import { createApiLogger } from '@/lib/logger';
import { CampaignEvent, CampaignEventType } from '@/lib/models/social-drip-campaign';
import { createClient } from '@/lib/supabase/server';

const logger = createApiLogger({ service: 'EventLogger' });

export interface LogEventParams {
  campaignId: string;
  enrollmentId: string;
  contactId: string;
  eventType: CampaignEventType;
  eventSource: 'system' | 'email_provider' | 'webhook' | 'manual';
  stepId?: string;
  nodeId?: string;
  eventData: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  locationData?: {
    city?: string;
    country?: string;
    timezone?: string;
  };
}

export class EventLogger {
  /**
   * Log campaign event
   */
  async logEvent(params: LogEventParams): Promise<CampaignEvent> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_events')
        .insert({
          campaign_id: params.campaignId,
          enrollment_id: params.enrollmentId,
          contact_id: params.contactId,
          event_type: params.eventType,
          event_source: params.eventSource,
          step_id: params.stepId,
          node_id: params.nodeId,
          event_data: params.eventData,
          user_agent: params.userAgent,
          ip_address: params.ipAddress,
          device_type: params.deviceType,
          location_data: params.locationData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Campaign event logged', {
        eventType: params.eventType,
        campaignId: params.campaignId,
        enrollmentId: params.enrollmentId,
      });

      return this.mapToCampaignEvent(data);
    } catch (error) {
      logger.error('Failed to log campaign event', { error, params });
      throw error;
    }
  }

  /**
   * Get events for enrollment
   */
  async getEnrollmentEvents(enrollmentId: string): Promise<CampaignEvent[]> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_events')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((row) => this.mapToCampaignEvent(row));
    } catch (error) {
      logger.error('Failed to get enrollment events', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Get events for campaign
   */
  async getCampaignEvents(
    campaignId: string,
    options?: {
      eventType?: CampaignEventType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<CampaignEvent[]> {
    const supabase = await createClient();

    try {
      let query = supabase
        .from('campaign_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (options?.eventType) {
        query = query.eq('event_type', options.eventType);
      }

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((row) => this.mapToCampaignEvent(row));
    } catch (error) {
      logger.error('Failed to get campaign events', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get event counts by type
   */
  async getEventCounts(
    campaignId: string,
    eventTypes: CampaignEventType[]
  ): Promise<Record<CampaignEventType, number>> {
    const supabase = await createClient();

    try {
      const counts: Record<CampaignEventType, number> = {} as any;

      for (const eventType of eventTypes) {
        const { count, error } = await supabase
          .from('campaign_events')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', eventType);

        if (error) throw error;

        counts[eventType] = count || 0;
      }

      return counts;
    } catch (error) {
      logger.error('Failed to get event counts', { error, campaignId });
      throw error;
    }
  }

  /**
   * Map database row to CampaignEvent interface
   */
  private mapToCampaignEvent(data: any): CampaignEvent {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      enrollment_id: data.enrollment_id,
      contact_id: data.contact_id,
      event_type: data.event_type,
      event_source: data.event_source,
      step_id: data.step_id,
      node_id: data.node_id,
      event_data: data.event_data || {},
      user_agent: data.user_agent,
      ip_address: data.ip_address,
      device_type: data.device_type,
      location_data: data.location_data,
      created_at: new Date(data.created_at),
    };
  }
}
