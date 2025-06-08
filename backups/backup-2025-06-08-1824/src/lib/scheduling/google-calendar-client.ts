/**
 * Google Calendar API Client
 * Integration with Google Calendar for scheduling functionality
 */

import { ApiClient, RetryStrategy } from '@/lib/api';
import {
  Calendar,
  CalendarEvent,
  Attendee,
  RecurrenceRule,
  DayOfWeek,
  TimeSlot,
  AvailabilityStatus,
  EventStatus,
  AttendeeResponseStatus,
  RecurrenceFrequency,
} from './types';

/**
 * Google Calendar client configuration
 */
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string; // For public access only
  scopes?: string[];
  maxRetries?: number;
  timeout?: number;
}

/**
 * OAuth2 auth strategy for Google
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  scopes?: string[];
}

/**
 * Simple OAuth2 auth strategy implementation
 */
class OAuth2AuthStrategy {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken?: string;
  private refreshToken?: string;
  private scopes: string[];
  
  constructor(config: OAuth2Config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.scopes = config.scopes || [];
  }
  
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }
  
  public setRefreshToken(token: string): void {
    this.refreshToken = token;
  }
  
  public getAccessToken(): string | undefined {
    return this.accessToken;
  }
  
  public getAuthorizationHeader(): string {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    return `Bearer ${this.accessToken}`;
  }
}

/**
 * Default scopes for Google Calendar access
 */
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Time period for availability check
 */
export interface TimeRange {
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  timezone?: string;
}

/**
 * Google Calendar API client
 */
export class GoogleCalendarClient {
  private client: ApiClient;
  private authStrategy: OAuth2AuthStrategy;
  private accessToken?: string;
  private refreshToken?: string;
  private calendarCache: Map<string, Calendar> = new Map();

  constructor(private config: GoogleCalendarConfig) {
    // Set up auth strategy for Google OAuth2
    this.authStrategy = new OAuth2AuthStrategy({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      scopes: config.scopes || DEFAULT_SCOPES,
    });

    // Create retry strategy
    const retryStrategy = new RetryStrategy({
      maxRetries: config.maxRetries || 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: true,
      retryableStatuses: [429, 500, 503, 504],
      nonRetryableStatuses: [400, 401, 403, 404],
    });

    // Create API client
    this.client = new ApiClient({
      baseUrl: 'https://www.googleapis.com/calendar/v3',
      timeout: config.timeout || 30000,
      // We're not using the built-in auth strategy since we need to customize it
      // for Google OAuth2
      retryStrategy,
    });

    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
  }

  /**
   * Get the API client for direct access if needed
   */
  public getClient(): ApiClient {
    return this.client;
  }

  /**
   * Get the authorization URL for the OAuth flow
   */
  public getAuthorizationUrl(state?: string): string {
    const scopes = this.config.scopes || DEFAULT_SCOPES;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update tokens
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    
    // Update the auth strategy
    if (this.accessToken) {
      this.authStrategy.setAccessToken(this.accessToken);
    }
    
    if (this.refreshToken) {
      this.authStrategy.setRefreshToken(this.refreshToken);
    }

    return data;
  }

  /**
   * Get all calendars for the authenticated user
   */
  public async getCalendars(): Promise<Calendar[]> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const response = await this.client.get('/users/me/calendarList', { headers });
      
      const calendars: Calendar[] = response.items.map((item: any) => {
        const calendar: Calendar = {
          id: item.id,
          provider: 'google',
          name: item.summary,
          description: item.description,
          color: item.backgroundColor,
          timezone: item.timeZone,
          owner: {
            id: item.id,
            name: '',
            email: '',
          },
          accessRole: this.mapAccessRole(item.accessRole),
          externalId: item.id,
          metadata: {
            foregroundColor: item.foregroundColor,
            hidden: item.hidden,
            selected: item.selected,
            primary: item.primary,
          },
        };
        
        // Cache calendar for later use
        this.calendarCache.set(calendar.id, calendar);
        
        return calendar;
      });
      
