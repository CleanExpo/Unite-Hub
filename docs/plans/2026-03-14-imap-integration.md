# IMAP Integration for SiteGround Email Accounts

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect `support@carsi.com.au` and `phill.m@carsi.com.au` (SiteGround IMAP) to the Nexus email system so the AI can read threads for bookkeeping.

**Architecture:** IMAP credentials (host/port/email/password) are collected via a modal form on the email page, validated by attempting a live IMAP connection, encrypted with AES-256-GCM (existing vault), and stored in `credentials_vault` with `service='imap'`. At read time, `imapflow` connects, fetches the 50 most recent inbox threads, and returns them in the same `GmailThread` shape so the existing UI requires zero changes.

**Tech Stack:** `imapflow` (IMAP client), existing `src/lib/vault.ts` (AES-256-GCM), existing `credentials_vault` Supabase table, Next.js App Router API routes, Tailwind CSS modal.

---

## Background

### What already exists
- `credentials_vault` table with `service` discriminator column — used for `service='google'`
- `encrypt()`/`decrypt()` in `src/lib/vault.ts` — AES-256-GCM, PBKDF2 key derivation
- `createServiceClient()` in `src/lib/supabase/service.ts` — bypasses RLS for vault ops
- `getCached()`/`setCache()` in `src/lib/cache.ts` — 5-min TTL in-memory cache
- `GmailThread` interface in `src/lib/integrations/google.ts` — the shape UI expects
- `EMAIL_ACCOUNTS` in `src/lib/email-accounts.ts` — already has `provider: 'siteground'` on CARSI accounts
- Email page already renders `IMAP · TBD` placeholder for siteground accounts

### What needs building
1. Install `imapflow` package
2. `/api/auth/imap/connect` POST route — validate + encrypt + store credentials
3. `src/lib/integrations/imap.ts` — fetch threads via IMAP using stored credentials
4. Update email page — replace `IMAP · TBD` with a working connect modal
5. Wire `fetchImapThreads()` into the email page alongside `fetchGmailThreads()`

### SiteGround IMAP settings (hardcoded — carsi.com.au)
- Host: `mail.carsi.com.au`
- Port: `993`
- TLS: `true`
- Username: full email address (e.g. `support@carsi.com.au`)

---

## Task 1: Install imapflow

**Files:**
- Modify: `package.json` (root)

**Step 1: Install package**

```bash
cd /c/Unite-Group && pnpm add imapflow
```

**Step 2: Verify install**

```bash
grep '"imapflow"' package.json
```
Expected: line like `"imapflow": "^1.0.x"`

**Step 3: Check TypeScript types are available**

```bash
cd /c/Unite-Group && pnpm run type-check 2>&1 | head -20
```
Expected: no errors related to imapflow (it ships its own types)

**Step 4: Commit**

```bash
cd /c/Unite-Group && git add package.json pnpm-lock.yaml
git commit -m "chore: add imapflow for SiteGround IMAP integration"
```

---

## Task 2: Create IMAP connection API route

**Files:**
- Create: `src/app/api/auth/imap/connect/route.ts`

**What it does:**
- Receives POST `{ email, password }` from the email page modal
- Looks up `host` and `port` from the `EMAIL_ACCOUNTS` registry (so passwords never pass through the browser URL)
- Validates credentials by opening a real IMAP connection (connect + authenticate only — no fetch)
- On success: encrypts `{ host, port, email, username: email, password }` and upserts into `credentials_vault` with `service='imap'`
- Returns `{ ok: true }` or `{ error: string }`

**Step 1: Create the route file**

