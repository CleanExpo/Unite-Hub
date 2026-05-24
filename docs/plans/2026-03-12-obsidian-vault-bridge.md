# Obsidian Vault Bridge — Google Drive Sync

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this plan task-by-task.

**Goal:** Enable read-only browsing and markdown rendering of Obsidian `.md` notes synced to a designated Google Drive folder.

**Architecture:** Server-side in-memory caching (5-min TTL) of Drive folder contents and file metadata, mirroring the existing `gmail.ts` / `calendar.ts` pattern. Google OAuth tokens already stored in `credentials_vault` — no new auth flow needed.

**Tech Stack:** `react-markdown` for rendering, existing `google.ts` token infrastructure, new `google-drive.ts` integration lib.

---

## Context & Decisions

### What This Is
A new `/founder/notes` page that:
- Lists `.md` files from a Google Drive folder (specified in `GOOGLE_DRIVE_VAULT_FOLDER_ID`)
- Renders selected note as formatted markdown
- Reads only (no editing, publishing, or sync back to local Obsidian)
- Uses existing Google OAuth tokens (same `credentials_vault` lookup as Gmail/Calendar)

### What This Is NOT
- A replacement for Obsidian (Obsidian is the editor)
- A two-way sync engine (no conflict resolution, no delta tracking)
- An integration with Obsidian's native sync service (user manually syncs Obsidian → Google Drive, we read from Drive)
- An editor for notes (display only)

### Key Decisions
1. **Read-only browse (Approach 2):** Server-side cache (5 min) mirrors `google.ts` exactly — consistent, fast, minimal infrastructure
2. **New page, not mixed UI:** `/founder/notes` is a first-class feature (sidebar entry), separate from credentials vault
3. **Rendered markdown:** `react-markdown` with design tokens — headings, code blocks, links styled in cyan
4. **Soft failures:** Missing env var or Drive folder → user-friendly warning, not a crash
5. **Same OAuth flow:** Reuse `getConnectedGoogleAccounts()` and token refresh; if user connects Google for Gmail, it works for notes too

---

## Implementation Tasks

### Task 1: Create `src/lib/integrations/google-drive.ts`

**Files:**
- Create: `src/lib/integrations/google-drive.ts`

**Description:**
Mirror the pattern from `google.ts`: functions to fetch vault file list and content, with cache layer.

**Step 1: Write the integration lib**

```typescript
// src/lib/integrations/google-drive.ts
import { getCached, setCache, invalidateCache } from '@/lib/cache'

const GOOGLE_DRIVE_CACHE_TTL_MS = 5 * 60 * 1_000

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink: string
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_VAULT_FOLDER_ID
  )
}

async function listFolderContents(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and mimeType='text/markdown' and trashed=false`
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=100&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return []
  const data = await res.json() as { files?: DriveFile[] }
  return (data.files ?? []).sort((a, b) =>
    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  )
}

async function getFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return ''
  return res.text()
}