      return calendars;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  /**
   * Get a specific calendar
   */
  public async getCalendar(calendarId: string): Promise<Calendar> {
    // Check cache first
    if (this.calendarCache.has(calendarId)) {
      return this.calendarCache.get(calendarId)!;
    }
    
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const response = await this.client.get(`/calendars/${calendarId}`, { headers });
      
      const calendar: Calendar = {
        id: response.id,
        provider: 'google',
        name: response.summary,
        description: response.description,
        timezone: response.timeZone,
        owner: {
          id: response.id,
          name: '',
          email: '',
        },
        accessRole: 'reader', // Default
        externalId: response.id,
      };
      
      // Get additional metadata from the calendar list
      try {
        const calendarListEntry = await this.client.get(`/users/me/calendarList/${calendarId}`, { headers });
        calendar.color = calendarListEntry.backgroundColor;
        calendar.accessRole = this.mapAccessRole(calendarListEntry.accessRole);
        calendar.metadata = {
          foregroundColor: calendarListEntry.foregroundColor,
          hidden: calendarListEntry.hidden,
          selected: calendarListEntry.selected,
          primary: calendarListEntry.primary,
        };
      } catch (error) {
        // Ignore error and continue with basic calendar info
        console.warn(`Could not fetch calendar list entry for ${calendarId}:`, error);
      }
      
      // Cache calendar for later use
      this.calendarCache.set(calendar.id, calendar);
      
      return calendar;
    } catch (error) {
      console.error(`Error fetching calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new calendar
   */
  public async createCalendar(params: {
    name: string;
    description?: string;
    timezone?: string;
  }): Promise<Calendar> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const response = await this.client.post('/calendars', {
        summary: params.name,
        description: params.description,
        timeZone: params.timezone || 'UTC',
      }, { headers });
      
      const calendar: Calendar = {
        id: response.id,
        provider: 'google',
        name: response.summary,
        description: response.description,
        timezone: response.timeZone,
        owner: {
          id: response.id,
          name: '',
          email: '',
        },
        accessRole: 'owner',
        externalId: response.id,
      };
      
      // Cache the new calendar
      this.calendarCache.set(calendar.id, calendar);
      
      return calendar;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw error;
    }
  }

  /**
   * Get events from a calendar
   */
  public async getEvents(params: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
    q?: string;
  }): Promise<CalendarEvent[]> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const queryParams: Record<string, any> = {
        singleEvents: params.singleEvents === undefined ? true : params.singleEvents,
        orderBy: params.orderBy || 'startTime',
        maxResults: params.maxResults || 100,
      };
      
      if (params.timeMin) {
        queryParams.timeMin = params.timeMin;
      }
      
      if (params.timeMax) {
        queryParams.timeMax = params.timeMax;
      }
      
      if (params.q) {
        queryParams.q = params.q;
      }
      
      const response = await this.client.get(`/calendars/${params.calendarId}/events`, {
        params: queryParams,
        headers,
      });
      
      const events: CalendarEvent[] = response.items.map((item: any) => this.mapGoogleEventToCalendarEvent(item, params.calendarId));
      
      return events;
    } catch (error) {
      console.error(`Error fetching events for calendar ${params.calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific event
   */
  public async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const response = await this.client.get(`/calendars/${calendarId}/events/${eventId}`, { headers });
      return this.mapGoogleEventToCalendarEvent(response, calendarId);
    } catch (error) {
      console.error(`Error fetching event ${eventId} from calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  public async createEvent(calendarId: string, event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'externalIds'>): Promise<CalendarEvent> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const googleEvent = this.mapCalendarEventToGoogleEvent(event);
      
      const response = await this.client.post(`/calendars/${calendarId}/events`, googleEvent, { headers });
      
      return this.mapGoogleEventToCalendarEvent(response, calendarId);
    } catch (error) {
      console.error(`Error creating event in calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  public async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      // First get the existing event
      const existingEvent = await this.getEvent(calendarId, eventId);
      
      // Merge with updates
      const updatedEvent = { ...existingEvent, ...event };
      
      // Map to Google format
      const googleEvent = this.mapCalendarEventToGoogleEvent(updatedEvent);
      
      // Update event
      const response = await this.client.put(`/calendars/${calendarId}/events/${eventId}`, googleEvent, { headers });
      
      return this.mapGoogleEventToCalendarEvent(response, calendarId);
    } catch (error) {
      console.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  public async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      await this.client.delete(`/calendars/${calendarId}/events/${eventId}`, { headers });
      return true;
    } catch (error) {
      console.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Get free/busy information for a set of calendars
   */
  public async getFreeBusy(params: {
    timeMin: string;
    timeMax: string;
    timezone?: string;
    calendarIds: string[];
  }): Promise<Record<string, TimeSlot[]>> {
    try {
      // Add auth header
      const headers = {
        'Authorization': this.authStrategy.getAuthorizationHeader(),
      };
      
      const response = await this.client.post('/freeBusy', {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        timeZone: params.timezone || 'UTC',
        items: params.calendarIds.map(id => ({ id })),
      }, { headers });
      
      const result: Record<string, TimeSlot[]> = {};
      
      // Process the response
      for (const calendarId of params.calendarIds) {
        const busySlots = response.calendars[calendarId]?.busy || [];
        
        // Map busy slots to our TimeSlot format
        result[calendarId] = busySlots.map((slot: any) => ({
          start: slot.start,
          end: slot.end,
          status: 'busy' as AvailabilityStatus,
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching free/busy information:', error);
      throw error;
    }
  }

  /**
   * Find available time slots based on calendars and criteria
   */
  public async findAvailableSlots(params: {
    calendarIds: string[];
    timeRange: TimeRange;
    duration: number; // minutes
    bufferTime?: number; // minutes
    availability?: Record<DayOfWeek, { start: string; end: string }[]>;
  }): Promise<TimeSlot[]> {
    try {
      // Get busy slots for all calendars
      const busySlotsByCalendar = await this.getFreeBusy({
        timeMin: params.timeRange.startTime,
        timeMax: params.timeRange.endTime,
        timezone: params.timeRange.timezone,
        calendarIds: params.calendarIds,
      });
      
      // Combine all busy slots into a single array
      let allBusySlots: TimeSlot[] = [];
      for (const calendarId of params.calendarIds) {
        allBusySlots = [...allBusySlots, ...(busySlotsByCalendar[calendarId] || [])];
      }
      
      // Sort busy slots by start time
      allBusySlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      // Merge overlapping busy slots
      const mergedBusySlots: TimeSlot[] = [];
      for (const slot of allBusySlots) {
        const lastSlot = mergedBusySlots[mergedBusySlots.length - 1];
        
        if (lastSlot && new Date(slot.start) <= new Date(lastSlot.end)) {
          // Overlap found, extend the end time if needed
          if (new Date(slot.end) > new Date(lastSlot.end)) {
            lastSlot.end = slot.end;
          }
        } else {
          // No overlap, add as new busy slot
          mergedBusySlots.push({ ...slot });
        }
      }
      
      // Generate all possible time slots within the time range
      const allSlots = this.generateTimeSlots(
        params.timeRange.startTime,
        params.timeRange.endTime,
        params.duration,
        params.bufferTime || 0,
        params.availability
      );
      
      // Filter out slots that overlap with busy times
      const availableSlots = allSlots.filter(slot => {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        
        // Check if slot overlaps with any busy slot
        for (const busySlot of mergedBusySlots) {
          const busyStart = new Date(busySlot.start).getTime();
          const busyEnd = new Date(busySlot.end).getTime();
          
          // Check for overlap
          if (!(slotEnd <= busyStart || slotStart >= busyEnd)) {
            return false; // Slot overlaps with a busy time
          }
        }
        
        return true; // No overlaps found, slot is available
      });
      
      return availableSlots.map(slot => ({
        ...slot,
        status: 'available' as AvailabilityStatus,
      }));
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw error;
    }
  }

  /**
   * Generate time slots between start and end time
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    bufferTime: number = 0,
    availability?: Record<DayOfWeek, { start: string; end: string }[]>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Duration in milliseconds
    const durationMs = duration * 60 * 1000;
    const bufferMs = bufferTime * 60 * 1000;
    
    // Current slot start time
    let currentStart = new Date(start);
    
    while (currentStart < end) {
      // Calculate slot end time
      const slotEnd = new Date(currentStart.getTime() + durationMs);
      
      // If slot end is past the end time, break
      if (slotEnd > end) {
        break;
      }
      
      // Check if this time slot is within availability windows
      if (availability) {
        const dayOfWeek = this.getDayOfWeek(currentStart);
        const availableTimes = availability[dayOfWeek];
        
        // Skip if no availability defined for this day
        if (!availableTimes || availableTimes.length === 0) {
          // Move to next day at midnight
          currentStart = new Date(currentStart);
          currentStart.setDate(currentStart.getDate() + 1);
          currentStart.setHours(0, 0, 0, 0);
          continue;
        }
        
        // Check if within any availability window
        let withinWindow = false;
        for (const window of availableTimes) {
          // Parse availability window for the day
          const availStart = this.parseTimeOfDay(currentStart, window.start);
          const availEnd = this.parseTimeOfDay(currentStart, window.end);
          
          // Check if slot is within window
          if (currentStart >= availStart && slotEnd <= availEnd) {
            withinWindow = true;
            break;
          }
        }
        
        // Skip if not within any availability window
        if (!withinWindow) {
          // Move forward by the slot duration
          currentStart = new Date(currentStart.getTime() + durationMs);
          continue;
        }
      }
      
      // Add slot
      slots.push({
        start: currentStart.toISOString(),
        end: slotEnd.toISOString(),
        status: 'available',
      });
      
      // Move to next slot start (add duration + buffer)
      currentStart = new Date(currentStart.getTime() + durationMs + bufferMs);
    }
    
    return slots;
  }

  /**
   * Get day of week from date
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Parse time of day string (e.g., "09:00") into Date object
   */
  private parseTimeOfDay(baseDate: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Map Google Calendar access role to our access role
   */
  private mapAccessRole(googleRole: string): 'owner' | 'writer' | 'reader' {
    switch (googleRole) {
      case 'owner':
        return 'owner';
      case 'writer':
        return 'writer';
      case 'reader':
      case 'freeBusyReader':
      default:
        return 'reader';
    }
  }

  /**
   * Map Google Calendar event to our CalendarEvent format
   */
  private mapGoogleEventToCalendarEvent(googleEvent: any, calendarId: string): CalendarEvent {
    // Map attendees
    const attendees: Attendee[] = (googleEvent.attendees || []).map((attendee: any) => ({
      email: attendee.email,
      name: attendee.displayName,
      responseStatus: this.mapGoogleResponseStatus(attendee.responseStatus),
      role: attendee.organizer ? 'organizer' : (attendee.optional ? 'optional' : 'required'),
      optional: attendee.optional || false,
    }));
    
    // Extract organizer
    let organizer = {
      name: googleEvent.organizer?.displayName || '',
      email: googleEvent.organizer?.email || '',
    };
    
    // If no organizer, use the creator
    if (!organizer.email && googleEvent.creator) {
      organizer = {
        name: googleEvent.creator.displayName || '',
        email: googleEvent.creator.email || '',
      };
    }
    
    // Map event status
    const status: EventStatus = this.mapGoogleEventStatus(googleEvent.status);
    
    // Map recurrence rule if present
    let recurrence: RecurrenceRule | undefined;
    if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
      recurrence = this.parseRecurrenceRule(googleEvent.recurrence[0]);
    }
    
    // Determine if all day event
    const isAllDay = !!googleEvent.start.date;
    
    // Extract start and end times
    let start: string;
    let end: string;
    
    if (isAllDay) {
      // For all-day events, use the date
      start = googleEvent.start.date;
      end = googleEvent.end.date;
    } else {
      // For time-specific events, use the dateTime
      start = googleEvent.start.dateTime;
      end = googleEvent.end.dateTime;
    }
    
    // Create calendar event
    const calendarEvent: CalendarEvent = {
      id: googleEvent.id,
      title: googleEvent.summary,
      description: googleEvent.description,
      location: googleEvent.location,
      start,
      end,
      allDay: isAllDay,
      timezone: googleEvent.start.timeZone || 'UTC',
      organizer,
      attendees,
      status,
      recurrence,
      visibility: googleEvent.visibility || 'public',
      metadata: {
        htmlLink: googleEvent.htmlLink,
        iCalUID: googleEvent.iCalUID,
        hangoutLink: googleEvent.hangoutLink,
        conferenceData: googleEvent.conferenceData,
        originalStartTime: googleEvent.originalStartTime,
        transparency: googleEvent.transparency,
      },
      externalIds: {
        google: googleEvent.id,
      },
      createdAt: googleEvent.created,
      updatedAt: googleEvent.updated,
    };
    
    return calendarEvent;
  }

  /**
   * Map our CalendarEvent to Google Calendar event format
   */
  private mapCalendarEventToGoogleEvent(event: Partial<CalendarEvent>): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
    };
    
    // Set start and end times
    if (event.allDay) {
      // For all-day events
      googleEvent.start = {
        date: event.start?.split('T')[0], // Extract date part from ISO string
      };
      googleEvent.end = {
        date: event.end?.split('T')[0], // Extract date part from ISO string
      };
    } else {
      // For time-specific events
      googleEvent.start = {
        dateTime: event.start,
        timeZone: event.timezone || 'UTC',
      };
      googleEvent.end = {
        dateTime: event.end,
        timeZone: event.timezone || 'UTC',
      };
    }
    
    // Add attendees
    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        optional: attendee.optional,
        responseStatus: this.mapToGoogleResponseStatus(attendee.responseStatus),
      }));
    }
    
    // Set visibility
    if (event.visibility) {
      googleEvent.visibility = event.visibility;
    }
    
    // Set status
    if (event.status) {
      googleEvent.status = this.mapToGoogleEventStatus(event.status);
    }
    
    // Set recurrence
    if (event.recurrence) {
      googleEvent.recurrence = [this.formatRecurrenceRule(event.recurrence)];
    }
    
    return googleEvent;
  }

  /**
   * Map Google Calendar response status to our format
   */
  private mapGoogleResponseStatus(status?: string): AttendeeResponseStatus {
    switch (status) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentative':
        return 'tentative';
      case 'needsAction':
      default:
        return 'needsAction';
    }
  }

  /**
   * Map our response status to Google Calendar format
   */
  private mapToGoogleResponseStatus(status: AttendeeResponseStatus): string {
    switch (status) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentative':
        return 'tentative';
      case 'needsAction':
      default:
        return 'needsAction';
    }
  }

