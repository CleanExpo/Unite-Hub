/**
 * Training Video Script Templates
 * Phase 55: Templates for Gemini VEO 3 video generation
 */

export interface VideoScriptConfig {
  title: string;
  duration: number; // target duration in seconds
  style: 'professional' | 'friendly' | 'energetic';
  visualStyle: 'screencast' | 'talking_head' | 'animated' | 'mixed';
  brandColors?: {
    primary: string;
    secondary: string;
  };
  speakerName?: string;
  scenes: VideoScene[];
}

export interface VideoScene {
  sceneNumber: number;
  duration: number;
  visualDescription: string;
  narration: string;
  onScreenText?: string;
  transition?: string;
}

export interface GeneratedVideoScript {
  fullScript: string;
  veo3Prompt: string;
  elevenLabsScript: string;
  metadata: {
    totalDuration: number;
    sceneCount: number;
    wordCount: number;
  };
}

// Generate video script for Gemini VEO 3
export function generateVideoScript(config: VideoScriptConfig): GeneratedVideoScript {
  const scenes = config.scenes.map((scene) => formatScene(scene, config.style));
  const fullScript = scenes.join('\n\n---\n\n');

  const veo3Prompt = generateVEO3Prompt(config);
  const elevenLabsScript = extractNarration(config.scenes);

  const wordCount = elevenLabsScript.split(/\s+/).length;

  return {
    fullScript,
    veo3Prompt,
    elevenLabsScript,
    metadata: {
      totalDuration: config.duration,
      sceneCount: config.scenes.length,
      wordCount,
    },
  };
}

function formatScene(scene: VideoScene, style: string): string {
  const toneDirection = getToneDirection(style);

  return `SCENE ${scene.sceneNumber}
Duration: ${scene.duration} seconds

VISUAL:
${scene.visualDescription}

NARRATION (${toneDirection}):
"${scene.narration}"

${scene.onScreenText ? `ON-SCREEN TEXT:\n${scene.onScreenText}\n` : ''}
${scene.transition ? `TRANSITION: ${scene.transition}` : ''}`;
}

function getToneDirection(style: string): string {
  switch (style) {
    case 'professional':
      return 'Clear, authoritative, measured pace';
    case 'energetic':
      return 'Upbeat, enthusiastic, slightly faster pace';
    default:
      return 'Warm, conversational, natural pace';
  }
}

function generateVEO3Prompt(config: VideoScriptConfig): string {
  const styleGuide = {
    professional: 'corporate style with clean graphics and minimal animation',
    friendly: 'approachable style with warm colors and smooth transitions',
    energetic: 'dynamic style with motion graphics and quick cuts',
  };

  const visualGuide = {
    screencast: 'screen recording with cursor highlights and annotations',
    talking_head: 'presenter on camera with supporting graphics',
    animated: 'fully animated explainer with character illustrations',
    mixed: 'combination of screen recordings and presenter segments',
  };

  return `Create a ${config.duration}-second training video titled "${config.title}".

STYLE: ${styleGuide[config.style]}
VISUAL FORMAT: ${visualGuide[config.visualStyle]}
${config.brandColors ? `BRAND COLORS: Primary ${config.brandColors.primary}, Secondary ${config.brandColors.secondary}` : ''}

SCENE BREAKDOWN:
${config.scenes.map((s) => `- Scene ${s.sceneNumber} (${s.duration}s): ${s.visualDescription}`).join('\n')}

IMPORTANT:
- Maintain consistent visual style throughout
- Use clear typography for any on-screen text
- Include smooth transitions between scenes
- Ensure accessibility with good contrast
- No copyrighted music or stock footage watermarks`;
}

function extractNarration(scenes: VideoScene[]): string {
  return scenes
    .map((scene) => scene.narration)
    .join('\n\n')
    .trim();
}

// Pre-built video script templates
export const videoScriptTemplates = {
  welcomeVideo: {
    title: 'Welcome to Unite-Hub',
    duration: 120,
    style: 'friendly' as const,
    visualStyle: 'mixed' as const,
    scenes: [
      {
        sceneNumber: 1,
        duration: 20,
        visualDescription: 'Logo animation followed by dashboard overview',
        narration: 'Welcome to Unite-Hub - your AI-powered marketing platform. In the next two minutes, I\'ll show you the key areas you\'ll be using every day.',
        onScreenText: 'Welcome to Unite-Hub',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        duration: 30,
        visualDescription: 'Screencast of dashboard with highlight annotations',
        narration: 'This is your dashboard. You\'ll see your lead score, recent activity, and quick actions here. Think of it as your daily command centre.',
        onScreenText: 'Your Dashboard',
        transition: 'slide',
      },
      {
        sceneNumber: 3,
        duration: 30,
        visualDescription: 'Screencast of 90-day activation view',
        narration: 'Your 90-day activation shows exactly where you are in your marketing journey. Each milestone builds on the last - no skipping steps.',
        onScreenText: '90-Day Activation',
        transition: 'slide',
      },
      {
        sceneNumber: 4,
        duration: 25,
        visualDescription: 'Screencast of content packs',
        narration: 'Content packs deliver your weekly marketing materials. Review, approve, and publish - that simple.',
        onScreenText: 'Content Packs',
        transition: 'slide',
      },
      {
        sceneNumber: 5,
        duration: 15,
        visualDescription: 'Call to action screen with next steps',
        narration: 'Take five minutes to explore your dashboard. Your first milestone is completing this training. Let\'s get started.',
        onScreenText: 'Explore Your Dashboard',
        transition: 'fade',
      },
    ],
  },

  aiBriefingTutorial: {
    title: 'How to Brief the AI',
    duration: 180,
    style: 'professional' as const,
    visualStyle: 'screencast' as const,
    scenes: [
      {
        sceneNumber: 1,
        duration: 20,
        visualDescription: 'Title card with concept illustration',
        narration: 'The quality of AI output depends entirely on the quality of your brief. Let me show you how to get better results every time.',
        onScreenText: 'Better Briefs = Better Results',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        duration: 40,
        visualDescription: 'Split screen: bad brief vs good brief',
        narration: 'Here\'s a bad brief: "Write a blog post." Here\'s a good brief: "Write a 600-word blog for Brisbane homeowners about the signs they need new gutters." See the difference? Specifics give the AI direction.',
        onScreenText: 'Be Specific',
        transition: 'slide',
      },
      {
        sceneNumber: 3,
        duration: 40,
        visualDescription: 'Screencast showing context fields being filled',
        narration: 'Always include context. Who is your audience? What tone do you want? What action should readers take? Fill in these fields and your content improves immediately.',
        onScreenText: 'Add Context',
        transition: 'slide',
      },
      {
        sceneNumber: 4,
        duration: 40,
        visualDescription: 'Example of editing AI output with highlights',
        narration: 'Review and refine. AI gives you a draft, not final copy. Edit it with your expertise. Add your stories. Remove anything that doesn\'t sound like you. This is normal and expected.',
        onScreenText: 'Review & Refine',
        transition: 'slide',
      },
      {
        sceneNumber: 5,
        duration: 40,
        visualDescription: 'Summary slide with three key points',
        narration: 'Remember: be specific, add context, and always review. Your next brief will be better because you know what works. Try it now.',
        onScreenText: '1. Be Specific\n2. Add Context\n3. Review & Refine',
        transition: 'fade',
      },
    ],
  },
};

export default {
  generateVideoScript,
  videoScriptTemplates,
};
