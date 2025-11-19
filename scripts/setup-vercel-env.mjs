#!/usr/bin/env node

/**
 * Setup Vercel Environment Variables
 * Securely adds environment variables to Vercel without exposing secrets
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local to get the key (without exposing it in logs)
const envPath = join(__dirname, '..', '.env.local');
let perplexityKey = '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/PERPLEXITY_API_KEY[="]([^"\n]+)/);

  if (match && match[1]) {
    perplexityKey = match[1];
    console.log('✅ Found Perplexity API key in .env.local');
  } else {
    console.error('❌ PERPLEXITY_API_KEY not found in .env.local');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

console.log('\n🚀 Adding PERPLEXITY_API_KEY to Vercel...\n');

// Add to Vercel using environment variable (not command line args for security)
const vercelAdd = spawn('vercel', ['env', 'add', 'PERPLEXITY_API_KEY'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: {
    ...process.env,
  },
});

// Send the API key via stdin (more secure than command line args)
vercelAdd.stdin.write(perplexityKey + '\n');

// Select all environments
setTimeout(() => {
  // 'a' selects all environments
  vercelAdd.stdin.write('a\n');
  vercelAdd.stdin.end();
}, 1000);

vercelAdd.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ PERPLEXITY_API_KEY added to Vercel successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Redeploy: vercel --prod');
    console.log('   2. Test locally: npm run seo:eeat');
    console.log('   3. Verify: Check Vercel dashboard\n');
  } else {
    console.error(`\n❌ Failed to add environment variable (exit code ${code})`);
    console.error('\nTry adding manually via Vercel dashboard:');
    console.error('https://vercel.com/unite-groups-projects/unite-hub/settings/environment-variables\n');
    process.exit(code);
  }
});

vercelAdd.on('error', (error) => {
  console.error('❌ Error running vercel CLI:', error.message);
  console.error('\nMake sure Vercel CLI is installed:');
  console.error('npm install -g vercel\n');
  process.exit(1);
});
