#!/usr/bin/env node
// Quick Phase 2 Verification
// Simple check to ensure everything is set up

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('\n🔍 Phase 2 Quick Verification\n');
console.log('='.repeat(60));

// Test 1: Can we query media_files?
console.log('\n1️⃣ Testing media_files table...');
const { count, error: tableError } = await supabase
  .from('media_files')
  .select('*', { count: 'exact', head: true });

if (tableError) {
  console.log('❌ media_files table not accessible');
  console.error(tableError);
} else {
  console.log(`✅ media_files table exists (${count || 0} records)`);
}

// Test 2: Can we access storage?
console.log('\n2️⃣ Testing storage bucket...');
const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

if (bucketError) {
  console.log('❌ Cannot access storage');
  console.error(bucketError);
} else {
  const bucket = buckets?.find(b => b.id === 'media-uploads');
  if (bucket) {
    console.log('✅ media-uploads bucket exists');
  } else {
    console.log('❌ media-uploads bucket not found');
    console.log('Available buckets:', buckets?.map(b => b.id).join(', '));
  }
}

// Test 3: Get workspace info for testing
console.log('\n3️⃣ Getting workspace information...');
const { data: orgs, error: orgError } = await supabase
  .from('organizations')
  .select('id, name, workspaces(id, name)')
  .limit(1);

if (orgError) {
  console.log('❌ Cannot fetch organizations');
  console.error(orgError);
} else if (orgs && orgs.length > 0) {
  const org = orgs[0];
  const workspace = org.workspaces?.[0];

  console.log(`✅ Found organization: ${org.name}`);

  if (workspace) {
    console.log(`\n📋 Test with these IDs:`);
    console.log(`   workspace_id: ${workspace.id}`);
    console.log(`   org_id: ${org.id}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Verification complete!');
console.log('\n📌 Next: Open http://localhost:3008/test-media-upload.html\n');
