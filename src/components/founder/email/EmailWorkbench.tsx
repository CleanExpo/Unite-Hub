'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GmailThread } from '@/lib/integrations/google'
import type { ConnectedAccountWithScope } from '@/lib/integrations/google'
import type { TriageCategory } from '@/lib/ai/capabilities/email-triage'
import { AccountTabs } from './AccountTabs'
import { ThreadList } from './ThreadList'
import { ThreadViewer } from './ThreadViewer'
import { BulkActionBar } from './BulkActionBar'
import { ReauthBanner } from './ReauthBanner'

interface TriageResult {
  thread_id: string
  category: TriageCategory
  action: string
  priority: number
}

interface Props {
  accounts: ConnectedAccountWithScope[]
}

export function EmailWorkbench({ accounts }: Props) {
  const [activeAccount, setActiveAccount] = useState(accounts[0]?.email ?? '')
  const [threads, setThreads] = useState<GmailThread[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [triageMap, setTriageMap] = useState<Record<string, { category: TriageCategory; action: string }>>({})
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Unread counts per account tab
  const unreadCounts = accounts.map(acc => ({
    ...acc,
    unreadCount: threads.filter(t => t.email === acc.email && t.unread).length,
  }))

  const loadThreads = useCallback(async (email: string, pageToken?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ account: email, maxResults: '25' })
      if (pageToken) params.set('pageToken', pageToken)

      const res = await fetch(`/api/email/threads?${params}`)
      const data = await res.json() as { threads?: GmailThread[]; nextPageToken?: string; error?: string }

      if (data.error) throw new Error(data.error)
      const incoming = data.threads ?? []

      setThreads(prev => pageToken ? [...prev, ...incoming] : incoming)
      setNextPageToken(data.nextPageToken)
    } catch (e) {
      console.error('[EmailWorkbench] load threads failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTriageResults = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/email/triage?account=${encodeURIComponent(email)}`)
      const data = await res.json() as { results?: TriageResult[] }
      if (data.results) {
        const map: Record<string, { category: TriageCategory; action: string }> = {}
        for (const r of data.results) {
          map[r.thread_id] = { category: r.category, action: r.action }
        }
        setTriageMap(map)
      }
    } catch {
      // triage results are best-effort — don't surface errors
    }
  }, [])

  // Load threads + triage results when account changes
  useEffect(() => {
    if (!activeAccount) return
    setThreads([])
    setNextPageToken(undefined)
    setActiveThreadId(null)
    setCheckedIds(new Set())
    loadThreads(activeAccount)
    loadTriageResults(activeAccount)
  }, [activeAccount, loadThreads, loadTriageResults])

  function handleAccountSelect(email: string) {
    setActiveAccount(email)
  }

  function handleCheck(id: string, checked: boolean) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function removeThread(id: string) {
    setThreads(prev => prev.filter(t => t.id !== id))
    if (activeThreadId === id) setActiveThreadId(null)
    setCheckedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function removeThreads(ids: string[]) {
    const idSet = new Set(ids)
    setThreads(prev => prev.filter(t => !idSet.has(t.id)))
    if (activeThreadId && idSet.has(activeThreadId)) setActiveThreadId(null)
    setCheckedIds(new Set())
  }

  async function handleBulkAction(action: 'archive' | 'delete' | 'read' | 'unread') {
    if (checkedIds.size === 0) return
    setBulkLoading(true)
    try {
      await fetch('/api/email/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: activeAccount, threadIds: [...checkedIds], action }),
      })
      if (action === 'archive' || action === 'delete') {
        removeThreads([...checkedIds])
      } else {
        // Update unread status in local state
        const ids = new Set(checkedIds)
        setThreads(prev => prev.map(t =>
          ids.has(t.id) ? { ...t, unread: action === 'unread' } : t
        ))
        setCheckedIds(new Set())
      }
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkTriage() {
    if (checkedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/email/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: activeAccount, threadIds: [...checkedIds] }),
      })
      const data = await res.json() as { results?: Array<{ threadId: string; category: TriageCategory; action: string }> }
      if (data.results) {
        setTriageMap(prev => {
          const next = { ...prev }
          for (const r of data.results ?? []) {
            next[r.threadId] = { category: r.category, action: r.action }
          }
          return next
        })
      }
    } finally {
      setBulkLoading(false)
    }
  }

  const reauthAccounts = accounts.filter(a => a.needsReauth)
  const connectedAccounts = accounts.filter(a => !a.needsReauth)

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Re-auth banners */}
      {reauthAccounts.length > 0 && (
        <div className="space-y-2">
          {reauthAccounts.map(a => (
            <ReauthBanner key={a.email} email={a.email} />
          ))}
        </div>
      )}

      {connectedAccounts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-white/30">No Gmail accounts with write access. Reconnect above.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 border border-white/[0.08] rounded-sm overflow-hidden">
          {/* Account tabs */}
          <div className="px-4 pt-3 pb-0 bg-zinc-950">
            <AccountTabs
              accounts={unreadCounts}
              activeAccount={activeAccount}
              onSelect={handleAccountSelect}
            />
          </div>

          {/* Split panel */}
          <div className="flex flex-1 min-h-0">
            {/* Thread list — 35% */}
            <div className="w-[35%] min-w-[260px] border-r border-white/[0.06] flex flex-col overflow-hidden">
              <ThreadList
                threads={threads.filter(t => t.email === activeAccount)}
                activeThreadId={activeThreadId}
                checkedIds={checkedIds}
                triageMap={triageMap}
                hasMore={Boolean(nextPageToken)}
                loading={loading}
                onCheck={handleCheck}
                onThreadClick={setActiveThreadId}
                onLoadMore={() => loadThreads(activeAccount, nextPageToken)}
              />
            </div>

            {/* Thread viewer — 65% */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {activeThreadId ? (
                <ThreadViewer
                  key={activeThreadId}
                  threadId={activeThreadId}
                  account={activeAccount}
                  onArchive={() => removeThread(activeThreadId)}
                  onDelete={() => removeThread(activeThreadId)}
                  onClose={() => setActiveThreadId(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-white/20">Select a thread to read</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar — floats above content */}
      <BulkActionBar
        selectedCount={checkedIds.size}
        onArchive={() => handleBulkAction('archive')}
        onDelete={() => handleBulkAction('delete')}
        onMarkRead={() => handleBulkAction('read')}
        onTriage={handleBulkTriage}
        loading={bulkLoading}
      />
    </div>
  )
}
