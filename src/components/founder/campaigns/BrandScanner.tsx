'use client'

// src/components/founder/campaigns/BrandScanner.tsx
// Brand DNA scanner — step 1 of the Synthex campaign creation flow.

import { useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandColours {
  primary: string
  secondary: string
  accent: string
}

interface ScanResult {
  profileId: string
  clientName: string
  industry: string | null
  toneOfVoice: string | null
  targetAudience: string | null
  colours: BrandColours
  referenceImageCount: number
  status: 'ready' | 'scanning' | 'failed'
}

interface ScanResponse {
  profileId: string
  clientName: string
  industry: string | null
  toneOfVoice: string | null
  targetAudience: string | null
  colours: BrandColours
  referenceImages: string[]
  status: 'ready' | 'scanning' | 'failed'
}

type ScanState = 'idle' | 'scanning' | 'complete' | 'error'

interface BrandScannerProps {
  onScanComplete: (profileId: string, clientName: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function isValidUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

// ─── Colour Swatch ───────────────────────────────────────────────────────────

interface ColourSwatchProps {
  colour: string
  label: string
}

function ColourSwatch({ colour, label }: ColourSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-8 h-8 rounded-sm border border-white/10"
        style={{ backgroundColor: colour }}
        title={colour}
      />
      <span className="text-[10px] font-mono text-white/30 uppercase">{label}</span>
    </div>
  )
}

// ─── Brand DNA Card ──────────────────────────────────────────────────────────

interface BrandDNACardProps {
  result: ScanResult
  onCreateCampaign: () => void
}

function BrandDNACard({ result, onCreateCampaign }: BrandDNACardProps) {
  return (
    <div className="flex flex-col gap-5 pt-5 border-t border-white/[0.06]">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-sm bg-[#00F5FF]" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#00F5FF]">
          Brand DNA extracted
        </span>
      </div>

      {/* Colour swatches */}
      <div className="flex items-start gap-4">
        <ColourSwatch colour={result.colours.primary}   label="Primary"   />
        <ColourSwatch colour={result.colours.secondary} label="Secondary" />
        <ColourSwatch colour={result.colours.accent}    label="Accent"    />
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-1 gap-3">
        <DataRow label="Client"          value={result.clientName} />
        <DataRow label="Industry"        value={truncate(result.industry, 80)} />
        <DataRow label="Tone of voice"   value={truncate(result.toneOfVoice, 100)} />
        <DataRow label="Target audience" value={truncate(result.targetAudience, 100)} />
        <DataRow
          label="Reference images"
          value={`${result.referenceImageCount} reference image${result.referenceImageCount !== 1 ? 's' : ''} found`}
          highlight
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onCreateCampaign}
        className="w-full bg-[#00F5FF] text-black text-[13px] font-semibold rounded-sm px-4 py-2.5 hover:bg-[#00F5FF]/90 transition-colors duration-150"
      >
        Create Campaign →
      </button>
    </div>
  )
}

interface DataRowProps {
  label: string
  value: string
  highlight?: boolean
}

function DataRow({ label, value, highlight = false }: DataRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">
        {label}
      </span>
      <span
        className={`text-[12px] font-mono ${highlight ? 'text-[#00F5FF]' : 'text-white/60'}`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BrandScanner({ onScanComplete }: BrandScannerProps) {
  const [websiteUrl, setWebsiteUrl]     = useState('')
  const [clientName, setClientName]     = useState('')
  const [scanState, setScanState]       = useState<ScanState>('idle')
  const [result, setResult]             = useState<ScanResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const isDisabled  = scanState === 'scanning'
  const canSubmit   = websiteUrl.trim().length > 0 && clientName.trim().length > 0 && !isDisabled

  const handleScan = useCallback(async () => {
    const url  = websiteUrl.trim()
    const name = clientName.trim()

    if (!url || !name) return

    if (!isValidUrl(url)) {
      setErrorMessage('Website URL must start with http:// or https://')
      setScanState('error')
      return
    }

    setScanState('scanning')
    setErrorMessage('')
    setResult(null)

    try {
      const response = await fetch('/api/campaigns/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: url, clientName: name }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
        throw new Error(body.error ?? `Scan failed (${response.status})`)
      }

      const data = await response.json() as ScanResponse

      setResult({
        profileId:            data.profileId,
        clientName:           data.clientName,
        industry:             data.industry,
        toneOfVoice:          data.toneOfVoice,
        targetAudience:       data.targetAudience,
        colours:              data.colours,
        referenceImageCount:  data.referenceImages?.length ?? 0,
        status:               data.status,
      })

      setScanState('complete')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(message)
      setScanState('error')
    }
  }, [websiteUrl, clientName])

  const handleReset = useCallback(() => {
    setScanState('idle')
    setResult(null)
    setErrorMessage('')
  }, [])

  const handleCreateCampaign = useCallback(() => {
    if (result) {
      onScanComplete(result.profileId, result.clientName)
    }
  }, [result, onScanComplete])

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-white tracking-tight">
          Brand Scanner
        </h2>
        <p className="text-[12px] text-white/30">
          Enter a website URL to extract Brand DNA — colours, tone, audience, and imagery.
        </p>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bs-client-name" className="text-[11px] font-medium uppercase tracking-widest text-white/30">
            Client name
          </label>
          <input
            id="bs-client-name"
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            disabled={isDisabled}
            placeholder="Acme Pty Ltd"
            className="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-white placeholder-white/30 focus:border-[#00F5FF]/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bs-website-url" className="text-[11px] font-medium uppercase tracking-widest text-white/30">
            Website URL
          </label>
          <input
            id="bs-website-url"
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            disabled={isDisabled}
            placeholder="https://example.com.au"
            className="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-white placeholder-white/30 focus:border-[#00F5FF]/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
          />
        </div>
      </div>

      {/* Scan button / scanning state */}
      {scanState !== 'complete' && (
        <button
          type="button"
          onClick={handleScan}
          disabled={!canSubmit}
          className="bg-[#00F5FF] text-black text-[13px] font-semibold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {scanState === 'scanning' ? (
            <>
              <span className="w-2 h-2 rounded-sm bg-black animate-pulse" />
              <span>
                Scanning {clientName || 'website'}…
              </span>
            </>
          ) : (
            'Scan Website'
          )}
        </button>
      )}

      {/* Error state */}
      {scanState === 'error' && (
        <div className="flex items-start justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
          <p className="text-[12px] text-red-400 flex-1">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors duration-100"
          >
            Reset
          </button>
        </div>
      )}

      {/* Brand DNA result card */}
      {scanState === 'complete' && result && (
        <BrandDNACard
          result={result}
          onCreateCampaign={handleCreateCampaign}
        />
      )}
    </div>
  )
}
