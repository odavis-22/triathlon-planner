'use client'

import { MessageSquare, Zap } from 'lucide-react'

export default function CoachPanel() {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
      <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
        <MessageSquare size={22} className="text-orange-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-white mb-1">AI Coach</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Your personal triathlon coach powered by Claude. Ask about training, pacing, race-day strategy, nutrition, and more.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
        <Zap size={12} className="text-orange-400" />
        <span>Coming soon — add your Claude API key to unlock</span>
      </div>
    </div>
  )
}
