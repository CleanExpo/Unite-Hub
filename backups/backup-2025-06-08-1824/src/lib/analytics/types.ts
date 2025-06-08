/**
 * Analytics Types
 * 
 * This module defines types for the analytics system, including events,
 * dimensions, metrics, and reporting structures.
 */

/**
 * Event types for analytics tracking
 */
export enum EventType {
  // Page Events
  PAGE_VIEW = 'page_view',
  PAGE_EXIT = 'page_exit',
  PAGE_SCROLL = 'page_scroll',
  PAGE_ERROR = 'page_error',
  
  // User Events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATE = 'user_profile_update',
  USER_SETTINGS_CHANGE = 'user_settings_change',
  
  // Content Events
  CONTENT_VIEW = 'content_view',
  CONTENT_DOWNLOAD = 'content_download',
  CONTENT_SHARE = 'content_share',
  CONTENT_SAVE = 'content_save',
  CONTENT_SEARCH = 'content_search',
  
  // Interaction Events
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_CLICK',
  FORM_START = 'form_start',
  FORM_COMPLETE = 'form_complete',
  FORM_ABANDON = 'form_abandon',
  ELEMENT_VIEW = 'element_view',
  ELEMENT_HOVER = 'element_hover',
  
  // Commerce Events
  PRODUCT_VIEW = 'product_view',
  PRODUCT_CLICK = 'product_click',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  BEGIN_CHECKOUT = 'begin_checkout',
  PURCHASE = 'purchase',
  REFUND = 'refund',
  
  // Consultation Events
  CONSULTATION_REQUEST = 'consultation_request',
  CONSULTATION_BOOK = 'consultation_book',
  CONSULTATION_ATTEND = 'consultation_attend',
  CONSULTATION_CANCEL = 'consultation_cancel',
  CONSULTATION_RESCHEDULE = 'consultation_reschedule',
  
  // Marketing Events
  CAMPAIGN_VIEW = 'campaign_view',
  CAMPAIGN_CLICK = 'campaign_click',
  EMAIL_OPEN = 'email_open',
  EMAIL_CLICK = 'email_click',
  EMAIL_UNSUBSCRIBE = 'email_unsubscribe',
  SOCIAL_SHARE = 'social_share',
  REFERRAL = 'referral',
  
  // Custom Events
  CUSTOM = 'custom'
}

/**
 * Common dimensions for analytics
 */
export enum AnalyticsDimension {
  // User Dimensions
  USER_ID = 'user_id',
  USER_TYPE = 'user_type',
  USER_ROLE = 'user_role',
  USER_SEGMENT = 'user_segment',
  USER_ACQUISITION_SOURCE = 'user_acquisition_source',
  USER_ACCOUNT_AGE = 'user_account_age',
  USER_SUBSCRIPTION_LEVEL = 'user_subscription_level',
  
  // Session Dimensions
  SESSION_ID = 'session_id',
  SESSION_START_TIME = 'session_start_time',
  SESSION_DURATION = 'session_duration',
  SESSION_PAGE_COUNT = 'session_page_count',
  SESSION_IS_FIRST = 'session_is_first',
  
  // Technical Dimensions
  DEVICE_TYPE = 'device_type',
  DEVICE_CATEGORY = 'device_category',
  BROWSER = 'browser',
  BROWSER_VERSION = 'browser_version',
  OPERATING_SYSTEM = 'operating_system',
  SCREEN_RESOLUTION = 'screen_resolution',
  VIEWPORT_SIZE = 'viewport_size',
  CONNECTION_TYPE = 'connection_type',
  
  // Location Dimensions
  COUNTRY = 'country',
  REGION = 'region',
  CITY = 'city',
  LANGUAGE = 'language',
  TIMEZONE = 'timezone',
  
  // Page Dimensions
  PAGE_URL = 'page_url',
  PAGE_PATH = 'page_path',
  PAGE_TITLE = 'page_title',
  PAGE_TYPE = 'page_type',
  PAGE_REFERRER = 'page_referrer',
  PAGE_LOAD_TIME = 'page_load_time',
  
