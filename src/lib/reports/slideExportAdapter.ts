/**
 * Slide Export Adapter
 * Phase 77: Converts renderable report to slide frames
 *
 * Returns JSON structure for slide generation.
 * Future integration: Google Slides API, PowerPoint, Keynote
 */

import { RenderableReport, prepareSlideFrames, SlideDeck, SlideFrame } from './reportRenderEngine';
import { LayoutVariant } from './reportLayoutTemplates';

/**
 * Slide export result
 */
export interface SlideExportResult {
  success: boolean;
  format: 'slides';
  deck: SlideDeck;
  filename: string;
  meta: {
    report_type: string;
    client_name: string;
    timeframe: string;
    generated_at: string;
    completeness: number;
    total_frames: number;
  };
  integration_note?: string;
}

/**
 * Slide layout configuration
 */
export interface SlideLayoutConfig {
  max_frames: number;
  include_notes: boolean;
  include_metrics_slide: boolean;
  condensed: boolean;
}

/**
 * Default layout configurations by report type
 */
const LAYOUT_CONFIGS: Record<string, SlideLayoutConfig> = {
  weekly: {
    max_frames: 8,
    include_notes: true,
    include_metrics_slide: true,
    condensed: false,
  },
  monthly: {
    max_frames: 12,
    include_notes: true,
    include_metrics_slide: true,
    condensed: false,
  },
  ninety_day: {
    max_frames: 15,
    include_notes: true,
    include_metrics_slide: true,
    condensed: false,
  },
};

/**
 * Export report to slide deck
 */
export function exportToSlides(
  renderable: RenderableReport,
  config?: Partial<SlideLayoutConfig>
): SlideExportResult {
  const deck = prepareSlideFrames(renderable);
  const reportConfig = LAYOUT_CONFIGS[renderable.meta.report_type] || LAYOUT_CONFIGS.monthly;
  const finalConfig = { ...reportConfig, ...config };

  // Apply condensed mode if needed
  let frames = deck.frames;
  if (finalConfig.condensed && frames.length > finalConfig.max_frames) {
    frames = condenseDeck(frames, finalConfig.max_frames);
  }

  // Remove notes if not needed
  if (!finalConfig.include_notes) {
    frames = frames.map(frame => ({ ...frame, notes: '' }));
  }

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const clientSlug = renderable.meta.client_name.toLowerCase().replace(/\s+/g, '-');
  const filename = `${clientSlug}-${renderable.meta.report_type}-slides-${dateStr}.json`;

  const finalDeck: SlideDeck = {
    ...deck,
    frames,
    total_frames: frames.length,
  };

  return {
    success: true,
    format: 'slides',
    deck: finalDeck,
    filename,
    meta: {
      report_type: renderable.meta.report_type,
      client_name: renderable.meta.client_name,
      timeframe: renderable.meta.timeframe.label,
      generated_at: renderable.meta.generated_at,
      completeness: renderable.meta.data_completeness,
      total_frames: finalDeck.total_frames,
    },
    integration_note: 'Slide frames returned as JSON. Integrate with Google Slides API, PowerPoint, or Keynote for actual presentation generation.',
  };
}

/**
 * Condense deck to fit max frames
 */
