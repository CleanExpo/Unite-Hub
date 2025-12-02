#!/usr/bin/env node

/**
 * VEO VIDEO THUMBNAIL GENERATION
 * Using the 5 Whys Marketing Theory
 *
 * CRITICAL: YouTube standard 1280x720 resolution
 * Following human-centered design principles
 * NO robots, NO cold tech imagery
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'thumbnails');

// YouTube standard thumbnail resolution
const THUMBNAIL_RESOLUTION = '1280x720';

// CRITICAL: No text will be added in prompts - we'll overlay text programmatically
const HUMAN_STORY_MANDATE = `
CRITICAL REQUIREMENTS:
- 1280x720 resolution (YouTube standard)
- HUMAN-CENTERED imagery - real people, real emotions
- NO robots, NO cold tech imagery, NO sci-fi elements
- NO TEXT IN THE IMAGE (text will be overlaid later)
- Warm, genuine, relatable imagery
- Australian/global business context
- Leave space for text overlay (top third and/or bottom third)
- Eye-catching, high-energy compositions
`;

// ============================================================================
// VIDEO THUMBNAIL SPECIFICATIONS - 6 VEO Videos
// ============================================================================

const VIDEO_THUMBNAILS = [
  {
    id: 'video-scattered-leads',
    title: 'Your Best Leads Are Hiding in 5 Different Places',
    fiveWhys: {
      why1_image: 'Show the overwhelming chaos of scattered lead management',
      why2_style: 'Photorealistic split-screen - visual chaos that business owners recognize',
      why3_situation: 'Overwhelmed business owner surrounded by multiple devices/tools',
      why4_person: 'Business owner who has felt this exact frustration',
      why5_feeling: 'Chaos and overwhelm - "This is exactly my problem"',
    },
    textOverlay: {
      top: 'Your Best Leads Are Hiding',
      bottom: 'In 5 Different Places',
      style: 'Bold, urgent, attention-grabbing',
    },
    prompt: `Photorealistic wide-angle image of a stressed business owner at their desk,
surrounded by chaos: multiple laptop screens, phone notifications visible, sticky notes
everywhere, scattered papers, coffee cup. The person (Australian business owner, 35-50,
diverse) has their hands on their head in frustration. The scene is lit dramatically with
natural light from window on left, creating depth. The composition shows the multi-screen
chaos clearly. Their expression conveys "I can't keep track of everything." Behind them,
a cluttered home office with too many tools open. The feeling is immediate recognition:
"That's me!" Leave the top third of the image slightly blurred/darker for text overlay.
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'video-5-minute-rule',
    title: 'The 5-Minute Conversion Rule Nobody Talks About',
    fiveWhys: {
      why1_image: 'Show the urgency and time-pressure of lead response',
      why2_style: 'Dynamic photorealistic - race against time',
      why3_situation: 'Business owner racing to respond before competitor does',
      why4_person: 'Sales professional who understands speed-to-lead',
      why5_feeling: 'Urgency and competitive pressure - "I need to be faster"',
    },
    textOverlay: {
      top: 'The 5-Minute Rule',
      bottom: 'Nobody Talks About',
      style: 'Bold with clock/urgency visual',
    },
    prompt: `Dramatic photorealistic image of a business professional (diverse, 30-45)
looking intensely at their phone/laptop with focused determination. They're in a modern
office or cafe, leaning forward urgently. In the background (blurred), we see a clock or
watch visible, suggesting time pressure. Their expression shows "I need to act NOW."
Natural lighting with strong shadows suggesting afternoon/golden hour. The composition
is dynamic - person positioned on right third, looking left toward the action space.
Professional but relatable attire. Australian business setting. The feeling is competitive
urgency: "Every minute counts." Leave top and bottom thirds suitable for bold text overlay.
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'video-lead-scoring',
    title: 'Why Your Salesperson Is Wasting 40+ Hours on Cold Leads',
    fiveWhys: {
      why1_image: 'Show the frustration of wasted effort on wrong prospects',
      why2_style: 'Photorealistic contrast - busy work vs. smart work',
      why3_situation: 'Salesperson buried in calls/emails that go nowhere',
      why4_person: 'Sales professional exhausted from unqualified leads',
      why5_feeling: 'Frustration and exhaustion - "There has to be a better way"',
    },
    textOverlay: {
      top: '40+ Hours Wasted',
      bottom: 'On Cold Leads',
      style: 'Bold, shocking statistic emphasis',
    },
    prompt: `Photorealistic image of an exhausted salesperson (diverse, 30-50) at their
desk surrounded by phone, computer, notebooks, all showing signs of heavy use. Their
expression shows tired frustration - head leaning on hand, looking at a long list of
contacts/calls. Multiple coffee cups visible (suggesting long hours). The lighting is
overhead fluorescent mixed with screen glow - slightly harsh, showing the grind.
Australian office setting. Papers are scattered showing unsuccessful follow-ups. The
composition centers the person with their workload visible around them. The feeling is:
"I'm working so hard but getting nowhere." Space at top and bottom for text overlay.
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'video-realtime-data',
    title: 'The 48-Hour Information Problem',
    fiveWhys: {
      why1_image: 'Show the blind spot of outdated data',
      why2_style: 'Photorealistic with visual contrast - old vs. new',
      why3_situation: 'Manager looking at outdated dashboard while reality differs',
      why4_person: 'Marketing manager who has made decisions on bad data',
      why5_feeling: 'Uncertainty and lack of control - "Am I looking at the truth?"',
    },
    textOverlay: {
      top: 'The 48-Hour',
      bottom: 'Information Problem',
      style: 'Bold, questioning tone',
    },
    prompt: `Photorealistic image of a marketing manager (diverse, 35-50) looking at a
laptop screen with visible concern/confusion. Their finger points at something on screen
(dashboard visible but not readable - just abstract data visualizations). Their expression
shows uncertainty: "Is this data current?" Behind them, through an office window, we see
it's a different time of day than what their dashboard shows (suggesting delay). Natural
office lighting. Australian corporate setting. The composition shows person on right third,
screen visible to viewer on left. Professional attire. The feeling is decision-paralysis:
"Can I trust this?" Leave top third and bottom third clear for text overlay.
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'video-approval-bottleneck',
    title: 'Why Approval Processes Kill Your Best Ideas',
    fiveWhys: {
      why1_image: 'Show the frustration of workflow bottlenecks',
      why2_style: 'Photorealistic - visible waiting/friction',
      why3_situation: 'Creative waiting endlessly for approvals',
      why4_person: 'Creative professional whose momentum is killed by process',
      why5_feeling: 'Frustration and momentum loss - "By the time this is approved..."',
    },
    textOverlay: {
      top: 'Approval Processes',
      bottom: 'Kill Your Best Ideas',
      style: 'Bold, frustrated energy',
    },
    prompt: `Photorealistic image of a creative professional (diverse, 28-45) sitting in
a modern office/home workspace, looking at their phone/email with visible frustration.
Behind them, a whiteboard or monitor shows a creative campaign that's clearly ready but
stuck. Their expression shows impatience and creative energy being wasted. Multiple
devices visible suggesting they're waiting for responses across platforms. Australian
workspace aesthetic - plants, natural light, good coffee. The composition shows the person
slightly off-center, with their creative work visible behind them. Afternoon lighting
creates warm but slightly tense atmosphere. The feeling is: "This should've launched
yesterday." Space at top and bottom for bold text.
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'video-setup-tax',
    title: 'The Setup Tax That\'s Killing Your Growth',
    fiveWhys: {
      why1_image: 'Show the overwhelm of complex setup processes',
      why2_style: 'Photorealistic - visible complexity and cost',
      why3_situation: 'Founder overwhelmed by technical setup requirements',
      why4_person: 'Business owner who wants to act now, not wait weeks',
      why5_feeling: 'Overwhelm and opportunity cost - "I could be growing instead"',
    },
    textOverlay: {
      top: 'The Setup Tax',
      bottom: 'Killing Your Growth',
      style: 'Bold, economic impact emphasis',
    },
    prompt: `Photorealistic image of a business founder (diverse, 30-50) looking at a very
thick technical manual or long setup documentation on their laptop. Their expression shows
overwhelm and disbelief: "This is going to take forever." Behind them, a calendar visible
showing weeks of time. Coffee cup, notebook with question marks/confusion visible. The
setting is a startup office or home workspace. Australian aesthetic with warm wood tones
and natural light. The composition centers the founder with the overwhelming documentation
visible. Papers scattered showing complexity. The feeling is: "I don't have 6 weeks for
this." Leave top third and bottom third for dramatic text overlay.
${HUMAN_STORY_MANDATE}`
  },
];

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateThumbnail(thumbnailConfig, index, total) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`[${index + 1}/${total}] Generating: ${thumbnailConfig.id}`);
  console.log(`Title: ${thumbnailConfig.title}`);
  console.log(`\n5 WHYS ANALYSIS:`);
  console.log(`  1. WHY this image?    ${thumbnailConfig.fiveWhys.why1_image}`);
  console.log(`  2. WHY this style?    ${thumbnailConfig.fiveWhys.why2_style}`);
  console.log(`  3. WHY this situation? ${thumbnailConfig.fiveWhys.why3_situation}`);
  console.log(`  4. WHY this person?   ${thumbnailConfig.fiveWhys.why4_person}`);
  console.log(`  5. WHY this feeling?  ${thumbnailConfig.fiveWhys.why5_feeling}`);
  console.log(`\nText Overlay (to be added separately):`);
  console.log(`  Top:    ${thumbnailConfig.textOverlay.top}`);
  console.log(`  Bottom: ${thumbnailConfig.textOverlay.bottom}`);
  console.log(`${'═'.repeat(80)}`);

  try {
    const response = await genAI.models.generateContent({
      model: ALLOWED_IMAGE_MODEL,
      contents: [{ parts: [{ text: thumbnailConfig.prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const extension = mimeType.includes('jpeg') ? 'jpg' : 'png';

            // Save base image (no text)
            const baseOutputPath = path.join(OUTPUT_DIR, `${thumbnailConfig.id}-base.${extension}`);
            const imageBuffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync(baseOutputPath, imageBuffer);

            console.log(`\n✅ SUCCESS: Base thumbnail saved`);
            console.log(`   Path: ${baseOutputPath}`);
            console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
            console.log(`   Resolution: ${THUMBNAIL_RESOLUTION} (YouTube standard)`);
            console.log(`   Feeling achieved: "${thumbnailConfig.fiveWhys.why5_feeling}"`);
            console.log(`\n   ⚠️  NEXT: Add text overlay programmatically`);
            console.log(`   Top text:    "${thumbnailConfig.textOverlay.top}"`);
            console.log(`   Bottom text: "${thumbnailConfig.textOverlay.bottom}"`);

            return {
              success: true,
              path: baseOutputPath,
              config: thumbnailConfig,
            };
          }
        }
      }
    }

    console.log(`\n❌ FAILED: No image data in response`);
    return { success: false, config: thumbnailConfig };

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return { success: false, error: error.message, config: thumbnailConfig };
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           VEO VIDEO THUMBNAIL GENERATION                                   ║');
  console.log('║           5 WHYS MARKETING THEORY                                          ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  PURPOSE: Generate professional YouTube thumbnails for 6 VEO videos       ║');
  console.log('║  RESOLUTION: 1280x720 (YouTube standard)                                   ║');
  console.log('║  STYLE: Photorealistic, human-centered, emotion-driven                    ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  PHASE 1: Generate base images (no text)                                   ║');
  console.log('║  PHASE 2: Add text overlays programmatically (separate script)            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal thumbnails to generate: ${VIDEO_THUMBNAILS.length}`);

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('\n❌ ERROR: GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < VIDEO_THUMBNAILS.length; i++) {
    const result = await generateThumbnail(VIDEO_THUMBNAILS[i], i, VIDEO_THUMBNAILS.length);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting - be respectful to Gemini API
    if (i < VIDEO_THUMBNAILS.length - 1) {
      console.log('\n⏳ Waiting 3 seconds (rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                      GENERATION COMPLETE                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\nResults:`);
  console.log(`  ✅ Success: ${successCount}/${VIDEO_THUMBNAILS.length}`);
  console.log(`  ❌ Failed:  ${failCount}/${VIDEO_THUMBNAILS.length}`);

  if (successCount > 0) {
    console.log(`\n✅ Generated thumbnails saved to: ${OUTPUT_DIR}`);
    console.log(`\nSuccessful thumbnails:`);
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`  ✓ ${r.config.id}`);
        console.log(`    Title: ${r.config.title}`);
        console.log(`    Path: ${r.path}`);
      });
  }

  if (failCount > 0) {
    console.log(`\n❌ Failed thumbnails:`);
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ✗ ${r.config.id}`);
        console.log(`    Title: ${r.config.title}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('1. Review base thumbnails visually');
  console.log('2. Run text overlay script (to be created) to add:');
  console.log('   - Video titles (top and bottom)');
  console.log('   - Synthex branding');
  console.log('   - Call-to-action elements');
  console.log('3. Export final thumbnails as:');
  console.log('   - video-{id}.jpg (1280x720, <200KB for YouTube)');
  console.log('4. Upload to YouTube video settings');
  console.log('5. Test click-through rates and iterate');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('\nGeneration session complete! 🎬');
}

main().catch(console.error);
