'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <p className="text-slate-400">Signing you in…</p>
    </div>
  )
}