export async function getVaultFiles(founderId: string): Promise<DriveFile[]> {
  if (!isGoogleDriveConfigured()) return []

  const cacheKey = `drive-vault:${founderId}`
  const cached = getCached<DriveFile[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const { getValidToken } = await import('@/lib/integrations/google')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')
    .limit(1)

  if (!vaultRows?.length) return []

  try {
    const tokens = JSON.parse(
      decrypt({
        encryptedValue: vaultRows[0].encrypted_value,
        iv: vaultRows[0].iv,
        salt: vaultRows[0].salt,
      })
    )
    const accessToken = await getValidToken(tokens)
    const files = await listFolderContents(
      accessToken,
      process.env.GOOGLE_DRIVE_VAULT_FOLDER_ID!
    )
    setCache(cacheKey, files, GOOGLE_DRIVE_CACHE_TTL_MS)
    return files
  } catch {
    return []
  }
}

export async function getVaultFileContent(
  founderId: string,
  fileId: string
): Promise<string> {
  if (!isGoogleDriveConfigured()) return ''

  const cacheKey = `drive-content:${fileId}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const { getValidToken } = await import('@/lib/integrations/google')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')
    .limit(1)

  if (!vaultRows?.length) return ''

  try {
    const tokens = JSON.parse(
      decrypt({
        encryptedValue: vaultRows[0].encrypted_value,
        iv: vaultRows[0].iv,
        salt: vaultRows[0].salt,
      })
    )
    const accessToken = await getValidToken(tokens)
    const content = await getFileContent(accessToken, fileId)
    setCache(cacheKey, content, GOOGLE_DRIVE_CACHE_TTL_MS)
    return content
  } catch {
    return ''
  }
}

export function invalidateVaultCache(founderId: string): void {
  invalidateCache(`drive-vault:${founderId}`)
}
```

**Step 2: Run type check**

```bash
pnpm run type-check
```

Expected: PASS (no TS errors)

**Step 3: Commit**

```bash
git add src/lib/integrations/google-drive.ts
git commit -m "feat(integrations): add Google Drive vault file listing & content fetch"
```

---

### Task 2: Create `/founder/notes` page (server component)

**Files:**
- Create: `src/app/(founder)/founder/notes/page.tsx`

**Description:**
Async server component that fetches vault files and passes to client shell.

**Step 1: Write the page**

```typescript
// src/app/(founder)/founder/notes/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getVaultFiles } from '@/lib/integrations/google-drive'
import { NotesPageClient } from '@/components/founder/notes/NotesPageClient'

export default async function NotesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const files = await getVaultFiles(user.id)

  return <NotesPageClient files={files} />
}
```

**Step 2: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/\(founder\)/founder/notes/page.tsx
git commit -m "feat(notes): add /founder/notes page with RSC auth guard"
```

---

### Task 3: Create `NotesPageClient` component

**Files:**
- Create: `src/components/founder/notes/NotesPageClient.tsx`
- Create: `src/components/founder/notes/FileTree.tsx`
- Create: `src/components/founder/notes/NoteViewer.tsx`

**Description:**
Client shell with split pane layout: file list on left, note content on right.

**Step 1: Write NotesPageClient**

```typescript
// src/components/founder/notes/NotesPageClient.tsx
'use client'

import { useState } from 'react'
import { DriveFile } from '@/lib/integrations/google-drive'
import { FileTree } from './FileTree'
import { NoteViewer } from './NoteViewer'

interface NotesPageClientProps {
  files: DriveFile[]
}

export function NotesPageClient({ files }: NotesPageClientProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      <FileTree files={files} onSelectFile={setSelectedFileId} />
      <NoteViewer fileId={selectedFileId} />
    </div>
  )
}
```

**Step 2: Write FileTree**

```typescript
// src/components/founder/notes/FileTree.tsx
'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { DriveFile } from '@/lib/integrations/google-drive'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  files: DriveFile[]
  onSelectFile: (fileId: string) => void
}

