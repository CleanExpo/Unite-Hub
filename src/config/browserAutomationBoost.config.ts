/**
 * Browser Automation Boost Configuration
 * Automated browser-based testing, interaction simulation, and pattern learning
 *
 * @module browserAutomationBoost.config
 * @version 1.0.0
 */

/**
 * Supported browsers for automation
 */
export type Browser = 'chromium' | 'firefox' | 'webkit' | 'edge';

/**
 * Execution modes for browser automation
 */
export type ExecutionMode = 'manual' | 'scheduled' | 'event_triggered';

/**
 * Pattern types for learning
 */
export type PatternType =
  | 'navigation'
  | 'form_interaction'
  | 'click_sequence'
  | 'scroll_behavior'
  | 'input_validation'
  | 'error_handling'
  | 'performance_bottleneck';

/**
 * Browser automation action types
 */
export type ActionType =
  | 'navigate'
  | 'click'
  | 'input_text'
  | 'submit'
  | 'scroll'
  | 'wait'
  | 'screenshot'
  | 'extract_data'
  | 'check_assertion';

/**
 * Browser automation pattern
 */
export interface AutomationPattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
  actions: ActionType[];
  successRate: number; // 0-100
  lastExecuted?: Date;
  isActive: boolean;
}

/**
 * Browser Automation Boost configuration interface
 */
export interface BrowserAutomationBoostConfig {
  /** Enable/disable browser automation */
  BROWSER_AUTOMATION_ENABLED: boolean;

  /** Enable pattern learning from automation runs */
  PATTERN_LEARNING_ENABLED: boolean;

  /** Maximum patterns to store per business */
  MAX_PATTERNS_PER_BUSINESS: number;

  /** Execution mode: manual (default), scheduled, event_triggered */
  EXECUTION_MODE: ExecutionMode;

  /** Supported browsers for automation */
  SUPPORTED_BROWSERS: Browser[];

  /** Enable headless mode (no UI) */
  HEADLESS_MODE_ENABLED: boolean;

  /** Browser page load timeout in seconds */
  PAGE_LOAD_TIMEOUT_SECONDS: number;

  /** Maximum parallel browser instances */
  MAX_PARALLEL_INSTANCES: number;

  /** Enable screenshot capture on each action */
  SCREENSHOT_CAPTURE_ENABLED: boolean;

  /** Enable performance metrics collection */
  PERFORMANCE_METRICS_ENABLED: boolean;

  /** Enable JavaScript error collection */
  JS_ERROR_COLLECTION_ENABLED: boolean;

  /** Enable network request tracking */
  NETWORK_TRACKING_ENABLED: boolean;

  /** Enable accessibility scanning during automation */
  ACCESSIBILITY_SCANNING_ENABLED: boolean;

  /** Enable video recording of automation runs */
  VIDEO_RECORDING_ENABLED: boolean;

  /** Retention days for automation logs */
  LOG_RETENTION_DAYS: number;

  /** Enable pattern-based bot detection avoidance */
  BOT_DETECTION_AVOIDANCE_ENABLED: boolean;

  /** Enable proxy rotation for automation */
  PROXY_ROTATION_ENABLED: boolean;

  /** Maximum retry attempts for failed actions */
  MAX_RETRY_ATTEMPTS: number;

  /** Delay between actions in milliseconds */
  ACTION_DELAY_MS: number;

  /** Enable competitive intelligence gathering */
  COMPETITOR_INTELLIGENCE_ENABLED: boolean;

  /** Cache automation results for this many hours */
  AUTOMATION_CACHE_HOURS: number;
}

/**
 * Browser Automation Boost runtime configuration
 */
export const BROWSER_AUTOMATION_BOOST_CONFIG: BrowserAutomationBoostConfig = {
  BROWSER_AUTOMATION_ENABLED:
    process.env.BROWSER_AUTOMATION_ENABLED !== 'false',

  PATTERN_LEARNING_ENABLED:
    process.env.PATTERN_LEARNING_ENABLED !== 'false',

  MAX_PATTERNS_PER_BUSINESS: parseInt(
    process.env.MAX_PATTERNS_PER_BUSINESS || '50',
    10
  ),

  EXECUTION_MODE:
    (process.env.EXECUTION_MODE as ExecutionMode) || 'manual',

  SUPPORTED_BROWSERS: (
    process.env.SUPPORTED_BROWSERS
      ? process.env.SUPPORTED_BROWSERS.split(',')
      : ['chromium', 'firefox', 'webkit']
  ) as Browser[],

  HEADLESS_MODE_ENABLED:
    process.env.HEADLESS_MODE_ENABLED !== 'false',

  PAGE_LOAD_TIMEOUT_SECONDS: parseInt(
    process.env.PAGE_LOAD_TIMEOUT_SECONDS || '30',
    10
  ),

  MAX_PARALLEL_INSTANCES: parseInt(
    process.env.MAX_PARALLEL_INSTANCES || '5',
    10
  ),

  SCREENSHOT_CAPTURE_ENABLED:
    process.env.SCREENSHOT_CAPTURE_ENABLED !== 'false',

  PERFORMANCE_METRICS_ENABLED:
    process.env.PERFORMANCE_METRICS_ENABLED !== 'false',

  JS_ERROR_COLLECTION_ENABLED:
    process.env.JS_ERROR_COLLECTION_ENABLED !== 'false',

  NETWORK_TRACKING_ENABLED:
    process.env.NETWORK_TRACKING_ENABLED !== 'false',

  ACCESSIBILITY_SCANNING_ENABLED:
    process.env.ACCESSIBILITY_SCANNING_ENABLED !== 'false',

  VIDEO_RECORDING_ENABLED:
    process.env.VIDEO_RECORDING_ENABLED === 'true',

  LOG_RETENTION_DAYS: parseInt(
    process.env.LOG_RETENTION_DAYS || '30',
    10
  ),

  BOT_DETECTION_AVOIDANCE_ENABLED:
    process.env.BOT_DETECTION_AVOIDANCE_ENABLED !== 'false',

  PROXY_ROTATION_ENABLED:
    process.env.PROXY_ROTATION_ENABLED === 'true',

  MAX_RETRY_ATTEMPTS: parseInt(
    process.env.MAX_RETRY_ATTEMPTS || '3',
    10
  ),

  ACTION_DELAY_MS: parseInt(
    process.env.ACTION_DELAY_MS || '500',
    10
  ),

  COMPETITOR_INTELLIGENCE_ENABLED:
    process.env.COMPETITOR_INTELLIGENCE_ENABLED !== 'false',

  AUTOMATION_CACHE_HOURS: parseInt(
    process.env.AUTOMATION_CACHE_HOURS || '6',
    10
  ),
};

