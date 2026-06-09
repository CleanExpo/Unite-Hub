import { spawnSync } from 'node:child_process'
import { loadSupabaseAdminConfig } from './supabase-admin-config'

const command = process.argv.slice(2)

if (command.length === 0) {
  console.error('Usage: tsx e2e/support/run-with-supabase-admin.ts <command> [...args]')
  process.exit(1)
}

const cfg = loadSupabaseAdminConfig()
const result = spawnSync(command[0], command.slice(1), {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: cfg.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: cfg.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: cfg.serviceRoleKey,
  },
  stdio: 'inherit',
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