```typescript
// src/app/api/auth/imap/connect/route.ts
// POST /api/auth/imap/connect
// Validates IMAP credentials, encrypts, stores in credentials_vault

import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encrypt } from '@/lib/vault'
import { accountByEmail } from '@/lib/email-accounts'

// SiteGround IMAP config per domain
const IMAP_CONFIG: Record<string, { host: string; port: number }> = {
  'carsi.com.au': { host: 'mail.carsi.com.au', port: 993 },
}

function getImapConfig(email: string) {
  const domain = email.split('@')[1]
  return IMAP_CONFIG[domain] ?? null
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let email: string, password: string
  try {
    const body = await request.json() as { email?: string; password?: string }
    email = body.email?.trim() ?? ''
    password = body.password ?? ''
    if (!email || !password) throw new Error('missing fields')
  } catch {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const imapCfg = getImapConfig(email)
  if (!imapCfg) {
    return NextResponse.json({ error: `No IMAP config for domain: ${email.split('@')[1]}` }, { status: 400 })
  }

  // Validate credentials by attempting a real connection
  const client = new ImapFlow({
    host: imapCfg.host,
    port: imapCfg.port,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  })

  try {
    await client.connect()
    await client.logout()
  } catch (err) {
    console.error('[IMAP] Connection validation failed:', err)
    return NextResponse.json({ error: 'Invalid credentials or server unreachable' }, { status: 401 })
  }

  // Encrypt and store
  const payload = encrypt(JSON.stringify({
    host: imapCfg.host,
    port: imapCfg.port,
    username: email,
    password,
  }))

  const account = accountByEmail(email)
  const businessKey = account?.businessKey ?? 'personal'
  const label = account?.label ?? email

  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('founder_id', user.id)
    .eq('slug', businessKey)
    .maybeSingle()

  await supabase.from('credentials_vault').upsert(
    {
      founder_id: user.id,
      business_id: business?.id ?? null,
      service: 'imap',
      label,
      encrypted_value: payload.encryptedValue,
      iv: payload.iv,
      salt: payload.salt,
      notes: email,
      metadata: { email, businessKey },
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: 'founder_id,service,label' }
  )

  return NextResponse.json({ ok: true })
}
```

**Step 2: Run type-check**

```bash
cd /c/Unite-Group && pnpm run type-check 2>&1
```
Expected: no errors

**Step 3: Run lint**

```bash
cd /c/Unite-Group && pnpm run lint 2>&1
```
Expected: no errors

**Step 4: Commit**

```bash
cd /c/Unite-Group && git add src/app/api/auth/imap/connect/route.ts
git commit -m "feat(imap): add POST /api/auth/imap/connect — validate + store encrypted credentials"
```

---

## Task 3: Create IMAP thread fetching library

**Files:**
- Create: `src/lib/integrations/imap.ts`

**What it does:**
- `getConnectedImapAccounts(founderId)` — queries vault for `service='imap'` rows, returns array of `{ email, businessKey, label }`
- `fetchImapThreads(founderId)` — decrypts each IMAP credential, opens an ImapFlow connection, fetches last 50 messages from INBOX, returns `GmailThread[]` (same shape as Gmail so UI is unchanged), caches 5 minutes

**Step 1: Create the file**

