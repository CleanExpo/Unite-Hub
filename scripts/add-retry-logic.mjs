#!/usr/bin/env node
/**
 * Automated script to add Anthropic retry logic to all files
 * Part of P0 Blocker #2 implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files that need retry logic added
const filesToUpdate = [
  // High-priority agent files (already partially done)
  'src/lib/agents/calendar-intelligence.ts',
  'src/lib/agents/whatsapp-intelligence.ts',
  'src/lib/agents/contact-intelligence.ts',
  'src/lib/agents/email-processor.ts',
  'src/lib/agents/intelligence-extraction.ts',
  'src/lib/agents/mindmap-analysis.ts',
  'src/lib/agents/multi-model-orchestrator.ts',
  'src/lib/agents/model-router.ts',

  // AI service files
  'src/lib/ai/enhanced-router.ts',
  'src/lib/ai/orchestrator.ts',
  'src/lib/ai/claude-client.ts',

  // Client agent files
  'src/lib/clientAgent/clientAgentPlannerService.ts',

  // API route files
  'src/app/api/ai/chat/route.ts',
  'src/app/api/landing-pages/[id]/alternatives/route.ts',
  'src/app/api/landing-pages/[id]/regenerate/route.ts',
  'src/app/api/landing-pages/generate/route.ts',
  'src/app/api/social-templates/[id]/variations/route.ts',
  'src/app/api/social-templates/generate/route.ts',
  'src/app/api/competitors/analyze/route.ts',
  'src/app/api/media/analyze/route.ts',
  'src/app/api/sequences/generate/route.ts',
  'src/app/api/calendar/[postId]/regenerate/route.ts',
  'src/app/api/calendar/generate/route.ts',

  // Additional files
  'next/core/ai/orchestrator.ts',
  'lib/claude/client.ts',
];

function addRetryLogic(filePath) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP: ${filePath} (file not found)`);
    return { updated: false, reason: 'not_found' };
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already has retry logic import
  if (content.includes('callAnthropicWithRetry')) {
    console.log(`✅ SKIP: ${filePath} (already has retry logic)`);
    return { updated: false, reason: 'already_updated' };
  }

  // Check if file uses anthropic.messages.create
  if (!content.includes('anthropic.messages.create')) {
    console.log(`⚠️  SKIP: ${filePath} (no Anthropic calls found)`);
    return { updated: false, reason: 'no_anthropic_calls' };
  }

  let modified = false;

  // Step 1: Add import statement
  const importPattern = /import\s+Anthropic\s+from\s+["']@anthropic-ai\/sdk["'];/;
  if (importPattern.test(content) && !content.includes('callAnthropicWithRetry')) {
    content = content.replace(
      importPattern,
      `import Anthropic from "@anthropic-ai/sdk";\nimport { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";`
    );
    modified = true;
  }

  // Step 2: Wrap all anthropic.messages.create calls
  // Pattern: const message = await anthropic.messages.create({
  const directCallPattern = /(const\s+\w+\s*=\s*await\s+anthropic\.messages\.create\(\{)/g;
  const matches = content.match(directCallPattern);

  if (matches && matches.length > 0) {
    console.log(`📝 UPDATE: ${filePath} (${matches.length} call(s))`);

    // This is a complex transformation, let's do it carefully
    // We need to wrap each anthropic.messages.create call with callAnthropicWithRetry

    // For now, report what needs to be done
    console.log(`   → Found ${matches.length} Anthropic call(s) to wrap`);
    console.log(`   → MANUAL UPDATE REQUIRED for complex call patterns`);

    return { updated: false, reason: 'manual_update_needed', callCount: matches.length };
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ UPDATED: ${filePath}`);
    return { updated: true };
  }

  return { updated: false, reason: 'no_changes_needed' };
}

// Main execution
console.log('🚀 Starting Anthropic Retry Logic Migration\n');
console.log(`Files to check: ${filesToUpdate.length}\n`);

const results = {
  updated: 0,
  alreadyUpdated: 0,
  notFound: 0,
  noAnthropicCalls: 0,
  manualUpdateNeeded: 0,
  errors: 0
};

for (const file of filesToUpdate) {
  try {
    const result = addRetryLogic(file);

    if (result.updated) {
      results.updated++;
    } else if (result.reason === 'already_updated') {
      results.alreadyUpdated++;
    } else if (result.reason === 'not_found') {
      results.notFound++;
    } else if (result.reason === 'no_anthropic_calls') {
      results.noAnthropicCalls++;
    } else if (result.reason === 'manual_update_needed') {
      results.manualUpdateNeeded++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${file} - ${error.message}`);
    results.errors++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 MIGRATION SUMMARY\n');
console.log(`✅ Updated: ${results.updated}`);
console.log(`⏭️  Already updated: ${results.alreadyUpdated}`);
console.log(`📝 Manual update needed: ${results.manualUpdateNeeded}`);
console.log(`⚠️  Not found: ${results.notFound}`);
console.log(`⚠️  No Anthropic calls: ${results.noAnthropicCalls}`);
console.log(`❌ Errors: ${results.errors}`);
console.log('='.repeat(60));

if (results.manualUpdateNeeded > 0) {
  console.log('\n⚠️  Some files require manual updates due to complex call patterns');
  console.log('   See claude.ai/code for detailed update instructions');
}

process.exit(results.errors > 0 ? 1 : 0);