  // Marketing Dimensions
  UTM_SOURCE = 'utm_source',
  UTM_MEDIUM = 'utm_medium',
  UTM_CAMPAIGN = 'utm_campaign',
  UTM_TERM = 'utm_term',
  UTM_CONTENT = 'utm_content',
  CAMPAIGN_ID = 'campaign_id',
  AD_GROUP_ID = 'ad_group_id',
  
  // Consultation Dimensions
  CONSULTATION_ID = 'consultation_id',
  CONSULTATION_TYPE = 'consultation_type',
  CONSULTATION_STATUS = 'consultation_status',
  CONSULTATION_SOURCE = 'consultation_source',
  
  // Content Dimensions
  CONTENT_ID = 'content_id',
  CONTENT_TYPE = 'content_type',
  CONTENT_CATEGORY = 'content_category',
  CONTENT_TAGS = 'content_tags',
  CONTENT_AUTHOR = 'content_author',
  CONTENT_PUBLISH_DATE = 'content_publish_date',
  
  // Custom Dimensions
  CUSTOM_DIMENSION_1 = 'custom_dimension_1',
  CUSTOM_DIMENSION_2 = 'custom_dimension_2',
  CUSTOM_DIMENSION_3 = 'custom_dimension_3',
  CUSTOM_DIMENSION_4 = 'custom_dimension_4',
  CUSTOM_DIMENSION_5 = 'custom_dimension_5'
}

/**
 * Common metrics for analytics
 */
export enum AnalyticsMetric {
  // Count Metrics
  EVENT_COUNT = 'event_count',
  USER_COUNT = 'user_count',
  SESSION_COUNT = 'session_count',
  PAGE_VIEW_COUNT = 'page_view_count',
  UNIQUE_PAGE_VIEW_COUNT = 'unique_page_view_count',
  
  // Time Metrics
  AVG_SESSION_DURATION = 'avg_session_duration',
  AVG_PAGE_TIME = 'avg_page_time',
  TIME_ON_PAGE = 'time_on_page',
  TIME_TO_FIRST_INTERACTION = 'time_to_first_interaction',
  
  // Engagement Metrics
  BOUNCE_RATE = 'bounce_rate',
  EXIT_RATE = 'exit_rate',
  PAGES_PER_SESSION = 'pages_per_session',
  SCROLL_DEPTH = 'scroll_depth',
  CLICKS_PER_SESSION = 'clicks_per_session',
  INTERACTION_RATE = 'interaction_rate',
  ENGAGEMENT_SCORE = 'engagement_score',
  
  // Conversion Metrics
  CONVERSION_RATE = 'conversion_rate',
  CONSULTATION_REQUEST_RATE = 'consultation_request_rate',
  CONSULTATION_BOOK_RATE = 'consultation_book_rate',
  CONSULTATION_ATTEND_RATE = 'consultation_attend_rate',
  SIGNUP_CONVERSION_RATE = 'signup_conversion_rate',
  LEAD_CONVERSION_RATE = 'lead_conversion_rate',
  
  // Commerce Metrics
  REVENUE = 'revenue',
  AVERAGE_ORDER_VALUE = 'average_order_value',
  ITEMS_PER_PURCHASE = 'items_per_purchase',
  CART_ABANDONMENT_RATE = 'cart_abandonMENT_RATE',
  REFUND_RATE = 'refund_rate',
  CUSTOMER_LIFETIME_VALUE = 'customer_lifetime_value',
  
  // Performance Metrics
  PAGE_LOAD_TIME = 'page_load_time',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT = 'largest_contentful_paint',
  FIRST_INPUT_DELAY = 'first_input_delay',
  CUMULATIVE_LAYOUT_SHIFT = 'cumulative_layout_shift',
  
  // User Metrics
  NEW_USER_RATE = 'new_user_rate',
  USER_RETENTION_RATE = 'user_retENTION_RATE',
  ACTIVE_USERS = 'active_users',
  