```typescript
// src/lib/integrations/imap.ts
// Fetches email threads from SiteGround IMAP accounts via stored credentials
// Returns GmailThread[] — same interface as google.ts so UI needs no changes

import { ImapFlow, FetchMessageObject } from 'imapflow'
import { getCached, setCache } from '@/lib/cache'
import type { GmailThread, ConnectedAccount } from '@/lib/integrations/google'

const IMAP_CACHE_TTL_MS = 5 * 60 * 1_000

interface StoredImapCredentials {
  host: string
  port: number
  username: string
  password: string
}

export async function getConnectedImapAccounts(founderId: string): Promise<ConnectedAccount[]> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('credentials_vault')
    .select('label, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'imap')

  return (data ?? []).map(row => ({
    email: row.notes ?? '',
    businessKey: (row.metadata as { businessKey?: string })?.businessKey ?? 'personal',
    label: row.label,
  }))
}

async function fetchThreadsForImapAccount(
  creds: StoredImapCredentials,
  email: string,
  businessKey: string
): Promise<GmailThread[]> {
  const client = new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: true,
    auth: { user: creds.username, pass: creds.password },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    const threads: GmailThread[] = []

    try {
      // Fetch last 50 messages by sequence number
      const total = client.mailbox?.exists ?? 0
      if (total === 0) return []

      const start = Math.max(1, total - 49)
      const range = `${start}:${total}`

      for await (const msg of client.fetch(range, {
        envelope: true,
        flags: true,
      }) as AsyncIterable<FetchMessageObject>) {
        const envelope = msg.envelope
        if (!envelope) continue

        const subject = envelope.subject ?? '(no subject)'
        const from = envelope.from?.[0]
          ? `${envelope.from[0].name ?? ''} <${envelope.from[0].address ?? ''}>`.trim()
          : 'unknown'
        const date = envelope.date?.toISOString() ?? new Date().toISOString()
        const unread = !msg.flags?.has('\\Seen')

        threads.push({
          id: msg.uid?.toString() ?? String(msg.seq),
          subject,
          from,
          snippet: '',  // IMAP envelope doesn't include body preview — acceptable limitation
          date,
          unread,
          businessKey,
          email,
        })
      }
    } finally {
      lock.release()
    }

    await client.logout()

    // Return newest first (IMAP fetch is oldest-first by default)
    return threads.reverse()
  } catch (err) {
    console.error('[IMAP] Fetch failed for', email, err)
    await client.logout().catch(() => {})
    return []
  }
}

export async function fetchImapThreads(founderId: string): Promise<GmailThread[]> {
  const cacheKey = `imap:${founderId}`
  const cached = getCached<GmailThread[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'imap')

  if (!vaultRows?.length) return []

  const allThreads = await Promise.all(
    vaultRows.map(async (row) => {
      try {
        const creds: StoredImapCredentials = JSON.parse(
          decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
        )
        const email = row.notes ?? ''
        const businessKey = (row.metadata as { businessKey?: string })?.businessKey ?? 'personal'
        return fetchThreadsForImapAccount(creds, email, businessKey)
      } catch (err) {
        console.error('[IMAP] Decrypt/fetch failed for', row.notes, err)
        return []
      }
    })
  )

  const threads = allThreads
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  setCache(cacheKey, threads, IMAP_CACHE_TTL_MS)
  return threads
}
```

**Step 2: Export `ConnectedAccount` and `GmailThread` from `google.ts`** so `imap.ts` can import them.

Check if they're exported:
```bash
cd /c/Unite-Group && grep "^export" src/lib/integrations/google.ts | grep -E "GmailThread|ConnectedAccount"
```

If not exported, add `export` to their declarations in `src/lib/integrations/google.ts`.

**Step 3: Run type-check**

```bash
cd /c/Unite-Group && pnpm run type-check 2>&1
```
Expected: no errors

**Step 4: Commit**

```bash
cd /c/Unite-Group && git add src/lib/integrations/imap.ts
git commit -m "feat(imap): add fetchImapThreads() and getConnectedImapAccounts() — mirrors google.ts pattern"
```

---

## Task 4: Update email page — IMAP connect modal + wire threads

**Files:**
- Modify: `src/app/(founder)/founder/email/page.tsx`

**What changes:**
1. Import `getConnectedImapAccounts` and `fetchImapThreads` from `imap.ts`
2. Add `imapConnectedEmails` Set alongside `connectedEmails`
3. For `provider === 'siteground'`: show "Connect →" button that opens an inline password form (client component) instead of "IMAP · TBD"
4. Wire `fetchImapThreads` so IMAP threads appear alongside Gmail threads

**Step 1: Read the current page**

```bash
cat -n /c/Unite-Group/src/app/'(founder)'/founder/email/page.tsx
```

**Step 2: Plan the exact changes**

The page is a server component. The IMAP connect form needs to be a **client component** (it has a form with state). Create a small client component:

**Create: `src/components/founder/email/ImapConnectForm.tsx`**

