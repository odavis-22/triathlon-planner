import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidAccessToken, fetchStravaActivities, stravaActivityToSession } from '@/lib/strava'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return NextResponse.json({ synced: 0 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch activities from the last 7 days to pick up anything new
  const after = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
  const activities = await fetchStravaActivities(accessToken, after)

  if (!Array.isArray(activities) || activities.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

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

  return NextResponse.json({ synced: newSessions.length })
}
