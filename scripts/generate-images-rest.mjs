#!/usr/bin/env node

/**
 * UNITE-HUB BRANDED IMAGE GENERATION (REST API Version)
 *
 * Uses Gemini's REST API for image generation
 * EXECUTION: node scripts/generate-images-rest.mjs
 * OUTPUT: public/images/generated/ (PNG format)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'public', 'images', 'generated');
const logFile = path.join(outputDir, '_generation-log.json');

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY or GOOGLE_AI_API_KEY not found');
  process.exit(1);
}

// Brand Guidelines
const BRAND = {
  primary: '#14B8A6',
  secondary: '#6B7280',
  accent: '#FB923C',
  style: 'modern, professional, clean, minimalist',
};

// IMAGE SPECIFICATIONS
const imageSpecs = {
  'hero-dashboard': {
    category: 'homepage',
    prompt: `Modern CRM dashboard showing real-time contact management. Features a clean, minimalist design with teal (${BRAND.primary}) accent colors. Shows warm engagement metrics, smart contact cards with AI scoring badges. Style: professional enterprise software interface. ${BRAND.style}`,
    width: 1200,
    height: 600,
  },
  'hero-automation': {
    category: 'homepage',
    prompt: `AI automation workflow visualization showing email → contact intelligence → lead scoring pipeline. Modern minimalist design with teal connections and nodes. Shows data flowing through intelligent systems. ${BRAND.style}`,
    width: 1200,
    height: 600,
  },
  'hero-growth': {
    category: 'homepage',
    prompt: `Growth metrics visualization for CRM platform. Shows upward trending charts, conversion funnels, and engagement metrics in teal and orange. Clean, modern dashboard design. ${BRAND.style}`,
    width: 1200,
    height: 600,
  },
  'hero-team': {
    category: 'homepage',
    prompt: `Modern diverse team collaborating in a bright, minimalist office with soft natural lighting. People working on laptops showing CRM interface. Warm, welcoming atmosphere. ${BRAND.style}`,
    width: 1200,
    height: 600,
  },
  'hero-ai': {
    category: 'homepage',
    prompt: `Abstract visualization of AI and automation technology: neural networks, data flow, machine learning patterns in teal and warm gray. Futuristic yet professional. ${BRAND.style}`,
    width: 1200,
    height: 600,
  },
  'feature-email': {
    category: 'features',
    prompt: `Gmail envelope opening with data flowing out, connecting to contact profiles with AI analysis. Clean minimalist design with teal highlighting. Shows intelligent email parsing and contact enrichment. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
  'feature-scoring': {
    category: 'features',
    prompt: `Lead scoring interface with AI algorithm visualization. Numeric scores (0-100) displayed with teal progress bars. Shows warm/hot/cold lead categorization. Clean dashboard style. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
  'feature-campaigns': {
    category: 'features',
    prompt: `Visual drip campaign builder with conditional branching flowchart. Email steps, wait nodes, and conditions shown in minimalist teal theme. Modern drag-and-drop interface feel. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
  'feature-alerts': {
    category: 'features',
    prompt: `Real-time notification dashboard with alert badges, websocket connections, and live metrics streaming. Teal and orange accent colors. Modern notification center design. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
  'feature-analytics': {
    category: 'features',
    prompt: `Advanced analytics dashboard showing patterns, trends, and predictive insights. Multiple charts, heatmaps, and trend lines in teal palette. Professional data visualization. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
  'feature-seo': {
    category: 'features',
    prompt: `SEO enhancement toolkit interface with audit reports, keyword research, competitor analysis, and schema markup generation displayed in clean dashboard format. Teal and orange accents. ${BRAND.style}`,
    width: 800,
    height: 600,
  },
};

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created output directory`);
  }
}

function loadOrCreateLog() {
  if (fs.existsSync(logFile)) {
    try {
      return JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    } catch {
      return {
        images: [],
        summary: { total: 0, success: 0, failed: 0, skipped: 0 },
        startTime: new Date(),
      };
    }
  }
  return {
    images: [],
    summary: { total: 0, success: 0, failed: 0, skipped: 0 },
    startTime: new Date(),
  };
}

function saveLog(log) {
  log.lastUpdated = new Date();
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

function getImagePath(id) {
  return path.join(outputDir, `${id}.png`);
}

function isImageGenerated(id) {
  return fs.existsSync(getImagePath(id));
}

async function generateImage(id, spec) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a professional marketing image with these specifications:
- Resolution: ${spec.width}x${spec.height} pixels
- Prompt: ${spec.prompt}
- Brand Colors: Teal (#14B8A6), Gray (#6B7280), Orange (#FB923C)

Create high-quality professional imagery suitable for a CRM/marketing automation platform.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Check if response contains image data
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No image data in response');
    }

    return data;
  } catch (error) {
    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      throw new Error('SAFETY_FILTER');
    }
    throw error;
  }
}

async function processImage(id, spec, log) {
  if (isImageGenerated(id)) {
    log.summary.skipped++;
    console.log(`  ⊘ ${id} (already exists)`);
    return { status: 'skipped', id };
  }

  try {
    console.log(`  ⟳ ${id}...`);
    const imageData = await generateImage(id, spec);

    console.log(`  ✓ ${id}`);

    log.images.push({
      id,
      category: spec.category,
      generated: new Date(),
      dimensions: `${spec.width}x${spec.height}`,
      status: 'success',
    });

    log.summary.success++;
    return { status: 'success', id };
  } catch (error) {
    const errorType = error.message === 'SAFETY_FILTER' ? 'SAFETY' : 'API_ERROR';
    console.log(`  ✗ ${id} (${errorType})`);

    log.images.push({
      id,
      category: spec.category,
      attempted: new Date(),
      error: error.message,
      status: 'failed',
    });

    log.summary.failed++;
    return { status: 'failed', id, error: error.message };
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   UNITE-HUB IMAGE GENERATION (REST API)           ║');
  console.log('║   Autonomous Batch Processing                     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  ensureOutputDir();
  const log = loadOrCreateLog();

  const totalImages = Object.keys(imageSpecs).length;
  log.summary.total = totalImages;

  console.log(`📊 Target: ${totalImages} images`);
  console.log(`📂 Output: ${outputDir}`);
  console.log(`📝 Log: ${logFile}\n`);

  const byCategory = {};
  Object.entries(imageSpecs).forEach(([id, spec]) => {
    if (!byCategory[spec.category]) byCategory[spec.category] = [];
    byCategory[spec.category].push({ id, spec });
  });

  let processed = 0;
  for (const [category, images] of Object.entries(byCategory)) {
    console.log(`\n[${category.toUpperCase()}] ${images.length} images`);
    console.log('─'.repeat(50));

    for (const { id, spec } of images) {
      await processImage(id, spec, log);
      processed++;

      if (processed < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    saveLog(log);
  }

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              GENERATION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`✓ Success:  ${log.summary.success}/${totalImages}`);
  console.log(`✗ Failed:   ${log.summary.failed}/${totalImages}`);
  console.log(`⊘ Skipped:  ${log.summary.skipped}/${totalImages}\n`);

  if (log.summary.failed > 0) {
    const failed = log.images.filter(img => img.status === 'failed');
    console.log('Failed images:');
    failed.forEach(img => console.log(`  - ${img.id}: ${img.error}`));
  }

  saveLog(log);
}

process.on('unhandledRejection', reason => {
  console.error('\n❌ FATAL ERROR:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
