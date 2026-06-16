'use client'

import { useState, useEffect } from 'react'
import { Session, Discipline, Intensity } from '@/lib/types'
import { DISCIPLINES } from '@/lib/disciplines'
import { X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  date?: string
  session?: Session | null
  onSave: (session: Session) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const INTENSITIES: { value: Intensity; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy / Recovery', color: 'bg-green-500/20 border-green-500/50 text-green-300' },
  { value: 'moderate', label: 'Moderate / Base', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' },
  { value: 'hard', label: 'Hard / Threshold', color: 'bg-red-500/20 border-red-500/50 text-red-300' },
  { value: 'race', label: 'Race Effort', color: 'bg-orange-500/20 border-orange-500/50 text-orange-300' },
]

export default function SessionModal({ date, session, onSave, onDelete, onClose }: Props) {
  const [discipline, setDiscipline] = useState<Discipline>(session?.discipline || 'run')
  const [title, setTitle] = useState(session?.title || '')
  const [duration, setDuration] = useState(session?.duration?.toString() || '60')
  const [distance, setDistance] = useState(session?.distance?.toString() || '')
  const [distanceUnit, setDistanceUnit] = useState(session?.distanceUnit || 'km')
  const [intensity, setIntensity] = useState<Intensity>(session?.intensity || 'moderate')
  const [notes, setNotes] = useState(session?.notes || '')
  const [completed, setCompleted] = useState(session?.completed || false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSave() {
    if (!title.trim()) return
    onSave({
      id: session?.id || uuidv4(),
      date: session?.date || date || '',
      discipline,
      title: title.trim(),
      duration: parseInt(duration) || 60,
      distance: distance ? parseFloat(distance) : undefined,
      distanceUnit: distance ? (distanceUnit as 'km' | 'mi' | 'yards' | 'meters') : undefined,
      intensity,
      notes: notes.trim() || undefined,
      completed,
    })
    onClose()
  }

  const disc = DISCIPLINES[discipline]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {session ? 'Edit Session' : 'Add Training Session'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Discipline picker */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
              Discipline
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DISCIPLINES) as Discipline[]).map((d) => {
                const info = DISCIPLINES[d]
                return (
                  <button
                    key={d}
                    onClick={() => setDiscipline(d)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      discipline === d
                        ? info.bg + ' ' + info.color
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
              Session Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${disc.icon} Long ${disc.label} — Base Endurance`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-sm"
            />
          </div>

          {/* Duration + Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-slate-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Distance (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="—"
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-sm"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'mi' | 'yards' | 'meters')}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2.5 text-slate-300 focus:outline-none text-sm"
                >
                  <option value="km">km</option>
                  <option value="mi">mi</option>
                  <option value="meters">m</option>
                  <option value="yards">yd</option>
                </select>
              </div>
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
              Intensity
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITIES.map((i) => (
                <button
                  key={i.value}
                  onClick={() => setIntensity(i.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    intensity === i.value
                      ? i.color
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Workout details, how it felt, targets..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-sm resize-none"
            />
          </div>

          {/* Completed toggle */}
          {session && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setCompleted(!completed)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
                  completed ? 'bg-green-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    completed ? 'translate-x-4' : ''
                  }`}
                />
              </div>
              <span className="text-sm text-slate-300">Mark as completed</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <div>
            {session && onDelete && (
              <button
                onClick={() => { onDelete(session.id); onClose() }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {session ? 'Save Changes' : 'Add Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
