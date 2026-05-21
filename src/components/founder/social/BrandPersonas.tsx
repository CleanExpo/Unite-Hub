'use client'

import { useState, useEffect, useCallback } from 'react'
import { BUSINESSES } from '@/lib/businesses'
import { CARSI_BRAND, RESTOREASSIST_BRAND } from '@/lib/content/brand-identities'
import type { BrandIdentity, CharacterPersona } from '@/lib/content/types'

// ── Types ────────────────────────────────────────────────────────────────────

type PersonaDraft = Omit<BrandIdentity, 'id' | 'founderId' | 'createdAt' | 'updatedAt'>

type PersonaMap = Record<string, BrandIdentity>

interface PersonaWithName extends BrandIdentity {
  businessName: string
}

interface ApiPersonasResponse {
  personas: PersonaWithName[]
}

interface ApiPersonaResponse {
  persona: PersonaWithName
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEED_KEYS = ['carsi', 'restore'] as const

const SEED_DATA: Record<typeof SEED_KEYS[number], Omit<BrandIdentity, 'id' | 'founderId' | 'createdAt' | 'updatedAt'>> = {
  carsi: CARSI_BRAND,
  restore: RESTOREASSIST_BRAND,
}

function emptyCharacter(name: string): CharacterPersona {
  return { name, persona: '', avatarUrl: null, voiceStyle: '' }
}

function emptyPersona(businessKey: string): PersonaDraft {
  return {
    businessKey,
    toneOfVoice: '',
    targetAudience: '',
    industryKeywords: [],
    uniqueSellingPoints: [],
    characterMale: emptyCharacter('Jax'),
    characterFemale: emptyCharacter('Ada'),
    colourPrimary: null,
    colourSecondary: null,
    doList: [],
    dontList: [],
    sampleContent: {},
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface TagListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}

function TagList({ items, onChange, placeholder }: TagListProps) {
  const [inputVal, setInputVal] = useState('')

  function addTag() {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    // Support comma-separated batch entry
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
    onChange([...items, ...parts])
    setInputVal('')
  }

  function removeTag(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px]"
            style={{ background: 'rgba(0,245,255,0.08)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.2)' }}
          >
            {item}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-1.5 text-[11px] rounded-sm transition-colors"
          style={{
            border: '1px solid rgba(0,245,255,0.3)',
            color: '#00F5FF',
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

interface StringListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}

function StringList({ items, onChange, placeholder }: StringListProps) {
  const [inputVal, setInputVal] = useState('')

  function addItem() {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setInputVal('')
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, value: string) {
    onChange(items.map((item, i) => (i === idx ? value : item)))
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={e => updateItem(idx, e.target.value)}
            className="flex-1 bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="text-[12px] px-2 py-1.5 rounded-sm transition-colors opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Remove item"
          >
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1.5 text-[11px] rounded-sm transition-colors"
          style={{
            border: '1px solid rgba(0,245,255,0.3)',
            color: '#00F5FF',
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}

interface ColourFieldProps {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}

function ColourField({ label, value, onChange }: ColourFieldProps) {
  const displayValue = value ?? ''
  return (
    <div className="space-y-1">
      <label className="block text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayValue || '#050505'}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-sm cursor-pointer border-0 p-0"
          style={{ background: 'transparent' }}
        />
        <input
          type="text"
          value={displayValue}
          onChange={e => onChange(e.target.value || null)}
          placeholder="#000000"
          maxLength={7}
          className="w-28 bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none font-mono"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  )
}

interface CharacterEditorProps {
  label: string
  value: CharacterPersona
  onChange: (v: CharacterPersona) => void
}

function CharacterEditor({ label, value, onChange }: CharacterEditorProps) {
  function update(field: keyof CharacterPersona, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div
      className="rounded-sm p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#00F5FF' }}>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Name
          </label>
          <input
            type="text"
            value={value.name}
            onChange={e => update('name', e.target.value)}
            className="w-full bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Voice Style
          </label>
          <input
            type="text"
            value={value.voiceStyle}
            onChange={e => update('voiceStyle', e.target.value)}
            className="w-full bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Persona Description
        </label>
        <textarea
          value={value.persona}
          onChange={e => update('persona', e.target.value)}
          rows={2}
          className="w-full bg-transparent text-[12px] px-3 py-1.5 rounded-sm outline-none resize-none"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BrandPersonas() {
  const [personas, setPersonas] = useState<PersonaMap>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<PersonaDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load all personas and auto-seed CARSI + RestoreAssist if missing
  const loadPersonas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/social/personas')
      if (!res.ok) throw new Error('Failed to load personas')
      const json = await res.json() as ApiPersonasResponse
      const map: PersonaMap = {}
      for (const p of json.personas) {
        map[p.businessKey] = p
      }

      // Auto-seed missing CARSI / RestoreAssist
      const seedPromises: Promise<void>[] = []
      for (const key of SEED_KEYS) {
        if (!map[key]) {
          seedPromises.push(
            fetch('/api/social/personas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessKey: key,
                toneOfVoice: SEED_DATA[key].toneOfVoice,
                targetAudience: SEED_DATA[key].targetAudience,
                industryKeywords: SEED_DATA[key].industryKeywords,
                uniqueSellingPoints: SEED_DATA[key].uniqueSellingPoints,
                characterMale: SEED_DATA[key].characterMale,
                characterFemale: SEED_DATA[key].characterFemale,
                colourPrimary: SEED_DATA[key].colourPrimary,
                colourSecondary: SEED_DATA[key].colourSecondary,
                doList: SEED_DATA[key].doList,
                dontList: SEED_DATA[key].dontList,
                sampleContent: SEED_DATA[key].sampleContent,
              }),
            })
              .then(r => r.json())
              .then((seeded: ApiPersonaResponse) => {
                if (seeded.persona) map[key] = seeded.persona
              })
              .catch(err => console.error(`[BrandPersonas] Seed failed for ${key}:`, err))
          )
        }
      }

      if (seedPromises.length > 0) await Promise.allSettled(seedPromises)
      setPersonas({ ...map })
    } catch (err) {
      console.error('[BrandPersonas] Load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPersonas()
  }, [loadPersonas])

  // When a business is selected, initialise the draft from existing data or empty
  function selectBusiness(key: string) {
    setSelectedKey(key)
    setSaveError(null)
    setSaveSuccess(false)
    const existing = personas[key]
    if (existing) {
      setDraft({
        businessKey: existing.businessKey,
        toneOfVoice: existing.toneOfVoice,
        targetAudience: existing.targetAudience,
        industryKeywords: [...existing.industryKeywords],
        uniqueSellingPoints: [...existing.uniqueSellingPoints],
        characterMale: { ...existing.characterMale },
        characterFemale: { ...existing.characterFemale },
        colourPrimary: existing.colourPrimary,
        colourSecondary: existing.colourSecondary,
        doList: [...existing.doList],
        dontList: [...existing.dontList],
        sampleContent: { ...existing.sampleContent },
      })
    } else {
      setDraft(emptyPersona(key))
    }
  }

  async function handleSave() {
    if (!draft || !selectedKey) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/social/personas/${encodeURIComponent(selectedKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneOfVoice: draft.toneOfVoice,
          targetAudience: draft.targetAudience,
          industryKeywords: draft.industryKeywords,
          uniqueSellingPoints: draft.uniqueSellingPoints,
          characterMale: draft.characterMale,
          characterFemale: draft.characterFemale,
          colourPrimary: draft.colourPrimary,
          colourSecondary: draft.colourSecondary,
          doList: draft.doList,
          dontList: draft.dontList,
          sampleContent: draft.sampleContent,
        }),
      })

      if (res.status === 404) {
        // Does not exist yet — POST to create
        const createRes = await fetch('/api/social/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessKey: selectedKey,
            toneOfVoice: draft.toneOfVoice,
            targetAudience: draft.targetAudience,
            industryKeywords: draft.industryKeywords,
            uniqueSellingPoints: draft.uniqueSellingPoints,
            characterMale: draft.characterMale,
            characterFemale: draft.characterFemale,
            colourPrimary: draft.colourPrimary,
            colourSecondary: draft.colourSecondary,
            doList: draft.doList,
            dontList: draft.dontList,
            sampleContent: draft.sampleContent,
          }),
        })
        if (!createRes.ok) throw new Error('Failed to create persona')
        const created = await createRes.json() as ApiPersonaResponse
        setPersonas(prev => ({ ...prev, [selectedKey]: created.persona }))
      } else {
        if (!res.ok) throw new Error('Failed to save persona')
        const updated = await res.json() as ApiPersonaResponse
        setPersonas(prev => ({ ...prev, [selectedKey]: updated.persona }))
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function updateDraft<K extends keyof PersonaDraft>(field: K, value: PersonaDraft[K]) {
    if (!draft) return
    setDraft({ ...draft, [field]: value })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedBusiness = selectedKey ? BUSINESSES.find(b => b.key === selectedKey) : null

  return (
    <div className="flex gap-4" style={{ minHeight: '480px' }}>

      {/* Left: Business list */}
      <div
        className="w-56 flex-shrink-0 rounded-sm overflow-hidden"
        style={{ border: '1px solid var(--color-border)', background: 'var(--surface-card)' }}
      >
        <div
          className="px-3 py-2 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Businesses
          </p>
        </div>

        {loading ? (
          <div className="px-3 py-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-sm animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {BUSINESSES.map(biz => {
              const hasPersona = Boolean(personas[biz.key])
              const isActive = selectedKey === biz.key
              return (
                <li key={biz.key}>
                  <button
                    type="button"
                    onClick={() => selectBusiness(biz.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: isActive ? 'rgba(0,245,255,0.06)' : 'transparent',
                      borderLeft: isActive ? '2px solid #00F5FF' : '2px solid transparent',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: biz.color }}
                    />
                    <span
                      className="flex-1 text-[12px] truncate"
                      style={{ color: isActive ? '#00F5FF' : 'var(--color-text-primary)' }}
                    >
                      {biz.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-medium flex-shrink-0"
                      style={{
                        background: hasPersona ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                        color: hasPersona ? '#22c55e' : 'var(--color-text-secondary)',
                      }}
                    >
                      {hasPersona ? '✓' : '—'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Right: Persona editor */}
      <div className="flex-1 min-w-0">
        {!selectedKey || !draft ? (
          <div
            className="flex items-center justify-center h-full rounded-sm"
            style={{ border: '1px solid var(--color-border)', background: 'var(--surface-card)' }}
          >
            <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              Select a business to edit its brand persona
            </p>
          </div>
        ) : (
          <div
            className="rounded-sm overflow-auto"
            style={{ border: '1px solid var(--color-border)', background: 'var(--surface-card)', maxHeight: '75vh' }}
          >
            {/* Editor header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
            >
              <div className="flex items-center gap-2">
                {selectedBusiness && (
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: selectedBusiness.color }}
                  />
                )}
                <h3 className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedBusiness?.name ?? selectedKey}
                </h3>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                  style={{
                    background: personas[selectedKey] ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    color: personas[selectedKey] ? '#22c55e' : 'var(--color-text-secondary)',
                  }}
                >
                  {personas[selectedKey] ? 'Complete' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {saveError && (
                  <span className="text-[11px]" style={{ color: '#ef4444' }}>{saveError}</span>
                )}
                {saveSuccess && (
                  <span className="text-[11px]" style={{ color: '#22c55e' }}>Saved</span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-[11px] uppercase tracking-[0.1em] rounded-sm transition-colors disabled:opacity-50"
                  style={{
                    background: 'rgba(0,245,255,0.08)',
                    border: '1px solid rgba(0,245,255,0.3)',
                    color: '#00F5FF',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Persona'}
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div className="p-4 space-y-5">

              {/* Tone of Voice */}
              <FormSection label="Tone of Voice" hint="How does this brand sound? (warm, professional, authoritative...)">
                <textarea
                  value={draft.toneOfVoice}
                  onChange={e => updateDraft('toneOfVoice', e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-[12px] px-3 py-2 rounded-sm outline-none resize-none"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </FormSection>

              {/* Target Audience */}
              <FormSection label="Target Audience" hint="Who is the ideal customer?">
                <textarea
                  value={draft.targetAudience}
                  onChange={e => updateDraft('targetAudience', e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-[12px] px-3 py-2 rounded-sm outline-none resize-none"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </FormSection>

              {/* Industry Keywords */}
              <FormSection label="Industry Keywords" hint="Add keywords one at a time or comma-separated">
                <TagList
                  items={draft.industryKeywords}
                  onChange={items => updateDraft('industryKeywords', items)}
                  placeholder="e.g. roadside assistance Australia"
                />
              </FormSection>

              {/* Unique Selling Points */}
              <FormSection label="Unique Selling Points" hint="Key differentiators for this brand">
                <StringList
                  items={draft.uniqueSellingPoints}
                  onChange={items => updateDraft('uniqueSellingPoints', items)}
                  placeholder="e.g. No lock-in contracts"
                />
              </FormSection>

              {/* Brand Colours */}
              <FormSection label="Brand Colours">
                <div className="flex gap-6">
                  <ColourField
                    label="Primary"
                    value={draft.colourPrimary}
                    onChange={v => updateDraft('colourPrimary', v)}
                  />
                  <ColourField
                    label="Secondary"
                    value={draft.colourSecondary}
                    onChange={v => updateDraft('colourSecondary', v)}
                  />
                </div>
              </FormSection>

              {/* Characters */}
              <FormSection label="Brand Characters">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CharacterEditor
                    label="Jax (Male)"
                    value={draft.characterMale}
                    onChange={v => updateDraft('characterMale', v)}
                  />
                  <CharacterEditor
                    label="Ada (Female)"
                    value={draft.characterFemale}
                    onChange={v => updateDraft('characterFemale', v)}
                  />
                </div>
              </FormSection>

              {/* Do List */}
              <FormSection label="Do List" hint="Content rules — what this brand should always do">
                <StringList
                  items={draft.doList}
                  onChange={items => updateDraft('doList', items)}
                  placeholder="e.g. Use Australian English"
                />
              </FormSection>

              {/* Don't List */}
              <FormSection label="Don't List" hint="Content rules — what this brand must never do">
                <StringList
                  items={draft.dontList}
                  onChange={items => updateDraft('dontList', items)}
                  placeholder="e.g. Never use fear-mongering tactics"
                />
              </FormSection>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── FormSection helper ────────────────────────────────────────────────────────

interface FormSectionProps {
  label: string
  hint?: string
  children: React.ReactNode
}

function FormSection({ label, hint, children }: FormSectionProps) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        {hint && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
