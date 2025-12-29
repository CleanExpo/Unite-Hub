/**
 * Generate Video & Image Assets
 * Creates metadata for VEO 2 videos and generates images with Nano Banana 2 Pro
 *
 * Part of Anthropic UI/UX Phase - Google AI Integration
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ Missing Google AI API key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const outputDir = join(process.cwd(), 'public', 'generated-assets');

console.log('🎬 Generating Video & Image Assets with Google AI...\n');

/**
 * Generate video metadata for all agent demos
 */
async function generateVideoMetadata() {
  console.log('📹 Generating video metadata for VEO 2...\n');

  const videoSpecs = [
    {
      name: 'ai-email-agent-demo',
      title: 'AI Email Agent: Autonomous Lead Processing',
      duration: 8,
      costPerSecond: 0.35,
      segments: [
        { start: 0, end: 2, name: 'Email Arrival', description: 'New email detected and queued for AI processing' },
        { start: 2, end: 5, name: 'AI Analysis', description: 'Intent extraction and sentiment analysis by AI Email Agent' },
        { start: 5, end: 7, name: 'Score Update', description: 'Contact score automatically increased by 15 points' },
        { start: 7, end: 8, name: 'Categorization', description: 'Lead categorized as Hot and added to follow-up campaign' }
      ],
      overlayType: 'mermaid',
      keywords: ['AI email processing', 'intent extraction', 'sentiment analysis', 'lead scoring']
    },
    {
      name: 'content-generator-demo',
      title: 'AI Content Generator: Personalized Email Creation',
      duration: 8,
      costPerSecond: 0.35,
      segments: [
        { start: 0, end: 2, name: 'Contact Selection', description: 'Review contact history and engagement score' },
        { start: 2, end: 5, name: 'AI Generation', description: 'Claude Opus 4 creates personalized email content' },
        { start: 5, end: 7, name: 'Personalization', description: 'Template tokens replaced with real contact data' },
        { start: 7, end: 8, name: 'Preview Ready', description: 'Email ready to send with call-to-action button' }
      ],
      overlayType: 'json',
      keywords: ['AI content generation', 'personalization', 'Claude Opus 4', 'email marketing']
    },
    {
      name: 'orchestrator-demo',
      title: 'Campaign Orchestrator: Automated Drip Sequences',
      duration: 8,
      costPerSecond: 0.35,
      segments: [
        { start: 0, end: 2, name: 'Campaign Setup', description: 'Multi-step drip sequence configuration' },
        { start: 2, end: 5, name: 'Automation Trigger', description: 'Contact enters campaign based on score threshold' },
        { start: 5, end: 7, name: 'Execution', description: 'First email sent automatically with wait condition' },
        { start: 7, end: 8, name: 'Branching', description: 'Conditional routing based on email engagement' }
      ],
      overlayType: 'mermaid',
      keywords: ['drip campaigns', 'marketing automation', 'workflow orchestration', 'conditional logic']
    }
  ];

  const videoMetadata = videoSpecs.map(spec => ({
    "@type": "VideoObject",
    "name": spec.title,
    "identifier": spec.name,
    "duration": `PT${spec.duration}S`,
    "estimatedCost": spec.duration * spec.costPerSecond,
    "hasPart": spec.segments.map(segment => ({
      "@type": "Clip",
      "name": segment.name,
      "description": segment.description,
      "startOffset": segment.start,
      "endOffset": segment.end
    })),
    "overlayType": spec.overlayType,
    "keywords": spec.keywords.join(', '),
    "generationStatus": "metadata-ready",
    "model": "veo-2",
    "pricing": `$${spec.costPerSecond}/second via Gemini API`
  }));

  // Save metadata
  const metadataPath = join(outputDir, 'video-metadata.json');
  writeFileSync(metadataPath, JSON.stringify(videoMetadata, null, 2), 'utf-8');

  console.log(`✅ Video metadata saved: ${metadataPath}`);
  console.log(`   Videos: ${videoSpecs.length}`);
  console.log(`   Total duration: ${videoSpecs.reduce((sum, v) => sum + v.duration, 0)}s`);
  console.log(`   Estimated cost: $${videoSpecs.reduce((sum, v) => sum + (v.duration * v.costPerSecond), 0).toFixed(2)}\n`);

  return videoMetadata;
}

/**
 * Generate marketing images with Gemini
 */
