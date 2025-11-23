/**
 * Report Sections Configuration
 * Phase 76: Define report structure for weekly, monthly, and 90-day reports
 */

export type ReportType = 'weekly' | 'monthly' | 'ninety_day';

export type DataSource =
  | 'performance'
  | 'success'
  | 'creative'
  | 'vif'
  | 'production'
  | 'journey'
  | 'touchpoints'
  | 'alignment';

export interface ReportSectionConfig {
  id: string;
  title: string;
  description: string;
  data_source: DataSource;
  required_signals: string[];
  optional: boolean;
  order: number;
}

export interface ReportTypeConfig {
  type: ReportType;
  title: string;
  description: string;
  sections: ReportSectionConfig[];
}

/**
 * Weekly Report Sections
 */
const WEEKLY_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'High-level overview of this week\'s progress',
    data_source: 'touchpoints',
    required_signals: ['touchpoint_weekly'],
    optional: false,
    order: 1,
  },
  {
    id: 'key_metrics',
    title: 'Key Metrics',
    description: 'Performance indicators for the week',
    data_source: 'performance',
    required_signals: ['kpi_data'],
    optional: false,
    order: 2,
  },
  {
    id: 'production_update',
    title: 'Production Update',
    description: 'Content and assets delivered this week',
    data_source: 'production',
    required_signals: ['production_jobs'],
    optional: true,
    order: 3,
  },
  {
    id: 'wins_and_highlights',
    title: 'Wins & Highlights',
    description: 'Key achievements and positive outcomes',
    data_source: 'success',
    required_signals: ['wins_data'],
    optional: true,
    order: 4,
  },
  {
    id: 'areas_for_attention',
    title: 'Areas for Attention',
    description: 'Items requiring focus or action',
    data_source: 'alignment',
    required_signals: ['blockers'],
    optional: true,
    order: 5,
  },
  {
    id: 'next_steps',
    title: 'Next Steps',
    description: 'Recommended actions for the coming week',
    data_source: 'journey',
    required_signals: ['next_milestones'],
    optional: false,
    order: 6,
  },
];

/**
 * Monthly Report Sections
 */
const MONTHLY_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Month-in-review overview',
    data_source: 'touchpoints',
    required_signals: ['touchpoint_monthly'],
    optional: false,
    order: 1,
  },
  {
    id: 'journey_progress',
    title: 'Journey Progress',
    description: 'Milestone completion and phase advancement',
    data_source: 'journey',
    required_signals: ['milestones', 'phase_data'],
    optional: false,
    order: 2,
  },
  {
    id: 'performance_metrics',
    title: 'Performance Metrics',
    description: 'Comprehensive KPI analysis',
    data_source: 'performance',
    required_signals: ['kpi_data', 'trends'],
    optional: false,
    order: 3,
  },
  {
    id: 'content_performance',
    title: 'Content Performance',
    description: 'Creative output and engagement analysis',
    data_source: 'creative',
    required_signals: ['content_metrics'],
    optional: true,
    order: 4,
  },
  {
    id: 'visual_intelligence',
    title: 'Visual Intelligence',
    description: 'Brand alignment and visual asset performance',
    data_source: 'vif',
    required_signals: ['vif_scores'],
    optional: true,
    order: 5,
  },
  {
    id: 'production_summary',
    title: 'Production Summary',
    description: 'Deliverables completed and pipeline status',
    data_source: 'production',
    required_signals: ['production_jobs', 'delivery_stats'],
    optional: true,
    order: 6,
  },
  {
    id: 'success_indicators',
    title: 'Success Indicators',
    description: 'Success score trends and influencing factors',
    data_source: 'success',
    required_signals: ['success_score', 'factors'],
    optional: false,
    order: 7,
  },
  {
    id: 'alignment_status',
    title: 'Alignment Status',
    description: 'Five-dimension alignment overview',
    data_source: 'alignment',
    required_signals: ['alignment_scores', 'blockers', 'opportunities'],
    optional: false,
    order: 8,
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    description: 'Strategic recommendations for the next month',
    data_source: 'touchpoints',
    required_signals: ['next_steps'],
    optional: false,
    order: 9,
  },
];

/**
 * 90-Day Report Sections
 */
