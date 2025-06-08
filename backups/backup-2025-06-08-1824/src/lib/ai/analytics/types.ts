/**
 * Advanced AI Analytics Types
 * Unite Group - Version 11.0 Phase 4 Implementation
 */

export interface AdvancedAnalyticsConfig {
  realTimeMonitoring: {
    enabled: boolean;
    refreshIntervalMs: number;
    alertThresholds: {
      performanceDegradation: number;
      errorRate: number;
      responseTime: number;
    };
    maxDataPoints: number;
  };
  predictiveAnalytics: {
    enabled: boolean;
    forecastingHorizonDays: number;
    confidenceInterval: number;
    modelUpdateFrequency: string; // cron expression
    features: string[];
  };
  reporting: {
    autoGeneration: boolean;
    schedules: ReportSchedule[];
    retentionDays: number;
    exportFormats: ('pdf' | 'csv' | 'excel' | 'json')[];
  };
  dashboards: {
    enableCustomDashboards: boolean;
    maxDashboardsPerUser: number;
    enableDataExport: boolean;
    enableSharing: boolean;
  };
}

export interface ReportSchedule {
  id: string;
  name: string;
  type: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  timezone: string;
  enabled: boolean;
}

export type ReportType = 
  | 'performance_summary'
  | 'business_intelligence'
  | 'user_engagement'
  | 'revenue_analytics'
  | 'ai_usage_metrics'
  | 'market_intelligence'
  | 'compliance_report'
  | 'custom';

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  dataType: 'number' | 'percentage' | 'currency' | 'duration' | 'count';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  unit?: string;
  thresholds?: {
    warning: number;
    critical: number;
    target?: number;
  };
  formula?: string;
  dependencies?: string[];
}

export type MetricCategory = 
  | 'business'
  | 'technical'
  | 'user_experience'
  | 'ai_performance'
  | 'financial'
  | 'operational'
  | 'compliance';

export interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  metricId: string;
  data: DataPoint[];
  aggregationLevel: 'minute' | 'hour' | 'day' | 'week' | 'month';
  startTime: Date;
  endTime: Date;
}

export interface RealTimeMetrics {
  id: string;
  timestamp: Date;
  business: {
    activeUsers: number;
    conversionRate: number;
    revenue: number;
    leadGeneration: number;
    consultationBookings: number;
  };
  technical: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  ai: {
    requestsPerSecond: number;
    averageProcessingTime: number;
    modelAccuracy: number;
    tokenUsage: number;
    costPerRequest: number;
  };
  userExperience: {
    pageLoadTime: number;
    bounceRate: number;
    sessionDuration: number;
    userSatisfaction: number;
    supportTickets: number;
  };
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: ModelType;
  targetMetric: string;
  features: string[];
  trainingData: {
    startDate: Date;
    endDate: Date;
    sampleCount: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    meanAbsoluteError?: number;
  };
  status: 'training' | 'active' | 'deprecated' | 'failed';
  lastTrained: Date;
  nextUpdate: Date;
  version: string;
}

export type ModelType = 
  | 'time_series_forecasting'
  | 'classification'
  | 'regression'
  | 'anomaly_detection'
  | 'clustering'
  | 'recommendation';

export interface Prediction {
  id: string;
  modelId: string;
  targetMetric: string;
  prediction: {
    value: number;
    confidence: number;
    range: {
      lower: number;
      upper: number;
    };
  };
  timeHorizon: {
    start: Date;
    end: Date;
  };
  inputFeatures: Record<string, unknown>;
  generatedAt: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface Anomaly {
  id: string;
  metricId: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: {
    action: string;
    resolvedAt: Date;
    resolvedBy: string;
    notes: string;
  };
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  metricId?: string;
  currentValue?: number;
  threshold?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  channels: AlertChannel[];
  recipients: string[];
  acknowledgments: {
    userId: string;
    acknowledgedAt: Date;
    notes?: string;
  }[];
}

export type AlertType = 
  | 'threshold_breach'
  | 'anomaly_detected'
  | 'system_health'
  | 'business_critical'
  | 'compliance_violation'
  | 'performance_degradation';

export type AlertChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'dashboard';

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  owner: string;
  widgets: Widget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval?: number;
  isPublic: boolean;
  sharedWith: string[];
  createdAt: Date;
  lastModified: Date;
  tags: string[];
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: string;
  refreshInterval?: number;
  lastUpdated?: Date;
}

export type WidgetType = 
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'gauge'
  | 'kpi_card'
  | 'table'
  | 'heatmap'
  | 'scatter_plot'
  | 'funnel'
  | 'progress_bar'
  | 'text_widget'
  | 'alert_list';

