'use client'

import { useState } from 'react'
import type { Contact } from '@/types/database'
import { BUSINESSES } from '@/lib/businesses'

interface ContactFormModalProps {
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}

const STATUS_OPTIONS: Contact['status'][] = ['lead', 'prospect', 'client', 'churned', 'archived']

export function ContactFormModal({ contact, onClose, onSave }: ContactFormModalProps) {
  const isEdit = contact !== null

  const [firstName, setFirstName] = useState(contact?.first_name ?? '')
  const [lastName, setLastName] = useState(contact?.last_name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [company, setCompany] = useState(contact?.company ?? '')
  const [role, setRole] = useState(contact?.role ?? '')
  const [status, setStatus] = useState<Contact['status']>(contact?.status ?? 'lead')
  const [businessId, setBusinessId] = useState(contact?.business_id ?? '')
  const [tagsInput, setTagsInput] = useState(contact?.tags?.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const body = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      company: company || null,
      role: role || null,
      status,
      business_id: businessId || null,
      tags,
    }

    try {
      const url = isEdit ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} contact`)
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-sm border border-[var(--color-border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00F5FF] focus:outline-none'
  const labelClass = 'block text-xs font-medium text-[var(--color-text-muted)] mb-1'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      data-testid="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-sm border border-[var(--color-border)] bg-[var(--surface-card)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          {isEdit ? 'Edit Contact' : 'Add Contact'}
        </h2>

        {error && (
          <div className="mb-4 rounded-sm border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                placeholder="First name"
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="0400 000 000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                placeholder="Role / title"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Contact['status'])}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Business</label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {BUSINESSES.map((biz) => (
                  <option key={biz.key} value={biz.key}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={inputClass}
              placeholder="vip, priority, follow-up"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: '#00F5FF18',
                color: '#00F5FF',
                border: '1px solid #00F5FF30',
              }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
