// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
    }),
    {
      name: 'nexus-ui',
      // Only persist UI layout state — never theme (dark-only app)
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen, expandedBusinesses: s.expandedBusinesses }),
    }
  )
)
