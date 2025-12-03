import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== SUPABASE DIAGNOSTIC ===')
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseKey)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!serviceRoleKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  // Test basic connection with anon key
  console.log('\n--- Testing Anon Key Connection ---')
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1)

  if (profilesError) {
    console.error('profiles table error:', profilesError.message, '| code:', profilesError.code)
  } else {
    console.log('profiles table: ACCESSIBLE')
  }

  // Test user_profiles table
  const { data: userProfilesData, error: userProfilesError } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1)

  if (userProfilesError) {
    console.error('user_profiles table error:', userProfilesError.message, '| code:', userProfilesError.code)
  } else {
    console.log('user_profiles table: ACCESSIBLE')
  }

  // Test contacts table
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('count')
    .limit(1)

  if (contactsError) {
    console.error('contacts table error:', contactsError.message, '| code:', contactsError.code)
  } else {
    console.log('contacts table: ACCESSIBLE')
  }

  // Test auth system
  console.log('\n--- Testing Auth System ---')
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Auth error:', sessionError.message)
  } else {
    console.log('Auth system: ACCESSIBLE')
    console.log('Current session:', sessionData.session ? 'EXISTS' : 'NONE')
  }

  // Check OAuth providers (this info comes from Supabase Dashboard, can't query directly)
  console.log('\n--- OAuth Configuration ---')
  console.log('Dashboard URL:', supabaseUrl?.replace('.supabase.co', '.supabase.co/dashboard/project/') + 'auth/providers')
  console.log('Note: OAuth providers must be configured in Supabase Dashboard')

  // Test if we can get auth settings
  const { data: { providers }, error: providersError } = await supabase.auth.getSession().then(() => ({ data: { providers: null }, error: null }))

  // List expected tables
  console.log('\n--- Table Existence Check ---')
  const tables = ['profiles', 'user_profiles', 'organizations', 'user_organizations', 'contacts', 'emails', 'campaigns', 'workspaces']

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1)
    if (error) {
      console.log(`${table}: ${error.code === 'PGRST116' ? 'NO RLS ACCESS' : error.code === '42P01' ? 'DOES NOT EXIST' : error.message}`)
    } else {
      console.log(`${table}: EXISTS & ACCESSIBLE`)
    }
  }
}

test()
