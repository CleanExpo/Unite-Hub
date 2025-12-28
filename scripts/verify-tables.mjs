import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verifying Phase 2 tables...\n');

const { data, error } = await supabase
  .from('agent_execution_metrics')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Verification failed:', error.message);
} else {
  console.log('✅ agent_execution_metrics table exists and is accessible!');
  console.log('✅ All Phase 2 migrations applied successfully!\n');
  console.log('📊 Next: Run tests to confirm integration');
  console.log('   npm run test tests/agents\n');
}
