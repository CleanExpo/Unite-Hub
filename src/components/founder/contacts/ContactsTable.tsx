'use client'

import type { Contact } from '@/types/database'

const STATUS_COLOURS: Record<Contact['status'], string> = {
  lead: '#3b82f6',
  prospect: '#f97316',
  client: '#22c55e',
  churned: '#ef4444',
  archived: '#808080',
}

interface ContactsTableProps {
  contacts: Contact[]
  loading: boolean
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
}

export function ContactsTable({ contacts, loading, onEdit, onDelete }: ContactsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
        Loading contacts...
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
        No contacts yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'
            return (
              <tr
                key={contact.id}
                className="group border-b border-[var(--color-border)] transition-colors hover:bg-[var(--surface-elevated)]"
              >
                <td className="px-4 py-3 text-[var(--color-text-primary)]">{name}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">{contact.email ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">{contact.company ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-sm px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: `${STATUS_COLOURS[contact.status]}20`,
                      color: STATUS_COLOURS[contact.status],
                      border: `1px solid ${STATUS_COLOURS[contact.status]}40`,
                    }}
                  >
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-sm px-2 py-0.5 text-xs"
                        style={{
                          background: '#00F5FF18',
                          color: '#00F5FF',
                          border: '1px solid #00F5FF30',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onEdit(contact)}
                      className="rounded-sm px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[#00F5FF]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(contact.id)}
                      className="rounded-sm px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[#ef4444]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
