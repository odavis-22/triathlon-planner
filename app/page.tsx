'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Session, RaceGoal } from '@/lib/types'
import { getSessions, saveSession, deleteSession, getRaceGoal, saveRaceGoal } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { stravaAuthUrl } from '@/lib/strava'
import { DISCIPLINES } from '@/lib/disciplines'
import Calendar from '@/components/Calendar'
import SessionModal from '@/components/SessionModal'
import RaceModal from '@/components/RaceModal'
import RaceCountdown from '@/components/RaceCountdown'
import WeeklyStats from '@/components/WeeklyStats'
import CoachPanel from '@/components/CoachPanel'
import { Trophy, LogOut } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [race, setRace] = useState<RaceGoal | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showRaceModal, setShowRaceModal] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null)

  async function refreshSessions() {
    setSessions(await getSessions())
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? null)
      setUserId(user.id)
      getRaceGoal().then(setRace)

      // Check Strava connection status
      const res = await fetch(`/api/strava/status?userId=${user.id}`)
      const { connected } = await res.json()
      setStravaConnected(connected)

      if (connected) {
        // Auto-sync new activities on every login
        await fetch('/api/strava/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      }

      refreshSessions()
    })

    // Show success message if coming back from Strava OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('strava') === 'connected') {
      window.history.replaceState({}, '', '/')
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

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

  async function handleSaveSession(session: Session) {
    await saveSession(session)
    await refreshSessions()
  }

  async function handleDeleteSession(id: string) {
    await deleteSession(id)
    await refreshSessions()
  }

  async function handleSaveRace(goal: RaceGoal) {
    await saveRaceGoal(goal)
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
          <div className="flex items-center gap-3">
            <RaceCountdown race={race} onSetRace={() => setShowRaceModal(true)} />

            {stravaConnected === false && userId && (
              <a
                href={stravaAuthUrl(userId)}
                className="flex items-center gap-2 bg-[#FC4C02] hover:bg-[#e04400] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Connect Strava
              </a>
            )}
            {stravaConnected === true && (
              <span className="flex items-center gap-1.5 text-xs text-[#FC4C02] font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Strava connected
              </span>
            )}

            <div className="flex items-center gap-3 border-l border-slate-700 pl-3">
              {userEmail && <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>}
              <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
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
            onSessionsAdd={async (newSessions) => {
              await Promise.all(newSessions.map(saveSession))
              await refreshSessions()
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
