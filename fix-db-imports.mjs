#!/usr/bin/env node
/**
 * Fix db.ts to use getSupabaseServer() instead of supabaseServer
 */

import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/lib/db.ts';

console.log('Reading db.ts...');
let content = readFileSync(filePath, 'utf8');

console.log('Applying fixes...');

// Pattern to match function bodies that use supabaseServer
const functionPattern = /(\w+):\s*async\s*\(([^)]*)\)\s*=>\s*\{([^}]*await supabaseServer[^}]*)\}/gs;

let fixCount = 0;
content = content.replace(functionPattern, (match, funcName, params, body) => {
  // Check if getSupabaseServer() is already called
  if (body.includes('const supabaseServer = getSupabaseServer()')) {
    return match; // Already fixed
  }

  // Add getSupabaseServer() call at the beginning of the function
  const fixedBody = body.replace(
    /^(\s*)/,
    '$1const supabaseServer = getSupabaseServer();\n$1'
  );

  fixCount++;
  return `${funcName}: async (${params}) => {${fixedBody}}`;
});

console.log(`Fixed ${fixCount} functions`);

console.log('Writing updated file...');
writeFileSync(filePath, content, 'utf8');

console.log('✓ db.ts has been updated');
console.log('\nPlease review the changes and test the application.');
