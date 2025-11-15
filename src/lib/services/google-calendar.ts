import { google, calendar_v3 } from "googleapis";
import { db } from "@/lib/db";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  conferenceData?: any;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;
  private oauth2Client: any;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  /**
   * List events within a time range
   */
  async listEvents(
    timeMin: string,
    timeMax: string,
    maxResults: number = 50
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults,
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error listing calendar events:", error);
      throw error;
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId,
      });

      return response.data;
    } catch (error) {
      console.error("Error getting calendar event:", error);
      return null;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event as calendar_v3.Schema$Event,
        conferenceDataVersion: event.conferenceData ? 1 : 0,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody: event as calendar_v3.Schema$Event,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(
    timeMin: string,
    timeMax: string,
    calendars: string[] = ["primary"]
  ): Promise<any> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendars.map((id) => ({ id })),
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error getting free/busy data:", error);
      throw error;
    }
  }

  /**
   * Find available time slots in a date range
   */
  async findAvailableSlots(
    startDate: Date,
    endDate: Date,
    slotDuration: number = 30, // minutes
    workingHoursStart: number = 9, // 9 AM
    workingHoursEnd: number = 17 // 5 PM
  ): Promise<TimeSlot[]> {
    try {
      const events = await this.listEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      const availableSlots: TimeSlot[] = [];
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Generate slots for working hours
        for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
          for (let minute = 0; minute < 60; minute += slotDuration) {
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

            // Check if slot conflicts with any events
            const hasConflict = events.some((event) => {
              if (!event.start?.dateTime || !event.end?.dateTime) return false;

              const eventStart = new Date(event.start.dateTime);
              const eventEnd = new Date(event.end.dateTime);

              return (
                (slotStart >= eventStart && slotStart < eventEnd) ||
                (slotEnd > eventStart && slotEnd <= eventEnd) ||
                (slotStart <= eventStart && slotEnd >= eventEnd)
              );
            });

            availableSlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              available: !hasConflict,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availableSlots.filter((slot) => slot.available);
    } catch (error) {
      console.error("Error finding available slots:", error);
      throw error;
    }
  }

  /**
   * Create a meeting with Google Meet link
   */
  async createMeetingWithConference(
    summary: string,
    start: string,
    end: string,
    attendees: string[],
    description?: string
  ): Promise<calendar_v3.Schema$Event> {
    const event: CalendarEvent = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: "America/New_York", // TODO: Make configurable
      },
      end: {
        dateTime: end,
        timeZone: "America/New_York",
      },
      attendees: attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    return await this.createEvent(event);
  }
}

/**
 * Get calendar service instance for a workspace
 */
export async function getCalendarService(
  workspaceId: string
): Promise<GoogleCalendarService | null> {
  try {
    // Get active Gmail integration (which now includes calendar scopes)
    const integrations = await db.emailIntegrations.getByWorkspace(workspaceId);

    if (!integrations || integrations.length === 0) {
      return null;
    }

    const integration = integrations[0];

    if (!integration.access_token) {
      return null;
    }

    return new GoogleCalendarService(
      integration.access_token,
      integration.refresh_token || undefined
    );
  } catch (error) {
    console.error("Error getting calendar service:", error);
    return null;
  }
}
