'use client'

// Live mission clock (UTC) for the Command Deck status strip.
// Client-only; renders a stable placeholder until mounted to avoid hydration drift.

import { useEffect, useState } from 'react'

function formatUTC(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}

export function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string>('--:--:--')

  useEffect(() => {
    const tick = () => setTime(formatUTC(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className={className} aria-label="Mission time, UTC" suppressHydrationWarning>
      {time}
    </span>
  )
}
