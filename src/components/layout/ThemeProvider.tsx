// src/components/layout/ThemeProvider.tsx
// Hydration-safe theme application.
// The class toggle runs in useEffect (client-only) to prevent SSR mismatch.
// Dark :root tokens are the safe server-side default — no flash.

'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return <>{children}</>
}
