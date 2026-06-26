import { Session, RaceGoal } from './types'
import { supabase } from './supabase'
import { STRAVA_SESSIONS } from './stravaImport'

// ── Sessions ──────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: true })
  if (error) {
    console.error('getSessions:', error.message)
    return []
  }
  return data.map(rowToSession)
}

export async function saveSession(session: Session): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('sessions')
    .upsert({ ...sessionToRow(session), user_id: user.id }, { onConflict: 'id' })
  if (error) console.error('saveSession:', error.message)
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) console.error('deleteSession:', error.message)
}

// ── Strava Sync ───────────────────────────────────────────────────────────

export async function syncStravaActivities(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Find which strava IDs are already in the DB
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .like('id', 'strava-%')

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newSessions = STRAVA_SESSIONS.filter((s) => !existingIds.has(s.id))

  if (newSessions.length === 0) return 0

  const rows = newSessions.map((s) => ({ ...sessionToRow(s), user_id: user.id }))
  const { error } = await supabase.from('sessions').insert(rows)
  if (error) console.error('syncStravaActivities:', error.message)

  return newSessions.length
}

// ── Race Goal ─────────────────────────────────────────────────────────────

export async function getRaceGoal(): Promise<RaceGoal | null> {
  const { data, error } = await supabase
    .from('race_goals')
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('getRaceGoal:', error.message)
    return null
  }
  if (!data) return null
  return { date: data.date, name: data.name, type: data.type }
}

export async function saveRaceGoal(goal: RaceGoal): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase.from('race_goals').upsert(
    { user_id: user.id, date: goal.date, name: goal.name, type: goal.type, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) console.error('saveRaceGoal:', error.message)
}

// ── Row mapping ───────────────────────────────────────────────────────────

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    date: row.date as string,
    discipline: row.discipline as Session['discipline'],
    title: row.title as string,
    duration: row.duration as number,
    distance: row.distance as number | undefined,
    distanceUnit: row.distance_unit as Session['distanceUnit'],
    intensity: row.intensity as Session['intensity'],
    notes: row.notes as string | undefined,
    completed: row.completed as boolean,
  }
}

function sessionToRow(s: Session) {
  return {
    id: s.id,
    date: s.date,
    discipline: s.discipline,
    title: s.title,
    duration: s.duration,
    distance: s.distance ?? null,
    distance_unit: s.distanceUnit ?? null,
    intensity: s.intensity,
    notes: s.notes ?? null,
    completed: s.completed,
  }
}
