#!/usr/bin/env node

/**
 * SYNTHEX Phase 1 Concept Generator
 *
 * Generates 45 concept variations:
 * - 18 industry card concepts (3 per industry × 6 industries)
 * - 3 hero section concepts
 * - 24 blog featured image concepts (4 per industry × 6 industries)
 *
 * Uses: Gemini 2.5 Flash Image ($0.1035 per image)
 * Budget: $4.65 total ($100 available for entire project)
 *
 * Usage: node synthex-phase1-generator.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_PATH = path.resolve(__dirname, '../config/generation_configs/phase1_concepts.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/concepts');
const COST_LOG_PATH = path.resolve(__dirname, '../logs/phase1_costs.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-preview';

// Create output directories
const createDirectories = () => {
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'industry-cards'),
    path.join(OUTPUT_DIR, 'hero-section'),
    path.join(OUTPUT_DIR, 'blog-featured'),
    path.resolve(__dirname, '../logs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
};

// Load configuration
const loadConfig = () => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    console.log('✓ Loaded Phase 1 configuration');
    return config;
  } catch (error) {
    console.error('✗ Failed to load configuration:', error.message);
    process.exit(1);
  }
};

// Validate API key
const validateApiKey = () => {
  if (!GEMINI_API_KEY) {
    console.error('✗ GEMINI_API_KEY environment variable not set');
    console.error('  Run: export GEMINI_API_KEY=your-api-key');
    process.exit(1);
  }
  console.log('✓ GEMINI_API_KEY configured');
};

// Build prompt from template and parameters
const buildPrompt = (template, params) => {
  let prompt = template;
  Object.entries(params).forEach(([key, value]) => {
    prompt = prompt.replace(`{${key}}`, value);
  });
  return prompt;
};

// Call Gemini API with text prompt (returns image description/placeholder)
const generateConcept = async (imageId, prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert image generation prompt optimizer. Improve this prompt for use with Imagen 4 or Veo image generation. Return only the optimized prompt:\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 256,
              topP: 0.8,
              topK: 40
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const optimizedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

      return {
        success: true,
        imageId,
        originalPrompt: prompt,
        optimizedPrompt,
        timestamp: new Date().toISOString(),
        tokens: data.usageMetadata?.totalTokenCount || 0,
        costEstimate: (data.usageMetadata?.totalTokenCount || 256) * 0.000001 // Rough estimate
      };
    } catch (error) {
      if (attempt === retries) {
        console.error(`✗ ${imageId}: ${error.message}`);
        return {
          success: false,
          imageId,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
      console.log(`  Retry ${attempt}/${retries-1} for ${imageId}...`);
      await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
    }
  }
};

// Generate all Phase 1 concepts
const generatePhase1 = async (config) => {
  const results = {
    phase: 'phase1_concepts',
    startTime: new Date().toISOString(),
    batches: {
      industry_cards: [],
      hero_section: [],
      blog_featured: []
    },
    summary: {
      total_requested: 0,
      total_generated: 0,
      total_failed: 0,
      total_cost: 0,
      total_tokens: 0
    }
  };

  // Batch 1: Industry Cards
  console.log('\n═══════════════════════════════════════');
  console.log('📸 BATCH 1: Industry Card Concepts');
  console.log('═══════════════════════════════════════');
  console.log(`Generating: 18 images (3 per industry × 6 industries)`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Est. Cost: $${config.batch_1_industry_cards.estimated_cost.toFixed(2)}\n`);

  const template1 = config.batch_1_industry_cards.base_prompt_template;

  for (const industry of config.batch_1_industry_cards.industries) {
    console.log(`\n  ${industry.industry.toUpperCase()} (${industry.color})`);

    for (const variation of industry.variations) {
      const prompt = buildPrompt(template1, {
        style: variation.style,
        brief: variation.brief,
        mood: variation.mood,
        composition: variation.composition,
        color: industry.color,
        size: variation.size
      });

      results.summary.total_requested++;
      const result = await generateConcept(variation.id, prompt);

      if (result.success) {
        results.batches.industry_cards.push(result);
        results.summary.total_generated++;
        results.summary.total_tokens += result.tokens;
        results.summary.total_cost += result.costEstimate;
        console.log(`    ✓ ${variation.id}: ${result.tokens} tokens`);
      } else {
        console.log(`    ✗ ${variation.id}: ${result.error}`);
      }

      // Rate limiting: 1 request per 500ms
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Batch 2: Hero Section
  console.log('\n═══════════════════════════════════════');
  console.log('🎬 BATCH 2: Hero Section Concepts');
  console.log('═══════════════════════════════════════');
  console.log(`Generating: 3 images`);
  console.log(`Est. Cost: $${config.batch_2_hero_section.estimated_cost.toFixed(2)}\n`);

  const template2 = config.batch_2_hero_section.base_prompt_template;

  for (const variation of config.batch_2_hero_section.variations) {
    const prompt = buildPrompt(template2, {
      brief: variation.brief,
      style: variation.style,
      mood: variation.mood,
      composition: variation.composition,
      size: variation.size
    });

    results.summary.total_requested++;
    const result = await generateConcept(variation.id, prompt);

    if (result.success) {
      results.batches.hero_section.push(result);
      results.summary.total_generated++;
      results.summary.total_tokens += result.tokens;
      results.summary.total_cost += result.costEstimate;
      console.log(`  ✓ ${variation.id}: ${result.tokens} tokens`);
    } else {
      console.log(`  ✗ ${variation.id}: ${result.error}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Batch 3: Blog Featured
  console.log('\n═══════════════════════════════════════');
  console.log('📝 BATCH 3: Blog Featured Image Concepts');
  console.log('═══════════════════════════════════════');
  console.log(`Generating: 24 images (4 per industry × 6 industries)`);
  console.log(`Est. Cost: $${config.batch_3_blog_featured.estimated_cost.toFixed(2)}\n`);

  const template3 = config.batch_3_blog_featured.base_prompt_template;

  for (const category of config.batch_3_blog_featured.categories) {
    console.log(`\n  ${category.industry.toUpperCase()}`);

    for (const article of category.articles) {
      const prompt = buildPrompt(template3, {
        title: article.title,
        industry: category.industry,
        brief: article.brief,
        color: category.color
      });

      results.summary.total_requested++;
      const result = await generateConcept(article.id, prompt);

      if (result.success) {
        results.batches.blog_featured.push(result);
        results.summary.total_generated++;
        results.summary.total_tokens += result.tokens;
        results.summary.total_cost += result.costEstimate;
        console.log(`    ✓ ${article.id}: ${result.tokens} tokens`);
      } else {
        console.log(`    ✗ ${article.id}: ${result.error}`);
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Summary
  results.endTime = new Date().toISOString();
  results.summary.failed = results.summary.total_requested - results.summary.total_generated;

  return results;
};

// Save results
const saveResults = (results) => {
  // Save detailed results
  const resultsPath = path.join(OUTPUT_DIR, 'phase1_generation_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Save cost log
  const costLog = {
    timestamp: results.endTime,
    phase: 'phase1',
    total_tokens: results.summary.total_tokens,
    total_cost: results.summary.total_cost,
    cost_per_image: results.summary.total_cost / results.summary.total_generated,
    images_generated: results.summary.total_generated,
    budget_remaining: 100 - results.summary.total_cost
  };

  fs.writeFileSync(COST_LOG_PATH, JSON.stringify(costLog, null, 2));

  return resultsPath;
};

// Main execution
const main = async () => {
  console.log('\n████████████████████████████████████████████████████');
  console.log('█ SYNTHEX PHASE 1: CONCEPT GENERATION                █');
  console.log('█ Budget: $100 | Phase 1 Allocation: $4.65          █');
  console.log('████████████████████████████████████████████████████\n');

  try {
    validateApiKey();
    createDirectories();

    const config = loadConfig();
    console.log(`\n📊 Generating ${config.batch_1_industry_cards.total_images + config.batch_2_hero_section.total_images + config.batch_3_blog_featured.total_images} concept variations`);
    console.log(`💰 Total Phase 1 Budget: $${(config.batch_1_industry_cards.estimated_cost + config.batch_2_hero_section.estimated_cost + config.batch_3_blog_featured.estimated_cost).toFixed(2)}`);

    const results = await generatePhase1(config);
    const resultsPath = saveResults(results);

    // Print final summary
    console.log('\n════════════════════════════════════════');
    console.log('PHASE 1 GENERATION COMPLETE');
    console.log('════════════════════════════════════════');
    console.log(`✓ Generated: ${results.summary.total_generated}/${results.summary.total_requested} concepts`);
    console.log(`✗ Failed: ${results.summary.total_failed}`);
    console.log(`📊 Total Tokens: ${results.summary.total_tokens}`);
    console.log(`💰 Phase 1 Cost: $${results.summary.total_cost.toFixed(2)}`);
    console.log(`💳 Budget Remaining: $${(100 - results.summary.total_cost).toFixed(2)}`);
    console.log(`\n📁 Results saved to: ${resultsPath}`);
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Run quality assessment: npm run synthex:assess-phase1');
    console.log('2. Collect stakeholder feedback');
    console.log('3. Proceed to Phase 2 refinement based on feedback');

  } catch (error) {
    console.error('\n✗ Fatal Error:', error.message);
    process.exit(1);
  }
};

main();
