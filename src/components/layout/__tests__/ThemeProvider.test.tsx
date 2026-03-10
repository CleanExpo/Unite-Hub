// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { useUIStore } from '@/store/ui'
import { ThemeProvider } from '../ThemeProvider'

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'dark' })
  document.documentElement.classList.remove('light')
})

describe('ThemeProvider', () => {
  it('does not add .light class when theme is dark', () => {
    render(<ThemeProvider><div /></ThemeProvider>)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('adds .light class to <html> when theme is light', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'light' })
    render(<ThemeProvider><div /></ThemeProvider>)
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
