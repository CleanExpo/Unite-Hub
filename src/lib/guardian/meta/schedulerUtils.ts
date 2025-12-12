/**
 * Guardian Z13: Scheduler Utilities
 * Deterministic computation of next_run_at for automation schedules
 * Supports: hourly, daily, weekly, monthly cadences
 */

/**
 * Compute next run time for a schedule
 * Deterministic: same inputs always produce same output
 */
export interface ScheduleConfig {
  cadence: 'hourly' | 'daily' | 'weekly' | 'monthly';
  runAtHour: number; // 0-23
  runAtMinute: number; // 0-59
  dayOfWeek?: number; // 0-6 (0 = Sunday) for weekly
  dayOfMonth?: number; // 1-28/31 for monthly
  timezone?: string; // Ignored for now (computed in UTC)
}

/**
 * Compute the next run time after the given date
 * Deterministic scheduling: hourly → daily → weekly → monthly
 */
export function computeNextRunAt(now: Date, schedule: ScheduleConfig): Date {
  const next = new Date(now);

  switch (schedule.cadence) {
    case 'hourly':
      // Next run: exactly 1 hour from now
      next.setUTCHours(next.getUTCHours() + 1);
      next.setUTCMinutes(schedule.runAtMinute);
      next.setUTCSeconds(0);
      next.setUTCMilliseconds(0);
      break;

    case 'daily':
      // Next run: tomorrow at runAtHour:runAtMinute
      next.setUTCDate(next.getUTCDate() + 1);
      next.setUTCHours(schedule.runAtHour);
      next.setUTCMinutes(schedule.runAtMinute);
      next.setUTCSeconds(0);
      next.setUTCMilliseconds(0);

      // If that time has already passed today, ensure it's tomorrow
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      break;

    case 'weekly':
      // Next run: on the specified day of week at runAtHour:runAtMinute
      const dayOfWeek = schedule.dayOfWeek ?? 1; // Default: Monday
      const currentDayOfWeek = next.getUTCDay();
      let daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;

      // If same day, check if time has passed
      if (daysToAdd === 0) {
        const checkTime = new Date(next);
        checkTime.setUTCHours(schedule.runAtHour);
        checkTime.setUTCMinutes(schedule.runAtMinute);
        checkTime.setUTCSeconds(0);
        checkTime.setUTCMilliseconds(0);

        if (checkTime <= now) {
          daysToAdd = 7; // Next week
        } else {
          next.setTime(checkTime.getTime());
          return next;
        }
      }

      next.setUTCDate(next.getUTCDate() + daysToAdd);
      next.setUTCHours(schedule.runAtHour);
      next.setUTCMinutes(schedule.runAtMinute);
      next.setUTCSeconds(0);
      next.setUTCMilliseconds(0);
      break;

    case 'monthly':
      // Next run: on the specified day of month at runAtHour:runAtMinute
      const dayOfMonth = schedule.dayOfMonth ?? 1;
      const currentDay = next.getUTCDate();

      if (dayOfMonth > currentDay) {
        // Run this month
        next.setUTCDate(dayOfMonth);
      } else if (dayOfMonth === currentDay) {
        // Check if time has passed today
        const checkTime = new Date(next);
        checkTime.setUTCHours(schedule.runAtHour);
        checkTime.setUTCMinutes(schedule.runAtMinute);
        checkTime.setUTCSeconds(0);
        checkTime.setUTCMilliseconds(0);

        if (checkTime <= now) {
          // Time has passed, run next month
          next.setUTCMonth(next.getUTCMonth() + 1);
          next.setUTCDate(Math.min(dayOfMonth, getLastDayOfMonth(next)));
        } else {
          next.setTime(checkTime.getTime());
          return next;
        }
      } else {
        // Day has passed, run next month
        next.setUTCMonth(next.getUTCMonth() + 1);
        next.setUTCDate(Math.min(dayOfMonth, getLastDayOfMonth(next)));
      }

      next.setUTCHours(schedule.runAtHour);
      next.setUTCMinutes(schedule.runAtMinute);
      next.setUTCSeconds(0);
      next.setUTCMilliseconds(0);
      break;
  }

  // Safety: ensure next is always in the future
  if (next <= now) {
    next.setUTCHours(next.getUTCHours() + 1);
  }

  return next;
}

/**
 * Get the last day of the month for a given date
 */
function getLastDayOfMonth(date: Date): number {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(0);
  return next.getUTCDate();
}

/**
 * Check if a schedule is due to run
 */
export function isDue(now: Date, nextRunAt?: Date | null): boolean {
  if (!nextRunAt) return false;
  return nextRunAt <= now;
}

/**
 * Format schedule for display
 */
export function formatScheduleCadence(schedule: ScheduleConfig): string {
  switch (schedule.cadence) {
    case 'hourly':
      return `Every hour at :${String(schedule.runAtMinute).padStart(2, '0')}`;

    case 'daily':
      return `Daily at ${String(schedule.runAtHour).padStart(2, '0')}:${String(schedule.runAtMinute).padStart(2, '0')}`;

    case 'weekly':
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[schedule.dayOfWeek ?? 1];
      return `Weekly on ${day} at ${String(schedule.runAtHour).padStart(2, '0')}:${String(schedule.runAtMinute).padStart(2, '0')}`;

    case 'monthly':
      return `Monthly on the ${schedule.dayOfMonth || 1}th at ${String(schedule.runAtHour).padStart(2, '0')}:${String(schedule.runAtMinute).padStart(2, '0')}`;

    default:
      return 'Unknown schedule';
  }
}
