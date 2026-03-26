'use client'

// src/app/(founder)/founder/campaigns/new/page.tsx
// Step 1: Scan a website for Brand DNA (BrandScanner)
// Step 2: Configure and generate campaign assets (CampaignGenerator)
// Step 3: Redirect to the campaign detail page

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandScanner } from '@/components/founder/campaigns/BrandScanner'
import { CampaignGenerator } from '@/components/founder/campaigns/CampaignGenerator'

type Step = 'scan' | 'generate'

interface ScanResult {
  profileId: string
  clientName: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('scan')
  const [scan, setScan] = useState<ScanResult | null>(null)

  function handleScanComplete(profileId: string, clientName?: string) {
    setScan({ profileId, clientName: clientName ?? 'Your Brand' })
    setStep('generate')
  }

  function handleGenerated(campaignId: string) {
    router.push(`/founder/campaigns/${campaignId}`)
  }

  function handleBack() {
    setStep('scan')
    setScan(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/founder/campaigns"
          className="p-1.5 rounded-sm border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Back to campaigns"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            New Campaign
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
            {step === 'scan' ? 'Step 1 — Scan website for Brand DNA' : `Step 2 — Configure campaign for ${scan?.clientName}`}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['scan', 'generate'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center text-[11px] font-medium"
              style={{
                background: step === s ? '#00F5FF' : step === 'generate' && s === 'scan' ? 'rgba(0,245,255,0.15)' : 'var(--surface-elevated)',
                color: step === s ? '#050505' : step === 'generate' && s === 'scan' ? '#00F5FF' : 'var(--color-text-disabled)',
              }}
            >
              {i + 1}
            </div>
            <span className="text-[12px]" style={{ color: step === s ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
              {s === 'scan' ? 'Brand Scan' : 'Generate'}
            </span>
            {i === 0 && <div className="w-8 h-px" style={{ background: 'var(--color-border)' }} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 'scan' && (
        <BrandScanner onScanComplete={(profileId) => handleScanComplete(profileId)} />
      )}

      {step === 'generate' && scan && (
        <CampaignGenerator
          brandProfileId={scan.profileId}
          brandName={scan.clientName}
          onGenerated={handleGenerated}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
