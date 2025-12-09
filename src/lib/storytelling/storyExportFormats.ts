/**
 * Story Export Formats
 * Phase 74: Export stories to multiple formats
 */

import { ClientStoryNarrative, FounderStoryNarrative, VideoScript, VoiceScript } from './storytellingNarrativeBuilder';

export interface ExportedStory {
  format: 'json' | 'markdown' | 'email' | 'script';
  content: string;
  filename_suggestion: string;
}

/**
 * Export story to structured JSON
 */
export function exportToJSON(narrative: ClientStoryNarrative): ExportedStory {
  const safeNarrative = {
    title: narrative.title,
    subtitle: narrative.subtitle,
    executive_summary: narrative.executive_summary,
    journey_context: narrative.journey_context,
    key_wins: narrative.key_wins,
    kpi_highlights: narrative.kpi_highlights,
    milestone_summary: narrative.milestone_summary,
    next_steps: narrative.next_steps,
    generated_at: narrative.generated_at,
  };

  return {
    format: 'json',
    content: JSON.stringify(safeNarrative, null, 2),
    filename_suggestion: `story_${Date.now()}.json`,
  };
}

/**
 * Export story to Markdown
 */
export function exportToMarkdown(narrative: ClientStoryNarrative): ExportedStory {
  let md = `# ${narrative.title}\n\n`;
  md += `*${narrative.subtitle}*\n\n`;

  md += `## Executive Summary\n\n${narrative.executive_summary}\n\n`;

  md += `## Journey Context\n\n${narrative.journey_context}\n\n`;

  if (narrative.key_wins.length > 0) {
    md += `## Key Wins\n\n`;
    narrative.key_wins.forEach(win => {
      md += `- ${win}\n`;
    });
    md += '\n';
  }

  if (narrative.kpi_highlights.length > 0) {
    md += `## Key Metrics\n\n`;
    md += '| Metric | Value | Trend |\n';
    md += '|--------|-------|-------|\n';
    narrative.kpi_highlights.forEach(kpi => {
      md += `| ${kpi.name} | ${kpi.value} | ${kpi.trend} |\n`;
    });
    md += '\n';
  }

  if (narrative.challenges.length > 0) {
    md += `## Areas for Attention\n\n`;
    narrative.challenges.forEach(challenge => {
      md += `- ${challenge}\n`;
    });
    md += '\n';
  }

  if (narrative.next_steps.length > 0) {
    md += `## Next Steps\n\n`;
    narrative.next_steps.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`;
    });
    md += '\n';
  }

  md += `---\n\n*${narrative.data_notice}*\n\n`;
  md += `Generated: ${new Date(narrative.generated_at).toLocaleString()}\n`;

  return {
    format: 'markdown',
    content: md,
    filename_suggestion: `story_${Date.now()}.md`,
  };
}

/**
 * Export story to plain-text email body
 */
export function exportToEmail(narrative: ClientStoryNarrative): ExportedStory {
  let email = `${narrative.title}\n`;
  email += `${narrative.subtitle}\n\n`;
  email += `---\n\n`;

  email += `SUMMARY\n\n`;
  email += `${narrative.executive_summary}\n\n`;

  if (narrative.key_wins.length > 0 && narrative.key_wins[0] !== 'Journey is progressing - wins will be highlighted as milestones are achieved') {
    email += `KEY WINS\n\n`;
    narrative.key_wins.forEach(win => {
      email += `• ${win}\n`;
    });
    email += '\n';
  }

  if (narrative.kpi_highlights.length > 0) {
    email += `METRICS\n\n`;
    narrative.kpi_highlights.forEach(kpi => {
      email += `• ${kpi.name}: ${kpi.value} (${kpi.trend})\n`;
    });
    email += '\n';
  }

  if (narrative.next_steps.length > 0) {
    email += `NEXT STEPS\n\n`;
    narrative.next_steps.forEach((step, i) => {
      email += `${i + 1}. ${step}\n`;
    });
    email += '\n';
  }

  email += `---\n\n`;
  email += `${narrative.data_notice}\n\n`;
  email += `View full details in your dashboard.`;

  return {
    format: 'email',
    content: email,
    filename_suggestion: `story_email_${Date.now()}.txt`,
  };
}

/**
 * Export video script outline
 */
export function exportVideoScript(videoScript: VideoScript): ExportedStory {
  let script = `VIDEO SCRIPT OUTLINE\n`;
  script += `Total Duration: ${videoScript.total_duration}\n`;
  script += `Style: ${videoScript.style_notes}\n\n`;
  script += `---\n\n`;

  videoScript.scenes.forEach((scene, i) => {
    script += `SCENE ${i + 1} (${scene.duration})\n`;
    script += `Visual: ${scene.visual}\n`;
    script += `Narration: "${scene.narration}"\n\n`;
  });

  return {
    format: 'script',
    content: script,
    filename_suggestion: `video_script_${Date.now()}.txt`,
  };
}

/**
 * Export voice script
 */
export function exportVoiceScript(voiceScript: VoiceScript): ExportedStory {
  let script = `VOICE SCRIPT\n`;
  script += `Estimated Duration: ${voiceScript.estimated_duration}\n`;
  script += `Tone: ${voiceScript.tone}\n`;
  script += `Pacing: ${voiceScript.pacing}\n\n`;
  script += `---\n\n`;
  script += `SCRIPT:\n\n`;
  script += voiceScript.script;

  return {
    format: 'script',
    content: script,
    filename_suggestion: `voice_script_${Date.now()}.txt`,
  };
}

/**
 * Export founder narrative with operational details
 */
export function exportFounderMarkdown(narrative: FounderStoryNarrative): ExportedStory {
  const md = exportToMarkdown(narrative).content;

  // Add founder-specific sections before the footer
  const footerIndex = md.lastIndexOf('---');
  const beforeFooter = md.substring(0, footerIndex);
  const footer = md.substring(footerIndex);

  let founderSections = '';

  founderSections += `## Operational Summary\n\n${narrative.operational_summary}\n\n`;

  if (narrative.risk_indicators.length > 0) {
    founderSections += `## Risk Indicators\n\n`;
    narrative.risk_indicators.forEach(risk => {
      founderSections += `- ⚠️ ${risk}\n`;
    });
    founderSections += '\n';
  }

  if (narrative.opportunity_indicators.length > 0) {
    founderSections += `## Opportunities\n\n`;
    narrative.opportunity_indicators.forEach(opp => {
      founderSections += `- ✨ ${opp}\n`;
    });
    founderSections += '\n';
  }

  if (narrative.recommended_actions.length > 0) {
    founderSections += `## Recommended Actions\n\n`;
    narrative.recommended_actions.forEach((action, i) => {
      founderSections += `${i + 1}. ${action}\n`;
    });
    founderSections += '\n';
  }

  return {
    format: 'markdown',
    content: beforeFooter + founderSections + footer,
    filename_suggestion: `founder_story_${Date.now()}.md`,
  };
}

/**
 * Get all available export options
 */
export function getExportOptions(
  hasVideoScript: boolean,
  hasVoiceScript: boolean
): { id: string; label: string; description: string }[] {
  const options = [
    { id: 'json', label: 'JSON', description: 'Structured data format' },
    { id: 'markdown', label: 'Markdown', description: 'Formatted report' },
    { id: 'email', label: 'Email', description: 'Plain text email body' },
  ];

  if (hasVideoScript) {
    options.push({ id: 'video', label: 'Video Script', description: 'Scene-by-scene outline' });
  }

  if (hasVoiceScript) {
    options.push({ id: 'voice', label: 'Voice Script', description: 'Narration with tone guidance' });
  }

  return options;
}

export default {
  exportToJSON,
  exportToMarkdown,
  exportToEmail,
  exportVideoScript,
  exportVoiceScript,
  exportFounderMarkdown,
  getExportOptions,
};
