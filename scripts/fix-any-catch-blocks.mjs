import fs from 'fs';
import path from 'path';

// Recursively find .ts and .tsx files in src/
function findFiles(dir, ext) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      results.push(...findFiles(fullPath, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('src', ['.ts', '.tsx']);
const pattern = /catch\s*\(\s*(error|e|err)\s*:\s*any\s*\)/g;

let totalFixed = 0;
let filesFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace catch (error: any) → catch (error: unknown)
  content = content.replace(pattern, 'catch ($1: unknown)');
  // Reset regex lastIndex
  pattern.lastIndex = 0;

  if (content !== original) {
    const matches = (original.match(/catch\s*\(\s*(error|e|err)\s*:\s*any\s*\)/g) || []).length;
    fs.writeFileSync(file, content, 'utf8');
    totalFixed += matches;
    filesFixed++;
  }
}

console.log(`Files fixed: ${filesFixed}`);
console.log(`Total catch blocks fixed: ${totalFixed}`);