  /**
   * Map Google Calendar event status to our format
   */
  private mapGoogleEventStatus(status?: string): EventStatus {
    switch (status) {
      case 'confirmed':
        return 'confirmed';
      case 'tentative':
        return 'tentative';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'confirmed';
    }
  }

  /**
   * Map our event status to Google Calendar format
   */
  private mapToGoogleEventStatus(status: EventStatus): string {
    switch (status) {
      case 'confirmed':
        return 'confirmed';
      case 'tentative':
        return 'tentative';
      case 'cancelled':
        return 'cancelled';
      case 'pending':
        return 'tentative';
      default:
        return 'confirmed';
    }
  }

  /**
   * Parse a Google Calendar recurrence rule
   */
  private parseRecurrenceRule(rrule: string): RecurrenceRule | undefined {
    try {
      // Remove RRULE: prefix
      const rule = rrule.replace(/^RRULE:/, '');
      
      // Split into parts
      const parts = rule.split(';');
      
      // Initialize recurrence rule
      const recurrence: Partial<RecurrenceRule> = {};
      
      // Parse each part
      for (const part of parts) {
        const [key, value] = part.split('=');
        
        switch (key) {
          case 'FREQ':
            recurrence.frequency = this.mapFrequency(value);
            break;
          case 'INTERVAL':
            recurrence.interval = parseInt(value, 10);
            break;
          case 'COUNT':
            recurrence.count = parseInt(value, 10);
            break;
          case 'UNTIL':
            recurrence.until = this.formatRruleDate(value);
            break;
          case 'BYDAY':
            recurrence.byDay = value.split(',').map(day => this.mapDay(day));
            break;
          case 'BYMONTHDAY':
            recurrence.byMonthDay = value.split(',').map(day => parseInt(day, 10));
            break;
          case 'BYMONTH':
            recurrence.byMonth = value.split(',').map(month => parseInt(month, 10));
            break;
        }
      }
      
      return recurrence as RecurrenceRule;
    } catch (error) {
      console.error('Error parsing recurrence rule:', error);
      return undefined;
    }
  }

