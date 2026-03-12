'use client'

import { useState } from 'react'
import type { SocialPost, SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_COLOURS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  tiktok: '#FE2C55',
  youtube: '#FF0000',
}

interface Props {
  posts: SocialPost[]
}

export function CalendarView({ posts }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const monthLabel = new Date(year, month).toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  const postsByDay: Record<number, SocialPost[]> = {}
  for (const post of posts) {
    const date = post.scheduledAt ? new Date(post.scheduledAt) : post.publishedAt ? new Date(post.publishedAt) : null
    if (!date) continue
    if (date.getFullYear() === year && date.getMonth() === month) {
      const d = date.getDate()
      postsByDay[d] = postsByDay[d] ?? []
      postsByDay[d].push(post)
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">{monthLabel}</span>
        <div className="flex gap-2">
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="px-2 py-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-sm"
          >{'\u2190'}</button>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="px-2 py-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-sm"
          >{'\u2192'}</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-[9px] uppercase tracking-wider text-white/30 text-center py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[64px] p-1 border border-white/[0.06] rounded-sm ${
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                ? 'border-[#00F5FF]/30'
                : ''
            }`}
          >
            {day && (
              <>
                <span className="text-[10px] text-white/30">{day}</span>
                <div className="mt-1 space-y-0.5">
                  {(postsByDay[day] ?? []).slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className="text-[8px] px-1 py-0.5 rounded-sm truncate"
                      style={{
                        backgroundColor: `${PLATFORM_COLOURS[(post.platforms as SocialPlatform[])[0]]}20`,
                        color: PLATFORM_COLOURS[(post.platforms as SocialPlatform[])[0]],
                      }}
                      title={post.content}
                    >
                      {post.content.slice(0, 20)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
