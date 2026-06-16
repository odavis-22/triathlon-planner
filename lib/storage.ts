import { Session, RaceGoal } from './types'
import { STRAVA_SESSIONS } from './stravaImport'

const SESSIONS_KEY = 'tricoach_sessions'
const RACE_KEY = 'tricoach_race'
const SEEDED_KEY = 'tricoach_seeded'

export function getSessions(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    // On first load, seed with Strava data
    if (!localStorage.getItem(SEEDED_KEY)) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(STRAVA_SESSIONS))
      localStorage.setItem(SEEDED_KEY, 'true')
    }
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  const sessions = getSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.push(session)
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getRaceGoal(): RaceGoal | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(RACE_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveRaceGoal(goal: RaceGoal): void {
  localStorage.setItem(RACE_KEY, JSON.stringify(goal))
}
