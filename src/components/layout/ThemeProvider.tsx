// src/components/layout/ThemeProvider.tsx
// Dark-only app — no theme toggle. This component is kept as a passthrough
// in case layout hierarchy needs it; it applies no class manipulation.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
