// src/store/__tests__/ui.test.ts
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { useUIStore } from '../ui'

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [] })
})

describe('useUIStore', () => {
  it('initialises with sidebar open', () => {
    const { result } = renderHook(() => useUIStore())
    expect(result.current.sidebarOpen).toBe(true)
  })

  it('toggleSidebar flips sidebarOpen', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarOpen).toBe(false)
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarOpen).toBe(true)
  })

  it('toggleBusiness adds key when not expanded', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleBusiness('dr'))
    expect(result.current.expandedBusinesses).toContain('dr')
  })

  it('toggleBusiness removes key when already expanded', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: ['dr'] })
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleBusiness('dr'))
    expect(result.current.expandedBusinesses).not.toContain('dr')
  })
})
