import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // SELECT * to see what columns PostgREST exposes
  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Select error:', error.message)
  } else {
    // Even with no rows, PostgREST returns column metadata
    console.log('PostgREST sees these columns:', data && data.length > 0 ? Object.keys(data[0]).join(', ') : '(no rows — but no error means table accessible)')
    console.log('Row count:', data?.length)
  }
}
main()
