/**
 * Report Layout Templates
 * Phase 76: Define layout variants for HTML/Markdown generation
 */

import { ComposedReport, ReportSection, ReportBlock } from './reportCompositionEngine';

export type LayoutVariant = 'standard_agency_report' | 'compact_summary';

export interface LayoutConfig {
  variant: LayoutVariant;
  title: string;
  description: string;
  show_cover: boolean;
  show_table_of_contents: boolean;
  show_section_numbers: boolean;
  show_footer: boolean;
  max_sections?: number;
}

export const LAYOUT_CONFIGS: Record<LayoutVariant, LayoutConfig> = {
  standard_agency_report: {
    variant: 'standard_agency_report',
    title: 'Standard Agency Report',
    description: 'Full multi-section report with formal structure',
    show_cover: true,
    show_table_of_contents: true,
    show_section_numbers: true,
    show_footer: true,
  },
  compact_summary: {
    variant: 'compact_summary',
    title: 'Compact Summary',
    description: 'Condensed report for quick review',
    show_cover: false,
    show_table_of_contents: false,
    show_section_numbers: false,
    show_footer: true,
    max_sections: 5,
  },
};

/**
 * Apply layout to composed report
 */
export function applyLayout(
  report: ComposedReport,
  variant: LayoutVariant
): ComposedReport {
  const config = LAYOUT_CONFIGS[variant];

  let sections = [...report.sections];

  // Limit sections for compact layout
  if (config.max_sections && sections.length > config.max_sections) {
    sections = sections.slice(0, config.max_sections);
  }

  return {
    ...report,
    sections,
  };
}

/**
 * Build cover page content
 */
export function buildCoverContent(report: ComposedReport): {
  title: string;
  subtitle: string;
  client_name: string;
  timeframe: string;
  generated_date: string;
} {
  return {
    title: report.title,
    subtitle: report.subtitle,
    client_name: report.client_name,
    timeframe: report.timeframe.label,
    generated_date: new Date(report.generated_at).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

/**
 * Build table of contents
 */
export function buildTableOfContents(
  report: ComposedReport
): { number: number; title: string; section_id: string }[] {
  return report.sections.map((section, index) => ({
    number: index + 1,
    title: section.title,
    section_id: section.section_id,
  }));
}

/**
 * Build footer content
 */
export function buildFooterContent(report: ComposedReport): {
  data_notice: string;
  timeframe_notice: string;
  omitted_notice?: string;
  generated_notice: string;
} {
  const omittedCount = report.omitted_sections.length;

  return {
    data_notice: `This report is based on data from ${report.timeframe.label.toLowerCase()} (${new Date(report.timeframe.start).toLocaleDateString()} to ${new Date(report.timeframe.end).toLocaleDateString()}).`,
    timeframe_notice: `All metrics and insights reflect only the specified timeframe and should not be extrapolated beyond this period.`,
    omitted_notice: omittedCount > 0
      ? `${omittedCount} section(s) were omitted due to insufficient data: ${report.omitted_sections.join(', ')}.`
      : undefined,
    generated_notice: `Report generated on ${new Date(report.generated_at).toLocaleString()}.`,
  };
}

/**
 * Get layout recommendations based on report type
 */
export function getRecommendedLayout(reportType: string): LayoutVariant {
  switch (reportType) {
    case 'weekly':
      return 'compact_summary';
    case 'monthly':
    case 'ninety_day':
      return 'standard_agency_report';
    default:
      return 'standard_agency_report';
  }
}

export default {
  LAYOUT_CONFIGS,
  applyLayout,
  buildCoverContent,
  buildTableOfContents,
  buildFooterContent,
  getRecommendedLayout,
};
