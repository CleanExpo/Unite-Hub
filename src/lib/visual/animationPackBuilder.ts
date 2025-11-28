/**
 * Animation Pack Builder
 *
 * Generates downloadable PDF style packs from StyleProfiles.
 * Used by the wizard results screen and sales team.
 */

import { StyleProfile, prepareProfileForExport, ProfileExportData } from './styleProfile';
import { animationStyles } from './animationStyles';

// ============================================================================
// TYPES
// ============================================================================

export interface AnimationPackConfig {
  profile: StyleProfile;
  includeCodeSamples: boolean;
  includeTiming: boolean;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  companyLogo?: string;
}

export interface PackSection {
  title: string;
  content: string;
  styles?: Array<{
    name: string;
    description: string;
    cssClass: string;
    previewUrl?: string;
  }>;
}

// ============================================================================
// PACK CONTENT GENERATOR
// ============================================================================

export function generatePackContent(config: AnimationPackConfig): PackSection[] {
  const { profile, includeCodeSamples, includeTiming } = config;

  const exportData = prepareProfileForExport(
    profile,
    animationStyles.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      bestFor: s.bestFor,
    }))
  );

  const sections: PackSection[] = [];

  // Header Section
  sections.push({
    title: 'Animation Style Pack',
    content: `
Prepared for: ${exportData.clientName}${exportData.brandName ? ` (${exportData.brandName})` : ''}
Generated: ${new Date(exportData.createdAt).toLocaleDateString()}

${exportData.summary}
    `.trim(),
  });

  // Profile Overview
  sections.push({
    title: 'Your Style Profile',
    content: `
Target Audience: ${exportData.settings.persona}
Animation Intensity: ${exportData.settings.intensity}

Features Enabled:
${exportData.settings.features.map(f => `  • ${f}`).join('\n') || '  • Standard animations only'}

${exportData.notes ? `Notes: ${exportData.notes}` : ''}
    `.trim(),
  });

  // Recommended Styles
  sections.push({
    title: 'Recommended Animation Styles',
    content: `
Based on your preferences, we recommend the following ${exportData.styles.length} animation styles:
    `.trim(),
    styles: exportData.styles.map(style => ({
      name: style.name,
      description: style.description,
      cssClass: style.id,
      previewUrl: `/demos/thumbnails/${style.id}.jpg`,
    })),
  });

  // Implementation Guide
  if (includeCodeSamples) {
    sections.push({
      title: 'Implementation Guide',
      content: `
How to Use These Animations:

1. Hero Sections
   Apply entrance animations to hero content for immediate impact.
   Recommended: ${profile.preferredStyles[0] || 'beam-sweep-alpha'}

2. Card Hover Effects
   Add micro-interactions to cards and buttons.
   Recommended: ${profile.preferredStyles.find(s => s.includes('card')) || 'card-fade-scale'}

3. Scroll Reveals
   Trigger animations as sections enter the viewport.
   Use with Intersection Observer for performance.

4. Page Transitions
   Smooth transitions between pages for SPA feel.
   Recommended: ${profile.preferredStyles.find(s => s.includes('transition')) || 'transition-fade-through'}

CSS Classes:
${profile.preferredStyles.map(s => `  .${s} { /* Apply to element */ }`).join('\n')}
      `.trim(),
    });
  }

  // Timing Guidelines
  if (includeTiming) {
    const timingGuide = getTimingGuide(profile.intensity);
    sections.push({
      title: 'Timing Guidelines',
      content: `
Recommended Animation Timings for ${profile.intensity.charAt(0).toUpperCase() + profile.intensity.slice(1)} Intensity:

Duration: ${timingGuide.duration}
Easing: ${timingGuide.easing}
Delay Between Elements: ${timingGuide.stagger}

Best Practices:
${timingGuide.tips.map(tip => `  • ${tip}`).join('\n')}
      `.trim(),
    });
  }

  // Accessibility Notes
  sections.push({
    title: 'Accessibility Compliance',
    content: `
All recommended animations follow these accessibility guidelines:

• No rapid flashing (>3Hz) that could trigger photosensitive epilepsy
• All durations exceed 0.5 seconds for comfortable viewing
• Respects prefers-reduced-motion media query
• Soft transitions instead of abrupt changes
• No auto-playing video without user consent

Implementation Note:
Always wrap animations with a reduced-motion check:

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
    `.trim(),
  });

  // Next Steps
  sections.push({
    title: 'Next Steps',
    content: `
Ready to bring these animations to life?

1. Review the recommended styles in our gallery
   → https://unite-hub.com/inspiration

2. Book a consultation with our team
   → We'll implement these animations on your site

3. Download component code (Professional/Enterprise packs)
   → Ready-to-use React/CSS components

Contact: hello@unite-hub.com
    `.trim(),
  });

  return sections;
}