  // Custom Metrics
  CUSTOM_METRIC_1 = 'custom_metric_1',
  CUSTOM_METRIC_2 = 'custom_metric_2',
  CUSTOM_METRIC_3 = 'custom_metric_3',
  CUSTOM_METRIC_4 = 'custom_metric_4',
  CUSTOM_METRIC_5 = 'custom_metric_5'
}

/**
 * Analytics provider configuration
 */
export interface AnalyticsProviderConfig {
  /**
   * Name of the analytics provider
   */
  provider: string;
  
  /**
   * API key or measurement ID for the provider
   */
  apiKey?: string;
  
  /**
   * Whether this provider is enabled
   */
  enabled: boolean;
  
  /**
   * Whether to include personally identifiable information
   */
  includePII: boolean;
  
  /**
   * Provider-specific options
   */
  options?: Record<string, unknown>;
}

/**
 * Prediction model types
 */
export enum PredictionModelType {
  LINEAR_REGRESSION = 'linear_regression',
  LOGISTIC_REGRESSION = 'logistic_regression',
  RANDOM_FOREST = 'random_forest',
  GRADIENT_BOOSTING = 'gradient_boosting',
  NEURAL_NETWORK = 'neural_network',
  TIME_SERIES = 'time_series',
  CLUSTERING = 'clustering',
  ASSOCIATION_RULES = 'association_rules'
}

/**
 * Prediction model definition
 */
export interface PredictionModel {
  /**
   * Unique identifier for the model
   */
  id: string;
  
  /**
   * Name of the model
   */
  name: string;
  
  /**
   * Description of the model
   */
  description?: string;
  
  /**
   * Type of machine learning model
   */
  type: PredictionModelType;
  
  /**
   * Target variable that the model predicts
   */
  target: AnalyticsMetric | string;
  
  /**
   * Features used by the model
   */
  features: Array<{
    /**
     * Feature name
     */
    name: string;
    
    /**
     * Feature type
     */
    type: 'dimension' | 'metric' | 'derived';
    
    /**
     * Importance score (0-1)
     */
    importance?: number;
  }>;
  
  /**
   * Model accuracy metrics
   */
  accuracy?: {
    /**
     * R-squared score for regression models
     */
    rSquared?: number;
    
    /**
     * Mean absolute error
     */
    mae?: number;
    
    /**
     * Root mean square error
     */
    rmse?: number;
    
    /**
     * Precision for classification models
     */
    precision?: number;
    
    /**
     * Recall for classification models
     */
    recall?: number;
    
    /**
     * F1 score for classification models
     */
    f1Score?: number;
  };
  
  /**
   * Training configuration
   */
  training?: {
    /**
     * Training data start date
     */
    startDate: string;
    
    /**
     * Training data end date
     */
    endDate: string;
    
    /**
     * Validation split ratio
     */
    validationSplit: number;
    
    /**
     * Cross-validation folds
     */
    crossValidationFolds?: number;
  };
  
  /**
   * Whether the model is currently active
   */
  active: boolean;
  
  /**
   * Model version
   */
  version: string;
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt: string;
  
  /**
   * Last trained date
   */
  lastTrainedAt?: string;
}

/**
 * Analytics event data
 */
export interface AnalyticsEvent {
  /**
   * Unique identifier for the event
   */
  id: string;
  
  /**
   * Type of event
   */
  type: EventType;
  
  /**
   * Timestamp when the event occurred (ISO string)
   */
  timestamp: string;
  
  /**
   * User identifier
   */
  userId?: string;
  
  /**
   * Session identifier
   */
  sessionId?: string;
  
  /**
   * Name of the event (for custom events)
   */
  name?: string;
  
  /**
   * Properties associated with the event
   */
  properties: Record<string, unknown>;
  
  /**
   * Event dimensions
   */
  dimensions: Partial<Record<AnalyticsDimension, string | number | boolean>>;
  
  /**
   * Event metrics
   */
  metrics: Partial<Record<AnalyticsMetric, number>>;
}

/**
 * User journey step
 */
export interface JourneyStep {
  /**
   * Unique identifier for the step
   */
  id: string;
  
