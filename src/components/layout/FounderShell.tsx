'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useUIStore } from '@/store/ui'

// Lazy-load overlay components — defers JS bundle until first render
const IdeaCapture = dynamic(
  () => import('./IdeaCapture').then(m => ({ default: m.IdeaCapture })),
  { ssr: false }
)
const CommandBar = dynamic(
  () => import('./CommandBar').then(m => ({ default: m.CommandBar })),
  { ssr: false }
)

export function FounderShell({ children }: { children: React.ReactNode }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === '\\') { e.preventDefault(); toggleSidebar(); return }
      if (e.key === 'k')  { e.preventDefault(); toggleCommandBar(); return }
      if (e.key === 'i')  { e.preventDefault(); toggleCapture(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, toggleCommandBar, toggleCapture])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--surface-canvas)' }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <IdeaCapture />
      <CommandBar />
    </div>
  )
}
