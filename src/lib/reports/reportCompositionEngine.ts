/**
 * Report Composition Engine
 * Phase 76: Orchestrate report generation from existing engines
 */

import {
  ReportType,
  ReportSectionConfig,
  getReportSections,
  REPORT_CONFIGS,
} from './reportSectionsConfig';
import {
  generateClientStory,
  generateWeeklySummary,
  generateMonthlySummary,
  generateQuarterSummary,
  getStoryHealth,
} from '@/lib/storytelling/storytellingEngine';
import { generateAlignmentReport } from '@/lib/alignment/alignmentEngine';
import { calculateJourneyState } from '@/lib/guides/firstClientJourneyConfig';

export interface ReportBlock {
  block_id: string;
  type: 'text' | 'metric' | 'list' | 'table' | 'callout';
  content: unknown;
}

export interface ReportSection {
  section_id: string;
  title: string;
  description: string;
  blocks: ReportBlock[];
  data_status: 'complete' | 'partial' | 'limited' | 'omitted';
  omission_reason?: string;
}

export interface ComposedReport {
  report_id: string;
  report_type: ReportType;
  title: string;
  subtitle: string;
  client_id: string;
  client_name: string;
  workspace_id: string;
  timeframe: {
    start: string;
    end: string;
    label: string;
  };
  sections: ReportSection[];
  generated_at: string;
  data_completeness: number;
  omitted_sections: string[];
  meta: {
    total_sections: number;
    complete_sections: number;
    partial_sections: number;
    omitted_sections: number;
    data_sources_used: string[];
  };
}

export interface ReportCompositionConfig {
  workspace_id: string;
  client_id: string;
  client_name: string;
  report_type: ReportType;
  include_optional_sections?: boolean;
}

/**
 * Build a client report
 */
export function buildClientReport(config: ReportCompositionConfig): ComposedReport {
  const reportConfig = REPORT_CONFIGS[config.report_type];
  const sectionConfigs = getReportSections(config.report_type);

  const timeframe = getTimeframe(config.report_type);
  const sections: ReportSection[] = [];
  const omittedSections: string[] = [];
  const dataSourcesUsed = new Set<string>();

  // Collect data from various sources
  const storyData = collectStoryData(config);
  const alignmentData = collectAlignmentData(config);
  const journeyData = collectJourneyData(config);

  // Build each section
  for (const sectionConfig of sectionConfigs) {
    // Skip optional sections if not requested
    if (sectionConfig.optional && !config.include_optional_sections) {
      continue;
    }

    const section = buildSection(
      sectionConfig,
      { story: storyData, alignment: alignmentData, journey: journeyData },
      config
    );

    if (section.data_status === 'omitted') {
      omittedSections.push(sectionConfig.id);
    } else {
      sections.push(section);
      dataSourcesUsed.add(sectionConfig.data_source);
    }
  }

  // Calculate completeness
  const totalSections = sectionConfigs.filter(s => !s.optional || config.include_optional_sections).length;
  const completeSections = sections.filter(s => s.data_status === 'complete').length;
  const partialSections = sections.filter(s => s.data_status === 'partial').length;
  const dataCompleteness = Math.round((completeSections / totalSections) * 100);

  return {
    report_id: `report_${config.client_id}_${config.report_type}_${Date.now()}`,
    report_type: config.report_type,
    title: reportConfig.title,
    subtitle: `${config.client_name} - ${timeframe.label}`,
    client_id: config.client_id,
    client_name: config.client_name,
    workspace_id: config.workspace_id,
    timeframe,
    sections,
    generated_at: new Date().toISOString(),
    data_completeness: dataCompleteness,
    omitted_sections: omittedSections,
    meta: {
      total_sections: totalSections,
      complete_sections: completeSections,
      partial_sections: partialSections,
      omitted_sections: omittedSections.length,
      data_sources_used: Array.from(dataSourcesUsed),
    },
  };
}

/**
 * Build a founder report with operational insights
 */
