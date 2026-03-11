// src/components/founder/settings/SettingsPageClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, KeyRound, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { VaultChangePassword } from '@/components/founder/vault/VaultChangePassword'

export function SettingsPageClient() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const [showPwModal, setShowPwModal] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadEmail() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
    }
    void loadEmail()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1
        className="text-xl font-semibold mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Settings
      </h1>

      <div className="flex flex-col gap-5">

        {/* ── Appearance ──────────────────────────────────────────── */}
        <section
          className="rounded-sm p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-[13px] font-medium uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Appearance
          </h2>
          <div className="flex gap-3">
            <ThemeCard
              icon={<Moon size={20} strokeWidth={1.5} />}
              label="Dark"
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeCard
              icon={<Sun size={20} strokeWidth={1.5} />}
              label="Light"
              active={theme === 'light'}
              onClick={() => setTheme('light')}
            />
          </div>
        </section>

        {/* ── Vault Password ──────────────────────────────────────── */}
        <section
          className="rounded-sm p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-[13px] font-medium uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Vault Password
          </h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            The vault master password protects access to your stored credentials.
            This is a local UI gate — your credentials are encrypted server-side with AES-256-GCM.
          </p>
          <button
            onClick={() => setShowPwModal(true)}
            className="flex items-center gap-2 px-4 h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90"
            style={{ background: '#00F5FF18', color: '#00F5FF', border: '1px solid #00F5FF30' }}
          >
            <KeyRound size={14} strokeWidth={1.5} />
            Change Password
          </button>
        </section>

        {/* ── Account ─────────────────────────────────────────────── */}
        <section
          className="rounded-sm p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-[13px] font-medium uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Account
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              <User size={16} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {email ?? 'Loading...'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                Supabase Auth (PKCE)
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 h-9 rounded-sm text-[13px] font-medium transition-colors"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-danger)',
            }}
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign Out
          </button>
        </section>
      </div>

      {/* Vault change password modal */}
      {showPwModal && <VaultChangePassword onClose={() => setShowPwModal(false)} />}
    </div>
  )
}

// ── Theme choice card ─────────────────────────────────────────────────────────
function ThemeCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 w-28 py-4 rounded-sm text-[12px] font-medium transition-all"
      style={{
        background: active ? '#00F5FF10' : 'var(--surface-elevated)',
        border: `1px solid ${active ? '#00F5FF' : 'var(--color-border)'}`,
        color: active ? '#00F5FF' : 'var(--color-text-muted)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
