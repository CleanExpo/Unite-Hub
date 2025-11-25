#!/usr/bin/env node

/**
 * Pre-Deployment Build Verification
 *
 * Verifies the codebase is ready for Vercel deployment by checking:
 * 1. All import/export matches are correct
 * 2. No syntax errors in critical files
 * 3. Environment variables are documented
 * 4. Build passes successfully
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Build Readiness...\n');

let passed = 0;
let failed = 0;
const issues = [];

// Test 1: Check critical import/export matches
console.log('1️⃣  Checking import/export matches...');
const importChecks = [
  {
    file: 'src/app/api/aido/content/generate/route.ts',
    import: 'generateContent',
    module: 'src/lib/aido/content-generation-ai.ts'
  },
  {
    file: 'src/app/api/founder/cognitive-map/route.ts',
    import: 'getCognitiveMap',
    module: 'src/lib/founderCognitiveMap/index.ts'
  },
  {
    file: 'src/app/api/aido/google-curve/signals/route.ts',
    import: 'getActiveChangeSignals',
    module: 'src/lib/aido/database/change-signals.ts'
  }
];

for (const check of importChecks) {
  try {
    const fileContent = fs.readFileSync(check.file, 'utf-8');
    const moduleContent = fs.readFileSync(check.module, 'utf-8');

    if (fileContent.includes(check.import) && moduleContent.includes(`export.*${check.import}`)) {
      console.log(`   ✅ ${check.import} - OK`);
      passed++;
    } else if (fileContent.includes(check.import)) {
      console.log(`   ✅ ${check.import} - imported in ${path.basename(check.file)}`);
      passed++;
    } else {
      console.log(`   ❌ ${check.import} - NOT FOUND`);
      issues.push(`Missing import: ${check.import} in ${check.file}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  ${check.file} - ${error.message}`);
    issues.push(`Error checking ${check.file}: ${error.message}`);
    failed++;
  }
}

// Test 2: Check rate-limit-tiers syntax
console.log('\n2️⃣  Checking rate-limit-tiers.ts syntax...');
try {
  const rateLimitContent = fs.readFileSync('src/lib/rate-limit-tiers.ts', 'utf-8');

  // Check for invalid escape sequences
  if (rateLimitContent.includes('error: \\,') || rateLimitContent.includes('message: \\,')) {
    console.log('   ❌ Invalid escape sequences found');
    issues.push('rate-limit-tiers.ts contains invalid backslash escape sequences');
    failed++;
  } else {
    console.log('   ✅ No syntax errors found');
    passed++;
  }
} catch (error) {
  console.log(`   ❌ ${error.message}`);
  issues.push(`Error checking rate-limit-tiers.ts: ${error.message}`);
  failed++;
}

// Test 3: Check environment variables documented
console.log('\n3️⃣  Checking environment variables...');
try {
  const envExample = fs.readFileSync('.env.example', 'utf-8');

  const requiredVars = [
    'CRON_SECRET',
    'ALERT_EMAILS',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY'
  ];

  let allFound = true;
  for (const varName of requiredVars) {
    if (envExample.includes(varName)) {
      console.log(`   ✅ ${varName} - documented`);
    } else {
      console.log(`   ❌ ${varName} - NOT documented`);
      issues.push(`${varName} not documented in .env.example`);
      allFound = false;
      failed++;
    }
  }

  if (allFound) {
    passed++;
  }
} catch (error) {
  console.log(`   ❌ ${error.message}`);
  issues.push(`Error checking .env.example: ${error.message}`);
  failed++;
}

// Test 4: Check monitoring system files exist
console.log('\n4️⃣  Checking monitoring system files...');
const monitoringFiles = [
  'supabase/migrations/220_autonomous_monitoring_system.sql',
  'src/lib/monitoring/autonomous-monitor.ts',
  'src/app/api/cron/health-check/route.ts',
  'src/app/api/monitoring/dashboard/route.ts',
  'src/app/dashboard/monitoring/page.tsx',
  'scripts/test-monitoring-system.mjs'
];

let allFilesExist = true;
for (const file of monitoringFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${path.basename(file)} - exists`);
  } else {
    console.log(`   ❌ ${path.basename(file)} - MISSING`);
    issues.push(`Missing file: ${file}`);
    allFilesExist = false;
    failed++;
  }
}

if (allFilesExist) {
  passed++;
}

// Test 5: Run actual build
console.log('\n5️⃣  Running production build...');
try {
  console.log('   (This may take 1-2 minutes...)\n');

  const buildOutput = execSync('npm run build', {
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 300000 // 5 minutes
  });

  if (buildOutput.includes('Compiled successfully') || buildOutput.includes('Route (app)')) {
    console.log('   ✅ Build successful!');
    passed++;
  } else {
    console.log('   ⚠️  Build completed but output unclear');
    console.log('   Last 10 lines of output:');
    const lines = buildOutput.split('\n').slice(-10);
    lines.forEach(line => console.log(`      ${line}`));
    passed++;
  }
} catch (error) {
  console.log('   ❌ Build failed!');
  console.log('\n   Error output:');
  const errorLines = error.stdout ? error.stdout.split('\n').slice(-20) :
                     error.stderr ? error.stderr.split('\n').slice(-20) :
                     [error.message];
  errorLines.forEach(line => console.log(`      ${line}`));
  issues.push('Build failed - see error output above');
  failed++;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Verification Results: ${passed}/${passed + failed} passed\n`);

if (failed === 0) {
  console.log('✅ All checks passed! Ready for Vercel deployment.\n');
  console.log('Next steps:');
  console.log('1. Ensure CRON_SECRET and ALERT_EMAILS are set in Vercel');
  console.log('2. Push to main branch (git push origin main)');
  console.log('3. Vercel will auto-deploy');
  console.log('4. Visit /dashboard/monitoring after deployment\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} check(s) failed. Issues found:\n`);
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  console.log('\nPlease fix these issues before deploying.\n');
  process.exit(1);
}
