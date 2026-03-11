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
      const timer = setTimeout(() => {
        setState('input')
        setRawIdea('')
        setMessages([])
        setSpec(null)
        setLoading(false)
        setSuccessId(null)
        setUserInput('')
      }, 300)
      return () => clearTimeout(timer)
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