export function buildFounderReport(config: ReportCompositionConfig): ComposedReport {
  const report = buildClientReport(config);

  // Add founder-specific sections at the end
  const founderSections: ReportSection[] = [];

  // Operational summary section
  founderSections.push({
    section_id: 'founder_operational',
    title: 'Operational Notes',
    description: 'Internal operational insights for founder review',
    blocks: [
      {
        block_id: 'op_1',
        type: 'callout',
        content: {
          variant: 'info',
          title: 'Review Required',
          message: 'Please review this report before sharing with the client.',
        },
      },
      {
        block_id: 'op_2',
        type: 'text',
        content: {
          text: 'Add any notes or adjustments below before approving this report for client delivery.',
        },
      },
    ],
    data_status: 'complete',
  });

  return {
    ...report,
    sections: [...report.sections, ...founderSections],
  };
}

/**
 * Get timeframe based on report type
 */
function getTimeframe(reportType: ReportType): { start: string; end: string; label: string } {
  const end = new Date();
  let start: Date;
  let label: string;

  switch (reportType) {
    case 'weekly':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 Days';
      break;
    case 'monthly':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Last 30 Days';
      break;
    case 'ninety_day':
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      label = 'Last 90 Days';
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label,
  };
}

/**
 * Collect story data for report
 */
function collectStoryData(config: ReportCompositionConfig) {
  const timeRange = config.report_type === 'weekly' ? 'last_7_days' :
                    config.report_type === 'monthly' ? 'last_30_days' : 'last_90_days';

  try {
    const story = generateClientStory(config.workspace_id, config.client_id, timeRange);
    return {
      narrative: story.narrative,
      data: story.data,
      health: getStoryHealth(config.workspace_id),
    };
  } catch {
    return null;
  }
}

/**
 * Collect alignment data for report
 */
function collectAlignmentData(config: ReportCompositionConfig) {
  try {
    // Generate alignment report with mock data for now
    const report = generateAlignmentReport({
      workspaceId: config.workspace_id,
      clientName: config.client_name,
      journeyDay: 35,
      journeyPhase: 'activation',
      milestonesCompleted: 6,
      totalMilestones: 12,
      productionJobsCompleted: 4,
      profileCompleted: true,
      brandKitUploaded: true,
      lastCommunicationDays: 3,
      pendingProduction: 2,
      completedProduction: 4,
      pendingApprovals: 1,
      successScore: 58,
      brandAlignmentScore: 72,
      revisionRate: 0.15,
      engagementRate: 0.035,
      clientLoginDays: 2,
      feedbackCount: 3,
    });
    return report;
  } catch {
    return null;
  }
}

/**
 * Collect journey data for report
 */
function collectJourneyData(config: ReportCompositionConfig) {
  try {
    const journeyState = calculateJourneyState({
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      profileCompleted: true,
      brandKitUploaded: true,
      vifGenerated: true,
      productionJobs: 4,
      contentDelivered: 10,
      performanceReports: 1,
    });
    return journeyState;
  } catch {
    return null;
  }
}

/**
 * Build a single report section
 */