/**
 * Default automation patterns (shared templates)
 */
export const DEFAULT_AUTOMATION_PATTERNS: AutomationPattern[] = [
  {
    id: 'verify_homepage_load',
    name: 'Verify Homepage Load',
    type: 'navigation',
    description: 'Navigate to homepage and verify all critical elements load',
    actions: ['navigate', 'wait', 'screenshot', 'extract_data', 'check_assertion'],
    successRate: 98,
    isActive: true,
  },
  {
    id: 'test_contact_form',
    name: 'Test Contact Form',
    type: 'form_interaction',
    description: 'Fill and submit contact form with validation',
    actions: ['navigate', 'input_text', 'click', 'submit', 'check_assertion'],
    successRate: 95,
    isActive: true,
  },
  {
    id: 'verify_mobile_responsive',
    name: 'Verify Mobile Responsive',
    type: 'scroll_behavior',
    description: 'Test mobile responsiveness and layout',
    actions: ['navigate', 'scroll', 'screenshot', 'check_assertion'],
    successRate: 97,
    isActive: true,
  },
  {
    id: 'check_page_performance',
    name: 'Check Page Performance',
    type: 'performance_bottleneck',
    description: 'Measure page load metrics and identify bottlenecks',
    actions: ['navigate', 'wait', 'extract_data', 'screenshot'],
    successRate: 99,
    isActive: true,
  },
  {
    id: 'verify_competitor_changes',
    name: 'Verify Competitor Changes',
    type: 'navigation',
    description: 'Monitor competitor website for significant changes',
    actions: ['navigate', 'screenshot', 'extract_data', 'check_assertion'],
    successRate: 92,
    isActive: true,
  },
];

/**
 * Validate Browser Automation Boost configuration
 */
export function validateBrowserAutomationBoostConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (BROWSER_AUTOMATION_BOOST_CONFIG.MAX_PATTERNS_PER_BUSINESS < 1) {
    errors.push('MAX_PATTERNS_PER_BUSINESS must be at least 1');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.PAGE_LOAD_TIMEOUT_SECONDS < 5) {
    errors.push('PAGE_LOAD_TIMEOUT_SECONDS should be at least 5');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.MAX_PARALLEL_INSTANCES < 1) {
    errors.push('MAX_PARALLEL_INSTANCES must be at least 1');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.MAX_PARALLEL_INSTANCES > 20) {
    errors.push('MAX_PARALLEL_INSTANCES should not exceed 20 for stability');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.LOG_RETENTION_DAYS < 1) {
    errors.push('LOG_RETENTION_DAYS must be at least 1');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.MAX_RETRY_ATTEMPTS < 0) {
    errors.push('MAX_RETRY_ATTEMPTS must be 0 or greater');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.ACTION_DELAY_MS < 0) {
    errors.push('ACTION_DELAY_MS must be 0 or greater');
  }

  if (BROWSER_AUTOMATION_BOOST_CONFIG.SUPPORTED_BROWSERS.length === 0) {
    errors.push('At least one browser must be supported');
  }

  const validBrowsers = ['chromium', 'firefox', 'webkit', 'edge'];
  const invalidBrowsers = BROWSER_AUTOMATION_BOOST_CONFIG.SUPPORTED_BROWSERS.filter(
    (b) => !validBrowsers.includes(b)
  );
  if (invalidBrowsers.length > 0) {
    errors.push(
      `Invalid browsers: ${invalidBrowsers.join(
        ', '
      )}. Must be one of: ${validBrowsers.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get supported browsers list
 */
export function getSupportedBrowsers(): Browser[] {
  return BROWSER_AUTOMATION_BOOST_CONFIG.SUPPORTED_BROWSERS;
}

/**
 * Check if browser is supported
 */
export function isBrowserSupported(browser: Browser): boolean {
  return BROWSER_AUTOMATION_BOOST_CONFIG.SUPPORTED_BROWSERS.includes(browser);
}

/**
 * Get default automation patterns
 */
export function getDefaultPatterns(): AutomationPattern[] {
  return DEFAULT_AUTOMATION_PATTERNS.filter((p) => p.isActive);
}
