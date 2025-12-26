#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Get first workspace
const { data: workspace } = await supabase
  .from('workspaces')
  .select('id')
  .limit(1)
  .single();

if (!workspace) {
  console.error('No workspace found');
  process.exit(1);
}

// Check what columns clients table has
const { data: clientsSchema, error } = await supabase
  .from('clients')
  .select('*')
  .limit(0);

console.log('Clients table columns check:', error ? error.message : 'OK');

// Try simple insert
const { data: newClient, error: insertError } = await supabase
  .from('clients')
  .insert({
    workspace_id: workspace.id,
    company_name: 'Test Plumbing Co Authority',
  })
  .select()
  .single();

if (insertError) {
  console.error('Insert error:', insertError);
} else {
  console.log('✅ Client created:', newClient.id);
}
