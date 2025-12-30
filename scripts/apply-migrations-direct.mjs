#!/usr/bin/env node
/**
 * Apply migrations directly using Supabase Management API
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import https from 'https';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];

async function executeSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function main() {
  console.log('🚀 Applying Synthex Migrations...\n');

  const combinedSQL = fs.readFileSync('APPLY-THESE-MIGRATIONS.sql', 'utf8');

  console.log('Attempting to execute via Supabase REST API...\n');

  try {
    await executeSQL(combinedSQL);
    console.log('✅ Migrations applied successfully!\n');
  } catch (error) {
    console.log('❌ Automatic application failed:', error.message);
    console.log('\n📋 MANUAL APPLICATION REQUIRED:\n');
    console.log('1. Open Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
    console.log('2. Copy and paste the entire content of:');
    console.log('   APPLY-THESE-MIGRATIONS.sql\n');
    console.log('3. Click "Run" button\n');
    console.log('4. Verify with verification queries at bottom of file\n');
  }
}

main();
