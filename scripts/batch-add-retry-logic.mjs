#!/usr/bin/env node
/**
 * Batch update all files to add Anthropic retry logic
 * Automates the manual update process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to update (excluding already completed ones)
const filesToUpdate = [
  'src/lib/agents/contact-intelligence.ts',
  'src/lib/agents/email-processor.ts',
  'src/lib/agents/intelligence-extraction.ts',
  'src/lib/agents/mindmap-analysis.ts',
  'src/lib/agents/multi-model-orchestrator.ts',
  'src/lib/ai/enhanced-router.ts',
  'src/lib/ai/orchestrator.ts',
  'src/lib/ai/claude-client.ts',
  'src/lib/clientAgent/clientAgentPlannerService.ts',
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
];

function updateFile(filePath) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP: ${filePath} (not found)`);
    return { updated: false, reason: 'not_found' };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Step 1: Add import if not present
  if (!content.includes('callAnthropicWithRetry') && content.includes('anthropic.messages.create')) {
    const anthropicImport = /import\s+Anthropic\s+from\s+['"]@anthropic-ai\/sdk['"];?/;
    if (anthropicImport.test(content)) {
      content = content.replace(
        anthropicImport,
        `import Anthropic from "@anthropic-ai/sdk";\nimport { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";`
      );
      modified = true;
    }
  }

  // Step 2: Wrap anthropic.messages.create calls
  // Pattern: const varName = await anthropic.messages.create({
  const directCallPattern = /(const\s+(\w+)\s*=\s*await\s+anthropic\.messages\.create\(\{)/g;

  let match;
  const matches = [];
  while ((match = directCallPattern.exec(content)) !== null) {
    matches.push({ index: match.index, varName: match[2], fullMatch: match[0] });
  }

  if (matches.length > 0) {
    // Process matches in reverse to maintain correct indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const { index, varName, fullMatch } = matches[i];

      // Find the closing of messages.create
      let depth = 0;
      let endIndex = index + fullMatch.length;
      for (let j = endIndex; j < content.length; j++) {
        if (content[j] === '{') depth++;
        if (content[j] === '}') {
          depth--;
          if (depth === -1) {
            endIndex = j + 2; // Include });
            break;
          }
        }
      }

      const callBlock = content.substring(index + fullMatch.length - 1, endIndex);

      // Create the new wrapped version
      const newCode = `const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create${callBlock}
    });

    const ${varName} = result.data;`;

      content = content.substring(0, index) + newCode + content.substring(endIndex);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ UPDATED: ${filePath} (${matches.length} call(s))`);
    return { updated: true, callsUpdated: matches.length };
  }

  console.log(`⏭️  SKIP: ${filePath} (no changes needed)`);
  return { updated: false, reason: 'no_changes' };
}

// Main execution
console.log('🚀 Batch updating Anthropic retry logic\n');

let updated = 0;
let skipped = 0;
let totalCalls = 0;

for (const file of filesToUpdate) {
  const result = updateFile(file);
  if (result.updated) {
    updated++;
    totalCalls += result.callsUpdated || 0;
  } else {
    skipped++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 BATCH UPDATE SUMMARY\n');
console.log(`✅ Files updated: ${updated}`);
console.log(`📝 Total calls wrapped: ${totalCalls}`);
console.log(`⏭️  Files skipped: ${skipped}`);
console.log('='.repeat(60));

console.log('\n✅ Batch update complete!');
process.exit(0);