  /**
   * Step number in the journey
   */
  stepNumber: number;
  
  /**
   * Name of the step
   */
  name: string;
  
  /**
   * Description of the step
   */
  description?: string;
  
  /**
   * Event that triggered this step
   */
  event: AnalyticsEvent;
  
  /**
   * Time spent on this step (in milliseconds)
   */
  timeSpent?: number;
  
  /**
   * Whether this step completed successfully
   */
  completed: boolean;
  
  /**
   * Whether this step was abandoned
   */
  abandoned: boolean;
  
  /**
   * Reason for abandonment (if applicable)
   */
  abandonReason?: string;
  
  /**
   * Next step in the journey (if applicable)
   */
  nextStepId?: string;
  
  /**
   * Previous step in the journey (if applicable)
   */
  prevStepId?: string;
}

/**
 * User journey
 */
export interface UserJourney {
  /**
   * Unique identifier for the journey
   */
  id: string;
  
  /**
   * Name of the journey (e.g., "Consultation Booking Journey")
   */
  name: string;
  
  /**
   * User associated with the journey
   */
  userId: string;
  
  /**
   * Time when the journey started
   */
  startTime: string;
  
  /**
   * Time when the journey ended (if completed)
   */
  endTime?: string;
  
  /**
   * Steps in the journey
   */
  steps: JourneyStep[];
  
  /**
   * Whether the journey was completed
   */
  completed: boolean;
  
  /**
   * Whether the journey resulted in a conversion
   */
  converted: boolean;
  
  /**
   * Time spent on the journey (in milliseconds)
   */
  totalTimeSpent: number;
  
  /**
   * Entry point for the journey (e.g., "Homepage", "Google Search", "Email Campaign")
   */
  entryPoint: string;
  
  /**
   * Exit point from the journey (if applicable)
   */
  exitPoint?: string;
  
  /**
   * Tags associated with the journey
   */
  tags: string[];
}

/**
 * Funnel step
 */
export interface FunnelStep {
  /**
   * Unique identifier for the step
   */
  id: string;
  
  /**
   * Name of the step
   */
  name: string;
  
  /**
   * Description of the step
   */
  description?: string;
  
  /**
   * Position of the step in the funnel (1-based)
   */
  position: number;
  
  /**
   * Event types that qualify as this step
   */
  eventTypes: EventType[];
  
  /**
   * Additional conditions for qualifying events
   */
  conditions?: Record<string, unknown>;
}

/**
 * Analytics funnel definition
 */
export interface AnalyticsFunnel {
  /**
   * Unique identifier for the funnel
   */
  id: string;
  
  /**
   * Name of the funnel
   */
  name: string;
  
  /**
   * Description of the funnel
   */
  description?: string;
  
  /**
   * Steps in the funnel
   */
  steps: FunnelStep[];
  
  /**
   * Whether the funnel is currently active
   */
  active: boolean;
  
  /**
   * Time window for completing the funnel (in hours)
   */
  timeWindowHours?: number;
  
  /**
   * Tags associated with the funnel
   */
  tags: string[];
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt: string;
}

/**
 * Analytics segment definition
 */
export interface AnalyticsSegment {
  /**
   * Unique identifier for the segment
   */
  id: string;
  
  /**
   * Name of the segment
   */
  name: string;
  
  /**
   * Description of the segment
   */
  description?: string;
  
  /**
   * Rules for including users in the segment
   */
  rules: {
    /**
     * Dimensions to filter on
     */
    dimensions?: Partial<Record<AnalyticsDimension, unknown>>;
    
    /**
     * Metrics to filter on
     */
    metrics?: Partial<Record<AnalyticsMetric, {
      /**
       * Operator for comparison
       */
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'not_in';
      
      /**
       * Value to compare against
       */
      value: unknown;
    }>>;
    
    /**
     * Events that must have occurred
     */
    events?: {
      /**
       * Type of event
       */
      type: EventType;
      
      /**
       * Time period for the event
       */
      period?: {
        /**
         * Number of days, weeks, or months
         */
        value: number;
        
        /**
         * Unit for the period
         */
        unit: 'day' | 'week' | 'month';
      };
      
      /**
       * Minimum number of occurrences
       */
      minCount?: number;
      
      /**
       * Maximum number of occurrences
       */
      maxCount?: number;
    }[];
  };
  
