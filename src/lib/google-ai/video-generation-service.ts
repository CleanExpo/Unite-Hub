/**
 * VEO 2 Video Generation Service
 * Production-ready service for generating demo videos with logic overlays
 *
 * Based on Google VEO 2 via Gemini API
 * Pricing: $0.35/second (5-8 second videos)
 * Sources:
 * - https://developers.googleblog.com/en/veo-2-video-generation-now-generally-available/
 * - https://ai.google.dev/gemini-api/docs/veo
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VideoRequest {
  name: string;
  prompt: string;
  duration: number; // 5-8 seconds supported
  style: 'realistic' | 'animated' | 'technical';
  overlayType?: 'mermaid' | 'json' | 'code';
  keyMoments: Array<{
    timestamp: number;
    action: string;
    description: string;
  }>;
}

export interface VideoResult {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  estimatedCost: number; // USD
  segments: Array<{
    start: number;
    end: number;
    name: string;
    description: string;
  }>;
  metadata: {
    model: 'veo-2';
    prompt: string;
    generatedAt: string;
    pricing: string;
  };
}

export class VideoGenerationService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  private costPerSecond = 0.35; // VEO 2 pricing via Gemini API

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Missing Google AI API key for VEO 2');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Generate video using VEO 2 (via Gemini API)
   * Note: Actual video generation requires Vertex AI setup
   * This creates the metadata structure for video assets
   */
  async generateVideoMetadata(request: VideoRequest): Promise<VideoResult> {
    try {
      // Validate duration (VEO 2 supports 5-8 seconds)
      if (request.duration < 5 || request.duration > 8) {
        throw new Error('VEO 2 supports 5-8 second videos. Duration must be in this range.');
      }

      console.log('🎬 Preparing VEO 2 video generation...');
      console.log(`   Name: ${request.name}`);
      console.log(`   Duration: ${request.duration}s`);
      console.log(`   Estimated cost: $${(request.duration * this.costPerSecond).toFixed(2)}`);

      // Build enhanced prompt with overlay instructions
      const enhancedPrompt = this.buildPromptWithOverlay(request);

      // Generate segments from key moments
      const segments = this.generateSegments(request);

      const result: VideoResult = {
        name: request.name,
        status: 'pending', // Would be 'processing' when actually calling VEO 2 API
        duration: request.duration,
        estimatedCost: request.duration * this.costPerSecond,
        segments,
        metadata: {
          model: 'veo-2',
          prompt: enhancedPrompt,
          generatedAt: new Date().toISOString(),
          pricing: `$${this.costPerSecond}/second via Gemini API`
        }
      };

      console.log('✅ Video metadata prepared');
      console.log(`   Estimated cost: $${result.estimatedCost.toFixed(2)}`);
      console.log(`   Segments: ${segments.length}`);

      return result;

    } catch (err) {
      console.error('Video generation failed:', err);
      throw err;
    }
  }

  /**
   * Build prompt with logic overlay instructions
   */
  private buildPromptWithOverlay(request: VideoRequest): string {
    let prompt = request.prompt;

    // Add style directives
    if (request.style === 'technical') {
      prompt += '\n\nStyle: Professional technical demonstration. Clean UI, modern design, high-fidelity screen recording quality.';
    } else if (request.style === 'realistic') {
      prompt += '\n\nStyle: Photorealistic screen recording with natural cursor movements and realistic timing.';
    } else if (request.style === 'animated') {
      prompt += '\n\nStyle: Smooth animated demonstration with clear visual indicators and transitions.';
    }

    // Add overlay instructions
    if (request.overlayType === 'mermaid') {
      prompt += '\n\nOverlay: Include a subtle mermaid diagram in the bottom-right corner (20% opacity) showing the logic flow between components. The diagram should be clean, professional, and easy to read.';
    } else if (request.overlayType === 'json') {
      prompt += '\n\nOverlay: Display JSON API request/response data in a terminal-style window (semi-transparent, 25% opacity) showing the data structure being processed.';
    } else if (request.overlayType === 'code') {
      prompt += '\n\nOverlay: Show relevant code snippets in a VS Code-style editor window (translucent background) demonstrating the implementation.';
    }

    // Add Google ranking optimization
    prompt += '\n\nTechnical framing: This is educational/technical content for developers. Optimize for information density and clarity.';

    return prompt;
  }

  /**
   * Generate video segments from key moments
   */
  private generateSegments(request: VideoRequest): VideoResult['segments'] {
    return request.keyMoments.map((moment, index, arr) => ({
      start: moment.timestamp,
      end: arr[index + 1]?.timestamp || request.duration,
      name: moment.action,
      description: moment.description
    }));
  }

  /**
   * Get all Unite-Hub agent demo video specs
   */
  getAgentDemoSpecs(): Record<string, VideoRequest> {
    return {
      emailAgent: {
        name: 'AI Email Agent: Autonomous Lead Processing',
        duration: 8,
        style: 'technical',
        overlayType: 'mermaid',
        prompt: `Create a high-fidelity technical demonstration of the Unite-Hub AI Email Agent processing an incoming email:

SCENE 1 (0-2s): Email arrives
- Show inbox with new email appearing
- Subject: "Interested in your marketing services"
- From: "john@example.com"
- AI indicator starts analyzing

SCENE 2 (3-5s): Intent extraction & sentiment analysis
- Show AI analyzing email content
- Intent extracted: "Service inquiry - pricing information"
- Sentiment: "Positive (0.85 confidence)"
- Contact score updates: +15 points

SCENE 3 (6-8s): Categorization & automation
- Lead automatically categorized as "Hot"
- Added to "Pricing Follow-up" campaign
- Dashboard updates showing new hot lead

OVERLAY: Mermaid diagram showing flow:
Email → Intent Extraction → Sentiment Analysis → Score Update → Categorization

Professional, clean UI, modern design. Show the autonomous nature of the system.`,
        keyMoments: [
          { timestamp: 0, action: 'Email Arrival', description: 'New email detected and queued' },
          { timestamp: 2, action: 'AI Analysis', description: 'Intent extraction and sentiment analysis' },
          { timestamp: 5, action: 'Score Update', description: 'Contact score increased by 15 points' },
          { timestamp: 7, action: 'Categorization', description: 'Lead categorized and added to campaign' }
        ]
      },
      contentGenerator: {
        name: 'AI Content Generator: Personalized Email Creation',
        duration: 8,
        style: 'technical',
        overlayType: 'json',
        prompt: `Create a technical demonstration of Unite-Hub's Content Generator creating a personalized marketing email:

SCENE 1 (0-2s): Contact selection
- Show contact record: "Sarah Chen" from "Acme Corp"
- Interaction history visible: 5 emails, 3 opens
- Score: 75 (warm lead)

SCENE 2 (3-5s): AI generation with Claude Opus 4
- Show "Generate Content" button clicked
- Loading indicator: "Claude Opus 4 analyzing contact history..."
- Template with {firstName}, {company} tokens visible

SCENE 3 (6-8s): Personalized result
- Email preview generated:
  "Hi Sarah, based on Acme Corp's recent engagement..."
- Personalization tokens replaced
- CTA button included
- Ready to send

OVERLAY: JSON showing API request/response:
{
  "model": "claude-opus-4",
  "contact": {"firstName": "Sarah", "company": "Acme Corp"},
  "template": "engagement_followup",
  "output": "personalized_email"
}

Clean, professional, showing AI quality and personalization.`,
        keyMoments: [
          { timestamp: 0, action: 'Contact Selection', description: 'Review contact history and score' },
          { timestamp: 2, action: 'AI Generation', description: 'Claude Opus 4 creates personalized content' },
          { timestamp: 5, action: 'Personalization', description: 'Tokens replaced with contact data' },
          { timestamp: 7, action: 'Preview Ready', description: 'Email ready to send with CTA' }
        ]
      },
      orchestrator: {
        name: 'Campaign Orchestrator: Automated Drip Sequences',
        duration: 8,
        style: 'technical',
        overlayType: 'mermaid',
        prompt: `Show the Unite-Hub Orchestrator managing an automated drip campaign:

SCENE 1 (0-2s): Campaign setup
- Multi-step campaign visible
- Trigger: "Contact score > 60"
- 5 steps with time delays

SCENE 2 (3-5s): Automation in action
- Contact enters campaign (triggered by score update)
- Step 1 executes: Welcome email sent
- Wait condition: 2 days
- Step 2 queued

SCENE 3 (6-8s): Conditional branching
- Email opened → Go to "Engaged" path
- Email not opened → Go to "Re-engage" path
- Orchestrator automatically routes based on behavior

OVERLAY: Flow diagram showing:
Trigger → Step 1 → Wait → Condition → Branch A/B

Technical, showing autonomous workflow management.`,
        keyMoments: [
          { timestamp: 0, action: 'Campaign Setup', description: 'Multi-step sequence configured' },
          { timestamp: 2, action: 'Trigger', description: 'Contact enters campaign' },
          { timestamp: 5, action: 'Execution', description: 'First step executes automatically' },
          { timestamp: 7, action: 'Branching', description: 'Conditional routing based on engagement' }
        ]
      }
    };
  }
}

// Singleton
let instance: VideoGenerationService | null = null;

export function getVideoGenerationService(): VideoGenerationService {
  if (!instance) {
    instance = new VideoGenerationService();
  }
  return instance;
}

/**
 * Generate all Unite-Hub demo video metadata
 */
export async function generateAllVideoMetadata(): Promise<VideoResult[]> {
  const service = getVideoGenerationService();
  const specs = service.getAgentDemoSpecs();

  const results = await Promise.all(
    Object.values(specs).map(spec => service.generateVideoMetadata(spec))
  );

  return results;
}
