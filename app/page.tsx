'use client'

import { useState, useEffect } from 'react'
import { Session, RaceGoal } from '@/lib/types'
import { getSessions, saveSession, deleteSession, getRaceGoal, saveRaceGoal } from '@/lib/storage'
import { DISCIPLINES } from '@/lib/disciplines'
import Calendar from '@/components/Calendar'
import SessionModal from '@/components/SessionModal'
import RaceModal from '@/components/RaceModal'
import RaceCountdown from '@/components/RaceCountdown'
import WeeklyStats from '@/components/WeeklyStats'
import CoachPanel from '@/components/CoachPanel'
import { Trophy } from 'lucide-react'

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [race, setRace] = useState<RaceGoal | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showRaceModal, setShowRaceModal] = useState(false)

  useEffect(() => {
    setSessions(getSessions())
    setRace(getRaceGoal())
  }, [])

  function handleDayClick(date: string) {
    setSelectedDate(date)
    setEditingSession(null)
    setShowSessionModal(true)
  }

  function handleSessionClick(session: Session) {
    setEditingSession(session)
    setSelectedDate(null)
    setShowSessionModal(true)
  }

  function handleSaveSession(session: Session) {
    saveSession(session)
    setSessions(getSessions())
  }

  function handleDeleteSession(id: string) {
    deleteSession(id)
    setSessions(getSessions())
  }

  function handleSaveRace(goal: RaceGoal) {
    saveRaceGoal(goal)
    setRace(goal)
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = sessions
    .filter((s) => !s.completed && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">TriCoach</h1>
              <p className="text-xs text-slate-500">Triathlon Training Planner</p>
            </div>
          </div>
          <RaceCountdown race={race} onSetRace={() => setShowRaceModal(true)} />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left: Calendar */}
        <div className="space-y-4">
          <WeeklyStats sessions={sessions} />
          <Calendar
            sessions={sessions}
            onDayClick={handleDayClick}
            onSessionClick={handleSessionClick}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <CoachPanel
                sessions={sessions}
                onSessionsAdd={(newSessions) => {
                  newSessions.forEach(saveSession)
                  setSessions(getSessions())
                }}
              />

          {/* Upcoming sessions */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Upcoming Sessions</h3>
            {upcoming.map((s) => {
              const info = DISCIPLINES[s.discipline]
              return (
                <button
                  key={s.id}
                  onClick={() => handleSessionClick(s)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border mb-2 hover:opacity-80 transition-opacity ${info.bg}`}
                >
                  <span className="text-base">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${info.color}`}>{s.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {s.duration}min
                    </div>
                  </div>
                </button>
              )
            })}
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-500">No upcoming sessions. Click a day on the calendar to add one.</p>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showSessionModal && (
        <SessionModal
          date={selectedDate || undefined}
          session={editingSession}
          onSave={handleSaveSession}
          onDelete={handleDeleteSession}
          onClose={() => { setShowSessionModal(false); setEditingSession(null) }}
        />
      )}
      {showRaceModal && (
        <RaceModal
          current={race}
          onSave={handleSaveRace}
          onClose={() => setShowRaceModal(false)}
        />
      )}
    </div>
  )
}
