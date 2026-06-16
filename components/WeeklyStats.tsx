'use client'

import { Session } from '@/lib/types'
import { DISCIPLINES } from '@/lib/disciplines'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'

interface Props {
  sessions: Session[]
}

export default function WeeklyStats({ sessions }: Props) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeek = sessions.filter((s) => {
    try {
      return isWithinInterval(parseISO(s.date), { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  })

  const totalMinutes = thisWeek.reduce((acc, s) => acc + s.duration, 0)
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  const byDiscipline = thisWeek.reduce<Record<string, number>>((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] || 0) + 1
    return acc
  }, {})

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl px-5 py-4">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">This Week</div>
      <div className="flex items-center gap-6">
        <div>
          <div className="text-2xl font-bold text-white">{hrs}h {mins}m</div>
          <div className="text-xs text-slate-500">Total training</div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div>
          <div className="text-2xl font-bold text-white">{thisWeek.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="flex gap-2 flex-wrap">
          {Object.entries(byDiscipline).map(([d, count]) => {
            const info = DISCIPLINES[d as keyof typeof DISCIPLINES]
            return (
              <span key={d} className={`text-xs px-2 py-1 rounded-md border ${info.bg} ${info.color}`}>
                {info.icon} {count}x {info.label}
              </span>
            )
          })}
          {thisWeek.length === 0 && (
            <span className="text-xs text-slate-500">No sessions planned yet</span>
          )}
        </div>
      </div>
    </div>
  )
}