const NINETY_DAY_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Comprehensive journey overview',
    data_source: 'touchpoints',
    required_signals: ['touchpoint_90day'],
    optional: false,
    order: 1,
  },
  {
    id: 'journey_narrative',
    title: 'Journey Narrative',
    description: 'Complete story of the client journey',
    data_source: 'journey',
    required_signals: ['full_journey_data'],
    optional: false,
    order: 2,
  },
  {
    id: 'milestone_achievements',
    title: 'Milestone Achievements',
    description: 'All milestones completed during the journey',
    data_source: 'journey',
    required_signals: ['milestones'],
    optional: false,
    order: 3,
  },
  {
    id: 'performance_trends',
    title: 'Performance Trends',
    description: 'KPI evolution over 90 days',
    data_source: 'performance',
    required_signals: ['kpi_data', 'trends', 'historical'],
    optional: false,
    order: 4,
  },
  {
    id: 'success_evolution',
    title: 'Success Evolution',
    description: 'Success score progression and factors',
    data_source: 'success',
    required_signals: ['success_history', 'factors'],
    optional: false,
    order: 5,
  },
  {
    id: 'creative_portfolio',
    title: 'Creative Portfolio',
    description: 'Content produced and performance highlights',
    data_source: 'creative',
    required_signals: ['content_library', 'performance'],
    optional: true,
    order: 6,
  },
  {
    id: 'visual_brand_summary',
    title: 'Visual Brand Summary',
    description: 'Brand alignment evolution and asset performance',
    data_source: 'vif',
    required_signals: ['vif_history', 'brand_scores'],
    optional: true,
    order: 7,
  },
  {
    id: 'production_review',
    title: 'Production Review',
    description: 'Complete production output and quality metrics',
    data_source: 'production',
    required_signals: ['production_history', 'quality_metrics'],
    optional: true,
    order: 8,
  },
  {
    id: 'alignment_journey',
    title: 'Alignment Journey',
    description: 'How alignment improved across all dimensions',
    data_source: 'alignment',
    required_signals: ['alignment_history', 'dimension_trends'],
    optional: false,
    order: 9,
  },
  {
    id: 'key_wins',
    title: 'Key Wins',
    description: 'Most significant achievements',
    data_source: 'success',
    required_signals: ['wins_data'],
    optional: false,
    order: 10,
  },
  {
    id: 'lessons_learned',
    title: 'Lessons Learned',
    description: 'Challenges overcome and insights gained',
    data_source: 'alignment',
    required_signals: ['blockers_resolved', 'insights'],
    optional: true,
    order: 11,
  },
  {
    id: 'future_roadmap',
    title: 'Future Roadmap',
    description: 'Recommended next steps for continued success',
    data_source: 'touchpoints',
    required_signals: ['next_steps', 'opportunities'],
    optional: false,
    order: 12,
  },
];

/**
 * Report Type Configurations
 */
export const REPORT_CONFIGS: Record<ReportType, ReportTypeConfig> = {
  weekly: {
    type: 'weekly',
    title: 'Weekly Report',
    description: 'Compact summary of the past 7 days',
    sections: WEEKLY_SECTIONS,
  },
  monthly: {
    type: 'monthly',
    title: 'Monthly Report',
    description: 'Comprehensive review of the past 30 days',
    sections: MONTHLY_SECTIONS,
  },
  ninety_day: {
    type: 'ninety_day',
    title: '90-Day Report',
    description: 'Complete journey review and strategic summary',
    sections: NINETY_DAY_SECTIONS,
  },
};

/**
 * Get section config by ID
 */
export function getSectionConfig(
  reportType: ReportType,
  sectionId: string
): ReportSectionConfig | undefined {
  return REPORT_CONFIGS[reportType].sections.find(s => s.id === sectionId);
}

/**
 * Get all sections for a report type
 */
export function getReportSections(reportType: ReportType): ReportSectionConfig[] {
  return REPORT_CONFIGS[reportType].sections.sort((a, b) => a.order - b.order);
}

/**
 * Get data sources required for a report type
 */
export function getRequiredDataSources(reportType: ReportType): DataSource[] {
  const sections = REPORT_CONFIGS[reportType].sections;
  const sources = new Set<DataSource>();

  for (const section of sections) {
    if (!section.optional) {
      sources.add(section.data_source);
    }
  }

  return Array.from(sources);
}

export default REPORT_CONFIGS;
