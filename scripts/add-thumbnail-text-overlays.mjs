#!/usr/bin/env node

/**
 * VIDEO THUMBNAIL TEXT OVERLAY SCRIPT
 * Adds professional text overlays to base thumbnail images
 *
 * Uses Canvas API to overlay text on generated thumbnails
 * YouTube standard: 1280x720, <200KB file size
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'thumbnails');
const OUTPUT_DIR = INPUT_DIR; // Same directory, different filename

// YouTube thumbnail specs
const THUMBNAIL_WIDTH = 1280;
const THUMBNAIL_HEIGHT = 720;

// Text overlay configurations for each video
const THUMBNAIL_TEXT_CONFIGS = [
  {
    id: 'video-scattered-leads',
    topText: 'Your Best Leads Are Hiding',
    bottomText: 'In 5 Different Places',
    topColor: '#FFFFFF',
    bottomColor: '#FFD700', // Gold for emphasis
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for readability
  },
  {
    id: 'video-5-minute-rule',
    topText: 'The 5-Minute Rule',
    bottomText: 'Nobody Talks About',
    topColor: '#FF6B6B', // Red for urgency
    bottomColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  {
    id: 'video-lead-scoring',
    topText: '40+ Hours Wasted',
    bottomText: 'On Cold Leads',
    topColor: '#FFD700', // Gold for shocking stat
    bottomColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  {
    id: 'video-realtime-data',
    topText: 'The 48-Hour',
    bottomText: 'Information Problem',
    topColor: '#FFFFFF',
    bottomColor: '#4ECDC4', // Teal for data/tech
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  {
    id: 'video-approval-bottleneck',
    topText: 'Approval Processes',
    bottomText: 'Kill Your Best Ideas',
    topColor: '#FF6B6B', // Red for frustration
    bottomColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  {
    id: 'video-setup-tax',
    topText: 'The Setup Tax',
    bottomText: 'Killing Your Growth',
    topColor: '#FFD700', // Gold for economic impact
    bottomColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
];

// Synthex branding config
const BRANDING = {
  text: 'SYNTHEX',
  color: '#FFFFFF',
  position: 'bottom-right', // or 'bottom-center'
  fontSize: 32,
};

/**
 * Add text overlay to thumbnail
 */
