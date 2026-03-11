'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { VaultEntry } from './VaultEntry'
import { VaultAddEntry } from './VaultAddEntry'
import { BUSINESSES } from '@/lib/businesses'

interface Credential {
  id: string
  businessKey: string
  label: string
  service: string
  username: string
  secret: string
  notes: string
}

interface VaultGridProps {
  unlocked: boolean
}

export function VaultGrid({ unlocked }: VaultGridProps) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [addingEntry, setAddingEntry] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vault/entries')
      if (res.ok) {
        const data = await res.json() as Credential[]
        setCredentials(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (unlocked) fetchEntries()
  }, [unlocked, fetchEntries])

  function handleDelete(id: string) {
    setCredentials(prev => prev.filter(c => c.id !== id))
  }

  const grouped = BUSINESSES.map(biz => ({
    business: biz,
    credentials: credentials.filter(c => c.businessKey === biz.key),
  })).filter(g => g.credentials.length > 0)

  if (!unlocked) return null

  return (
    <>
      {/* Add entry button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAddingEntry(true)}
          className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
          style={{ background: '#00F5FF18', color: '#00F5FF', border: '1px solid #00F5FF30' }}
        >
          <Plus size={13} strokeWidth={1.5} />
          Add Entry
        </button>
      </div>

      {loading && (
        <p className="text-[13px] text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Loading vault…
        </p>
      )}

      {!loading && credentials.length === 0 && (
        <p className="text-[13px] text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          No credentials stored yet. Add your first entry above.
        </p>
      )}

      {!loading && grouped.length > 0 && (
        <div className="flex flex-col gap-6">
          {grouped.map(({ business, credentials: creds }) => (
            <div key={business.key}>
              <div className="px-3 py-1 flex items-center gap-2">
                <span className="rounded-full" style={{ width: 6, height: 6, background: business.color }} />
                <span className="text-[10px] font-medium tracking-widest text-[#555] uppercase">
                  {business.name}
                </span>
              </div>
              <div
                className="rounded-sm border overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {creds.map(cred => (
                  <VaultEntry
                    key={cred.id}
                    id={cred.id}
                    label={cred.label}
                    username={cred.username}
                    secret={cred.secret}
                    businessColor={business.color}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {addingEntry && (
        <VaultAddEntry
          onClose={() => setAddingEntry(false)}
          onAdded={fetchEntries}
        />
      )}
    </>
  )
}