  /**
   * Whether the segment is currently active
   */
  active: boolean;
  
  /**
   * Tags associated with the segment
   */
  tags: string[];
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt: string;
}

/**
 * Report time period
 */
export interface ReportTimePeriod {
  /**
   * Start date (ISO string)
   */
  startDate: string;
  
  /**
   * End date (ISO string)
   */
  endDate: string;
  
  /**
   * Comparison period start date (ISO string)
   */
  comparisonStartDate?: string;
  
  /**
   * Comparison period end date (ISO string)
   */
  comparisonEndDate?: string;
}

/**
 * Report metric
 */
export interface ReportMetric {
  /**
   * Metric key
   */
  key: AnalyticsMetric | string;
  
  /**
   * Display name for the metric
   */
  name: string;
  
  /**
   * Current value of the metric
   */
  value: number;
  
  /**
   * Previous/comparison value of the metric
   */
  previousValue?: number;
  
  /**
   * Percent change from previous value
   */
  percentChange?: number;
  
  /**
   * Unit for the metric (e.g., "seconds", "percent", "currency")
   */
  unit?: string;
  
  /**
   * Precision for displaying the metric (number of decimal places)
   */
  precision?: number;
  
  /**
   * Whether a higher value is better (for color coding)
   */
  higherIsBetter?: boolean;
  
  /**
   * Data series for the metric (for charts)
   */
  series?: Array<{
    /**
     * Date or category for the data point
     */
    category: string;
    
    /**
     * Value for the data point
     */
    value: number;
  }>;
}

/**
 * Analytics dashboard configuration
 */
export interface DashboardConfig {
  /**
   * Unique identifier for the dashboard
   */
  id: string;
  
  /**
   * Name of the dashboard
   */
  name: string;
  
  /**
   * Description of the dashboard
   */
  description?: string;
  
  /**
   * Time period for the dashboard
   */
  timePeriod: ReportTimePeriod;
  
  /**
   * Layout of widgets on the dashboard
   */
  layout: Array<{
    /**
     * Widget identifier
     */
    widgetId: string;
    
    /**
     * Position information
     */
    position: {
      /**
       * Column index (0-based)
       */
      x: number;
      
      /**
       * Row index (0-based)
       */
      y: number;
      
      /**
       * Width in columns
       */
      width: number;
      
      /**
       * Height in rows
       */
      height: number;
    };
  }>;
  
  /**
   * Widgets on the dashboard
   */
  widgets: Array<{
    /**
     * Unique identifier for the widget
     */
    id: string;
    
    /**
     * Type of widget
     */
    type: 'metric' | 'chart' | 'table' | 'funnel' | 'journey' | 'map' | 'text';
    
    /**
     * Title of the widget
     */
    title: string;
    
    /**
     * Subtitle of the widget
     */
    subtitle?: string;
    
    /**
     * Configuration for the widget
     */
    config: Record<string, unknown>;
  }>;
  
  /**
   * Filters applied to the dashboard
   */
  filters?: Record<string, unknown>;
  
  /**
   * Segments applied to the dashboard
   */
  segments?: string[];
  
  /**
   * User ID of the owner
   */
  ownerId: string;
  
  /**
   * Whether the dashboard is shared
   */
  shared: boolean;
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt: string;
}

declare global {
  interface Window {
    gtag?: {
      (command: 'js', date: Date): void;
      (command: 'config', targetId: string, config?: Record<string, unknown>): void;
      (command: 'event', eventName: string, params?: Record<string, unknown>): void;
      (command: 'set', params: Record<string, unknown>): void;
      (command: string, ...args: unknown[]): void;
    };
    dataLayer?: unknown[];
    fbq?: (action: string, event?: string, params?: Record<string, unknown>) => void;
  }
}
