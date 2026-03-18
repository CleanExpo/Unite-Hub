import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const tables = [
  'webhook_events', 'brand_identities', 'generated_content',
  'social_posts', 'social_channels', 'video_assets',
  'social_engagements', 'email_campaigns', 'platform_analytics',
  'advisory_cases', 'businesses', 'contacts'
]

async function main() {
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1)
    console.log(error ? `❌ ${t}: ${error.message}` : `✅ ${t}`)
  }
}
main()
