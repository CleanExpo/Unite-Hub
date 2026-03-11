# Nexus 2.0 Production Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Take Nexus 2.0 from current state (Phase 3 complete, Phase 4 7/9) to a deployed production application with live KPI dashboard, Bron Capture (idea → Linear pipeline), Bron AI sidebar, Strategy Room, and full production hardening.

**Architecture:** Extend existing Next.js App Router patterns — all new API routes follow the `getUser()` auth guard + `founder_id` RLS filter pattern. Global UI panels (Capture, Bron) are added to `FounderShell` and controlled via Zustand `useUIStore`. Claude API calls follow the advisory cases pattern already established.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Zustand, Framer Motion, Anthropic SDK (`@anthropic-ai/sdk`), Linear GraphQL API, Tailwind CSS, Vitest + React Testing Library, Playwright

---

## Task 1: Linear KPI Data on Dashboard

**Goal:** Add active Linear issue count per business as the secondary metric on each KPI card.

**Files:**
- Modify: `src/lib/integrations/linear.ts`
- Create: `src/app/api/linear/kpi/route.ts`
- Modify: `src/components/founder/dashboard/KPICard.tsx`
- Modify: `src/components/founder/dashboard/KPIGrid.tsx`
- Create: `src/components/founder/dashboard/__tests__/KPICard.test.tsx`

---

### Step 1: Write the failing test

```tsx
// src/components/founder/dashboard/__tests__/KPICard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { KPICard } from '../KPICard'
import { BUSINESSES } from '@/lib/businesses'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, className }: any) => <div className={className}>{children}</div> },
}))

const business = BUSINESSES.find(b => b.key === 'restore')!

describe('KPICard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows linear issue count in secondary when linearBusinessKey provided', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { revenueCents: 9900, growth: 5.2, invoiceCount: 3 }, source: 'mock' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeCount: 4 }) })

    render(
      <KPICard
        business={business}
        metric="—"
        metricLabel="Revenue MTD"
        trend={{ value: '—', positive: true }}
        secondary="Loading..."
        xeroBusinessKey="restore"
        linearBusinessKey="restore"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('4 active issues')).toBeInTheDocument()
    })
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run src/components/founder/dashboard/__tests__/KPICard.test.tsx
```
Expected: FAIL — `linearBusinessKey` prop does not exist yet.

### Step 3: Add `fetchIssueCountByBusiness` to `linear.ts`

Add at the bottom of `src/lib/integrations/linear.ts`:

```typescript
// Returns active (non-completed, non-cancelled) issue count per business key
export async function fetchIssueCountByBusiness(): Promise<Record<string, number>> {
  const issues = await fetchIssues()
  const counts: Record<string, number> = {}
  for (const issue of issues) {
    const bizKey = teamKeyToBusiness(issue.team.key)
    counts[bizKey] = (counts[bizKey] ?? 0) + 1
  }
  return counts
}
```

### Step 4: Create `/api/linear/kpi/route.ts`

```typescript
// src/app/api/linear/kpi/route.ts
// GET /api/linear/kpi?business=<key>
// Returns active issue count for one business

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchIssueCountByBusiness } from '@/lib/integrations/linear'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ activeCount: 0, configured: false })
  }

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? ''

  try {
    const counts = await fetchIssueCountByBusiness()
    return NextResponse.json({ activeCount: counts[business] ?? 0, configured: true })
  } catch {
    return NextResponse.json({ activeCount: 0, configured: false })
  }
}
```

### Step 5: Update `KPICard` to accept and fetch `linearBusinessKey`

Add to the `KPICardProps` interface:
```typescript
linearBusinessKey?: string
```

Add a second `useEffect` after the existing Xero one:
```typescript
useEffect(() => {
  if (!linearBusinessKey) return
  fetch(`/api/linear/kpi?business=${encodeURIComponent(linearBusinessKey)}`)
    .then(res => res.json() as Promise<{ activeCount: number }>)
    .then(({ activeCount }) => {
      // Only update secondary if we don't already have Xero secondary data
      // Xero secondary takes priority — Linear count is the fallback
      setLinearCount(activeCount)
    })
    .catch(() => {}) // Silent — not critical
}, [linearBusinessKey])
```

Add `const [linearCount, setLinearCount] = useState<number | null>(null)` to component state.

Update the secondary display line:
```typescript
const displaySecondary = live.secondary
  ?? (linearCount !== null ? `${linearCount} active issue${linearCount !== 1 ? 's' : ''}` : secondary)
```

