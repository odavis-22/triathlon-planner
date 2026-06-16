'use client'

import { differenceInDays } from 'date-fns'
import { RaceGoal } from '@/lib/types'

interface Props {
  race: RaceGoal | null
  onSetRace: () => void
}

const RACE_LABELS = {
  sprint: 'Sprint Triathlon',
  olympic: 'Olympic Triathlon',
  half: 'Half Ironman (70.3)',
  full: 'Full Ironman',
}

export default function RaceCountdown({ race, onSetRace }: Props) {
  if (!race) {
    return (
      <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-3">
        <span className="text-slate-400 text-sm">No race set</span>
        <button
          onClick={onSetRace}
          className="text-xs bg-orange-500 hover:bg-orange-400 text-white px-3 py-1 rounded-lg transition-colors"
        >
          Set Race
        </button>
      </div>
    )
  }

  const daysLeft = differenceInDays(new Date(race.date), new Date())

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-xl px-5 py-3">
      <div className="text-3xl font-bold text-orange-400">{daysLeft}</div>
      <div>
        <div className="text-xs text-orange-300/70 uppercase tracking-wider">Days to</div>
        <div className="text-sm font-semibold text-orange-200">{race.name}</div>
        <div className="text-xs text-slate-400">{RACE_LABELS[race.type]}</div>
      </div>
      <button
        onClick={onSetRace}
        className="ml-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        Edit
      </button>
    </div>
  )
}
