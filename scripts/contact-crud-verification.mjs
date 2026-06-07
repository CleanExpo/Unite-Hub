#!/usr/bin/env node

/**
 * Contact CRUD verification setup/teardown.
 *
 * Service-role use is allowed only here, and only for non-production
 * seed/teardown. Production hosts are read-only and this script refuses writes.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

for (const file of ['.env.local', '.env.test']) {
  if (existsSync(file)) config({ path: file, override: false })
}

const command = process.argv[2] ?? 'status'
const statePath = join('.playwright', 'contact-crud-state.json')
const productionRef = 'lksfwktwtmyznckodsau'
const marker = `contact-crud-verification-${new Date().toISOString().slice(0, 10)}`

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL was not available to the effect check')

  const host = new URL(url).host
  const ref = host.split('.')[0]
  return {
    url,
    host,
    isProduction: ref === productionRef,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    testEmail: process.env.PLAYWRIGHT_TEST_EMAIL ?? process.env.TEST_FOUNDER_EMAIL,
    testPassword: process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.TEST_FOUNDER_PASSWORD,
  }
}

function requireNonProduction(config) {
  if (config.isProduction) {
    throw new Error(`Refusing ${command}: ${config.host} is the known production Supabase host`)
  }
}

function requireSeedConfig(config) {
  const missing = []
  if (!config.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!config.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!config.testEmail) missing.push('PLAYWRIGHT_TEST_EMAIL')
  if (!config.testPassword) missing.push('PLAYWRIGHT_TEST_PASSWORD')
  if (missing.length > 0) {
    throw new Error(`Cannot ${command}; required runtime values unavailable by effect: ${missing.join(', ')}`)
  }
}

async function findUserByEmail(admin, email) {
  let page = 1
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const user = data.users.find((candidate) => candidate.email === email)
    if (user) return user
    if (data.users.length < 100) return null
    page += 1
  }
  return null
}

async function ensureUser(admin, email, password) {
  const existing = await findUserByEmail(admin, email)
  if (existing) return existing

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data.user
}

async function status() {
  const config = getConfig()
  const result = {
    supabaseHost: config.host,
    mode: config.isProduction ? 'PROD_SAFE_READ_ONLY' : 'NON_PRODUCTION',
  }

  if (!config.anonKey) {
    console.log(JSON.stringify({ ...result, effectCall: { status: 'not_attempted' } }, null, 2))
    return
  }

  const res = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/contacts?select=id&limit=1`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  })
  const body = await res.text().catch(() => '')
  console.log(JSON.stringify({
    ...result,
    effectCall: {
      path: '/rest/v1/contacts?select=id&limit=1',
      status: res.status,
      bodyPrefix: body.slice(0, 240),
    },
  }, null, 2))
}

async function setup() {
  const cfg = getConfig()
  requireNonProduction(cfg)
  requireSeedConfig(cfg)

  const admin = createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const founder = await ensureUser(admin, cfg.testEmail, cfg.testPassword)
  const otherEmail = cfg.testEmail.replace('@', `+other-${Date.now()}@`)
  const other = await ensureUser(admin, otherEmail, cfg.testPassword)

  const { data: otherContact, error: otherContactError } = await admin
    .from('contacts')
    .insert({
      founder_id: other.id,
      first_name: 'RLS',
      last_name: 'Fixture',
      email: null,
      status: 'lead',
      tags: ['verification'],
      metadata: { marker, purpose: 'contact-crud-rls-negative-control' },
    })
    .select('id, founder_id')
    .single()

  if (otherContactError) throw otherContactError

  const state = {
    mode: 'NON_PRODUCTION',
    supabaseHost: cfg.host,
    founderUserId: founder.id,
    otherFounderUserId: other.id,
    otherContactId: otherContact.id,
    marker,
    createdAt: new Date().toISOString(),
  }

  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`)
  console.log(JSON.stringify(state, null, 2))
}

async function teardown() {
  const cfg = getConfig()
  requireNonProduction(cfg)
  requireSeedConfig(cfg)

  if (!existsSync(statePath)) {
    console.log(JSON.stringify({ status: 'nothing_to_teardown', statePath }, null, 2))
    return
  }

  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  const admin = createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const contactIds = [state.otherContactId, state.createdContactId].filter(Boolean)
  let deletedContacts = 0
  if (contactIds.length > 0) {
    const { data, error } = await admin
      .from('contacts')
      .delete()
      .in('id', contactIds)
      .select('id')
    if (error) throw error
    deletedContacts = data?.length ?? 0
  }

  if (state.otherFounderUserId) {
    await admin.auth.admin.deleteUser(state.otherFounderUserId)
  }

  console.log(JSON.stringify({
    status: 'teardown_complete',
    supabaseHost: cfg.host,
    deletedContacts,
  }, null, 2))
}

try {
  if (command === 'status') await status()
  else if (command === 'setup') await setup()
  else if (command === 'teardown') await teardown()
  else throw new Error(`Unknown command: ${command}`)
} catch (error) {
  console.error(JSON.stringify({
    status: 'error',
    command,
    message: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exit(1)
}
