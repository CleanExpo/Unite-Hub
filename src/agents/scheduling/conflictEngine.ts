/**
 * Conflict Detection Engine
 *
 * Identifies overlapping calendar events and scheduling conflicts.
 * Used by: Scheduling agent for conflict analysis and resolution suggestions
 */

import type { CalendarEvent } from './schedulingAgent';

export interface ConflictAnalysis {
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
  severity: 'low' | 'medium' | 'high'; // based on overlap duration
  suggestedResolution?: string;
}

/**
 * Detect conflicts (overlapping events) in calendar
 */
export function detectConflicts(events: CalendarEvent[]): ConflictAnalysis[] {
  const conflicts: ConflictAnalysis[] = [];

  // Sort events by start time
  const sorted = events
    .map((e, idx) => ({
      ...e,
      startMs: new Date(e.start).getTime(),
      endMs: new Date(e.end).getTime(),
      originalIndex: idx,
    }))
    .sort((a, b) => a.startMs - b.startMs);

  // Compare each pair of events
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const eventA = sorted[i];
      const eventB = sorted[j];

      // Check if events overlap
      if (eventA.endMs > eventB.startMs) {
        const overlapMs = Math.min(eventA.endMs, eventB.endMs) - eventB.startMs;
        const overlapMinutes = Math.round(overlapMs / 60 / 1000);
        const severity = calculateConflictSeverity(overlapMinutes);
        const suggestion = getResolutionSuggestion(eventA, eventB, overlapMinutes);

        conflicts.push({
          eventA: {
            id: eventA.id,
            title: eventA.title,
            start: eventA.start,
            end: eventA.end,
            organizer: eventA.organizer,
            attendees: eventA.attendees,
          },
          eventB: {
            id: eventB.id,
            title: eventB.title,
            start: eventB.start,
            end: eventB.end,
            organizer: eventB.organizer,
            attendees: eventB.attendees,
          },
          overlapMinutes,
          severity,
          suggestedResolution: suggestion,
        });
      }
    }
  }

  return conflicts.sort((a, b) => b.overlapMinutes - a.overlapMinutes);
}

/**
 * Calculate conflict severity based on overlap duration
 */
function calculateConflictSeverity(overlapMinutes: number): 'low' | 'medium' | 'high' {
  if (overlapMinutes <= 15) return 'low';
  if (overlapMinutes <= 30) return 'medium';
  return 'high';
}

/**
 * Generate resolution suggestion for conflicting events
 */
function getResolutionSuggestion(
  eventA: any,
  eventB: any,
  overlapMinutes: number
): string {
  const durationA = (eventA.endMs - eventA.startMs) / 60 / 1000;
  const durationB = (eventB.endMs - eventB.startMs) / 60 / 1000;

  if (eventA.organizer && !eventB.organizer) {
    return `Reschedule "${eventB.title}" to avoid overlap with "${eventA.title}"`;
  }

  if (durationA <= 15) {
    return `Consider shortening "${eventA.title}" (${durationA}min) to resolve conflict`;
  }

  if (durationB <= 15) {
    return `Consider shortening "${eventB.title}" (${durationB}min) to resolve conflict`;
  }

  const gapAfterA = eventB.startMs - eventA.endMs;
  const gapBeforeA = eventA.startMs - new Date().getTime();

  if (gapAfterA > 0) {
    return `Reschedule "${eventA.title}" earlier to create buffer before "${eventB.title}"`;
  }

  return `Review and reschedule one of the overlapping events`;
}

/**
 * Get consecutive events (back-to-back meetings)
 */
export function findConsecutiveEvents(
  events: CalendarEvent[],
  maxGapMinutes: number = 15
): CalendarEvent[][] {
  if (events.length < 2) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const chains: CalendarEvent[][] = [];
  let currentChain: CalendarEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(sorted[i - 1].end).getTime();
    const currentStart = new Date(sorted[i].start).getTime();
    const gapMinutes = (currentStart - prevEnd) / 60 / 1000;

    if (gapMinutes <= maxGapMinutes) {
      currentChain.push(sorted[i]);
    } else {
      if (currentChain.length > 1) {
        chains.push(currentChain);
      }
      currentChain = [sorted[i]];
    }
  }

  if (currentChain.length > 1) {
    chains.push(currentChain);
  }

  return chains;
}

/**
 * Get events by organizer (identifies who is causing conflicts)
 */
export function eventsByOrganizer(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const organizer = event.organizer || 'Unknown';
    if (!map.has(organizer)) {
      map.set(organizer, []);
    }
    map.get(organizer)!.push(event);
  }

  return map;
}

/**
 * Analyze conflict patterns (busy times, conflict hotspots)
 */
export function analyzeConflictPatterns(
  events: CalendarEvent[]
): { busyHours: number[]; busyDays: number[]; conflictDensity: number } {
  const busyHours = new Map<number, number>();
  const busyDays = new Map<number, number>();

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const day = start.getDay();

    busyDays.set(day, (busyDays.get(day) || 0) + 1);

    // Mark each hour the event spans as busy
    for (let hour = start.getHours(); hour <= end.getHours(); hour++) {
      busyHours.set(hour, (busyHours.get(hour) || 0) + 1);
    }
  }

  const sortedHours = Array.from(busyHours.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([hour]) => hour);

  const sortedDays = Array.from(busyDays.entries())
    .filter(([_, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .map(([day]) => day);

  const conflicts = detectConflicts(events);
  const conflictDensity =
    events.length > 0
      ? Math.round((conflicts.length / (events.length * (events.length - 1)) / 2) * 100)
      : 0;

  return {
    busyHours: sortedHours,
    busyDays: sortedDays,
    conflictDensity,
  };
}
