import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false })

const productionRef = 'lksfwktwtmyznckodsau'

type SupabaseApiKey = {
  api_key?: string
  name?: string
  type?: string
  description?: string
}

type SupabaseAdminConfig = {
  url: string
  anonKey: string
  serviceRoleKey: string
  host: string
}

function keyLabel(entry: SupabaseApiKey) {
  return `${entry.name ?? ''} ${entry.type ?? ''} ${entry.description ?? ''}`.toLowerCase()
}

function parseCliKeys(stdout: string) {
  const parsed = JSON.parse(stdout) as SupabaseApiKey[] | { api_keys?: SupabaseApiKey[] }
  return Array.isArray(parsed) ? parsed : parsed.api_keys ?? []
}

function resolveKeyFromCli(label: 'anon' | 'service_role') {
  const result = spawnSync(
    'supabase',
    ['projects', 'api-keys', '--project-ref', productionRef, '--output', 'json'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 }
  )

  if (result.status !== 0) {
    throw new Error(
      `Supabase CLI api-key lookup failed with status ${result.status ?? 'unknown'}: ${(result.stderr || '').slice(0, 500)}`
    )
  }

  const keys = parseCliKeys(result.stdout)
  const match = keys.find((entry) => {
    const text = keyLabel(entry)
    if (label === 'anon') return text.includes('anon')
    return text.includes('service_role') || text.includes('service role')
  })

  if (!match?.api_key) {
    throw new Error(`Supabase CLI api-key lookup did not return a ${label} key`)
  }

  return match.api_key
}

export function loadSupabaseAdminConfig(): SupabaseAdminConfig {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const url = configuredUrl || `https://${productionRef}.supabase.co`
  const host = new URL(url).host

  if (host.split('.')[0] !== productionRef) {
    throw new Error(`Expected production Supabase host for the approved exception, got ${host}`)
  }

  return {
    url,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || resolveKeyFromCli('anon'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || resolveKeyFromCli('service_role'),
    host,
  }
}

export function hasSupabaseAdminProvisioning() {
  try {
    loadSupabaseAdminConfig()
    return { ok: true as const, missing: [] as string[] }
  } catch (error) {
    return {
      ok: false as const,
      missing: [(error as Error).message],
    }
  }
}
