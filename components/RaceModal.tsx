'use client'

import { useState } from 'react'
import { RaceGoal } from '@/lib/types'
import { X } from 'lucide-react'

interface Props {
  current: RaceGoal | null
  onSave: (goal: RaceGoal) => void
  onClose: () => void
}

export default function RaceModal({ current, onSave, onClose }: Props) {
  const [name, setName] = useState(current?.name || '')
  const [date, setDate] = useState(current?.date || '')
  const [type, setType] = useState<RaceGoal['type']>(current?.type || 'olympic')

  function handleSave() {
    if (!name.trim() || !date) return
    onSave({ name: name.trim(), date, type })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Set Your Race Goal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Race Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Escape from Alcatraz"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Race Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Race Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['sprint', 'olympic', 'half', 'full'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                    type === t
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t === 'half' ? 'Half (70.3)' : t === 'full' ? 'Full Ironman' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !date}
            className="px-5 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg"
          >
            Save Race
          </button>
        </div>
      </div>
    </div>
  )
}
