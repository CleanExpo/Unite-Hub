/**
 * Availability Engine
 *
 * Calculates free time slots from calendar events.
 * Used by: Scheduling agent for meeting availability detection
 */

import type { CalendarEvent, AvailabilitySlot } from './schedulingAgent';

export interface AvailabilityInput {
  calendarEvents: CalendarEvent[];
  durationMinutes: number;
  dateRange: { start: string; end: string };
}

/**
 * Calculate available time slots for meetings
 */
export function calculateAvailability(input: AvailabilityInput): AvailabilitySlot[] {
  const freeSlots: AvailabilitySlot[] = [];

  const rangeStart = new Date(input.dateRange.start).getTime();
  const rangeEnd = new Date(input.dateRange.end).getTime();
  const durationMs = input.durationMinutes * 60 * 1000;

  // Sort events by start time
  const sortedEvents = input.calendarEvents
    .map(e => ({
      start: new Date(e.start).getTime(),
      end: new Date(e.end).getTime(),
      title: e.title,
      original: e,
    }))
    .sort((a, b) => a.start - b.start);

  // Merge overlapping events
  const mergedEvents = mergeOverlappingEvents(sortedEvents);

  // Find gaps between events
  let currentTime = rangeStart;

  for (const event of mergedEvents) {
    // Check if there's a gap before this event
    if (currentTime + durationMs <= event.start) {
      const confidence = calculateConfidence(currentTime, event.start, durationMs);
      freeSlots.push({
        start: new Date(currentTime).toISOString(),
        end: new Date(event.start).toISOString(),
        durationMinutes: (event.start - currentTime) / 60 / 1000,
        confidence,
      });
    }
    currentTime = Math.max(currentTime, event.end);
  }

  // Check if there's space after the last event
  if (currentTime + durationMs <= rangeEnd) {
    const confidence = calculateConfidence(currentTime, rangeEnd, durationMs);
    freeSlots.push({
      start: new Date(currentTime).toISOString(),
      end: new Date(rangeEnd).toISOString(),
      durationMinutes: (rangeEnd - currentTime) / 60 / 1000,
      confidence,
    });
  }

  // Filter slots that are large enough and sort by confidence
  return freeSlots
    .filter(slot => slot.durationMinutes >= input.durationMinutes)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Merge overlapping calendar events
 */
function mergeOverlappingEvents(
  events: Array<{ start: number; end: number; title: string; original: CalendarEvent }>
): Array<{ start: number; end: number }> {
  if (events.length === 0) {
return [];
}

  const merged: Array<{ start: number; end: number }> = [
    { start: events[0].start, end: events[0].end },
  ];

  for (let i = 1; i < events.length; i++) {
    const lastMerged = merged[merged.length - 1];
    const current = events[i];

    if (current.start <= lastMerged.end) {
      // Overlapping - merge
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      // No overlap - add as new event
      merged.push({ start: current.start, end: current.end });
    }
  }

  return merged;
}

/**
 * Calculate confidence score for availability slot (0-1)
 * Lower confidence if slot is adjacent to other events
 */
function calculateConfidence(slotStart: number, slotEnd: number, durationMs: number): number {
  const slotDuration = slotEnd - slotStart;
  const durationRatio = durationMs / slotDuration;

  // More buffer around the actual meeting duration = higher confidence
  // Confidence decreases as the slot gets tighter
  const baseConfidence = 1 - durationRatio * 0.3; // 0.7 - 1.0 range

  // Prefer morning/early afternoon slots (9am-3pm)
  const slotDate = new Date(slotStart);
  const hour = slotDate.getHours();
  const timeBonus =
    hour >= 9 && hour <= 15
      ? 0.1 // +10% bonus for business hours
      : hour >= 8 && hour <= 17
        ? 0.05 // +5% for extended hours
        : -0.1; // -10% for off-hours

  return Math.min(1, Math.max(0, baseConfidence + timeBonus));
}

/**
 * Get next available slot
 */
export function getNextAvailableSlot(slots: AvailabilitySlot[]): AvailabilitySlot | null {
  if (slots.length === 0) {
return null;
}
  return slots[0]; // Already sorted by confidence
}

/**
 * Get N earliest available slots
 */
export function getEarliestSlots(slots: AvailabilitySlot[], count: number): AvailabilitySlot[] {
  return slots.slice(0, count);
}

/**
 * Get preferred time slots (filtered by user preferences)
 */
export function filterByPreference(
  slots: AvailabilitySlot[],
  preferences: string[]
): AvailabilitySlot[] {
  return slots.filter(slot => {
    const slotHour = new Date(slot.start).getHours();
    return preferences.some(pref => {
      if (pref === 'morning') {
return slotHour >= 8 && slotHour < 12;
}
      if (pref === 'afternoon') {
return slotHour >= 12 && slotHour < 17;
}
      if (pref === 'evening') {
return slotHour >= 17 && slotHour < 21;
}
      return true;
    });
  });
}
