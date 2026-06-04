'use client'

// SeedRegistryButton — promotes the json project registry into durable
// cc_projects rows for the founder (CC seed registry).
//
// POSTs /api/command-centre/projects/seed (credentials: 'include') and shows the
// seeded count. Idempotent server-side. Loading / error states are honest —
// success is only ever claimed on a 2xx response.

import { useState } from 'react'
import styles from './queue-board.module.css'

interface SeedResponse {
  seeded?: number
  error?: string
}

export function SeedRegistryButton() {
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function seed() {
    if (seeding) return
    setSeeding(true)
    setError(null)
    setSeeded(null)
    try {
      const res = await fetch('/api/command-centre/projects/seed', {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as SeedResponse
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : `Seed failed (HTTP ${res.status})`)
        return
      }
      setSeeded(typeof data.seeded === 'number' ? data.seeded : 0)
    } catch {
      setError('Network error — could not reach the seed service.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      <button type="button" className={styles.refresh} onClick={() => void seed()} disabled={seeding}>
        {seeding && <span className={styles.spinner} aria-hidden="true" />}
        {seeding ? 'Seeding…' : 'Seed registry'}
      </button>
      {seeded !== null && (
        <span className={styles.toolbarMeta} role="status">
          Seeded {seeded} project{seeded === 1 ? '' : 's'} to cc_projects
        </span>
      )}
      {error && (
        <span className={styles.cardError} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
