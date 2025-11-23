/**
 * Global Event Tracking Utility
 * Phase 49: Centralized engagement event tracking
 */

import { trackEngagementEvent } from '@/lib/services/clientSuccessService';

// Event types that can be tracked
export type EngagementEventType =
  | 'login'
  | 'page_view'
  | 'task_completed'
  | 'content_generated'
  | 'visual_created'
  | 'voice_interaction'
  | 'insight_reviewed'
  | 'export_downloaded'
  | 'settings_updated'
  | 'feedback_given'
  | 'dashboard_page_view'
  | 'audit_created'
  | 'roadmap_updated'
  | 'voice_command_issued'
  | 'review_pack_created'
  | 'time_logged'
  | 'financial_report_viewed';

export interface TrackEventOptions {
  clientId: string;
  organizationId: string;
  eventType: EngagementEventType;
  eventData?: Record<string, any>;
  sessionId?: string;
  pagePath?: string;
  durationSeconds?: number;
}

/**
 * Track an engagement event globally
 * Use this throughout the app to track client activities
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    // Map extended event types to base types for storage
    let eventType = options.eventType;

    // Map custom events to base types
    const eventTypeMap: Record<string, string> = {
      dashboard_page_view: 'page_view',
      audit_created: 'task_completed',
      roadmap_updated: 'task_completed',
      voice_command_issued: 'voice_interaction',
      review_pack_created: 'content_generated',
      time_logged: 'task_completed',
      financial_report_viewed: 'page_view',
    };

    const mappedType = eventTypeMap[eventType] || eventType;

    await trackEngagementEvent({
      clientId: options.clientId,
      organizationId: options.organizationId,
      eventType: mappedType,
      eventData: {
        ...options.eventData,
        original_event_type: eventType, // Preserve original for analysis
      },
      sessionId: options.sessionId,
      pagePath: options.pagePath,
      durationSeconds: options.durationSeconds,
    });
  } catch (error) {
    // Silently fail - event tracking should not block user actions
    console.error('[EventTracking] Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  clientId: string,
  organizationId: string,
  pagePath: string,
  pageTitle?: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'page_view',
    eventData: { pageTitle },
    pagePath,
  });
}

/**
 * Track login event
 */
export async function trackLogin(
  clientId: string,
  organizationId: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'login',
    eventData: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track task completion
 */
export async function trackTaskCompleted(
  clientId: string,
  organizationId: string,
  taskId: string,
  taskTitle: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'task_completed',
    eventData: { taskId, taskTitle },
  });
}

/**
 * Track content generation
 */
export async function trackContentGenerated(
  clientId: string,
  organizationId: string,
  contentType: string,
  contentId?: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'content_generated',
    eventData: { contentType, contentId },
  });
}

/**
 * Track visual creation
 */
export async function trackVisualCreated(
  clientId: string,
  organizationId: string,
  visualType: string,
  visualId?: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'visual_created',
    eventData: { visualType, visualId },
  });
}

/**
 * Track voice interaction
 */
export async function trackVoiceInteraction(
  clientId: string,
  organizationId: string,
  command: string,
  success: boolean
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'voice_interaction',
    eventData: { command, success },
  });
}

/**
 * Track insight reviewed
 */
export async function trackInsightReviewed(
  clientId: string,
  organizationId: string,
  insightId: string,
  action: 'read' | 'dismissed' | 'acted_on'
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'insight_reviewed',
    eventData: { insightId, action },
  });
}

/**
 * Track export downloaded
 */
export async function trackExportDownloaded(
  clientId: string,
  organizationId: string,
  exportType: string,
  fileName: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'export_downloaded',
    eventData: { exportType, fileName },
  });
}

/**
 * Track settings updated
 */
export async function trackSettingsUpdated(
  clientId: string,
  organizationId: string,
  settingType: string
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'settings_updated',
    eventData: { settingType },
  });
}

/**
 * Track feedback given
 */
export async function trackFeedbackGiven(
  clientId: string,
  organizationId: string,
  feedbackType: string,
  rating?: number
): Promise<void> {
  await trackEvent({
    clientId,
    organizationId,
    eventType: 'feedback_given',
    eventData: { feedbackType, rating },
  });
}

/**
 * React hook for tracking (client-side)
 */
export function useEventTracking(clientId: string, organizationId: string) {
  return {
    trackPageView: (pagePath: string, pageTitle?: string) =>
      trackPageView(clientId, organizationId, pagePath, pageTitle),
    trackLogin: () => trackLogin(clientId, organizationId),
    trackTaskCompleted: (taskId: string, taskTitle: string) =>
      trackTaskCompleted(clientId, organizationId, taskId, taskTitle),
    trackContentGenerated: (contentType: string, contentId?: string) =>
      trackContentGenerated(clientId, organizationId, contentType, contentId),
    trackVisualCreated: (visualType: string, visualId?: string) =>
      trackVisualCreated(clientId, organizationId, visualType, visualId),
    trackVoiceInteraction: (command: string, success: boolean) =>
      trackVoiceInteraction(clientId, organizationId, command, success),
    trackInsightReviewed: (insightId: string, action: 'read' | 'dismissed' | 'acted_on') =>
      trackInsightReviewed(clientId, organizationId, insightId, action),
    trackExportDownloaded: (exportType: string, fileName: string) =>
      trackExportDownloaded(clientId, organizationId, exportType, fileName),
    trackSettingsUpdated: (settingType: string) =>
      trackSettingsUpdated(clientId, organizationId, settingType),
    trackFeedbackGiven: (feedbackType: string, rating?: number) =>
      trackFeedbackGiven(clientId, organizationId, feedbackType, rating),
  };
}

export default {
  trackEvent,
  trackPageView,
  trackLogin,
  trackTaskCompleted,
  trackContentGenerated,
  trackVisualCreated,
  trackVoiceInteraction,
  trackInsightReviewed,
  trackExportDownloaded,
  trackSettingsUpdated,
  trackFeedbackGiven,
  useEventTracking,
};
