// src/components/layout/Sidebar.tsx
'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { BUSINESSES } from '@/lib/businesses'
import { SidebarNav } from './SidebarNav'
import { SidebarBusinessItem } from './SidebarBusinessItem'

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 48 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative shrink-0 flex flex-col overflow-hidden border-r fixed md:relative inset-y-0 left-0 z-50 md:z-auto"
      style={{
        background: 'var(--surface-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Workspace header */}
      <div
        className="flex items-center h-11 px-3 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-[15px] font-semibold select-none" style={{ color: '#00F5FF' }}>
          ◈
        </span>
        {sidebarOpen && (
          <span
            className="ml-2 text-[13px] font-semibold tracking-widest"
            style={{ color: 'var(--color-text-primary)' }}
          >
            NEXUS
          </span>
        )}
        {sidebarOpen && (
          <span
            className="ml-auto font-mono text-[10px]"
            style={{ color: 'var(--color-text-disabled)' }}
          >
            ⌘\
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-2">
        {/* Search trigger */}
        {sidebarOpen && (
          <div className="px-2">
            <button
              className="w-full flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] transition-colors"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-disabled)',
              }}
            >
              <Search size={12} strokeWidth={1.75} />
              <span>Search...</span>
              <span className="ml-auto font-mono text-[10px]">⌘K</span>
            </button>
          </div>
        )}

        {/* Global nav */}
        <SidebarNav collapsed={!sidebarOpen} />

        {/* MY BUSINESSES */}
        <div className="flex flex-col gap-0.5">
          {sidebarOpen && (
            <span
              className="px-4 text-[10px] font-medium tracking-widest uppercase"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              My Businesses
            </span>
          )}
          <div className="px-2 flex flex-col gap-0.5">
            {BUSINESSES.map((biz) => (
              <SidebarBusinessItem key={biz.key} business={biz} collapsed={!sidebarOpen} />
            ))}
          </div>
        </div>
      </div>

      {/* Avatar footer */}
      <div
        className="h-11 flex items-center px-3 shrink-0 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          P
        </div>
        {sidebarOpen && (
          <span
            className="ml-2 text-[12px] truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Phill McGurk
          </span>
        )}
      </div>
    </motion.aside>
  )
}
