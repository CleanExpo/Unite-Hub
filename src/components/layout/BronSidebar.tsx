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
