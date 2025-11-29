#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const replacements = [
  { from: /claude-opus-4-20250514/g, to: 'claude-opus-4-5-20251101' },
  { from: /claude-sonnet-4-20250514/g, to: 'claude-sonnet-4-5-20250929' },
  { from: /claude-haiku-4-20250514/g, to: 'claude-haiku-4-5-20251001' },
];

function getAllFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    }
  } catch (err) {
    // Skip directories we can't access
  }
  return fileList;
}

console.log('🔍 Finding Markdown files in docs/ and .claude/...');
const docFiles = getAllFiles('docs');
const claudeFiles = getAllFiles('.claude');
const rootMdFiles = readdirSync('.')
  .filter(f => f.endsWith('.md') && statSync(f).isFile())
  .filter(f => {
    const content = readFileSync(f, 'utf8');
    return content.includes('claude-opus-4-20250514') ||
           content.includes('claude-sonnet-4-20250514') ||
           content.includes('claude-haiku-4-20250514');
  });

const files = [...docFiles, ...claudeFiles, ...rootMdFiles];

console.log(`📝 Found ${files.length} markdown files. Updating...`);

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

console.log(`\n✨ Done! Updated ${updatedCount} documentation files with ${totalReplacements} total replacements.`);
