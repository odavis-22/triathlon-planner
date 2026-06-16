'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Session } from '@/lib/types'
import { DISCIPLINES } from '@/lib/disciplines'

interface Props {
  sessions: Session[]
  onDayClick: (date: string) => void
  onSessionClick: (session: Session) => void
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Calendar({ sessions, onDayClick, onSessionClick }: Props) {
  const [current, setCurrent] = useState(new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function sessionsForDay(day: Date) {
    return sessions.filter((s) => {
      try { return isSameDay(parseISO(s.date), day) } catch { return false }
    })
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <button
          onClick={() => setCurrent(subMonths(current, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrent(addMonths(current, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-700">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const daySessions = sessionsForDay(day)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          const dateStr = format(day, 'yyyy-MM-dd')

          return (
            <div
              key={i}
              onClick={() => onDayClick(dateStr)}
              className={`min-h-[100px] p-2 border-b border-r border-slate-700/50 cursor-pointer group transition-colors
                ${inMonth ? 'hover:bg-slate-700/30' : 'opacity-30'}
                ${i % 7 === 6 ? 'border-r-0' : ''}
              `}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${today ? 'bg-orange-500 text-white' : 'text-slate-400'}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {inMonth && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300">
                    <Plus size={14} />
                  </span>
                )}
              </div>

              {/* Sessions */}
              <div className="space-y-0.5">
                {daySessions.slice(0, 3).map((s) => {
                  const info = DISCIPLINES[s.discipline]
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); onSessionClick(s) }}
                      className={`text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity
                        ${info.bg} ${info.color}
                        ${s.completed ? 'opacity-50 line-through' : ''}
                      `}
                    >
                      {info.icon} {s.title}
                    </div>
                  )
                })}
                {daySessions.length > 3 && (
                  <div className="text-xs text-slate-500 pl-1">+{daySessions.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
