import { Discipline } from './types'

export const DISCIPLINES: Record<Discipline, { label: string; color: string; bg: string; icon: string }> = {
  swim: {
    label: 'Swim',
    color: 'text-blue-300',
    bg: 'bg-blue-500/20 border-blue-500/40',
    icon: '🏊',
  },
  bike: {
    label: 'Bike',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/20 border-yellow-500/40',
    icon: '🚴',
  },
  run: {
    label: 'Run',
    color: 'text-green-300',
    bg: 'bg-green-500/20 border-green-500/40',
    icon: '🏃',
  },
  lift: {
    label: 'Strength',
    color: 'text-red-300',
    bg: 'bg-red-500/20 border-red-500/40',
    icon: '🏋️',
  },
  brick: {
    label: 'Brick',
    color: 'text-purple-300',
    bg: 'bg-purple-500/20 border-purple-500/40',
    icon: '⚡',
  },
  yoga: {
    label: 'Yoga / Mobility',
    color: 'text-pink-300',
    bg: 'bg-pink-500/20 border-pink-500/40',
    icon: '🧘',
  },
  rest: {
    label: 'Rest / Recovery',
    color: 'text-slate-300',
    bg: 'bg-slate-500/20 border-slate-500/40',
    icon: '😴',
  },
  race: {
    label: 'Race',
    color: 'text-orange-300',
    bg: 'bg-orange-500/20 border-orange-500/40',
    icon: '🏁',
  },
  other: {
    label: 'Other',
    color: 'text-teal-300',
    bg: 'bg-teal-500/20 border-teal-500/40',
    icon: '🎯',
  },
}
