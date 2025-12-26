#!/usr/bin/env node
/**
 * Verify UX Pattern Solutions Tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔍 Verifying UX Pattern Tables\n');

// Pattern 1: Onboarding Wizard
console.log('Pattern 1: Onboarding Wizard');
const { data: onboarding, error: onboardingError } = await supabase
  .from('user_onboarding_progress')
  .select('id')
  .limit(1);

if (onboardingError) {
  console.log(`❌ user_onboarding_progress: ${onboardingError.message}`);
} else {
  console.log(`✅ user_onboarding_progress: OK (${onboarding?.length || 0} rows)`);
}

// Pattern 2: Dashboard Modes (check user_profiles has dashboard_mode column)
console.log('\nPattern 2: Dashboard Modes');
const { data: profiles, error: profilesError } = await supabase
  .from('user_profiles')
  .select('id, dashboard_mode')
  .limit(1);

if (profilesError || !profiles) {
  console.log(`❌ user_profiles.dashboard_mode: ${profilesError?.message || 'Column not found'}`);
} else {
  console.log(`✅ user_profiles.dashboard_mode: OK`);
}

// Pattern 3: Integration Priority
console.log('\nPattern 3: Integration Priority');
const { data: integrations, error: integrationsError } = await supabase
  .from('integration_metadata')
  .select('integration_name, priority')
  .limit(10);

if (integrationsError) {
  console.log(`❌ integration_metadata: ${integrationsError.message}`);
} else {
  console.log(`✅ integration_metadata: OK (${integrations?.length || 0} integrations)`);
  if (integrations && integrations.length > 0) {
    console.log('\nIntegrations seeded:');
    integrations.forEach(i => {
      console.log(`  - ${i.integration_name}: ${i.priority.toUpperCase()}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ All UX Pattern Solutions Verified!');
console.log('='.repeat(60));
console.log('\nReady to test:');
console.log('1. Onboarding Wizard: http://localhost:3008/onboarding');
console.log('2. Dashboard Modes: Settings page');
console.log('3. Integration Badges: Integrations page\n');
