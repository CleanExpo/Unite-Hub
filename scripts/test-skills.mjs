#!/usr/bin/env node
/**
 * Test Suite for Unite-Hub Skills
 * Validates skill files are properly formatted and accessible
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('\n🧪 Unite-Hub Skills Test Suite\n');

const commandsDir = '.claude/commands';
const skillFiles = readdirSync(commandsDir).filter(f => f.endsWith('.md'));

console.log(`Found ${skillFiles.length} skill files:\n`);

let passCount = 0;
let failCount = 0;

for (const file of skillFiles) {
  const skillName = file.replace('.md', '');
  const filePath = join(commandsDir, file);

  console.log(`📄 Testing: /${skillName}`);

  try {
    const content = readFileSync(filePath, 'utf-8');

    // Test 1: File has content
    if (content.length === 0) {
      console.log(`   ❌ File is empty`);
      failCount++;
      continue;
    }

    // Test 2: Contains $ARGUMENTS placeholder (indicates command)
    const hasArguments = content.includes('$ARGUMENTS');
    if (hasArguments) {
      console.log(`   ✅ Command format (has $ARGUMENTS)`);
    } else {
      console.log(`   ⚠️  No $ARGUMENTS placeholder (may be documentation only)`);
    }

    // Test 3: Has clear purpose/description
    const hasHeading = content.match(/^#\s+(.+)/m);
    if (hasHeading) {
      console.log(`   ✅ Title: "${hasHeading[1]}"`);
    }

    // Test 4: Has usage instructions
    const hasUsage = content.toLowerCase().includes('usage') || content.toLowerCase().includes('use when');
    if (hasUsage) {
      console.log(`   ✅ Usage instructions present`);
    } else {
      console.log(`   ⚠️  No usage instructions found`);
    }

    // Test 5: Has examples or templates
    const hasExamples = content.toLowerCase().includes('example') || content.toLowerCase().includes('template');
    if (hasExamples) {
      console.log(`   ✅ Examples/templates provided`);
    }

    // Test 6: File size reasonable (not empty, not too large)
    const sizeKB = (content.length / 1024).toFixed(1);
    console.log(`   📊 Size: ${sizeKB} KB`);

    if (content.length > 100) {
      console.log(`   ✅ Skill validated\n`);
      passCount++;
    } else {
      console.log(`   ❌ File too small, may be incomplete\n`);
      failCount++;
    }

  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}\n`);
    failCount++;
  }
}

console.log('='.repeat(60));
console.log('Skills Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total: ${skillFiles.length}`);

if (failCount === 0) {
  console.log('\n✅ All skills validated successfully!\n');
  console.log('Skills can be invoked as commands in Claude Code:');
  skillFiles.forEach(f => {
    console.log(`  /${f.replace('.md', '')} [arguments]`);
  });
  console.log('');
} else {
  console.log('\n⚠️  Some skills need attention\n');
  process.exit(1);
}
