/**
 * Elite Production Status Visualization System - Duration Formatting Utilities
 * Australian localisation (en-AU)
 */

// ============================================================================
// Elapsed Time Formatting
// ============================================================================

/**
 * Format elapsed time in seconds to human-readable Australian format
 * @param seconds - Elapsed time in seconds
 * @returns Formatted string (e.g., "1m 23s", "2h 15m")
 */
export function formatElapsedAU(seconds: number): string {
  if (seconds < 0) return '0s';

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format elapsed time with millisecond precision
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted string
 */
export function formatElapsedMs(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return formatElapsedAU(ms / 1000);
}

// ============================================================================
// Timestamp Formatting (Australian)
// ============================================================================

/**
 * Format ISO timestamp to Australian date/time format
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted string (DD/MM/YYYY, H:MM am/pm)
 */
export function formatTimestampAU(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Format ISO timestamp to Australian date only
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted string (DD/MM/YYYY)
 */
export function formatDateAU(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format ISO timestamp to Australian time only
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted string (H:MM am/pm)
 */
export function formatTimeAU(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Invalid time';
  }

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
}

// ============================================================================
// Relative Time Formatting
// ============================================================================

/**
 * Format ISO timestamp to relative time
 * @param isoString - ISO 8601 timestamp
 * @returns Relative time string (e.g., "Just now", "2m ago", "1h ago")
 */
export function getRelativeTimeAU(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const now = Date.now();
  const then = date.getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  // Future timestamps
  if (diffSeconds < 0) {
    return 'In the future';
  }

  // Just now (< 10 seconds)
  if (diffSeconds < 10) {
    return 'Just now';
  }

  // Seconds (< 1 minute)
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  // Minutes (< 1 hour)
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins}m ago`;
  }

  // Hours (< 24 hours)
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }

  // Days (< 7 days)
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }

  // Fall back to full date
  return formatDateAU(isoString);
}

// ============================================================================
// Duration Calculation
// ============================================================================

/**
 * Calculate duration between two timestamps
 * @param startIso - Start timestamp (ISO 8601)
 * @param endIso - End timestamp (ISO 8601), defaults to now
 * @returns Duration in seconds
 */
export function calculateDuration(startIso: string, endIso?: string): number {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();

  if (isNaN(start) || isNaN(end)) {
    return 0;
  }

  return Math.max(0, Math.floor((end - start) / 1000));
}

/**
 * Format duration between two timestamps
 * @param startIso - Start timestamp (ISO 8601)
 * @param endIso - End timestamp (ISO 8601), defaults to now
 * @returns Formatted duration string
 */
export function formatDuration(startIso: string, endIso?: string): string {
  const seconds = calculateDuration(startIso, endIso);
  return formatElapsedAU(seconds);
}

// ============================================================================
// Timezone Utilities
// ============================================================================

/**
 * Get Australian timezone abbreviation based on current date
 * @returns AEST or AEDT
 */
export function getAustralianTimezone(): string {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = now.getTimezoneOffset() < stdOffset;

  // This is a simplified check - in production, use a timezone library
  return isDST ? 'AEDT' : 'AEST';
}

/**
 * Format timestamp with timezone indicator
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted string with timezone (e.g., "2:30 pm AEST")
 */
export function formatTimeWithTimezone(isoString: string): string {
  const time = formatTimeAU(isoString);
  const tz = getAustralianTimezone();
  return `${time} ${tz}`;
}

// ============================================================================
// ETA Calculation
// ============================================================================

/**
 * Calculate estimated time of completion based on progress
 * @param startIso - Start timestamp (ISO 8601)
 * @param progressPercent - Current progress (0-100)
 * @returns Estimated remaining seconds, or null if cannot calculate
 */
export function calculateETA(startIso: string, progressPercent: number): number | null {
  if (progressPercent <= 0 || progressPercent >= 100) {
    return null;
  }

  const elapsedSeconds = calculateDuration(startIso);
  if (elapsedSeconds <= 0) {
    return null;
  }

  // Simple linear extrapolation
  const totalEstimated = elapsedSeconds / (progressPercent / 100);
  const remaining = totalEstimated - elapsedSeconds;

  return Math.max(0, Math.floor(remaining));
}

/**
 * Format ETA to human-readable string
 * @param startIso - Start timestamp (ISO 8601)
 * @param progressPercent - Current progress (0-100)
 * @returns Formatted ETA string or "Calculating..."
 */
export function formatETA(startIso: string, progressPercent: number): string {
  const remainingSeconds = calculateETA(startIso, progressPercent);

  if (remainingSeconds === null) {
    return progressPercent >= 100 ? 'Complete' : 'Calculating...';
  }

  if (remainingSeconds < 10) {
    return 'Almost done';
  }

  return `~${formatElapsedAU(remainingSeconds)} remaining`;
}
