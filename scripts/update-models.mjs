#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const replacements = [
  { from: /claude-opus-4-20250514/g, to: 'claude-opus-4-5-20251101' },
  { from: /claude-sonnet-4-20250514/g, to: 'claude-sonnet-4-5-20250929' },
  { from: /claude-haiku-4-20250514/g, to: 'claude-haiku-4-5-20251001' },
];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

console.log('🔍 Finding TypeScript files in src/...');
const files = getAllFiles('src');

console.log(`📝 Found ${files.length} files. Updating...`);

let updatedCount = 0;
let totalReplacements = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let fileUpdated = false;
  let fileReplacements = 0;

  for (const { from, to } of replacements) {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileUpdated = true;
      fileReplacements += matches.length;
      totalReplacements += matches.length;
    }
  }

  if (fileUpdated) {
    writeFileSync(file, content, 'utf8');
    console.log(`  ✅ ${file} (${fileReplacements} replacements)`);
    updatedCount++;
  }
}

console.log(`\n✨ Done! Updated ${updatedCount} files with ${totalReplacements} total replacements.`);