### Step 6: Update `KPIGrid` to pass `linearBusinessKey`

In `DASHBOARD_DATA`, add `linearBusinessKey` matching the business key for all active businesses (same value as `key`):
```typescript
{ key: 'dr', ..., xeroBusinessKey: 'dr', linearBusinessKey: 'dr' },
// repeat for all 8 entries
```

### Step 7: Run test to verify it passes

```bash
pnpm vitest run src/components/founder/dashboard/__tests__/KPICard.test.tsx
```
Expected: PASS

### Step 8: Commit

```bash
git add src/lib/integrations/linear.ts src/app/api/linear/kpi/route.ts \
  src/components/founder/dashboard/KPICard.tsx \
  src/components/founder/dashboard/KPIGrid.tsx \
  src/components/founder/dashboard/__tests__/KPICard.test.tsx
git commit -m "feat(dashboard): add Linear active issue count to KPI cards"
```

---

## Task 2: Idea → Linear Pipeline — Core Logic

**Goal:** Build the conversation engine that turns raw text into a structured Linear spec via Claude qualifying questions.

**Files:**
- Create: `src/lib/ideas/conversation.ts`
- Create: `src/lib/ideas/__tests__/conversation.test.ts`

---

### Step 1: Write failing tests

```typescript
// src/lib/ideas/__tests__/conversation.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, parseClaudeResponse } from '../conversation'

describe('parseClaudeResponse', () => {
  it('detects a JSON spec block', () => {
    const raw = `Sure thing!\n\`\`\`json\n{"type":"spec","title":"Add PDF export","teamKey":"RA","priority":2,"labels":["feature"],"description":"Allow export","acceptanceCriteria":["PDF downloads"]}\n\`\`\``
    const result = parseClaudeResponse(raw)
    expect(result.type).toBe('spec')
    expect(result.spec?.title).toBe('Add PDF export')
  })

  it('returns a question when no spec block present', () => {
    const raw = "I'd classify this as a Feature Request. Does that sound right?"
    const result = parseClaudeResponse(raw)
    expect(result.type).toBe('question')
    expect(result.question).toBe(raw)
  })
})

describe('buildSystemPrompt', () => {
  it('includes all business keys', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('dr')
    expect(prompt).toContain('synthex')
    expect(prompt).toContain('restore')
  })
})
```

### Step 2: Run tests to verify they fail

```bash
pnpm vitest run src/lib/ideas/__tests__/conversation.test.ts
```
Expected: FAIL — module not found

### Step 3: Implement `src/lib/ideas/conversation.ts`

```typescript
// src/lib/ideas/conversation.ts
import { BUSINESSES } from '@/lib/businesses'

// Business key → Linear team key mapping
export const BUSINESS_TO_TEAM_KEY: Record<string, string> = {
  dr:       'DR',
  dr_qld:   'DR',
  nrpg:     'DR',
  carsi:    'GP',
  restore:  'RA',
  synthex:  'SYN',
  ato:      'UNI',
  ccw:      'UNI',
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface IdeaSpec {
  title: string
  teamKey: string
  priority: number  // 1=urgent 2=high 3=normal 4=low
  labels: string[]
  description: string
  acceptanceCriteria: string[]
}

export type ClaudeResponse =
  | { type: 'question'; question: string }
  | { type: 'spec'; spec: IdeaSpec }

export function buildSystemPrompt(): string {
  const businessList = BUSINESSES.map(b => `- ${b.key}: ${b.name} → team key: ${BUSINESS_TO_TEAM_KEY[b.key]}`).join('\n')

  return `You are Bron, a concise AI assistant for Phill McGurk's founder CRM.

Your job: turn raw ideas into structured Linear issues through a short qualifying conversation.

## Rules
- Ask ONE qualifying question at a time — never multiple questions in one message
- Always include your recommendation AND the reason for it in each question
- Max 4 questions total — if you have enough context, produce the spec
- Keep questions short and conversational
- When you have enough to write a good spec, output ONLY the JSON block below — no surrounding text

## Businesses
${businessList}

## When ready to produce the spec, output this exact format (and ONLY this):
\`\`\`json
{
  "type": "spec",
  "title": "<concise action-oriented title>",
  "teamKey": "<Linear team key from list above>",
  "priority": <1=urgent|2=high|3=normal|4=low>,
  "labels": ["<label1>", "<label2>"],
  "description": "<markdown description, 2-3 sentences>",
  "acceptanceCriteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>"]
}
\`\`\`

## Priority guidance (always state your recommendation + reason)
- 1 Urgent: production broken, client blocked right now
- 2 High: important, affects revenue or key workflow
- 3 Normal: useful improvement, no time pressure
- 4 Low: nice to have`
}

export function parseClaudeResponse(raw: string): ClaudeResponse {
  // Look for a JSON code block
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as IdeaSpec & { type: string }
      if (parsed.type === 'spec') {
        return { type: 'spec', spec: parsed }
      }
    } catch {
      // Fall through to question
    }
  }
  return { type: 'question', question: raw }
}
```

### Step 4: Run tests to verify they pass

```bash
pnpm vitest run src/lib/ideas/__tests__/conversation.test.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/ideas/conversation.ts src/lib/ideas/__tests__/conversation.test.ts
git commit -m "feat(ideas): add conversation engine for idea → Linear pipeline"
```

---

## Task 3: Idea → Linear Pipeline — API Routes

**Goal:** Two API routes — one for the conversation (Claude), one for creating the Linear issue.

**Files:**
- Create: `src/app/api/ideas/capture/route.ts`
- Create: `src/app/api/ideas/create/route.ts`
- Modify: `src/lib/integrations/linear.ts` (add `createIssue` mutation)

---

### Step 1: Add `createIssue` to `linear.ts`

Add after `updateIssueState`:

```typescript
export interface CreateIssueInput {
  teamKey: string
  title: string
  description: string
  priority: number
  labels?: string[]
}

