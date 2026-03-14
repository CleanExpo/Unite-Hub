'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUSINESSES } from '@/lib/businesses'
import { BUSINESS_TO_TEAM } from '@/lib/integrations/linear'

interface CreateIssueModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const PRIORITIES = [
  { value: 1, label: 'Urgent' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'Low' },
] as const

export function CreateIssueModal({ open, onClose, onCreated }: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [businessKey, setBusinessKey] = useState<string>(BUSINESSES[0].key)
  const [priority, setPriority] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Focus title input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setBusinessKey(BUSINESSES[0].key)
      setPriority(3)
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)

    const teamKey = BUSINESS_TO_TEAM[businessKey]
    if (!teamKey) {
      setError(`No Linear team mapped for ${businessKey}`)
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/linear/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, teamKey, priority }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error ?? `Error ${res.status}`)
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 rounded-sm"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(0, 245, 255, 0.15)',
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <h2 className="text-[13px] font-medium" style={{ color: '#e2e8f0' }}>
                New Issue
              </h2>
              <button
                onClick={onClose}
                className="text-[13px] px-2 py-0.5 rounded-sm transition-colors"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Title <span style={{ color: '#00F5FF' }}>*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Issue title"
                  required
                  className="rounded-sm px-3 py-2 text-[13px] outline-none transition-colors"
                  style={{
                    background: '#050505',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.4)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="rounded-sm px-3 py-2 text-[13px] outline-none resize-none transition-colors"
                  style={{
                    background: '#050505',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.4)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                />
              </div>

              {/* Business + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Business */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                    Business
                  </label>
                  <div className="relative">
                    <select
                      value={businessKey}
                      onChange={(e) => setBusinessKey(e.target.value)}
                      className="w-full rounded-sm pl-7 pr-3 py-2 text-[13px] outline-none appearance-none transition-colors"
                      style={{
                        background: '#050505',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#e2e8f0',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.4)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                    >
                      {BUSINESSES.map((biz) => (
                        <option key={biz.key} value={biz.key}>
                          {biz.name}
                        </option>
                      ))}
                    </select>
                    {/* Colour dot */}
                    <span
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                      style={{
                        background: BUSINESSES.find((b) => b.key === businessKey)?.color ?? '#555',
                      }}
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-sm px-3 py-2 text-[13px] outline-none appearance-none transition-colors"
                    style={{
                      background: '#050505',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e2e8f0',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.4)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[11px] px-2 py-1.5 rounded-sm" style={{ color: '#ef4444', background: '#1a0505' }}>
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-1.5 text-[11px] rounded-sm transition-colors"
                  style={{
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-1.5 text-[11px] font-medium rounded-sm transition-opacity"
                  style={{
                    background: '#00F5FF',
                    color: '#050505',
                    opacity: submitting || !title.trim() ? 0.5 : 1,
                  }}
                >
                  {submitting ? 'Creating…' : 'Create Issue'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
