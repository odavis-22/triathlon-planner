'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
          <Trophy size={24} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">TriCoach</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to access your training plan</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-green-400 font-medium">Check your email!</p>
            <p className="text-slate-400 text-sm mt-1">We sent a login link to <span className="text-white">{email}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? 'Sending…' : 'Send login link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
