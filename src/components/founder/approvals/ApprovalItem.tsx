'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ApprovalItemProps {
  id: string
  businessColor: string
  action: string
  detail: string
  requestedBy: string
  requestedAt: string
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function ApprovalItem({
  id, businessColor, action, detail, requestedBy, requestedAt, onApprove, onReject,
}: ApprovalItemProps) {
  const [exiting, setExiting] = useState<'approve' | 'reject' | null>(null)

  function handleApprove() {
    setExiting('approve')
    setTimeout(() => onApprove(id), 200)
  }

  function handleReject() {
    setExiting('reject')
    setTimeout(() => onReject(id), 200)
  }

  return (
    <motion.div
      animate={
        exiting === 'approve' ? { opacity: 0, x: 16 } :
        exiting === 'reject'  ? { opacity: 0, x: -16 } :
        { opacity: 1, x: 0 }
      }
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 px-4 py-4 border-b"
      style={{
        background: 'var(--surface-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      <span
        className="shrink-0 rounded-full mt-1"
        style={{ width: 6, height: 6, background: businessColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#e0e0e0]">{action}</p>
        <p className="text-[12px] text-[#555] mt-0.5">{detail}</p>
        <p className="text-[11px] text-[#444] mt-1">Requested by {requestedBy} · {requestedAt}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleReject}
          disabled={exiting !== null}
          className="h-7 px-3 rounded-sm text-[12px] font-medium border transition-colors hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={exiting !== null}
          className="h-7 px-3 rounded-sm text-[12px] font-medium border transition-colors hover:bg-[rgba(34,197,94,0.08)] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
        >
          Approve
        </button>
      </div>
    </motion.div>
  )
}
