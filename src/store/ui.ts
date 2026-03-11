// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  theme: Theme
  captureOpen: boolean
  bronOpen: boolean
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
  setTheme: (theme: Theme) => void
  toggleCapture: () => void
  toggleBron: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      theme: 'dark',
      captureOpen: false,
      bronOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
      setTheme: (theme) => set({ theme }),
      toggleCapture: () => set((s) => ({ captureOpen: !s.captureOpen })),
      toggleBron: () => set((s) => ({ bronOpen: !s.bronOpen })),
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
