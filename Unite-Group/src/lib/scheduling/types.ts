/**
 * Scheduling System Types
 * Type definitions for scheduling and calendar functionality
 */

/**
 * Calendar provider types
 */
export type CalendarProvider = 
  | 'google'
  | 'microsoft'
  | 'apple'
  | 'internal'
  | 'custom';

/**
 * Event status
 */
export type EventStatus = 
  | 'confirmed'
  | 'tentative'
  | 'cancelled'
  | 'pending';

/**
 * Recurrence frequency
 */
export type RecurrenceFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

/**
 * Day of the week
 */
export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * Event attendee role
 */
export type AttendeeRole = 
  | 'organizer'
  | 'required'
  | 'optional'
  | 'informational';

/**
 * Attendee response status
 */
export type AttendeeResponseStatus = 
  | 'needsAction'
  | 'accepted'
  | 'declined'
  | 'tentative';

/**
 * Notification type
 */
export type NotificationType = 
  | 'email'
  | 'sms'
  | 'push'
  | 'in-app';

/**
 * Notification trigger time unit
 */
export type NotificationTimeUnit = 
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks';

/**
 * Availability status
 */
export type AvailabilityStatus = 
  | 'available'
  | 'busy'
  | 'unavailable'
  | 'tentative'
  | 'out-of-office';

/**
 * Time slot
 */
export interface TimeSlot {
  start: string; // ISO date string
  end: string; // ISO date string
  status: AvailabilityStatus;
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
}

/**
 * Calendar event attendee
 */
export interface Attendee {
  id?: string;
  email: string;
  name?: string;
  role: AttendeeRole;
  responseStatus: AttendeeResponseStatus;
  comment?: string;
  optional: boolean;
  phoneNumber?: string;
}

/**
 * Notification configuration
 */
export interface NotificationSetting {
  type: NotificationType;
  time: number;
  timeUnit: NotificationTimeUnit;
  recipient?: string; // email or phone number
  template?: string; // template ID
}

/**
 * Recurrence rule
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: string; // ISO date string
  byDay?: DayOfWeek[];
  byMonthDay?: number[];
  byMonth?: number[];
  excludeDates?: string[]; // ISO date strings
  exceptionDates?: string[]; // ISO date strings
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay: boolean;
  timezone: string;
  organizer: {
    id?: string;
    name: string;
    email: string;
  };
  attendees: Attendee[];
  status: EventStatus;
  recurrence?: RecurrenceRule;
  notifications?: NotificationSetting[];
  visibility: 'public' | 'private' | 'confidential';
  metadata?: Record<string, any>;
  externalIds?: Record<string, string>; // Map of provider -> external ID
  createdAt: string;
  updatedAt: string;
}

/**
 * Provider-specific calendar
 */
export interface Calendar {
  id: string;
  provider: CalendarProvider;
  name: string;
  description?: string;
  color?: string;
  timezone?: string;
  owner: {
    id?: string;
    name: string;
    email: string;
  };
  accessRole: 'owner' | 'writer' | 'reader';
  externalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Service provider availability settings
 */
export interface AvailabilitySettings {
  userId: string;
  timezone: string;
  weeklyHours: Record<DayOfWeek, TimeSlot[]>;
  bufferBetweenEvents?: number; // minutes
  exceptionalDays: Record<string, TimeSlot[]>; // Map of date string -> time slots
  unavailableDates: string[]; // ISO date strings
  maxBookingsPerDay?: number;
  advanceBookingDays?: number; // How many days in advance can people book
  minNoticeTime?: number; // Minimum notice in minutes
  minNoticeUnit?: NotificationTimeUnit;
}

/**
 * Appointment/meeting type
 */
export interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  color?: string;
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
  location?: string;
  providers: string[]; // User IDs of service providers
  maxAttendees?: number;
  price?: number;
  currency?: string;
  schedulingNotice?: string;
  cancellationPolicy?: string;
  availabilityOverrides?: Partial<AvailabilitySettings>;
  customQuestions?: {
    id: string;
    question: string;
    type: 'text' | 'select' | 'multiselect' | 'checkbox';
    required: boolean;
    options?: string[];
  }[];
  active: boolean;
  metadata?: Record<string, any>;
}

/**
 * Booking/appointment
 */
export interface Booking {
  id: string;
  eventId: string;
  appointmentTypeId: string;
  customerId: string;
  providerIds: string[];
  start: string; // ISO date string
  end: string; // ISO date string
  timezone: string;
  status: EventStatus;
  location?: string;
  notes?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerResponses?: Record<string, any>; // Responses to custom questions
  paymentStatus?: 'none' | 'pending' | 'paid' | 'failed';
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentTransactionId?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  remindersSent?: boolean;
  noShow?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
