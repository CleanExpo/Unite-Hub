'use client'

// DigestBanner — the morning digest at the top of the Command Deck (CC-19).
// Fetches GET /api/command-centre/overnight-summary and shows the headline +
// what needs the founder's attention. Honest loading/error states.

import { useEffect, useState } from 'react'
import styles from './digest-banner.module.css'

interface OvernightDigest {
  generatedAt: string
  tasks: { total: number; needsDecision: number; queued: number; blocked: number; failed: number; done: number }
  sessions: { total: number }
  attention: string[]
  headline: string
}

export function DigestBanner() {
  const [digest, setDigest] = useState<OvernightDigest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch('/api/command-centre/overnight-summary', { credentials: 'include' })
        if (!res.ok) {
          if (active) setError(`Digest unavailable (HTTP ${res.status})`)
          return
        }
        const data = (await res.json()) as { digest?: OvernightDigest }
        if (active) setDigest(data.digest ?? null)
      } catch {
        if (active) setError('Digest unavailable — network error.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className={styles.banner}>
        <span className={styles.muted}>Loading morning digest…</span>
      </div>
    )
  }
  if (error || !digest) {
    return (
      <div className={styles.banner}>
        <span className={styles.muted}>{error ?? 'No digest available.'}</span>
      </div>
    )
  }

  const hasAttention = digest.attention.length > 0
  return (
    <div className={styles.banner} data-attention={hasAttention}>
      <div className={styles.head}>
        <span className={styles.title}>Morning Digest</span>
        <span className={styles.headline}>{digest.headline}</span>
      </div>
      {hasAttention ? (
        <ul className={styles.attention}>
          {digest.attention.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : (
        <span className={styles.clear}>Nothing needs you — the board is clear.</span>
      )}
    </div>
  )
}
