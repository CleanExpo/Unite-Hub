'use client'

import { useState } from 'react'
import { ApprovalItem } from './ApprovalItem'
import { BUSINESSES } from '@/lib/businesses'

const bizColor = (key: string) => BUSINESSES.find(b => b.key === key)?.color ?? '#555555'

const INITIAL_QUEUE = [
  { id: '1', businessKey: 'synthex', action: 'Post to LinkedIn',       detail: 'Monthly performance update — 847 words',  requestedBy: 'Nexus AI', requestedAt: '09/03/2026 09:00' },
  { id: '2', businessKey: 'dr',      action: 'Send claim update email', detail: 'To 12 pending claimants — batch send',    requestedBy: 'Nexus AI', requestedAt: '09/03/2026 08:30' },
  { id: '3', businessKey: 'nrpg',    action: 'Post to Facebook',        detail: 'NRPG member spotlight — Sarah T.',        requestedBy: 'Nexus AI', requestedAt: '09/03/2026 08:00' },
  { id: '4', businessKey: 'restore', action: 'Create Linear issue',     detail: 'Bug: login timeout on mobile — P2',       requestedBy: 'Nexus AI', requestedAt: '08/03/2026 17:00' },
]

export function ApprovalQueue() {
  const [queue, setQueue] = useState(INITIAL_QUEUE)
  const [approvedCount, setApprovedCount] = useState(0)

  function handleApprove(id: string) {
    setApprovedCount(n => n + 1)
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  function handleReject(id: string) {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div>
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-[24px]" style={{ color: 'var(--color-text-muted)' }}>&#x2713;</span>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>All caught up</p>
        </div>
      ) : (
        <div className="rounded-sm border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {queue.map((item) => (
            <ApprovalItem
              key={item.id}
              id={item.id}
              businessColor={bizColor(item.businessKey)}
              action={item.action}
              detail={item.detail}
              requestedBy={item.requestedBy}
              requestedAt={item.requestedAt}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {approvedCount > 0 && (
        <div className="mt-6 opacity-50">
          <p className="text-[10px] font-medium tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Approved ({approvedCount})
          </p>
        </div>
      )}
    </div>
  )
}