```typescript
'use client'

import { useState } from 'react'

interface Props {
  email: string
  label: string
  onConnected: () => void
}

export function ImapConnectForm({ email, label, onConnected }: Props) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Connection failed')
        return
      }
      setOpen(false)
      onConnected()
    } catch {
      setError('Network error — check connection')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#00F5FF] hover:opacity-80 transition-opacity"
      >
        CONNECT →
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-1">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
        {label} · SiteGround
      </p>
      <input
        type="password"
        placeholder="Email password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoFocus
        className="bg-zinc-900 border border-zinc-700 rounded-sm px-2 py-1 text-xs text-white placeholder-zinc-500 focus:border-[#00F5FF] focus:outline-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-xs bg-[#00F5FF] text-black px-3 py-1 rounded-sm font-medium hover:opacity-80 disabled:opacity-40"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

**Step 3: Update `page.tsx` server component**

Key changes to `src/app/(founder)/founder/email/page.tsx`:

a) Add imports at top:
```typescript
import { getConnectedImapAccounts, fetchImapThreads } from '@/lib/integrations/imap'
import { ImapConnectForm } from '@/components/founder/email/ImapConnectForm'
```

b) In the async page function, alongside the Google fetches, add:
```typescript
const imapAccounts = user ? await getConnectedImapAccounts(user.id) : []
const imapConnectedEmails = new Set(imapAccounts.map((a) => a.email))

const imapThreads = user ? await fetchImapThreads(user.id) : []
```

c) Merge threads for display:
```typescript
const allThreads = [...gmailThreads, ...imapThreads]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
```

d) In the account card render, replace the `IMAP · TBD` block:
```tsx
// Before:
{account.provider === 'siteground' && (
  <span className="text-xs text-zinc-500">IMAP · TBD</span>
)}

// After:
{account.provider === 'siteground' && (
  imapConnectedEmails.has(account.email) ? (
    <span className="text-xs text-[#00F5FF] tracking-wider">CONNECTED</span>
  ) : (
    <ImapConnectForm
      email={account.email}
      label={account.label}
      onConnected={() => window.location.reload()}
    />
  )
)}
```

**Step 4: Run type-check + lint**

```bash
cd /c/Unite-Group && pnpm run type-check 2>&1 && pnpm run lint 2>&1
```
Expected: no errors

**Step 5: Commit**

```bash
cd /c/Unite-Group && git add src/app/'(founder)'/founder/email/page.tsx src/components/founder/email/ImapConnectForm.tsx
git commit -m "feat(imap): wire ImapConnectForm into email page, merge IMAP threads with Gmail threads"
```

---

## Task 5: Deploy + test end-to-end

**Step 1: Push to production**

```bash
cd /c/Unite-Group && git push origin main
```

**Step 2: Wait for Vercel deployment**

```bash
npx vercel ls 2>&1 | head -8
```
Wait until top entry shows `● Ready`.

**Step 3: Browser test — connect support@carsi.com.au**

1. Navigate to `https://unite-group.in/founder/email`
2. Find **CARSI SUPPORT · CARSI** card — should now show "CONNECT →" button
3. Click it — inline password form should appear
4. Enter `support@carsi.com.au` SiteGround password
5. Click **Connect**
6. Success: card shows **CONNECTED** in cyan, page reloads, CARSI threads appear in the thread list

**Step 4: Browser test — connect phill.m@carsi.com.au**

Repeat Step 3 for the **CARSI PERSONAL · CARSI** card.

**Step 5: Verify threads load**

Reload `/founder/email` — CARSI email threads should appear alongside Gmail threads, all sorted by date.

**Step 6: Check for errors**

If any account shows an error, check Vercel function logs:
```bash
npx vercel logs --follow 2>&1 | grep -i imap
```
The `console.error('[IMAP] ...')` calls added in `imap.ts` will surface any connection failures.

---

## Key Constraints

- **Do NOT use `nodemailer`** for reading — it's SMTP only (sending). Use `imapflow` exclusively for reading.
- **Do NOT store plain passwords** — always encrypt with `vault.encrypt()` before upsert.
- **Do NOT add IMAP to `email-accounts.ts`** — provider field already set to `'siteground'`.
- **Do NOT change the `GmailThread` interface** — IMAP threads use the same shape so the existing thread list UI requires zero modification.
- **Keep the `snippet` field empty** for IMAP threads — IMAP envelope-only fetch doesn't include body preview, which is an acceptable limitation that avoids downloading full message bodies.

---

## Future: Microsoft (`phill@disasterrecovery.com.au`)

The `@microsoft/microsoft-graph-client` package is already installed. Microsoft integration uses OAuth (not IMAP), so it would follow the Google OAuth pattern (`/api/auth/microsoft/authorize` → callback → vault). Not in scope for this plan.
