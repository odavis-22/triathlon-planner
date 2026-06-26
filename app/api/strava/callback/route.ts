import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeStravaCode, fetchStravaActivities, stravaActivityToSession } from '@/lib/strava'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${origin}/?strava=error`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Exchange code for tokens
  const tokens = await exchangeStravaCode(code)
  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/?strava=error`)
  }

  // Store tokens
  await supabase.from('strava_tokens').upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at,
    athlete_id: tokens.athlete.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Fetch last 90 days of activities
  const after = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
  const activities = await fetchStravaActivities(tokens.access_token, after)

  if (Array.isArray(activities) && activities.length > 0) {
    // Only insert activities not already in DB
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .like('id', 'strava-%')

    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
    const newSessions = activities
      .map(stravaActivityToSession)
      .filter((s) => !existingIds.has(s.id))

    if (newSessions.length > 0) {
      const rows = newSessions.map((s) => ({
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
        user_id: userId,
      }))
      await supabase.from('sessions').insert(rows)
    }
  }

  return NextResponse.redirect(`${origin}/?strava=connected`)
}