async function generateMarketingImages() {
  console.log('🎨 Generating additional marketing images...\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // GitHub Social Proof Image (SVG)
  console.log('   Generating GitHub social proof image...');

  const githubPrompt = `Create a professional SVG image (1200x630px) showing GitHub → Production connection:

LEFT SECTION (40% width):
- GitHub logo and branding
- Text: "CleanExpo/Unite-Hub"
- Code preview box showing TypeScript snippet
- Badges: "⭐ Open Source", "🔧 Active Development"
- Metrics: "43 AI Agents • 14K+ lines • 136 tests"

CENTER CONNECTOR (20% width):
- Large arrow →
- Text: "Powers"
- Data flow visualization

RIGHT SECTION (40% width):
- Browser window mockup
- Website: "unite-group.in"
- Dashboard preview (clean, modern)
- Status: "● Live in Production"
- Badges: "✅ Production Ready", "🚀 Deployed"

BOTTOM BANNER:
- Text: "Open Source Transparency → Production Excellence"
- Subtext: "From GitHub to your business"

Style: Professional, clean, high-trust. Orange accent #ff6b35. High contrast.
Return ONLY the SVG code.`;

  const githubResult = await model.generateContent(githubPrompt);
  let githubSvg = githubResult.response.text();
  githubSvg = githubSvg.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

  // Ensure starts with <svg>
  if (!githubSvg.startsWith('<svg')) {
    console.warn('   Warning: Generated output may not be valid SVG');
  }

  const githubPath = join(outputDir, 'github-social-proof.svg');
  writeFileSync(githubPath, githubSvg, 'utf-8');
  console.log(`   ✅ Saved: github-social-proof.svg\n`);

  // Project Vend Phase 2 Feature Image
  console.log('   Generating Project Vend Phase 2 feature image...');

  const phase2Prompt = `Create a professional SVG infographic (1200x800px) for Project Vend Phase 2:

TITLE (top): "Project Vend Phase 2: Agent Optimization Framework"

5 FEATURE CIRCLES (arranged in pentagonal layout):

1. METRICS (top):
   Circle with chart icon
   "Real-time Metrics"
   "Track costs, performance, health"

2. RULES (top-right):
   Circle with checklist icon
   "Business Rules"
   "18 constraints prevent naive decisions"

3. VERIFICATION (bottom-right):
   Circle with shield icon
   "Output Verification"
   "7 methods catch errors"

4. ESCALATIONS (bottom-left):
   Circle with bell icon
   "Smart Escalations"
   "Approval workflows"

5. BUDGETS (top-left):
   Circle with dollar icon
   "Cost Control"
   "Auto-pause at limits"

CENTER HUB:
- Large circle
- "43 Agents"
- "Enhanced Automatically"
- Lines connecting to all 5 features

FOOTER:
- "Transform: tool-with-agents → self-improving autonomous system"
- "136 tests passing • 8 systems operational"

Style: Professional, technical, clean. Orange/blue/purple palette. High information density.
Return ONLY the SVG code.`;

  const phase2Result = await model.generateContent(phase2Prompt);
  let phase2Svg = phase2Result.response.text();
  phase2Svg = phase2Svg.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

  const phase2Path = join(outputDir, 'project-vend-phase2-overview.svg');
  writeFileSync(phase2Path, phase2Svg, 'utf-8');
  console.log(`   ✅ Saved: project-vend-phase2-overview.svg\n`);

  return {
    github: githubPath,
    phase2: phase2Path
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting comprehensive asset generation...\n');

    // Generate video metadata
    const videos = await generateVideoMetadata();

    // Generate additional images
    const images = await generateMarketingImages();

    console.log('═'.repeat(70));
    console.log('✅ Asset generation COMPLETE\n');
    console.log('📊 Summary:');
    console.log(`   Videos (metadata): ${videos.length}`);
    console.log(`   Images (generated): 2 new SVG files`);
    console.log(`   Total visual assets: ${7 + 2} = 9 files\n`);
    console.log('📁 Output: public/generated-assets/');
    console.log('   - video-metadata.json (VEO 2 specs)');
    console.log('   - github-social-proof.svg');
    console.log('   - project-vend-phase2-overview.svg\n');
    console.log('💡 Next:');
    console.log('   1. Review generated files');
    console.log('   2. For actual video generation, configure Vertex AI');
    console.log('   3. Videos cost: ~$2.80 each (8s @ $0.35/s)');
    console.log('   4. Can generate placeholder videos or wait for API access\n');

  } catch (err) {
    console.error('❌ Asset generation failed:', err);
    process.exit(1);
  }
}

main();