function condenseDeck(frames: SlideFrame[], maxFrames: number): SlideFrame[] {
  if (frames.length <= maxFrames) return frames;

  // Always keep: title, summary, closing
  const essential = frames.filter(f =>
    f.frame_type === 'title' ||
    f.frame_type === 'summary' ||
    f.frame_type === 'closing'
  );

  // Get section frames
  const sectionFrames = frames.filter(f => f.frame_type === 'section');

  // Calculate how many sections we can include
  const availableSlots = maxFrames - essential.length;

  // Prioritize complete sections over partial/limited
  const sortedSections = [...sectionFrames].sort((a, b) => {
    const statusA = a.body_html.includes('status-complete') ? 0 :
                    a.body_html.includes('status-partial') ? 1 : 2;
    const statusB = b.body_html.includes('status-complete') ? 0 :
                    b.body_html.includes('status-partial') ? 1 : 2;
    return statusA - statusB || a.order - b.order;
  });

  const selectedSections = sortedSections.slice(0, availableSlots);

  // Rebuild deck in correct order
  const result: SlideFrame[] = [];
  let order = 0;

  // Title first
  const title = essential.find(f => f.frame_type === 'title');
  if (title) result.push({ ...title, order: order++ });

  // Summary
  const summary = essential.find(f => f.frame_type === 'summary');
  if (summary) result.push({ ...summary, order: order++ });

  // Selected sections
  selectedSections.forEach(section => {
    result.push({ ...section, order: order++ });
  });

  // Closing
  const closing = essential.find(f => f.frame_type === 'closing');
  if (closing) result.push({ ...closing, order: order++ });

  return result;
}

/**
 * Build slide deck with specific layout variant
 */
export function buildSlideDeck(
  renderable: RenderableReport,
  layoutVariant: LayoutVariant = 'standard_agency_report'
): SlideExportResult {
  const config: Partial<SlideLayoutConfig> = layoutVariant === 'compact_summary'
    ? { condensed: true, max_frames: 8 }
    : {};

  return exportToSlides(renderable, config);
}

/**
 * Get individual slide HTML for preview
 */
export function getSlidePreviewHtml(frame: SlideFrame): string {
  return `
    <div class="slide-preview" data-frame-id="${frame.frame_id}" data-frame-type="${frame.frame_type}">
      <div class="slide-header">
        <h2>${frame.title}</h2>
        ${frame.subtitle ? `<p class="subtitle">${frame.subtitle}</p>` : ''}
      </div>
      <div class="slide-body">
        ${frame.body_html}
      </div>
      ${frame.notes ? `
        <div class="slide-notes">
          <strong>Speaker Notes:</strong> ${frame.notes}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate slide deck preview HTML
 */
export function generateSlideDeckPreview(deck: SlideDeck): string {
  const styles = `
    <style>
      .slide-deck-preview {
        font-family: system-ui, sans-serif;
      }

      .slide-preview {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin: 1em 0;
        overflow: hidden;
      }

      .slide-header {
        background: #f8fafc;
        padding: 1em;
        border-bottom: 1px solid #e2e8f0;
      }

      .slide-header h2 {
        margin: 0;
        font-size: 1.25em;
        color: #0f172a;
      }

      .slide-header .subtitle {
        margin: 0.5em 0 0;
        color: #64748b;
        font-size: 0.875em;
      }

      .slide-body {
        padding: 1em;
      }

      .slide-notes {
        background: #fffbeb;
        padding: 0.75em 1em;
        font-size: 0.75em;
        color: #92400e;
        border-top: 1px solid #fcd34d;
      }

      .status-badge {
        display: inline-block;
        font-size: 0.7em;
        padding: 0.2em 0.5em;
        border-radius: 3px;
        margin-bottom: 0.5em;
      }

      .complete { background: #dcfce7; color: #166534; }
      .partial { background: #fef9c3; color: #854d0e; }
      .limited { background: #ffedd5; color: #9a3412; }

      .metric {
        text-align: center;
        padding: 0.5em;
        background: #f8fafc;
        border-radius: 4px;
        margin: 0.5em 0;
      }

      .callout {
        padding: 0.75em;
        border-radius: 4px;
        background: #eff6ff;
        border-left: 3px solid #3b82f6;
        margin: 0.5em 0;
      }
    </style>
  `;

  const slidesHtml = deck.frames.map(frame => getSlidePreviewHtml(frame)).join('\n');

  return `
    <div class="slide-deck-preview">
      ${styles}
      <div class="deck-meta">
        <p><strong>${deck.meta.title}</strong> - ${deck.total_frames} slides</p>
      </div>
      ${slidesHtml}
    </div>
  `;
}

export default {
  exportToSlides,
  buildSlideDeck,
  getSlidePreviewHtml,
  generateSlideDeckPreview,
};
