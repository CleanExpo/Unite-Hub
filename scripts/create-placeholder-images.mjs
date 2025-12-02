#!/usr/bin/env node

/**
 * CREATE PLACEHOLDER IMAGES FOR MVP
 *
 * Generates colored placeholder images to demonstrate the image system
 * These can be replaced with real generated images later
 * EXECUTION: node scripts/create-placeholder-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'public', 'images', 'generated');

// Color palette
const colors = {
  homepage: '#14B8A6',    // Teal
  features: '#0284C7',    // Blue
  industries: '#059669',  // Green
  dashboard: '#7C3AED',   // Purple
  about: '#DC2626',       // Red
  contact: '#EA580C',     // Orange
  blog: '#2563EB',        // Light Blue
  integrations: '#1E40AF', // Dark Blue
  conversion: '#06B6D4',  // Cyan
};

// Image specifications
const imageSpecs = [
  // Homepage (5)
  { id: 'hero-dashboard', category: 'homepage', width: 1200, height: 600 },
  { id: 'hero-automation', category: 'homepage', width: 1200, height: 600 },
  { id: 'hero-growth', category: 'homepage', width: 1200, height: 600 },
  { id: 'hero-team', category: 'homepage', width: 1200, height: 600 },
  { id: 'hero-ai', category: 'homepage', width: 1200, height: 600 },

  // Features (6)
  { id: 'feature-email', category: 'features', width: 800, height: 600 },
  { id: 'feature-scoring', category: 'features', width: 800, height: 600 },
  { id: 'feature-campaigns', category: 'features', width: 800, height: 600 },
  { id: 'feature-alerts', category: 'features', width: 800, height: 600 },
  { id: 'feature-analytics', category: 'features', width: 800, height: 600 },
  { id: 'feature-seo', category: 'features', width: 800, height: 600 },

  // Industries (6)
  { id: 'industry-saas', category: 'industries', width: 1000, height: 600 },
  { id: 'industry-ecommerce', category: 'industries', width: 1000, height: 600 },
  { id: 'industry-services', category: 'industries', width: 1000, height: 600 },
  { id: 'industry-agencies', category: 'industries', width: 1000, height: 600 },
  { id: 'industry-realestate', category: 'industries', width: 1000, height: 600 },
  { id: 'industry-healthcare', category: 'industries', width: 1000, height: 600 },

  // Dashboard (6)
  { id: 'empty-contacts', category: 'dashboard', width: 600, height: 400 },
  { id: 'empty-campaigns', category: 'dashboard', width: 600, height: 400 },
  { id: 'celebrate-success', category: 'dashboard', width: 600, height: 400 },
  { id: 'loading-state', category: 'dashboard', width: 600, height: 400 },
  { id: 'error-state', category: 'dashboard', width: 600, height: 400 },
  { id: 'onboarding-welcome', category: 'dashboard', width: 600, height: 400 },

  // About (3)
  { id: 'about-mission', category: 'about', width: 800, height: 600 },
  { id: 'about-team', category: 'about', width: 800, height: 600 },
  { id: 'about-values', category: 'about', width: 800, height: 600 },

  // Contact (2)
  { id: 'contact-hero', category: 'contact', width: 1000, height: 600 },
  { id: 'support-team', category: 'contact', width: 800, height: 600 },

  // Blog (3)
  { id: 'blog-hero', category: 'blog', width: 1200, height: 600 },
  { id: 'learning-journey', category: 'blog', width: 800, height: 400 },
  { id: 'case-study', category: 'blog', width: 800, height: 400 },

  // Integrations (3)
  { id: 'integration-workflow', category: 'integrations', width: 1000, height: 600 },
  { id: 'integration-api', category: 'integrations', width: 800, height: 600 },
  { id: 'automation-workflow', category: 'integrations', width: 800, height: 600 },

  // Conversion (1)
  { id: 'conversion-funnel', category: 'conversion', width: 800, height: 600 },
];

function createPlaceholderSVG(width, height, category, id) {
  const color = colors[category] || '#14B8A6';
  const bgColor = color + '20'; // Add transparency

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/6}" fill="${color}" opacity="0.2"/>
  <text x="50%" y="50%" font-size="32" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${color}">
    ${id}
  </text>
  <text x="50%" y="65%" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="${color}" opacity="0.7">
    ${width}×${height}
  </text>
</svg>`;
}

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function createPlaceholders() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   PLACEHOLDER IMAGE GENERATION FOR MVP              ║');
  console.log('║   35 SVG Placeholders | 9 Categories               ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  ensureOutputDir();

  const log = {
    images: [],
    summary: { total: imageSpecs.length, created: 0, skipped: 0 },
    startTime: new Date(),
    note: 'These are placeholder SVG images. Replace with real generated images from Gemini API or another service.',
  };

  let categoryCount = 0;
  const categories = {};

  // Group by category
  imageSpecs.forEach(spec => {
    if (!categories[spec.category]) {
      categories[spec.category] = [];
    }
    categories[spec.category].push(spec);
  });

  // Create placeholders
  for (const [category, images] of Object.entries(categories)) {
    categoryCount++;
    console.log(`[${categoryCount}/${Object.keys(categories).length}] ${category.toUpperCase()} (${images.length} images)`);
    console.log('─'.repeat(50));

    for (const spec of images) {
      const filePath = path.join(outputDir, `${spec.id}.svg`);

      if (fs.existsSync(filePath)) {
        console.log(`  ⊘ ${spec.id} (already exists)`);
        log.summary.skipped++;
        log.images.push({
          id: spec.id,
          category: spec.category,
          status: 'skipped',
          type: 'svg_placeholder',
        });
      } else {
        const svg = createPlaceholderSVG(spec.width, spec.height, spec.category, spec.id);
        fs.writeFileSync(filePath, svg);
        console.log(`  ✓ ${spec.id} (${spec.width}×${spec.height})`);
        log.summary.created++;
        log.images.push({
          id: spec.id,
          category: spec.category,
          created: new Date(),
          dimensions: `${spec.width}×${spec.height}`,
          status: 'created',
          type: 'svg_placeholder',
          note: 'Replace with real image from Gemini API',
        });
      }
    }

    console.log();
  }

  // Save log
  log.lastUpdated = new Date();
  const logPath = path.join(outputDir, '_placeholder-log.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  // Summary
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              PLACEHOLDERS CREATED                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`✓ Created:  ${log.summary.created}/${log.summary.total}`);
  console.log(`⊘ Skipped:  ${log.summary.skipped}/${log.summary.total}\n`);

  console.log(`📂 Output: ${outputDir}`);
  console.log(`📝 Log: ${logPath}\n`);

  console.log('📋 NEXT STEPS:');
  console.log('1. Test placeholder images are displaying correctly on Vercel');
  console.log('2. Integrate with real image generation service (Gemini API, Midjourney, etc.)');
  console.log('3. Replace SVG placeholders with generated images');
  console.log('4. Update IMAGE_GENERATION_GUIDE.md with actual API integration details\n');

  console.log('🎯 MVP CHECKLIST:');
  console.log('  ✓ Image system structure working');
  console.log('  ✓ Placeholder images created (35 total)');
  console.log('  ✓ Ready for integration with real images\n');
}

createPlaceholders();
