'use client'

import type { GmailThread } from '@/lib/integrations/google'
import type { TriageCategory } from '@/lib/ai/capabilities/email-triage'
import { ThreadRow } from './ThreadRow'

interface TriageMap {
  [threadId: string]: { category: TriageCategory; action: string }
}

interface Props {
  threads: GmailThread[]
  activeThreadId: string | null
  checkedIds: Set<string>
  triageMap: TriageMap
  hasMore: boolean
  loading: boolean
  onCheck: (id: string, checked: boolean) => void
  onThreadClick: (id: string) => void
  onLoadMore: () => void
}

export function ThreadList({
  threads,
  activeThreadId,
  checkedIds,
  triageMap,
  hasMore,
  loading,
  onCheck,
  onThreadClick,
  onLoadMore,
}: Props) {
  if (threads.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/30">No threads found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {threads.map(thread => (
          <ThreadRow
            key={`${thread.email}-${thread.id}`}
            thread={thread}
            selected={checkedIds.has(thread.id)}
            active={thread.id === activeThreadId}
            triageInfo={triageMap[thread.id]}
            onCheck={onCheck}
            onClick={onThreadClick}
          />
        ))}

        {loading && (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-white/30">Loading…</span>
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={onLoadMore}
            className="w-full py-3 text-xs text-white/40 hover:text-white/70 transition-colors border-t border-white/[0.04]"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  )
}
