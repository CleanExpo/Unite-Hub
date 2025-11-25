/**
 * Scheduling Communications Module
 *
 * Generates professional meeting proposals and calendar invites.
 * Used by: Scheduling agent for email and iCalendar generation
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import type { AvailabilitySlot } from './schedulingAgent';

export interface EmailOptions {
  brand: BrandId;
  participant: string;
  availableSlots: AvailabilitySlot[];
  timezone: string;
  description?: string;
}

export interface CalendarInviteOptions {
  brand: BrandId;
  participant: string;
  participantEmail: string;
  slots: AvailabilitySlot[];
  duration: number;
}

/**
 * Build professional meeting proposal email
 */
export function buildSchedulingEmail(options: EmailOptions): string {
  const { brand, participant, availableSlots, timezone, description } = options;

  const slots = availableSlots
    .slice(0, 5)
    .map((slot, idx) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      const timeStr = `${start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      })} - ${end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      })} ${timezone}`;
      const dateStr = start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const confidenceStr =
        slot.confidence >= 0.85 ? '✓ Highly available' :
        slot.confidence >= 0.7 ? '✓ Available' :
        '◐ Tight fit';

      return `${idx + 1}. ${dateStr} - ${timeStr}\n   ${confidenceStr}`;
    })
    .join('\n');

  const durationMin = options.availableSlots[0]?.durationMinutes || 60;
  const description_section = description ? `\n\nMeeting Details:\n${description}\n` : '';

  return `Hi ${participant},

I'd like to schedule a meeting with you. Based on your availability, here are some times that work well:

${slots}

${description_section}
Please let me know which option works best for you, or feel free to suggest an alternative time if none of these options suit your schedule.

Looking forward to connecting!

Best regards,
${getBrandName(brand)} Team`;
}

/**
 * Build iCalendar format invite
 */
export function buildCalendarInvite(options: CalendarInviteOptions): string {
  const { participant, participantEmail, slots, duration } = options;

  // Use first (highest confidence) slot as the proposed time
  const proposedSlot = slots[0];
  if (!proposedSlot) {
    return '';
  }

  const startDt = formatICalDate(new Date(proposedSlot.start));
  const endDate = new Date(new Date(proposedSlot.start).getTime() + duration * 60 * 1000);
  const endDt = formatICalDate(endDate);

  const eventId = `${crypto.randomUUID()}@unite-hub.local`;
  const stamp = formatICalDate(new Date());

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Unite-Hub//Meeting Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${stamp}
DTSTART:${startDt}
DTEND:${endDt}
SUMMARY:Meeting with ${participant}
DESCRIPTION:Proposed meeting time
ORGANIZER:noreply@unite-hub.local
ATTENDEE:${participantEmail}
STATUS:TENTATIVE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ format)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Get human-friendly brand name
 */
function getBrandName(brand: BrandId): string {
  const names: Record<BrandId, string> = {
    unite_hub: 'Unite-Hub',
    disaster_recovery_au: 'Disaster Recovery Australia',
    carsi: 'CARSI',
    synthex: 'Synthex',
    nrpg: 'NRPG',
    unite_group: 'Unite Group',
  };

  return names[brand] || brand;
}

/**
 * Build busy notification (when calendar is overbooked)
 */
export function buildBusyNotification(
  participant: string,
  availableSlots: AvailabilitySlot[]
): string {
  if (availableSlots.length === 0) {
    return `Hi ${participant},

Unfortunately, I don't have any available time in my calendar for the requested date range.

Could you please suggest some alternative dates that might work better for you? I'm happy to shift things around to accommodate your schedule.

Thanks!`;
  }

  if (availableSlots.length < 3) {
    return `Hi ${participant},

My calendar is quite full for the requested period, but I do have a few narrow windows available. Given the limited options, would you be able to work with any of these times?

Otherwise, I can look at extending the date range to find more convenient times.

Thanks!`;
  }

  return '';
}

/**
 * Build reschedule request (when conflict detected)
 */
export function buildRescheduleRequest(
  targetEvent: string,
  reason: string
): string {
  return `I need to reschedule "${targetEvent}" due to a scheduling conflict.

Reason: ${reason}

Could you let me know your availability for an alternative time?

Thanks!`;
}

/**
 * Build thank you confirmation (after meeting scheduled)
 */
export function buildConfirmationMessage(
  participant: string,
  meetingTime: Date,
  meetingDuration: number
): string {
  const timeStr = meetingTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = meetingTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return `Hi ${participant},

Great! I've confirmed our meeting for:

📅 ${dateStr}
⏰ ${timeStr}
⏱️ ${meetingDuration} minutes

You should receive a calendar invite shortly. Please add it to your calendar.

Looking forward to our conversation!

Best regards`;
}