async function addTextOverlay(config) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`Processing: ${config.id}`);
  console.log(`  Top text:    "${config.topText}"`);
  console.log(`  Bottom text: "${config.bottomText}"`);
  console.log(`${'═'.repeat(80)}`);

  try {
    // Find base image (try both .png and .jpg)
    const basePngPath = path.join(INPUT_DIR, `${config.id}-base.png`);
    const baseJpgPath = path.join(INPUT_DIR, `${config.id}-base.jpg`);

    let baseImagePath;
    if (fs.existsSync(basePngPath)) {
      baseImagePath = basePngPath;
    } else if (fs.existsSync(baseJpgPath)) {
      baseImagePath = baseJpgPath;
    } else {
      console.log(`❌ Base image not found: ${config.id}-base.{png|jpg}`);
      return { success: false, id: config.id, error: 'Base image not found' };
    }

    console.log(`✓ Found base image: ${path.basename(baseImagePath)}`);

    // Load base image
    const image = await loadImage(baseImagePath);

    // Create canvas
    const canvas = createCanvas(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw base image
    ctx.drawImage(image, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

    // Add semi-transparent overlays for text readability
    // Top text background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, THUMBNAIL_WIDTH, 180); // Top third

    // Bottom text background
    ctx.fillRect(0, THUMBNAIL_HEIGHT - 180, THUMBNAIL_WIDTH, 180); // Bottom third

    // Configure text styling
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add top text
    ctx.font = 'bold 72px Arial'; // Bold, large, readable
    ctx.fillStyle = config.topColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    // Add text stroke (outline) for better readability
    ctx.strokeText(config.topText, THUMBNAIL_WIDTH / 2, 90);
    ctx.fillText(config.topText, THUMBNAIL_WIDTH / 2, 90);

    // Add bottom text
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = config.bottomColor;
    ctx.strokeText(config.bottomText, THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT - 90);
    ctx.fillText(config.bottomText, THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT - 90);

    // Add Synthex branding
    ctx.font = `bold ${BRANDING.fontSize}px Arial`;
    ctx.fillStyle = BRANDING.color;
    ctx.textAlign = 'right';

    if (BRANDING.position === 'bottom-right') {
      ctx.fillText(BRANDING.text, THUMBNAIL_WIDTH - 40, THUMBNAIL_HEIGHT - 30);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(BRANDING.text, THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT - 30);
    }

    // Save final thumbnail as JPEG (better compression for YouTube)
    const outputPath = path.join(OUTPUT_DIR, `${config.id}.jpg`);
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);

    const fileSizeKB = (buffer.length / 1024).toFixed(1);
    const withinYouTubeLimit = buffer.length < 200 * 1024;

    console.log(`✅ SUCCESS: Thumbnail with text overlay saved`);
    console.log(`   Path: ${outputPath}`);
    console.log(`   Size: ${fileSizeKB} KB ${withinYouTubeLimit ? '✓' : '⚠️ (over 200KB limit)'}`);
    console.log(`   Resolution: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`);

    return {
      success: true,
      id: config.id,
      path: outputPath,
      sizeKB: parseFloat(fileSizeKB),
      withinLimit: withinYouTubeLimit,
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return {
      success: false,
      id: config.id,
      error: error.message,
    };
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         VIDEO THUMBNAIL TEXT OVERLAY GENERATOR                             ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  INPUT:  Base thumbnails (*-base.png or *-base.jpg)                       ║');
  console.log('║  OUTPUT: Final thumbnails (*.jpg) with text overlays                      ║');
  console.log('║  FORMAT: 1280x720 JPEG, <200KB for YouTube                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\nProcessing ${THUMBNAIL_TEXT_CONFIGS.length} thumbnails...\n`);

  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ ERROR: Input directory not found: ${INPUT_DIR}`);
    console.error('   Run generate-veo-thumbnails.mjs first to create base images.');
    process.exit(1);
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;
  let oversizedCount = 0;

  for (const config of THUMBNAIL_TEXT_CONFIGS) {
    const result = await addTextOverlay(config);
    results.push(result);

    if (result.success) {
      successCount++;
      if (!result.withinLimit) {
        oversizedCount++;
      }
    } else {
      failCount++;
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEXT OVERLAY COMPLETE                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\nResults:`);
  console.log(`  ✅ Success:     ${successCount}/${THUMBNAIL_TEXT_CONFIGS.length}`);
  console.log(`  ❌ Failed:      ${failCount}/${THUMBNAIL_TEXT_CONFIGS.length}`);
  console.log(`  ⚠️  Oversized:  ${oversizedCount}/${successCount} (>200KB YouTube limit)`);

  if (successCount > 0) {
    console.log(`\n✅ Final thumbnails saved to: ${OUTPUT_DIR}`);
    console.log(`\nThumbnail details:`);
    results
      .filter(r => r.success)
      .forEach(r => {
        const sizeWarning = !r.withinLimit ? ' ⚠️ OVERSIZED' : '';
        console.log(`  ✓ ${r.id}`);
        console.log(`    Path: ${r.path}`);
        console.log(`    Size: ${r.sizeKB} KB${sizeWarning}`);
      });
  }

  if (failCount > 0) {
    console.log(`\n❌ Failed thumbnails:`);
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ✗ ${r.id}`);
        console.log(`    Error: ${r.error}`);
      });
  }

  if (oversizedCount > 0) {
    console.log('\n⚠️  WARNING: Some thumbnails exceed YouTube\'s 200KB limit.');
    console.log('   Consider:');
    console.log('   1. Reducing JPEG quality (currently 0.95)');
    console.log('   2. Optimizing base images before text overlay');
    console.log('   3. Using tools like ImageOptim or TinyPNG');
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('1. Visually review all thumbnails:');
  console.log(`   open ${OUTPUT_DIR}`);
  console.log('2. Test thumbnail readability at YouTube sizes (preview in browser)');
  console.log('3. Upload to YouTube Studio for each video');
  console.log('4. A/B test different thumbnail variants');
  console.log('5. Track click-through rates and optimize');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('\nText overlay complete! 🎨');
}

main().catch(console.error);
