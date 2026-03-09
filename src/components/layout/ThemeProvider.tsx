// src/components/layout/ThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return <>{children}</>
}
