/**
 * Skill Heatmap Engine (SHE) Configuration
 * Visualizes skill usage, value, and health trends over time
 */

export const heatmapConfig = {
  // Intensity calculation weights
  weights: {
    usage: 0.4,        // 40% - How frequently used
    value: 0.35,       // 35% - Overall skill value
    health: 0.25       // 25% - Health score (docs, tests, maintenance)
  },

  // Intensity thresholds (0-100)
  intensityRanges: {
    critical: 85,      // High value, heavily used, good health
    high: 70,          // Good value and usage
    medium: 50,        // Average usage/value
    low: 30,           // Low usage or low value
    cold: 0            // Unused or deprecated
  },

  // Heat zones (for visual representation)
  heatZones: {
    superhotCore: {      // Top-tier strategic skills
      minIntensity: 90,
      minUsage: 50,
      minValue: 9,
      color: 'FF0000'  // Red
    },
    hotStrategic: {      // High-value, frequently used
      minIntensity: 75,
      minUsage: 20,
      minValue: 8,
      color: 'FF6600'  // Orange
    },
    warmMaintained: {    // Good skills, regular use
      minIntensity: 55,
      minUsage: 5,
      minValue: 6,
      color: 'FFFF00'  // Yellow
    },
    coolUnderutilized: { // Good skills, low use
      minIntensity: 30,
      minUsage: 0,
      minValue: 5,
      color: '00CCFF'  // Light blue
    },
    frozenDeprecated: {  // Unused or deprecated
      minIntensity: 0,
      minUsage: 0,
      minValue: 0,
      color: '6666FF'  // Dark blue
    }
  },

  // Time-based trend analysis
  trendWindows: {
    oneWeek: 7,
    twoWeeks: 14,
    oneMonth: 30,
    threeMonths: 90
  },

  // Report settings
  reportFormat: 'json' as const,
  includeVisualizations: true,
  includeTimeSeries: true
};

export type HeatmapConfig = typeof heatmapConfig;