export async function resolveTeamId(teamKey: string): Promise<string> {
  const teams = await fetchTeamStates()
  const team = teams.find(t => t.key === teamKey)
  if (!team) throw new Error(`Linear team not found: ${teamKey}`)
  return team.id
}

export async function createIssue(input: CreateIssueInput): Promise<string> {
  const teamId = await resolveTeamId(input.teamKey)

  const data = await gql<{ issueCreate: { issue: { id: string; identifier: string } } }>(`
    mutation CreateIssue($teamId: String!, $title: String!, $description: String, $priority: Int) {
      issueCreate(input: {
        teamId: $teamId
        title: $title
        description: $description
        priority: $priority
      }) {
        issue { id identifier }
      }
    }
  `, {
    teamId,
    title: input.title,
    description: input.description,
    priority: input.priority,
  })

  return data.issueCreate.issue.identifier
}
```

### Step 2: Create `/api/ideas/capture/route.ts`

```typescript
// src/app/api/ideas/capture/route.ts
// POST: Run one turn of the Bron qualifying conversation
// Body: { messages: ConversationMessage[], rawIdea: string }
// Returns: { type: 'question', question: string } | { type: 'spec', spec: IdeaSpec }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'
import { buildSystemPrompt, parseClaudeResponse, type ConversationMessage } from '@/lib/ideas/conversation'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { messages, rawIdea } = await request.json() as {
    messages: ConversationMessage[]
    rawIdea: string
  }

  if (!rawIdea?.trim()) {
    return NextResponse.json({ error: 'rawIdea is required' }, { status: 400 })
  }

  // Build message history — first message is always the raw idea
  const history: ConversationMessage[] = messages.length === 0
    ? [{ role: 'user', content: rawIdea }]
    : messages

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: history,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = parseClaudeResponse(raw)

  return NextResponse.json(parsed)
}
```

### Step 3: Create `/api/ideas/create/route.ts`

```typescript
// src/app/api/ideas/create/route.ts
// POST: Create approved spec as a Linear issue
// Body: { spec: IdeaSpec }
// Returns: { identifier: string } — e.g. "RA-42"

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createIssue, type CreateIssueInput } from '@/lib/integrations/linear'
import type { IdeaSpec } from '@/lib/ideas/conversation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ error: 'Linear not configured' }, { status: 503 })
  }

  const { spec } = await request.json() as { spec: IdeaSpec }

  const acceptanceBlock = spec.acceptanceCriteria.length > 0
    ? `\n\n**Acceptance criteria:**\n${spec.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`
    : ''

  const input: CreateIssueInput = {
    teamKey: spec.teamKey,
    title: spec.title,
    description: spec.description + acceptanceBlock,
    priority: spec.priority,
    labels: spec.labels,
  }

  try {
    const identifier = await createIssue(input)
    return NextResponse.json({ identifier })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create issue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

### Step 4: Run type-check

```bash
pnpm run type-check
```
Expected: No errors

### Step 5: Commit

```bash
git add src/lib/integrations/linear.ts \
  src/app/api/ideas/capture/route.ts \
  src/app/api/ideas/create/route.ts
git commit -m "feat(ideas): add capture and create API routes for idea → Linear pipeline"
```

---

## Task 4: Idea Capture UI Panel

**Goal:** Slide-out panel in the topbar that hosts the qualifying conversation and spec confirmation.

**Files:**
- Modify: `src/store/ui.ts` (add `captureOpen`)
- Create: `src/components/layout/IdeaCapture.tsx`
- Modify: `src/components/layout/Topbar.tsx` (add capture icon)
- Modify: `src/components/layout/FounderShell.tsx` (render panel)

---

### Step 1: Add `captureOpen` to Zustand store

In `src/store/ui.ts`, add to the `UIStore` interface:
```typescript
captureOpen: boolean
toggleCapture: () => void
```

Add to the store implementation:
```typescript
captureOpen: false,
toggleCapture: () => set((s) => ({ captureOpen: !s.captureOpen })),
```

Do NOT add `captureOpen` to `partialize` — it should reset on page refresh.

### Step 2: Create `IdeaCapture.tsx`

```tsx
// src/components/layout/IdeaCapture.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Zap, CheckCircle, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { ConversationMessage, IdeaSpec, ClaudeResponse } from '@/lib/ideas/conversation'

type PanelState = 'input' | 'conversation' | 'spec' | 'success'

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low',
}

export function IdeaCapture() {
  const captureOpen = useUIStore((s) => s.captureOpen)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  const [state, setState] = useState<PanelState>('input')
  const [rawIdea, setRawIdea] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [spec, setSpec] = useState<IdeaSpec | null>(null)
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset on close
  useEffect(() => {
    if (!captureOpen) {
      setTimeout(() => {
        setState('input')
        setRawIdea('')
        setMessages([])
        setSpec(null)
        setLoading(false)
        setSuccessId(null)
        setUserInput('')
      }, 300)
    }
  }, [captureOpen])

  async function sendToCapture(newMessages: ConversationMessage[]) {
    setLoading(true)
    try {
      const res = await fetch('/api/ideas/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, rawIdea }),
      })
      const data = await res.json() as ClaudeResponse

      if (data.type === 'spec') {
        setSpec(data.spec)
        setState('spec')
      } else {
        const assistantMsg: ConversationMessage = { role: 'assistant', content: data.question }
        setMessages([...newMessages, assistantMsg])
        setState('conversation')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleInitialSubmit() {
    if (!rawIdea.trim()) return
    const initial: ConversationMessage[] = [{ role: 'user', content: rawIdea }]
    setMessages(initial)
    setState('conversation')
    await sendToCapture(initial)
  }

  async function handleAnswer() {
    if (!userInput.trim()) return
    const userMsg: ConversationMessage = { role: 'user', content: userInput }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setUserInput('')
    await sendToCapture(newMessages)
  }

  async function handleCreate() {
    if (!spec) return
    setLoading(true)
    try {
      const res = await fetch('/api/ideas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec }),
      })
      const data = await res.json() as { identifier: string }
      setSuccessId(data.identifier)
      setState('success')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {captureOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 z-40 md:hidden bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleCapture}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col border-l"
            style={{ background: 'var(--surface-overlay)', borderColor: 'var(--color-border)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 h-12 border-b shrink-0"
              style={{ borderColor: 'var(--color-border)' }}>
              <Zap size={14} style={{ color: '#00F5FF' }} />
              <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Capture Idea
              </span>
              <button onClick={toggleCapture} className="ml-auto transition-colors"
                style={{ color: 'var(--color-text-disabled)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Input state */}
              {state === 'input' && (
                <div className="space-y-3">
                  <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                    Type your idea in plain language. Bron will ask a few questions, then create the Linear issue.
                  </p>
                  <textarea
                    ref={textareaRef}
                    value={rawIdea}
                    onChange={e => setRawIdea(e.target.value)}
                    placeholder="I want to add..."
                    rows={5}
                    className="w-full resize-none rounded-sm border bg-transparent px-3 py-2 text-[13px] outline-none"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleInitialSubmit() }}
                  />
                  <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                    ⌘↵ to send
                  </p>
                </div>
              )}

              {/* Conversation state */}
              {(state === 'conversation') && (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[85%] rounded-sm px-3 py-2 text-[12px] leading-relaxed"
                        style={{
                          background: msg.role === 'user' ? 'rgba(0,245,255,0.08)' : 'var(--surface-card)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
                        Bron is thinking…
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spec state */}
              {state === 'spec' && spec && (
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#00F5FF' }}>
                    Ready to create
                  </p>
                  <div className="rounded-sm border p-4 space-y-3 text-[12px]"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}>
                    <p className="font-semibold text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
                      {spec.title}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] border"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {spec.teamKey}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm text-[10px] border"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {PRIORITY_LABEL[spec.priority]}
                      </span>
                      {spec.labels.map(l => (
                        <span key={l} className="px-2 py-0.5 rounded-sm text-[10px] border"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}>
                          {l}
                        </span>
                      ))}
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{spec.description}</p>
                    {spec.acceptanceCriteria.length > 0 && (
                      <ul className="space-y-1 list-none">
                        {spec.acceptanceCriteria.map((c, i) => (
                          <li key={i} className="flex gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                            <span style={{ color: '#00F5FF' }}>✓</span> {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Success state */}
              {state === 'success' && (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <CheckCircle size={32} style={{ color: '#00F5FF' }} />
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Issue created
                  </p>
                  {successId && (
                    <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
                      {successId} added to Linear
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t shrink-0 space-y-2"
              style={{ borderColor: 'var(--color-border)' }}>

              {state === 'input' && (
                <button
                  onClick={handleInitialSubmit}
                  disabled={!rawIdea.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 h-8 rounded-sm text-[12px] font-medium transition-colors disabled:opacity-40"
                  style={{ background: '#00F5FF', color: '#050505' }}
                >
                  <Send size={12} />
                  Send to Bron
                </button>
              )}

              {state === 'conversation' && !loading && (
                <div className="flex gap-2">
                  <input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAnswer() }}
                    placeholder="Your answer..."
                    className="flex-1 h-8 px-3 rounded-sm border bg-transparent text-[12px] outline-none"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    autoFocus
                  />
                  <button onClick={handleAnswer}
                    className="px-3 h-8 rounded-sm flex items-center justify-center transition-colors"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                    <Send size={12} />
                  </button>
                </div>
              )}

              {state === 'spec' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 h-8 rounded-sm text-[12px] font-medium transition-colors disabled:opacity-40"
                    style={{ background: '#00F5FF', color: '#050505' }}
                  >
                    Create in Linear
                  </button>
                  <button
                    onClick={toggleCapture}
                    className="px-3 h-8 rounded-sm flex items-center justify-center transition-colors"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-disabled)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}

              {state === 'success' && (
                <button
                  onClick={toggleCapture}
                  className="w-full h-8 rounded-sm text-[12px] transition-colors"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### Step 3: Add capture icon to `Topbar.tsx`

Add import at top: `import { Zap } from 'lucide-react'`

Add `toggleCapture` from store: `const toggleCapture = useUIStore((s) => s.toggleCapture)`

Add button in the right actions `div`, before the Search button:
```tsx
<button
  onClick={toggleCapture}
  className="transition-colors"
  style={{ color: 'var(--color-text-disabled)' }}
  aria-label="Capture idea"
  title="Capture idea (send to Linear)"
>
  <Zap size={16} strokeWidth={1.75} />
</button>
```

### Step 4: Render `IdeaCapture` in `FounderShell`

Add import: `import { IdeaCapture } from './IdeaCapture'`

Add inside the outer `div`, after the `<main>` block:
```tsx
<IdeaCapture />
```

### Step 5: Run type-check

```bash
pnpm run type-check
```
Expected: No errors

### Step 6: Commit

```bash
git add src/store/ui.ts \
  src/components/layout/IdeaCapture.tsx \
  src/components/layout/Topbar.tsx \
  src/components/layout/FounderShell.tsx
git commit -m "feat(ideas): add Bron Capture panel — idea → Linear pipeline UI"
```

---

## Task 5: Bron AI Sidebar

**Goal:** Context-aware AI chat sidebar accessible from anywhere in the app.

**Files:**
- Create: `src/app/api/bron/chat/route.ts`
- Create: `src/components/layout/BronSidebar.tsx`
- Modify: `src/store/ui.ts` (add `bronOpen`)
- Modify: `src/components/layout/Topbar.tsx` (add Bron icon)
- Modify: `src/components/layout/FounderShell.tsx` (render sidebar)

---

### Step 1: Add `bronOpen` to Zustand store

In `src/store/ui.ts`, add to the `UIStore` interface:
```typescript
bronOpen: boolean
toggleBron: () => void
```

Add to store implementation:
```typescript
bronOpen: false,
toggleBron: () => set((s) => ({ bronOpen: !s.bronOpen })),
```

### Step 2: Create `/api/bron/chat/route.ts`

```typescript
// src/app/api/bron/chat/route.ts
// POST: Single-turn Bron AI response with page context
// Body: { messages: {role, content}[], pageContext?: string, businessContext?: string }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildBronSystem(pageContext?: string, businessContext?: string): string {
  return `You are Bron, a concise AI assistant embedded in Phill McGurk's private founder CRM (Unite-Group Nexus).

Phill runs 8 businesses: Disaster Recovery, NRPG, CARSI, RestoreAssist, Synthex, ATO Tax Optimizer, CCW-ERP/CRM.

${pageContext ? `Current page: ${pageContext}` : ''}
${businessContext ? `Current business context: ${businessContext}` : ''}

Rules:
- Be concise — Phill is a founder, not a developer
- Provide recommendations with reasoning when asked
- Reference specific business data when available
- Never make up financial figures — say "I don't have that data" if unsure
- Format responses clearly with markdown when helpful`
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { messages, pageContext, businessContext } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    pageContext?: string
    businessContext?: string
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildBronSystem(pageContext, businessContext),
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ content: text })
}
```

### Step 3: Create `BronSidebar.tsx`

```tsx
// src/components/layout/BronSidebar.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { usePathname } from 'next/navigation'

