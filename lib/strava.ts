import { createClient } from '@supabase/supabase-js'
import { Session, Discipline, Intensity } from './types'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!

export function stravaAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: 'code',
    scope: 'activity:read_all',
    state: userId,
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeStravaCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number }
}> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  return res.json()
}

export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_at: number
}> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  const now = Math.floor(Date.now() / 1000)
  if (data.expires_at > now + 60) return data.access_token

  // Token expired — refresh it
  const refreshed = await refreshStravaToken(data.refresh_token)
  await supabase.from('strava_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: refreshed.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return refreshed.access_token
}

export async function fetchStravaActivities(
  accessToken: string,
  after?: number
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({ per_page: '100' })
  if (after) params.set('after', String(after))

  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

interface StravaActivity {
  id: number
  name: string
  description?: string
  sport_type: string
  start_date_local: string
  moving_time: number
  distance: number
  suffer_score?: number
  type: string
}

function sportToDiscipline(sport: string): Discipline {
  switch (sport) {
    case 'Run': return 'run'
    case 'Swim': return 'swim'
    case 'Ride':
    case 'VirtualRide': return 'bike'
    case 'WeightTraining': return 'lift'
    case 'Yoga': return 'yoga'
    default: return 'other'
  }
}

function effortToIntensity(sufferScore: number): Intensity {
  if (sufferScore >= 40) return 'hard'
  if (sufferScore >= 15) return 'moderate'
  return 'easy'
}

export function stravaActivityToSession(activity: StravaActivity): Session {
  const date = activity.start_date_local.split('T')[0]
  const discipline = sportToDiscipline(activity.sport_type || activity.type)
  const intensity = effortToIntensity(activity.suffer_score ?? 0)

  return {
    id: `strava-${activity.id}`,
    date,
    discipline,
    title: activity.name,
    duration: Math.round(activity.moving_time / 60),
    distance: activity.distance > 0 ? Math.round((activity.distance / 1000) * 100) / 100 : undefined,
    distanceUnit: activity.distance > 0 ? 'km' : undefined,
    intensity,
    notes: activity.description || undefined,
    completed: true,
  }
}
