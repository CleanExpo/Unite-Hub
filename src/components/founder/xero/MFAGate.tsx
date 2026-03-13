'use client'
// src/components/founder/xero/MFAGate.tsx
// MFA verification modal shown before connecting a business to Xero.
// Supports TOTP (authenticator app) and email OTP.
// On success navigates to /api/xero/connect?business=<key>.

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Step =
  | 'checking'
  | 'choose'
  | 'enroll-totp'
  | 'verify-totp'
  | 'verify-email'

interface MFAGateProps {
  businessKey: string
  businessName: string
  onCancel: () => void
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export function MFAGate({ businessKey, businessName, onCancel }: MFAGateProps) {
  const [step, setStep] = useState<Step>('checking')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null)
  const [enrollData, setEnrollData] = useState<{
    qrCode: string
    secret: string
    factorId: string
  } | null>(null)

  // On mount: check current AAL and existing TOTP factors
  useEffect(() => {
    let cancelled = false

    async function init() {
      const supabase = getSupabase()

      // If session is already AAL2 (verified earlier this session), proceed
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!cancelled && aalData?.currentLevel === 'aal2') {
        window.location.href = `/api/xero/connect?business=${businessKey}`
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!cancelled) setUserEmail(userData?.user?.email ?? '')

      // Check for an existing verified TOTP factor
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const verifiedTotp = factorsData?.totp?.find(f => f.status === 'verified')

      if (cancelled) return
      if (verifiedTotp) {
        setTotpFactorId(verifiedTotp.id)
        setStep('verify-totp')
      } else {
        setStep('choose')
      }
    }

    init()
    return () => { cancelled = true }
  }, [businessKey])

  // ── TOTP enrolment ───────────────────────────────────────────────────────

  const handleEnrollTOTP = useCallback(async () => {
    setError('')
    setBusy(true)
    const supabase = getSupabase()

    // Clean up any pending (unverified) factors from previous attempts
    const { data: existing } = await supabase.auth.mfa.listFactors()
    const pending = existing?.totp?.find(f => f.status !== 'verified')
    if (pending) {
      await supabase.auth.mfa.unenroll({ factorId: pending.id })
    }

    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Nexus Authenticator`,
    })

    setBusy(false)
    if (err || !data) {
      setError(err?.message ?? 'Enrolment failed. Please try again.')
      return
    }

    setEnrollData({
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    })
    setStep('enroll-totp')
  }, [])

  const handleVerifyEnrollment = useCallback(async () => {
    if (!enrollData || code.length !== 6) return
    setError('')
    setBusy(true)
    const supabase = getSupabase()

    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: enrollData.factorId,
    })
    if (chErr) { setError(chErr.message); setBusy(false); return }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: ch.id,
      code,
    })
    setBusy(false)
    if (vErr) { setError('Code incorrect — try again.'); return }

    window.location.href = `/api/xero/connect?business=${businessKey}`
  }, [enrollData, code, businessKey])

  // ── TOTP verify (already enrolled) ───────────────────────────────────────

  const handleVerifyTOTP = useCallback(async () => {
    if (!totpFactorId || code.length !== 6) return
    setError('')
    setBusy(true)
    const supabase = getSupabase()

    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: totpFactorId,
    })
    if (chErr) { setError(chErr.message); setBusy(false); return }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: totpFactorId,
      challengeId: ch.id,
      code,
    })
    setBusy(false)
    if (vErr) { setError('Code incorrect — try again.'); return }

    window.location.href = `/api/xero/connect?business=${businessKey}`
  }, [totpFactorId, code, businessKey])

  // ── Email OTP ─────────────────────────────────────────────────────────────

  const handleSendEmailOTP = useCallback(async () => {
    if (!userEmail) return
    setError('')
    setBusy(true)
    const supabase = getSupabase()

    const { error: err } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    if (err) { setError(err.message); return }
    setStep('verify-email')
  }, [userEmail])

  const handleVerifyEmailOTP = useCallback(async () => {
    if (!userEmail || code.length < 6) return
    setError('')
    setBusy(true)
    const supabase = getSupabase()

    const { error: err } = await supabase.auth.verifyOtp({
      email: userEmail,
      token: code,
      type: 'email',
    })
    setBusy(false)
    if (err) { setError('Code incorrect or expired. Request a new one.'); return }

    window.location.href = `/api/xero/connect?business=${businessKey}`
  }, [userEmail, code, businessKey])

  // ── Shared styles ─────────────────────────────────────────────────────────

  const inputCls =
    'w-full bg-white/[0.05] border border-white/[0.12] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm tracking-[0.25em] font-mono text-center'
  const btnCyan =
    'w-full py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-[11px] uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 disabled:opacity-40 rounded-sm transition-colors'
  const btnGhost =
    'w-full py-2.5 bg-white/[0.04] border border-white/[0.08] text-[11px] uppercase tracking-[0.15em] disabled:opacity-40 rounded-sm transition-colors hover:bg-white/[0.06]'
  const mutedText = { color: 'var(--color-text-muted)' } as const

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(5,5,5,0.88)' }}
    >
      <div
        className="w-full max-w-sm border border-white/[0.10] p-7 rounded-sm"
        style={{ background: 'var(--surface-card)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={mutedText}>
              Security Verification
            </p>
            <p className="text-sm font-light mt-1" style={{ color: 'var(--color-text-primary)' }}>
              Connect {businessName}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body */}
        {step === 'checking' && (
          <p className="text-xs text-center py-4" style={mutedText}>
            Checking security status…
          </p>
        )}

        {step === 'choose' && (
          <>
            <p className="text-xs mb-5 leading-relaxed" style={mutedText}>
              Verify your identity before connecting{' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>{businessName}</span>{' '}
              to Xero.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleEnrollTOTP}
                disabled={busy}
                className={btnCyan}
              >
                {busy ? 'Setting up…' : '🔐  Authenticator App'}
              </button>
              <button
                onClick={handleSendEmailOTP}
                disabled={busy || !userEmail}
                className={btnGhost}
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {busy ? 'Sending…' : `📧  Email OTP → ${userEmail}`}
              </button>
            </div>
          </>
        )}

        {step === 'enroll-totp' && enrollData && (
          <>
            <p className="text-xs mb-4 leading-relaxed" style={mutedText}>
              Scan this QR code with Google Authenticator, Authy, or any TOTP app.
              Then enter the 6-digit code below to complete setup.
            </p>
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollData.qrCode}
                alt="TOTP QR Code"
                className="w-36 h-36 rounded-sm"
                style={{ background: '#fff', padding: '6px' }}
              />
            </div>
            <p className="text-[10px] text-center mb-4 font-mono break-all" style={mutedText}>
              Manual key: {enrollData.secret}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inputCls}
              autoFocus
            />
            <button
              onClick={handleVerifyEnrollment}
              disabled={busy || code.length !== 6}
              className={`${btnCyan} mt-3`}
            >
              {busy ? 'Verifying…' : 'Verify & Connect'}
            </button>
          </>
        )}

        {step === 'verify-totp' && (
          <>
            <p className="text-xs mb-4 leading-relaxed" style={mutedText}>
              Open your authenticator app and enter the current 6-digit code for Nexus.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inputCls}
              autoFocus
            />
            <button
              onClick={handleVerifyTOTP}
              disabled={busy || code.length !== 6}
              className={`${btnCyan} mt-3`}
            >
              {busy ? 'Verifying…' : 'Verify & Connect'}
            </button>
            <button
              onClick={() => { setStep('choose'); setCode(''); setError('') }}
              className={`${btnGhost} mt-2`}
              style={{ color: 'var(--color-text-muted)' }}
            >
              Use email instead
            </button>
          </>
        )}

        {step === 'verify-email' && (
          <>
            <p className="text-xs mb-4 leading-relaxed" style={mutedText}>
              We sent a one-time code to{' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>{userEmail}</span>.
              Enter it below.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inputCls}
              autoFocus
            />
            <button
              onClick={handleVerifyEmailOTP}
              disabled={busy || code.length < 6}
              className={`${btnCyan} mt-3`}
            >
              {busy ? 'Verifying…' : 'Verify & Connect'}
            </button>
            <button
              onClick={() => { handleSendEmailOTP() }}
              disabled={busy}
              className={`${btnGhost} mt-2`}
              style={{ color: 'var(--color-text-muted)' }}
            >
              Resend code
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-xs text-red-400/90 border border-red-400/20 bg-red-400/5 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        {/* CRON note */}
        <p className="mt-5 text-[10px] leading-relaxed" style={mutedText}>
          Daily bookkeeper jobs run automatically and do not require verification.
        </p>
      </div>
    </div>
  )
}