export function FileTree({ files, onSelectFile }: FileTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-surface-elevated flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="px-3 py-2 rounded-sm bg-surface-elevated text-color-text-primary text-sm placeholder-color-text-muted focus:outline-none focus:ring-1 focus:ring-cyan-400"
      />

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <div className="text-color-text-muted text-sm p-4">
            {files.length === 0 ? 'No notes found. Connect Google Drive.' : 'No matches.'}
          </div>
        ) : (
          filtered.map(file => (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-sm text-sm transition-colors',
                'hover:bg-surface-elevated',
                'flex items-center gap-2'
              )}
            >
              <FileText size={16} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-color-text-primary">{file.name}</div>
                <div className="text-xs text-color-text-muted">
                  {new Date(file.modifiedTime).toLocaleDateString('en-AU')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
```

**Step 3: Write NoteViewer**

```typescript
// src/components/founder/notes/NoteViewer.tsx
'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface NoteViewerProps {
  fileId: string | null
}

export function NoteViewer({ fileId }: NoteViewerProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!fileId) {
      setContent('')
      return
    }

    setLoading(true)
    setError('')

    fetch(`/api/notes/content?fileId=${fileId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setContent(data.content || '')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [fileId])

  if (!fileId) {
    return (
      <div className="flex-1 flex items-center justify-center text-color-text-muted">
        Select a note to view
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-color-text-muted">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto prose prose-invert max-w-none px-4">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-color-text-primary mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-color-text-primary mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-color-text-primary mt-4 mb-2">{children}</h3>,
          code: ({ children }) => <code className="bg-surface-elevated text-color-text-primary px-2 py-1 rounded-sm text-sm">{children}</code>,
          a: ({ href, children }) => <a href={href} className="text-cyan-400 hover:underline">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

**Step 4: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/founder/notes/
git commit -m "feat(notes): add NotesPageClient, FileTree, NoteViewer components"
```

---

### Task 4: Create `/api/notes/content` API route

**Files:**
- Create: `src/app/api/notes/content/route.ts`

**Description:**
Fetches note content by file ID using `getVaultFileContent()`.

**Step 1: Write the route**

```typescript
// src/app/api/notes/content/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getVaultFileContent } from '@/lib/integrations/google-drive'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })

  try {
    const content = await getVaultFileContent(user.id, fileId)
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch note content' },
      { status: 500 }
    )
  }
}
```

**Step 2: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/notes/content/route.ts
git commit -m "feat(api): add /api/notes/content route"
```

---

### Task 5: Add Notes to sidebar nav

**Files:**
- Modify: `src/components/layout/SidebarNav.tsx`

**Description:**
Import `FileText` icon and add Notes entry between Vault and Approvals.

**Step 1: Update imports and NAV_ITEMS**

```typescript
// Diff for src/components/layout/SidebarNav.tsx
- import { LayoutDashboard, BookOpen, Columns2, Lock, ClipboardCheck, Scale, Share2, Settings } from 'lucide-react'
+ import { LayoutDashboard, BookOpen, Columns2, Lock, FileText, ClipboardCheck, Scale, Share2, Settings } from 'lucide-react'

  const NAV_ITEMS = [
    { href: '/founder/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/founder/bookkeeper', label: 'Bookkeeper', icon: BookOpen },
    { href: '/founder/kanban',     label: 'Kanban',     icon: Columns2 },
    { href: '/founder/vault',      label: 'Vault',      icon: Lock },
+   { href: '/founder/notes',      label: 'Notes',      icon: FileText },
    { href: '/founder/approvals',  label: 'Approvals',  icon: ClipboardCheck },
    { href: '/founder/advisory',   label: 'Advisory',   icon: Scale },
    { href: '/founder/social',     label: 'Social',     icon: Share2 },
    { href: '/founder/settings',   label: 'Settings',   icon: Settings },
  ] as const
```

**Step 2: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/components/layout/SidebarNav.tsx
git commit -m "feat(sidebar): add Notes nav item between Vault and Approvals"
```

---

### Task 6: Update `.env.example` (if needed)

**Files:**
- Modify: `.env.example`

**Description:**
Verify `GOOGLE_DRIVE_VAULT_FOLDER_ID` is present in the Google section.

**Step 1: Check and update if missing**

Add to `# Google — Gmail + Calendar + Drive (Phase 4)` section:

```
GOOGLE_DRIVE_VAULT_FOLDER_ID=your-google-drive-folder-id
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(env): ensure GOOGLE_DRIVE_VAULT_FOLDER_ID documented"
```

---

### Task 7: Create E2E smoke test

**Files:**
- Create: `e2e/notes.spec.ts`

**Description:**
Smoke test: navigate to `/founder/notes`, verify auth guard and page loads.

**Step 1: Write the test**

```typescript
// e2e/notes.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Notes page', () => {
  test('loads without error and shows vault file browser', async ({ page }) => {
    await page.goto('/founder/notes')
    const url = page.url()
    expect(url).toMatch(/founder\/notes|auth\/login/)
  })
})
```

**Step 2: Run the test**

```bash
pnpm run test:e2e -- e2e/notes.spec.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add e2e/notes.spec.ts
git commit -m "test(e2e): add notes page smoke test"
```

---

### Task 8: Build & test

**Step 1: Full type check**

```bash
pnpm run type-check
```

Expected: PASS

**Step 2: Lint**

```bash
pnpm run lint
```

Expected: PASS

**Step 3: Unit tests (if any)**

```bash
pnpm run test
```

Expected: PASS (or no new failures)

**Step 4: Commit (if needed)**

If any formatting fixes were applied by linter, commit them:

```bash
git add .
git commit -m "chore: lint and format fixes"
```

---

## Success Criteria

✅ `/founder/notes` page accessible (redirects to login if unauthenticated)
✅ File list fetched from Google Drive vault folder via cached integration
✅ Clicking a file fetches and renders its markdown content
✅ Search filter works on file list
✅ Missing Google config shows soft warning, not crash
✅ Sidebar shows Notes entry
✅ All types pass, all tests pass
✅ E2E smoke test passes
