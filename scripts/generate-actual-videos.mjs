/**
 * Generate Actual Videos with VEO 3.1 Fast
 * Production video generation for Unite-Hub agent demos
 *
 * Cost: 3 videos × 8 seconds × $0.40/second = $9.60 total
 * Model: veo-3.1-fast-generate-preview (with native audio)
 *
 * Official Docs: https://ai.google.dev/gemini-api/docs/video
 * GitHub Example: https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ Missing Google AI API key');
  console.error('Set GEMINI_API_KEY or GOOGLE_AI_API_KEY in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const outputDir = join(process.cwd(), 'public', 'videos');

// Ensure output directory exists
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory might exist
}

console.log('🎬 VEO 3.1 Fast Video Generation\n');
console.log('📊 Cost Estimate: 3 videos × 8s × $0.40/s = $9.60 total\n');

/**
 * Video specifications from metadata
 */
const videoSpecs = [
  {
    id: 'ai-email-agent-demo',
    name: 'AI Email Agent: Autonomous Lead Processing',
    prompt: `Create a professional 8-second screen recording demonstration of an AI Email Agent:

SECOND 1-2: Email notification arrives
- Modern inbox interface
- Email subject: "Interested in your marketing services"
- From: "john@example.com"
- AI processing indicator activates

SECOND 3-5: AI analysis in real-time
- Intent extracted: "Service inquiry - pricing information"
- Sentiment analyzed: "Positive (0.85 confidence)"
- Contact score updates visibly: +15 points
- Smooth animations showing AI processing

SECOND 6-8: Automatic categorization
- Lead badge changes to "Hot" (red/orange)
- Automatically added to "Pricing Follow-up" campaign
- Dashboard refreshes showing new hot lead
- Success indicator

OVERLAY REQUIREMENT:
Include a subtle mermaid diagram in bottom-right corner (20% opacity) showing:
Email → Intent Extraction → Sentiment Analysis → Score Update → Categorization

STYLE:
- Professional, clean UI
- Modern design (Next.js/React aesthetic)
- Smooth animations
- High-fidelity screen recording quality
- Technical/educational content for developers

This is a technical demonstration showing autonomous AI marketing automation.`,
    duration: 8,
    aspectRatio: '16:9',
    resolution: '1080p'
  },
  {
    id: 'content-generator-demo',
    name: 'AI Content Generator: Personalized Email Creation',
    prompt: `Create a professional 8-second demonstration of AI content generation:

SECOND 1-2: Contact record displayed
- Name: "Sarah Chen"
- Company: "Acme Corp"
- Score: 75 (warm lead)
- History: 5 emails, 3 opens visible
- "Generate Content" button clicked

SECOND 3-5: Claude Opus 4 processing
- Loading animation: "Claude Opus 4 analyzing contact history..."
- Template visible with {firstName}, {company} tokens
- AI generation in progress indicator
- Professional, modern UI

SECOND 6-8: Personalized email generated
- Email preview appears:
  "Hi Sarah, based on Acme Corp's recent engagement..."
- {firstName} → Sarah (highlighted briefly)
- {company} → Acme Corp (highlighted briefly)
- CTA button visible and styled
- "Ready to send" indicator

OVERLAY REQUIREMENT:
Show JSON API request/response (25% opacity terminal window):
{
  "model": "claude-opus-4",
  "contact": {"firstName": "Sarah", "company": "Acme Corp"},
  "output": "personalized_email"
}

STYLE:
- Clean, professional interface
- Smooth transitions
- Show personalization clearly
- Technical demonstration quality

This demonstrates AI-powered personalized content generation.`,
    duration: 8,
    aspectRatio: '16:9',
    resolution: '1080p'
  },
  {
    id: 'orchestrator-demo',
    name: 'Campaign Orchestrator: Automated Drip Sequences',
    prompt: `Create a professional 8-second demo of automated campaign orchestration:

SECOND 1-2: Campaign dashboard view
- Multi-step campaign visible
- 5 steps with time delays shown
- Trigger condition: "Contact score > 60"
- Clean workflow visualization

SECOND 3-5: Automation in action
- Contact "Sarah Chen" (score: 75) enters campaign
- Trigger fires automatically
- Step 1 executes: "Welcome email" sent
- Wait condition shown: "2 days delay"
- Step 2 queued

SECOND 6-8: Conditional branching
- Email engagement tracked: "Opened = True"
- Conditional logic evaluates
- Orchestrator routes to "Engaged" path automatically
- Next step in sequence activated
- Workflow continues autonomously

OVERLAY REQUIREMENT:
Mermaid diagram overlay (20% opacity) showing:
Trigger → Step 1 → Wait → Condition → Branch A/B

STYLE:
- Professional workflow UI
- Clear automation indicators
- Smooth state transitions
- Technical demonstration quality

This shows autonomous campaign management and conditional routing.`,
    duration: 8,
    aspectRatio: '16:9',
    resolution: '1080p'
  }
];

