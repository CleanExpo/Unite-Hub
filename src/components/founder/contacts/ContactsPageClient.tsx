'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Contact } from '@/types/database'
import { ContactsTable } from './ContactsTable'
import { ContactFormModal } from './ContactFormModal'

const STATUS_OPTIONS = ['all', 'lead', 'prospect', 'client', 'churned', 'archived'] as const

export function ContactsPageClient() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts ?? data)
      }
    } catch {
      // Silently handle — table will show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const filtered = useMemo(() => {
    let result = contacts

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase()
        const email = (c.email ?? '').toLowerCase()
        const company = (c.company ?? '').toLowerCase()
        return name.includes(q) || email.includes(q) || company.includes(q)
      })
    }

    return result
  }, [contacts, statusFilter, search])

  const stats = useMemo(() => {
    const counts = { lead: 0, prospect: 0, client: 0 }
    for (const c of contacts) {
      if (c.status in counts) {
        counts[c.status as keyof typeof counts]++
      }
    }
    return counts
  }, [contacts])

  function handleEdit(contact: Contact) {
    setEditingContact(contact)
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id))
      }
    } catch {
      // Silently handle
    }
  }

  function handleModalClose() {
    setShowModal(false)
    setEditingContact(null)
  }

  function handleSave() {
    handleModalClose()
    fetchContacts()
  }

  const inputClass =
    'rounded-sm border border-[var(--color-border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00F5FF] focus:outline-none'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Contacts</h1>
        <button
          onClick={() => {
            setEditingContact(null)
            setShowModal(true)
          }}
          className="rounded-sm px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: '#00F5FF18',
            color: '#00F5FF',
            border: '1px solid #00F5FF30',
          }}
        >
          Add Contact
        </button>
      </div>

      {/* Summary stat badges */}
      <div className="flex gap-3">
        {([
          { label: 'Leads', count: stats.lead, colour: '#3b82f6' },
          { label: 'Prospects', count: stats.prospect, colour: '#f97316' },
          { label: 'Clients', count: stats.client, colour: '#22c55e' },
        ] as const).map(({ label, count, colour }) => (
          <div
            key={label}
            className="rounded-sm px-3 py-1.5 text-xs font-medium"
            style={{
              background: `${colour}15`,
              color: colour,
              border: `1px solid ${colour}30`,
            }}
          >
            {label}: {count}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-[var(--color-border)] bg-[var(--surface-card)]">
        <ContactsTable
          contacts={filtered}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <ContactFormModal
          contact={editingContact}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
