export type Discipline =
  | 'swim'
  | 'bike'
  | 'run'
  | 'lift'
  | 'brick'
  | 'yoga'
  | 'rest'
  | 'race'
  | 'other'

export type Intensity = 'easy' | 'moderate' | 'hard' | 'race'

export interface Session {
  id: string
  date: string // ISO date string YYYY-MM-DD
  discipline: Discipline
  title: string
  duration: number // minutes
  distance?: number
  distanceUnit?: 'km' | 'mi' | 'yards' | 'meters'
  intensity: Intensity
  notes?: string
  completed: boolean
}

export interface RaceGoal {
  date: string
  name: string
  type: 'sprint' | 'olympic' | 'half' | 'full'
}