/**
 * Generate single video with VEO 3.1 Fast
 */
async function generateVideo(spec) {
  try {
    console.log(`🎬 Generating: ${spec.name}`);
    console.log(`   Duration: ${spec.duration}s`);
    console.log(`   Cost: $${(spec.duration * 0.40).toFixed(2)}`);
    console.log(`   Model: veo-3.1-fast-generate-preview\n`);

    // Note: VEO video generation via Gemini API
    // Based on: https://ai.google.dev/gemini-api/docs/video

    // Check if model is available
    try {
      const model = genAI.getGenerativeModel({
        model: 'veo-3.1-fast-generate-preview'
      });

      console.log('   ⏳ Calling VEO 3.1 Fast API...');
      console.log('   (This may take 2-5 minutes per video)\n');

      // Generate video
      const result = await model.generateContent({
        contents: [{
          parts: [{
            text: spec.prompt
          }]
        }],
        generationConfig: {
          // VEO 3.1 configuration (if supported)
          temperature: 0.8,
          // Note: duration, aspectRatio, resolution may need different API structure
        }
      });

      const response = result.response;

      // Check if video data is present
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const videoPart = candidate.content.parts.find(part => part.videoData);

        if (videoPart && videoPart.videoData) {
          console.log('   ✅ Video generated successfully!');

          // Save video data (base64 encoded)
          const videoData = videoPart.videoData.data;
          const mimeType = videoPart.videoData.mimeType || 'video/mp4';

          const filename = `${spec.id}.mp4`;
          const filepath = join(outputDir, filename);

          // Decode and save
          const buffer = Buffer.from(videoData, 'base64');
          writeFileSync(filepath, buffer);

          console.log(`   💾 Saved: ${filepath}`);
          console.log(`   📊 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`);

          return {
            success: true,
            id: spec.id,
            filename,
            filepath,
            size: buffer.length,
            cost: spec.duration * 0.40
          };
        }
      }

      // If no video data, the API might not support VEO yet or needs different structure
      console.log('   ⚠️  No video data in response');
      console.log('   ℹ️  VEO 3.1 may require Vertex AI or Google AI Studio access');
      console.log('   ℹ️  Metadata created, actual generation pending API access\n');

      return {
        success: false,
        id: spec.id,
        reason: 'VEO API not accessible via standard Gemini API',
        note: 'Use Google AI Studio (aistudio.google.com/models/veo-3) for manual generation'
      };

    } catch (modelError) {
      console.log(`   ℹ️  VEO 3.1 Fast model not directly accessible`);
      console.log(`   Error: ${modelError.message}`);
      console.log(`   ℹ️  This is expected - VEO may require Vertex AI setup\n`);

      return {
        success: false,
        id: spec.id,
        reason: 'Model not accessible',
        error: modelError.message
      };
    }

  } catch (err) {
    console.error(`   ❌ Failed to generate ${spec.id}:`, err.message);
    return {
      success: false,
      id: spec.id,
      error: err.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting video generation...\n');
    console.log('═'.repeat(70));

    const results = [];

    for (const spec of videoSpecs) {
      const result = await generateVideo(spec);
      results.push(result);

      // Brief pause between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('═'.repeat(70));
    console.log('\n📊 Generation Summary:\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${videoSpecs.length}`);
    console.log(`❌ Failed: ${failed.length}/${videoSpecs.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Generated Videos:');
      successful.forEach(r => {
        console.log(`   - ${r.filename} (${(r.size / 1024 / 1024).toFixed(2)} MB, $${r.cost.toFixed(2)})`);
      });
      console.log(`\n💰 Total Cost: $${successful.reduce((sum, r) => sum + r.cost, 0).toFixed(2)}`);
    }

    if (failed.length > 0) {
      console.log('\n⚠️  Not Generated (API Access Required):');
      failed.forEach(r => {
        console.log(`   - ${r.id}: ${r.reason || r.error}`);
      });
      console.log('\n📝 Alternative: Use Google AI Studio');
      console.log('   1. Visit: https://aistudio.google.com/models/veo-3');
      console.log('   2. Copy prompts from video-metadata.json');
      console.log('   3. Generate manually (same cost: $0.40/second)');
      console.log('   4. Download and place in public/videos/');
    }

    // Save results
    const resultsPath = join(outputDir, 'generation-results.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n💾 Results saved: ${resultsPath}`);

  } catch (err) {
    console.error('❌ Video generation failed:', err);
    process.exit(1);
  }
}

main();