export interface WidgetConfig {
  metrics: string[];
  timeRange: TimeRange;
  aggregation?: string;
  groupBy?: string[];
  filters?: Record<string, unknown>;
  visualization?: {
    colors?: string[];
    showLegend?: boolean;
    showTooltips?: boolean;
    animationsEnabled?: boolean;
  };
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  relative?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
  absolute?: {
    start: Date;
    end: Date;
  };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'date_range' | 'text' | 'number_range';
  values?: string[];
  defaultValue?: unknown;
  appliesToWidgets?: string[];
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  schedule?: ReportSchedule;
  parameters: ReportParameters;
  content: ReportContent;
  generatedAt: Date;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface ReportParameters {
  timeRange: TimeRange;
  metrics: string[];
  filters?: Record<string, unknown>;
  groupBy?: string[];
  format: 'pdf' | 'csv' | 'excel' | 'json';
  includeCharts: boolean;
  includeTables: boolean;
  includeInsights: boolean;
}

export interface ReportContent {
  summary: {
    title: string;
    period: string;
    keyMetrics: Array<{
      name: string;
      value: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  sections: ReportSection[];
  insights: string[];
  recommendations: string[];
  appendices?: Array<{
    title: string;
    content: string;
    type: 'text' | 'table' | 'chart';
  }>;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  charts: ChartData[];
  tables: TableData[];
  narrative: string;
  keyFindings: string[];
}

export interface ChartData {
  id: string;
  type: WidgetType;
  title: string;
  data: TimeSeriesData[];
  config: WidgetConfig;
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  summary?: {
    totalRows: number;
    aggregations?: Record<string, number>;
  };
}

export interface BusinessIntelligence {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  insights: BusinessInsight[];
  trends: TrendAnalysis[];
  forecasts: BusinessForecast[];
  recommendations: BusinessRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface BusinessInsight {
  id: string;
  category: 'revenue' | 'growth' | 'efficiency' | 'customer' | 'market' | 'operational';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  supportingData: {
    metrics: string[];
    values: number[];
    comparisons?: Array<{
      period: string;
      value: number;
    }>;
  };
  actionItems?: string[];
}

export interface TrendAnalysis {
  metricId: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number; // 0-1 scale
  significance: number; // 0-1 scale
  timespan: {
    start: Date;
    end: Date;
  };
  changeRate: number;
  projectedContinuation: {
    likelihood: number;
    timeframe: string;
  };
}

export interface BusinessForecast {
  metricId: string;
  horizon: {
    start: Date;
    end: Date;
  };
  predictions: Array<{
    date: Date;
    value: number;
    confidence: number;
  }>;
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  assumptions: string[];
  accuracy: {
    historical: number;
    expectedCurrent: number;
  };
}

export interface BusinessRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  expectedImpact: {
    metric: string;
    improvement: number;
    timeframe: string;
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
    timeRequired: string;
    resources: string[];
  };
  risks: string[];
  dependencies: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  monitoringRecommendations: string[];
}

export interface RiskFactor {
  id: string;
  category: 'financial' | 'operational' | 'strategic' | 'compliance' | 'technical';
  description: string;
  likelihood: number; // 0-1 scale
  impact: number; // 0-1 scale
  riskScore: number; // calculated from likelihood * impact
  mitigation: string[];
  owner?: string;
  status: 'identified' | 'assessing' | 'mitigating' | 'monitoring' | 'resolved';
}

export interface AdvancedAnalyticsEngine {
  // Real-time monitoring
  getRealTimeMetrics(): Promise<RealTimeMetrics>;
  subscribeToMetrics(callback: (metrics: RealTimeMetrics) => void): Promise<void>;
  unsubscribeFromMetrics(): Promise<void>;
  
  // Predictive analytics
  createModel(config: Partial<PredictiveModel>): Promise<PredictiveModel>;
  trainModel(modelId: string): Promise<void>;
  generatePrediction(modelId: string, features: Record<string, unknown>): Promise<Prediction>;
  getModelPerformance(modelId: string): Promise<PredictiveModel['performance']>;
  
  // Anomaly detection
  detectAnomalies(metricId: string, timeRange: TimeRange): Promise<Anomaly[]>;
  acknowledgeAnomaly(anomalyId: string, userId: string, notes?: string): Promise<void>;
  resolveAnomaly(anomalyId: string, resolution: Anomaly['resolution']): Promise<void>;
  
  // Alerting
  createAlert(config: Omit<Alert, 'id' | 'triggeredAt' | 'status'>): Promise<Alert>;
  acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<void>;
  resolveAlert(alertId: string, userId: string, notes?: string): Promise<void>;
  
  // Dashboard management
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'lastModified'>): Promise<Dashboard>;
  updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard>;
  getDashboard(dashboardId: string): Promise<Dashboard | null>;
  deleteDashboard(dashboardId: string): Promise<void>;
  
  // Reporting
  generateReport(parameters: ReportParameters): Promise<Report>;
  scheduleReport(schedule: ReportSchedule): Promise<void>;
  getReportHistory(userId?: string): Promise<Report[]>;
  downloadReport(reportId: string): Promise<Buffer>;
  
  // Business intelligence
  generateBusinessIntelligence(timeRange: TimeRange): Promise<BusinessIntelligence>;
  getInsights(category?: BusinessInsight['category']): Promise<BusinessInsight[]>;
  getForecast(metricId: string, horizonDays: number): Promise<BusinessForecast>;
  getRecommendations(priority?: BusinessRecommendation['priority']): Promise<BusinessRecommendation[]>;
  
  // Data management
  ingestMetric(metricId: string, value: number, timestamp?: Date, metadata?: Record<string, unknown>): Promise<void>;
  getTimeSeries(metricId: string, timeRange: TimeRange, aggregation?: string): Promise<TimeSeriesData>;
  getMetricDefinitions(category?: MetricCategory): Promise<MetricDefinition[]>;
  
  // Configuration
  updateConfig(config: Partial<AdvancedAnalyticsConfig>): Promise<void>;
  getConfig(): Promise<AdvancedAnalyticsConfig>;
}
