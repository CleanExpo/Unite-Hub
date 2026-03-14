// src/components/layout/BronSidebar.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { usePathname } from 'next/navigation'

interface Message { role: 'user' | 'assistant'; content: string }

/** Context-aware suggestion chips keyed by route */
const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  '/founder/dashboard': [
    'Summarise my business performance this week',
    'What needs my attention today?',
    'Give me a morning briefing across all businesses',
  ],
  '/founder/bookkeeper': [
    'Explain the uncategorised transactions',
    'Help me prepare for BAS this quarter',
    'What deductions am I missing?',
  ],
  '/founder/advisory': [
    'What tax strategies should I consider for DR?',
    'Compare my business structures for tax efficiency',
    'How should I handle FBT across my businesses?',
  ],
  '/founder/social': [
    'Draft a LinkedIn post for Disaster Recovery',
    'What should I post this week across platforms?',
    'Suggest content ideas for CARSI',
  ],
  '/founder/contacts': [
    'Who should I follow up with this week?',
    'Show me leads that need attention',
    'Summarise recent client interactions',
  ],
  '/founder/kanban': [
    'What are the highest priority issues right now?',
    'Summarise what was completed this week',
    'What tasks are overdue?',
  ],
  '/founder/email': [
    'Summarise my unread emails',
    'Any urgent emails I should respond to?',
    'Draft a follow-up for the last DR email',
  ],
  '/founder/strategy': [
    'Compare the profitability of my businesses',
    'What should my Q2 priorities be?',
    'Analyse the growth potential of Synthex',
  ],
  '/founder/xero': [
    'What is my total revenue this month?',
    'Compare revenue across businesses',
    'Are there any reconciliation issues?',
  ],
}

const DEFAULT_SUGGESTIONS = [
  'What can Nexus do for me?',
  'Summarise my business performance',
  'What needs my attention today?',
]

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
              <div className="space-y-3">
                <p className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  What would you like to know?
                </p>
                <div className="flex flex-wrap gap-2">
                  {(CONTEXT_SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); }}
                      className="rounded-sm border border-[var(--color-border)] bg-[var(--surface-card)] text-xs text-[var(--color-text-secondary)] hover:border-[#00F5FF]/30 hover:text-[#00F5FF] px-3 py-2 transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
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