function buildSection(
  config: ReportSectionConfig,
  data: { story: unknown; alignment: unknown; journey: unknown },
  reportConfig: ReportCompositionConfig
): ReportSection {
  const blocks: ReportBlock[] = [];
  let dataStatus: 'complete' | 'partial' | 'limited' | 'omitted' = 'complete';
  let omissionReason: string | undefined;

  // Build section based on data source
  switch (config.data_source) {
    case 'touchpoints':
      if (data.story) {
        const story = data.story as { narrative: { executive_summary: string; key_wins: string[]; next_steps: string[] }; health: number };
        if (config.id === 'executive_summary') {
          blocks.push({
            block_id: `${config.id}_summary`,
            type: 'text',
            content: { text: story.narrative.executive_summary },
          });
          dataStatus = story.health >= 75 ? 'complete' : story.health >= 40 ? 'partial' : 'limited';
        } else if (config.id === 'recommendations' || config.id === 'future_roadmap') {
          blocks.push({
            block_id: `${config.id}_steps`,
            type: 'list',
            content: { items: story.narrative.next_steps, ordered: true },
          });
        }
      } else {
        dataStatus = 'omitted';
        omissionReason = 'Story data unavailable';
      }
      break;

    case 'performance':
      if (data.story) {
        const story = data.story as { narrative: { kpi_highlights: { name: string; value: string; trend: string }[] } };
        blocks.push({
          block_id: `${config.id}_metrics`,
          type: 'table',
          content: {
            headers: ['Metric', 'Value', 'Trend'],
            rows: story.narrative.kpi_highlights.map(kpi => [kpi.name, kpi.value, kpi.trend]),
          },
        });
        dataStatus = story.narrative.kpi_highlights.length > 0 ? 'complete' : 'limited';
      } else {
        dataStatus = 'limited';
        blocks.push({
          block_id: `${config.id}_placeholder`,
          type: 'callout',
          content: { variant: 'info', message: 'Performance data will be available once more metrics are collected.' },
        });
      }
      break;

    case 'success':
      if (data.story) {
        const story = data.story as { narrative: { key_wins: string[] } };
        const wins = story.narrative.key_wins.filter(
          w => w !== 'Journey is progressing - wins will be highlighted as milestones are achieved'
        );
        if (wins.length > 0) {
          blocks.push({
            block_id: `${config.id}_wins`,
            type: 'list',
            content: { items: wins, ordered: false },
          });
        } else {
          blocks.push({
            block_id: `${config.id}_note`,
            type: 'text',
            content: { text: 'Wins will be highlighted as milestones are achieved.' },
          });
          dataStatus = 'partial';
        }
      } else {
        dataStatus = 'limited';
      }
      break;

    case 'alignment':
      if (data.alignment) {
        const alignment = data.alignment as { overall_score: number; blockers: { title: string }[]; opportunities: { title: string }[] };
        blocks.push({
          block_id: `${config.id}_score`,
          type: 'metric',
          content: { label: 'Alignment Score', value: alignment.overall_score, suffix: '%' },
        });
        if (alignment.blockers.length > 0) {
          blocks.push({
            block_id: `${config.id}_blockers`,
            type: 'list',
            content: { items: alignment.blockers.map(b => b.title), title: 'Blockers' },
          });
        }
        if (alignment.opportunities.length > 0) {
          blocks.push({
            block_id: `${config.id}_opportunities`,
            type: 'list',
            content: { items: alignment.opportunities.map(o => o.title), title: 'Opportunities' },
          });
        }
      } else {
        dataStatus = 'limited';
      }
      break;

    case 'journey':
      if (data.journey) {
        const journey = data.journey as { currentPhase: string; progressPercent: number; completedMilestones: string[]; nextMilestone: string | null };
        blocks.push({
          block_id: `${config.id}_progress`,
          type: 'metric',
          content: { label: 'Journey Progress', value: journey.progressPercent, suffix: '%' },
        });
        blocks.push({
          block_id: `${config.id}_phase`,
          type: 'text',
          content: { text: `Current phase: ${journey.currentPhase}` },
        });
        if (journey.completedMilestones.length > 0) {
          blocks.push({
            block_id: `${config.id}_milestones`,
            type: 'list',
            content: { items: journey.completedMilestones.slice(-5), title: 'Recent Milestones' },
          });
        }
      } else {
        dataStatus = 'limited';
      }
      break;

    case 'production':
    case 'creative':
    case 'vif':
      // These would pull from their respective engines when available
      dataStatus = 'limited';
      blocks.push({
        block_id: `${config.id}_placeholder`,
        type: 'callout',
        content: {
          variant: 'info',
          message: `${config.title} data will be included as more content is produced and analyzed.`,
        },
      });
      break;

    default:
      dataStatus = 'omitted';
      omissionReason = 'Unknown data source';
  }

  return {
    section_id: config.id,
    title: config.title,
    description: config.description,
    blocks,
    data_status: dataStatus,
    omission_reason: omissionReason,
  };
}

/**
 * Get report summary for quick display
 */
export function getReportSummary(report: ComposedReport): {
  title: string;
  subtitle: string;
  sections_count: number;
  completeness: number;
  status: 'complete' | 'partial' | 'limited';
} {
  return {
    title: report.title,
    subtitle: report.subtitle,
    sections_count: report.sections.length,
    completeness: report.data_completeness,
    status: report.data_completeness >= 75 ? 'complete' :
            report.data_completeness >= 40 ? 'partial' : 'limited',
  };
}

export default {
  buildClientReport,
  buildFounderReport,
  getReportSummary,
};
