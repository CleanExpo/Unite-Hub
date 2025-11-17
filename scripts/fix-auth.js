/**
 * Automated Auth Re-enabler
 *
 * This script finds all API routes with disabled authentication
 * and re-enables them by uncommenting auth checks and removing TODO comments.
 *
 * Usage: node scripts/fix-auth.js
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting auth fix script...\n');

// Find all route files
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
// Use forward slashes for glob pattern (works on Windows too)
const pattern = apiDir.replace(/\\/g, '/') + '/**/route.ts';

console.log(`📂 Searching for route files in: ${apiDir}`);
console.log(`📋 Glob pattern: ${pattern}\n`);

try {
  const files = await glob(pattern);

  console.log(`Found ${files.length} route files\n`);

  let fixedCount = 0;
  let unchangedCount = 0;
  const fixedFiles = [];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Pattern 1: Uncomment getServerSession calls
    content = content.replace(
      /\/\/ (const session = await getServerSession)/g,
      '$1'
    );

    // Pattern 2: Uncomment session checks
    content = content.replace(
      /\/\/ (if \(!session\))/g,
      '$1'
    );

    // Pattern 3: Uncomment return statements
    content = content.replace(
      /\/\/ (return NextResponse\.json\(\{ error: ['"]+Unauthorized['"]+.*\})/g,
      '$1'
    );

    // Pattern 4: Remove TODO comments about auth
    content = content.replace(
      /\/\/ TODO: Re-enable auth when ready\n/g,
      ''
    );

    // Pattern 5: Uncomment entire auth blocks (multi-line)
    content = content.replace(
      /\/\/ const session = await getServerSession\(authOptions\);\n\/\/ if \(!session\) return NextResponse\.json\(\{ error: ['"]+Unauthorized['"]+.*\n/g,
      match => match.replace(/\/\/ /g, '')
    );

    // Check if file was modified
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      const relativePath = path.relative(process.cwd(), file);
      fixedFiles.push(relativePath);
      console.log(`✅ Fixed auth in: ${relativePath}`);
    } else {
      unchangedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Files with auth fixes: ${fixedCount}`);
  console.log(`⏭️  Files unchanged: ${unchangedCount}`);
  console.log(`📁 Total files scanned: ${files.length}`);

  if (fixedFiles.length > 0) {
    console.log('\n📝 Modified files:');
    fixedFiles.forEach(file => console.log(`   - ${file}`));
  }

  console.log('\n✨ Auth fix script completed!\n');

  if (fixedCount > 0) {
    console.log('⚠️  IMPORTANT: Review the changes and test the API routes before deploying.');
    console.log('   Run: npm run dev');
    console.log('   Then test authenticated endpoints in your browser.\n');
  }
} catch (error) {
  console.error('❌ Error running auth fix script:', error);
  process.exit(1);
}