  /**
   * Format a recurrence rule for Google Calendar
   */
  private formatRecurrenceRule(rule: RecurrenceRule): string {
    const parts: string[] = [];
    
    // Add frequency
    parts.push(`FREQ=${this.mapToRruleFrequency(rule.frequency)}`);
    
    // Add interval if specified
    if (rule.interval && rule.interval > 1) {
      parts.push(`INTERVAL=${rule.interval}`);
    }
    
    // Add count if specified
    if (rule.count) {
      parts.push(`COUNT=${rule.count}`);
    }
    
    // Add until if specified
    if (rule.until) {
      parts.push(`UNTIL=${this.formatToRruleDate(rule.until)}`);
    }
    
    // Add by day if specified
    if (rule.byDay && rule.byDay.length > 0) {
      parts.push(`BYDAY=${rule.byDay.map(day => this.mapToRruleDay(day)).join(',')}`);
    }
    
    // Add by month day if specified
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
    }
    
    // Add by month if specified
    if (rule.byMonth && rule.byMonth.length > 0) {
      parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
    }
    
    return `RRULE:${parts.join(';')}`;
  }

  /**
   * Map RRULE frequency to our frequency
   */
  private mapFrequency(freq: string): RecurrenceFrequency {
    switch (freq) {
      case 'DAILY':
        return 'daily';
      case 'WEEKLY':
        return 'weekly';
      case 'MONTHLY':
        return 'monthly';
      case 'YEARLY':
        return 'yearly';
      default:
        return 'custom';
    }
  }

  /**
   * Map our frequency to RRULE frequency
   */
  private mapToRruleFrequency(freq: RecurrenceFrequency): string {
    switch (freq) {
      case 'daily':
        return 'DAILY';
      case 'weekly':
        return 'WEEKLY';
      case 'monthly':
        return 'MONTHLY';
      case 'yearly':
        return 'YEARLY';
      case 'custom':
      default:
        return 'DAILY';
    }
  }

  /**
   * Map RRULE day to our day
   */
  private mapDay(day: string): DayOfWeek {
    const dayMap: Record<string, DayOfWeek> = {
      'MO': 'monday',
      'TU': 'tuesday',
      'WE': 'wednesday',
      'TH': 'thursday',
      'FR': 'friday',
      'SA': 'saturday',
      'SU': 'sunday',
    };
    
    // Remove any prefix (like '1MO')
    const dayCode = day.replace(/^[0-9]+/, '');
    
    return dayMap[dayCode] || 'monday';
  }

  /**
   * Map our day to RRULE day
   */
  private mapToRruleDay(day: DayOfWeek): string {
    const dayMap: Record<DayOfWeek, string> = {
      'monday': 'MO',
      'tuesday': 'TU',
      'wednesday': 'WE',
      'thursday': 'TH',
      'friday': 'FR',
      'saturday': 'SA',
      'sunday': 'SU',
    };
    
    return dayMap[day];
  }

  /**
   * Format RRULE date to ISO string
   */
  private formatRruleDate(date: string): string {
    // RRULE dates are in format YYYYMMDDTHHMMSSZ
    if (date.includes('T')) {
      // Has time component
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      const hour = date.substring(9, 11);
      const minute = date.substring(11, 13);
      const second = date.substring(13, 15);
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    } else {
      // Date only
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      
      return `${year}-${month}-${day}`;
    }
  }

  /**
   * Format ISO date to RRULE date format
   */
  private formatToRruleDate(date: string): string {
    const dt = new Date(date);
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    
    if (date.includes('T')) {
      // Has time component
      const hour = String(dt.getUTCHours()).padStart(2, '0');
      const minute = String(dt.getUTCMinutes()).padStart(2, '0');
      const second = String(dt.getUTCSeconds()).padStart(2, '0');
      
      return `${year}${month}${day}T${hour}${minute}${second}Z`;
    } else {
      // Date only
      return `${year}${month}${day}`;
    }
  }
}
