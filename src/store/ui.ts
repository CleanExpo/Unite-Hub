// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  theme: Theme
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
  setTheme: (theme: Theme) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'nexus-ui',
      partialize: (s) => ({
        sidebarOpen: s.sidebarOpen,
        expandedBusinesses: s.expandedBusinesses,
        theme: s.theme,
      }),
    }
  )
)
