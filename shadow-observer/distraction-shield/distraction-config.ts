/**
 * Distraction Shield Intelligence Module Configuration
 * Analyzes founder focus patterns and distraction impact
 */

export const distractionConfig = {
  // Database
  distractionTable: 'distraction_events',
  focusSessionTable: 'founder_focus_sessions',
  timeBlockTable: 'time_blocks',

  // Reporting
  reportDir: './reports',
  reportFormat: 'json' as const,

  // Analysis thresholds
  focusDayThreshold: 8,        // Hours of focus needed for "good focus day"
  recoveryTimeWarning: 30,     // Minutes - warn if recovery > 30 min
  distractionHighThreshold: 10, // Count - more than 10 distractions = high
  preventionRateTarget: 80,    // % - target 80% prevention rate

  // Distraction source weights (impact on focus)
  sourceWeights: {
    'slack': 0.6,
    'email': 0.5,
    'phone': 0.8,
    'meeting': 0.9,
    'employee': 0.7,
    'client': 0.9,
    'internal_thought': 0.3,
    'notification': 0.4,
    'social_media': 0.7,
    'other': 0.5
  },

  // Analysis windows
  analysisWindows: {
    daily: 1,      // days
    weekly: 7,     // days
    monthly: 30    // days
  }
};

export type DistractionConfig = typeof distractionConfig;