// ============================================================================
// TIMING GUIDE HELPER
// ============================================================================

function getTimingGuide(intensity: 'subtle' | 'normal' | 'dramatic'): {
  duration: string;
  easing: string;
  stagger: string;
  tips: string[];
} {
  const guides = {
    subtle: {
      duration: '0.3-0.5 seconds',
      easing: 'ease-out (cubic-bezier(0, 0, 0.2, 1))',
      stagger: '50-100ms',
      tips: [
        'Keep movements minimal and refined',
        'Use opacity changes more than position shifts',
        'Avoid drawing attention away from content',
        'Test on slower devices to ensure smoothness',
      ],
    },
    normal: {
      duration: '0.5-0.8 seconds',
      easing: 'ease-in-out (cubic-bezier(0.4, 0, 0.2, 1))',
      stagger: '100-150ms',
      tips: [
        'Balance visibility with subtlety',
        'Use transforms for smooth 60fps animations',
        'Add slight delays for sequential reveals',
        'Consider scroll-triggered animations',
      ],
    },
    dramatic: {
      duration: '0.8-1.2 seconds',
      easing: 'spring-like (cubic-bezier(0.34, 1.56, 0.64, 1))',
      stagger: '150-250ms',
      tips: [
        'Make entrances memorable but not overwhelming',
        'Use the full screen for hero animations',
        'Consider parallax and 3D depth effects',
        'Ensure animations don\'t delay important content',
      ],
    },
  };

  return guides[intensity];
}

// ============================================================================
// HTML EXPORT (for PDF generation)
// ============================================================================

export function generatePackHTML(config: AnimationPackConfig): string {
  const sections = generatePackContent(config);
  const { brandColors } = config;

  const primaryColor = brandColors?.primary || '#6366f1';
  const secondaryColor = brandColors?.secondary || '#8b5cf6';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animation Style Pack - ${config.profile.clientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid ${primaryColor};
      margin-bottom: 30px;
    }
    .header h1 {
      color: ${primaryColor};
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #64748b;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: ${primaryColor};
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-content {
      white-space: pre-wrap;
      color: #475569;
    }
    .style-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
    }
    .style-card h3 {
      color: #1e293b;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .style-card p {
      color: #64748b;
      font-size: 14px;
    }
    .style-card code {
      display: inline-block;
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body { background: white; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Animation Style Pack</h1>
      <p>Prepared for ${config.profile.clientName}</p>
    </div>

    ${sections.map(section => `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="section-content">${escapeHtml(section.content)}</div>
        ${section.styles ? section.styles.map(style => `
          <div class="style-card">
            <h3>${style.name}</h3>
            <p>${style.description}</p>
            <code>.${style.cssClass}</code>
          </div>
        `).join('') : ''}
      </div>
    `).join('')}

    <div class="footer">
      <p>Generated by Unite-Hub Visual Experience Engine</p>
      <p>https://unite-hub.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// DOWNLOAD TRIGGER (client-side)
// ============================================================================

export function downloadPack(config: AnimationPackConfig): void {
  const html = generatePackHTML(config);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `animation-pack-${config.profile.clientName.toLowerCase().replace(/\s+/g, '-')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// JSON EXPORT (for API/storage)
// ============================================================================

export function exportPackAsJSON(config: AnimationPackConfig): string {
  const sections = generatePackContent(config);
  return JSON.stringify({
    profile: config.profile,
    sections,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  }, null, 2);
}

export default {
  generatePackContent,
  generatePackHTML,
  downloadPack,
  exportPackAsJSON,
};
