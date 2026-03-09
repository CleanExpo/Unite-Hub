'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy } from 'lucide-react'

interface VaultEntryProps {
  label: string
  username: string
  secret: string
  businessColor: string
}

export function VaultEntry({ label, username, secret, businessColor }: VaultEntryProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 800)
    } catch {
      // clipboard unavailable — no feedback, icon stays neutral
    }
  }

  return (
    <div
      className="group flex items-center gap-3 h-8 px-3 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, background: businessColor }} />
      <span className="text-[13px] text-[#ccc] w-40 truncate">{label}</span>
      <span className="text-[12px] text-[#555] w-32 truncate">{username}</span>
      <span className="flex-1 font-mono text-[12px] text-[#777]">
        {revealed ? secret : '··········'}
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setRevealed(!revealed)}
          className="text-[#555] hover:text-[#888] transition-colors"
          aria-label={revealed ? 'Hide' : 'Show'}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="transition-colors"
          style={{ color: copied ? '#00F5FF' : '#555555' }}
          aria-label="Copy"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}