interface Message { role: 'user' | 'assistant'; content: string }

export function BronSidebar() {
  const bronOpen = useUIStore((s) => s.bronOpen)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const pathname = usePathname()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/bron/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, pageContext: pathname }),
      })
      const data = await res.json() as { content: string }
      setMessages([...newMessages, { role: 'assistant', content: data.content }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {bronOpen && (
        <motion.div
          className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col border-l"
          style={{ background: 'var(--surface-overlay)', borderColor: 'var(--color-border)' }}
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 h-12 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)' }}>
            <MessageSquare size={14} style={{ color: '#00F5FF' }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Bron
            </span>
            <button onClick={toggleBron} className="ml-auto"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
                Ask me anything about your businesses, data, or strategy.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-sm px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user' ? 'rgba(0,245,255,0.08)' : 'var(--surface-card)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask Bron..."
                className="flex-1 h-8 px-3 rounded-sm border bg-transparent text-[12px] outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="px-3 h-8 rounded-sm flex items-center justify-center disabled:opacity-40"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Step 4: Add Bron icon to Topbar, render in FounderShell

In `Topbar.tsx`: Add `import { MessageSquare } from 'lucide-react'`, add `toggleBron` from store, add button next to the Zap icon:
```tsx
<button onClick={toggleBron} className="transition-colors"
  style={{ color: 'var(--color-text-disabled)' }} aria-label="Bron AI">
  <MessageSquare size={16} strokeWidth={1.75} />
</button>
```

In `FounderShell.tsx`: Add `import { BronSidebar } from './BronSidebar'` and render `<BronSidebar />` alongside `<IdeaCapture />`.

### Step 5: Run type-check and commit

```bash
pnpm run type-check
git add src/store/ui.ts src/app/api/bron/chat/route.ts \
  src/components/layout/BronSidebar.tsx \
  src/components/layout/Topbar.tsx \
  src/components/layout/FounderShell.tsx
git commit -m "feat(bron): add Bron AI chat sidebar"
```

---

## Task 6: Strategy Room

**Goal:** Dedicated page for deep business analysis using Claude Opus with extended thinking.

**Files:**
- Create: `src/app/api/strategy/analyze/route.ts`
- Create: `src/app/(founder)/founder/strategy/page.tsx`
- Create: `src/components/founder/strategy/StrategyRoomClient.tsx`

---

### Step 1: Create `/api/strategy/analyze/route.ts`

```typescript
// src/app/api/strategy/analyze/route.ts
// POST: Deep strategic analysis using Claude Opus with extended thinking
// Body: { prompt: string, businessContext?: string }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { prompt, businessContext } = await request.json() as {
    prompt: string
    businessContext?: string
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const systemPrompt = `You are a strategic advisor to Phill McGurk, founder of Unite-Group which oversees 8 businesses.
${businessContext ? `\nFocus: ${businessContext}` : ''}
Provide structured, actionable analysis. Use markdown headers and bullet points.
Be direct — Phill needs decisions, not theory.`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 16000,
    thinking: { type: 'enabled', budget_tokens: 10000 },
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const output = response.content
    .filter(b => b.type === 'text')
    .map(b => b.type === 'text' ? b.text : '')
    .join('\n\n')

  return NextResponse.json({ output })
}
```

### Step 2: Create `StrategyRoomClient.tsx`

```tsx
// src/components/founder/strategy/StrategyRoomClient.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { BUSINESSES } from '@/lib/businesses'

export function StrategyRoomClient() {
  const [prompt, setPrompt] = useState('')
  const [business, setBusiness] = useState<string>('')
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setOutput(null)

    try {
      const bizContext = business
        ? `Business: ${BUSINESSES.find(b => b.key === business)?.name}`
        : undefined

      const res = await fetch('/api/strategy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, businessContext: bizContext }),
      })
      const data = await res.json() as { output: string }
      setOutput(data.output)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Business selector */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest"
          style={{ color: 'var(--color-text-disabled)' }}>
          Business context (optional)
        </label>
        <select
          value={business}
          onChange={e => setBusiness(e.target.value)}
          className="w-full h-9 px-3 rounded-sm border bg-transparent text-[13px] outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All businesses</option>
          {BUSINESSES.map(b => (
            <option key={b.key} value={b.key}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest"
          style={{ color: 'var(--color-text-disabled)' }}>
          Your question or challenge
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What strategic decision are you thinking through?"
          rows={6}
          className="w-full resize-none rounded-sm border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <button
        onClick={analyze}
        disabled={!prompt.trim() || loading}
        className="flex items-center gap-2 px-4 h-9 rounded-sm text-[13px] font-medium transition-colors disabled:opacity-40"
        style={{ background: '#00F5FF', color: '#050505' }}
      >
        <Brain size={14} />
        {loading ? 'Analysing…' : 'Analyse with Opus'}
      </button>

      {loading && (
        <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          Opus is thinking. Extended analysis takes 15–30 seconds.
        </p>
      )}

      {output && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border p-6 prose prose-invert prose-sm max-w-none"
          style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
        >
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-primary)' }}>
            {output}
          </div>
        </motion.div>
      )}
    </div>
  )
}
```

### Step 3: Create strategy page

```tsx
// src/app/(founder)/founder/strategy/page.tsx
export const dynamic = 'force-dynamic'

import { StrategyRoomClient } from '@/components/founder/strategy/StrategyRoomClient'

export default function StrategyPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Strategy Room
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Deep analysis with Claude Opus — extended thinking enabled.
        </p>
      </div>
      <StrategyRoomClient />
    </div>
  )
}
```

### Step 4: Add Strategy to sidebar breadcrumb map

In `Topbar.tsx`, add to `BREADCRUMB_MAP`:
```typescript
'/founder/strategy': 'Strategy Room',
```

### Step 5: Run type-check and commit

```bash
pnpm run type-check
git add src/app/api/strategy/analyze/route.ts \
  src/components/founder/strategy/StrategyRoomClient.tsx \
  src/app/'(founder)'/founder/strategy/page.tsx \
  src/components/layout/Topbar.tsx
git commit -m "feat(strategy): add Strategy Room with Opus extended thinking"
```

---

## Task 7: Security Audit

**Agent:** `code-auditor` + `database-architect`

**Checklist:**

### Step 1: Verify auth on every API route

Run this grep to find routes missing `getUser()`:
```bash
grep -rL "getUser" src/app/api --include="route.ts"
```
Any file listed is missing auth. Add `getUser()` guard to each.

### Step 2: Verify RLS on all Supabase tables

```bash
pnpm run type-check
```

Then check Supabase dashboard → Authentication → Policies. Every table must have:
- SELECT: `founder_id = auth.uid()`
- INSERT: `founder_id = auth.uid()`
- UPDATE: `founder_id = auth.uid()`
- DELETE: `founder_id = auth.uid()`

### Step 3: Verify `.env.example` is complete

Check that every `process.env.X` reference in `src/` has a corresponding entry in `.env.example`:
```bash
grep -roh "process\.env\.[A-Z_]*" src/ | sort -u
```
Compare output against `.env.example`. Add any missing keys with placeholder values.

### Step 4: Commit

```bash
git add src/app/api/ .env.example
git commit -m "security: auth guards on all routes, RLS verified, env.example complete"
```

---

## Task 8: End-to-End Tests (Playwright)

**Agent:** `qa-tester`

**Files:**
- Create: `e2e/auth.spec.ts`
- Create: `e2e/dashboard.spec.ts`
- Create: `e2e/idea-capture.spec.ts`
- Create: `e2e/vault.spec.ts`

---

### Step 1: Verify Playwright is installed

```bash
pnpm list @playwright/test
```
If not listed: `pnpm add -D @playwright/test`

Check for `playwright.config.ts` at repo root. If missing, create:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
})
```

### Step 2: Write critical path tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/founder/dashboard')
  await expect(page).toHaveURL(/auth\/login/)
})

test('health endpoint returns 200', async ({ page }) => {
  const res = await page.request.get('/api/health')
  expect(res.status()).toBe(200)
})
```

```typescript
// e2e/dashboard.spec.ts
// Note: requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Login via UI
  await page.goto('/auth/login')
  await page.fill('[type=email]', process.env.PLAYWRIGHT_TEST_EMAIL!)
  await page.fill('[type=password]', process.env.PLAYWRIGHT_TEST_PASSWORD!)
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')
})

test('dashboard renders KPI grid', async ({ page }) => {
  await expect(page.locator('[data-testid="kpi-grid"]')).toBeVisible()
})

test('sidebar navigation works', async ({ page }) => {
  await page.click('a[href="/founder/kanban"]')
  await expect(page).toHaveURL('/founder/kanban')
})

test('vault page loads without error', async ({ page }) => {
  await page.goto('/founder/vault')
  await expect(page.locator('h1')).toContainText('Vault')
})
```

```typescript
// e2e/idea-capture.spec.ts
import { test, expect } from '@playwright/test'

test('capture panel opens from topbar', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('[type=email]', process.env.PLAYWRIGHT_TEST_EMAIL!)
  await page.fill('[type=password]', process.env.PLAYWRIGHT_TEST_PASSWORD!)
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')

  await page.click('[aria-label="Capture idea"]')
  await expect(page.locator('text=Capture Idea')).toBeVisible()
  await expect(page.locator('textarea')).toBeVisible()
})
```

### Step 3: Run tests

```bash
pnpm exec playwright test
```
Expected: All tests pass against local dev server.

### Step 4: Commit

```bash
git add e2e/ playwright.config.ts
git commit -m "test(e2e): add Playwright suite — auth, dashboard, idea capture, vault"
```

---

## Task 9: Performance + Monitoring

**Agent:** `devops-engineer`

### Step 1: Add `data-testid` attributes to KPI grid

In `KPIGrid.tsx`, add to the outer wrapper div:
```tsx
<div data-testid="kpi-grid" className="grid ...">
```

### Step 2: Run Lighthouse audit locally

```bash
pnpm exec lighthouse http://localhost:3000/founder/dashboard \
  --output=json --output-path=./lighthouse-report.json \
  --chrome-flags="--headless"
```
Target: `performance >= 90`, `accessibility >= 90`, `best-practices >= 90`, `seo >= 90`.

Fix any failing audits before proceeding.

### Step 3: Add Vercel Analytics

In `src/app/layout.tsx`, add:
```tsx
import { Analytics } from '@vercel/analytics/react'
// Inside <body>:
<Analytics />
```

Install if needed: `pnpm add @vercel/analytics`

### Step 4: Commit

```bash
git add src/ .env.example
git commit -m "feat(monitoring): add Vercel Analytics, performance audit complete"
```

---

## Task 10: Production Deploy

**Agent:** `devops-engineer`

### Step 1: Verify all required env vars are set in Vercel dashboard

Check each variable from `.env.example` is set in Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `LINEAR_API_KEY`
- `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `ENCRYPTION_KEY`

### Step 2: Run final pre-deploy checks

```bash
pnpm run type-check && pnpm run lint && pnpm vitest run
```
Expected: All green. Fix any failures before proceeding.

### Step 3: Push branch and create PR

```bash
git push origin claude/modest-saha
gh pr create --base main \
  --title "feat: Nexus 2.0 production release" \
  --body "Live KPI dashboard, Bron Capture (idea → Linear), Bron AI sidebar, Strategy Room, E2E tests, production hardening."
```

### Step 4: Verify production deployment

After merge and deploy:
1. Open `https://nexus.unite.group` (or Vercel deployment URL)
2. Login confirms auth works
3. Dashboard shows KPI cards loading
4. Capture icon in topbar opens panel
5. `/api/health` returns `{ status: 'ok' }`

---

## Post-Launch (Phase 4.5)

These are deferred — start platform app registrations now so approvals run in parallel:

| Item | Action |
|------|--------|
| Social OAuth — Facebook/Instagram | Register app at developers.facebook.com |
| Social OAuth — TikTok | Register at developers.tiktok.com (longest approval) |
| Social OAuth — LinkedIn | Register at developer.linkedin.com |
| Social OAuth — YouTube | Uses existing Google OAuth client (add YouTube scope) |
| Obsidian bridge | Google Drive folder read — reuse existing Google OAuth |
