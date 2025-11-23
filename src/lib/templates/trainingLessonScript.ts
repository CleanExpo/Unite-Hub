/**
 * Training Lesson Script Templates
 * Phase 55: Templates for generating lesson content
 */

export interface LessonScriptConfig {
  title: string;
  targetAudience: string;
  duration: number; // seconds
  keyPoints: string[];
  callToAction?: string;
  examples?: string[];
}

export interface GeneratedScript {
  videoScript: string;
  voiceScript: string;
  slideOutline: string[];
  estimatedDuration: number;
}

// Generate a lesson script from config
export function generateLessonScript(config: LessonScriptConfig): GeneratedScript {
  const intro = generateIntro(config.title, config.targetAudience);
  const body = generateBody(config.keyPoints, config.examples);
  const outro = generateOutro(config.callToAction);

  const videoScript = `${intro}\n\n${body}\n\n${outro}`;
  const voiceScript = convertToVoiceScript(videoScript);
  const slideOutline = generateSlideOutline(config);

  return {
    videoScript,
    voiceScript,
    slideOutline,
    estimatedDuration: config.duration,
  };
}

function generateIntro(title: string, audience: string): string {
  return `[INTRO - 15 seconds]

VISUAL: Title card with "${title}"

SCRIPT:
"Welcome to this quick lesson on ${title.toLowerCase()}.
This is designed specifically for ${audience.toLowerCase()} -
no technical background required.
Let's dive in."`;
}

function generateBody(keyPoints: string[], examples?: string[]): string {
  let body = '[MAIN CONTENT]\n\n';

  keyPoints.forEach((point, index) => {
    body += `[POINT ${index + 1}]\n\n`;
    body += `VISUAL: Key point graphic\n\n`;
    body += `SCRIPT:\n"${point}"\n\n`;

    if (examples && examples[index]) {
      body += `EXAMPLE:\n"${examples[index]}"\n\n`;
    }
  });

  return body;
}

function generateOutro(callToAction?: string): string {
  const cta = callToAction || 'Apply what you\'ve learned in your next task';

  return `[OUTRO - 10 seconds]

VISUAL: Summary slide with key takeaways

SCRIPT:
"That's it for this lesson. Remember the key points we covered.
${cta}.
See you in the next lesson."`;
}

function convertToVoiceScript(videoScript: string): string {
  // Remove visual cues and formatting for voice-only
  return videoScript
    .replace(/\[.*?\]/g, '')
    .replace(/VISUAL:.*?\n/g, '')
    .replace(/SCRIPT:\n/g, '')
    .replace(/EXAMPLE:\n/g, 'For example: ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function generateSlideOutline(config: LessonScriptConfig): string[] {
  const slides: string[] = [
    `Title: ${config.title}`,
    `Audience: ${config.targetAudience}`,
  ];

  config.keyPoints.forEach((point, i) => {
    slides.push(`Point ${i + 1}: ${point}`);
  });

  if (config.examples) {
    slides.push('Examples section');
  }

  slides.push(`Summary & CTA: ${config.callToAction || 'Apply your learning'}`);

  return slides;
}

// Pre-built lesson templates
export const lessonTemplates = {
  platformOverview: {
    title: 'Platform Overview',
    targetAudience: 'new users',
    duration: 180,
    keyPoints: [
      'The dashboard is your command centre - check it daily for updates',
      'Your 90-day activation shows your progress journey',
      'Content packs deliver ready-to-use marketing materials',
      'Settings lets you customize your experience',
    ],
    callToAction: 'Explore each section of your dashboard today',
  },

  aiBasics: {
    title: 'How AI Works in Unite-Hub',
    targetAudience: 'business owners with no AI background',
    duration: 240,
    keyPoints: [
      'AI generates drafts, not final content - you review and approve',
      'Better inputs lead to better outputs - be specific in your briefs',
      'AI learns from your feedback - corrections improve future results',
      'AI cannot guarantee results - it\'s a tool, not magic',
    ],
    examples: [
      'Instead of "write a blog", say "write a 500-word blog about [specific topic] for [specific audience]"',
    ],
    callToAction: 'Try improving one AI brief with more specific details',
  },

  seoBasics: {
    title: 'SEO Fundamentals for Local Business',
    targetAudience: 'local service business owners',
    duration: 300,
    keyPoints: [
      'SEO helps people find you on Google - it takes 90+ days to see results',
      'Keywords are what people type into Google - target relevant ones',
      'Google Business Profile is critical for local visibility',
      'Reviews and citations build trust with Google',
    ],
    callToAction: 'Check your Google Business Profile is complete and accurate',
  },

  readingMetrics: {
    title: 'Understanding Your Metrics',
    targetAudience: 'business owners reviewing reports',
    duration: 240,
    keyPoints: [
      'Focus on trends, not single data points - look for patterns',
      'Lead score shows how engaged a contact is - higher is better',
      'Conversion rate shows what percentage take action',
      'Compare periods fairly - month vs month, not random dates',
    ],
    examples: [
      'A 5% conversion rate means 5 out of 100 visitors take the desired action',
    ],
    callToAction: 'Review your dashboard and identify one positive trend',
  },
};

export default {
  generateLessonScript,
  lessonTemplates,
};
