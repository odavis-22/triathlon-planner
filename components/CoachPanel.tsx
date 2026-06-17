'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, CalendarPlus } from 'lucide-react'
import { Session } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  addedSessions?: Session[]
}

interface Props {
  sessions: Session[]
  onSessionsAdd: (sessions: Session[]) => void
}

const SUGGESTIONS = [
  'How is my training load this week?',
  'Add a 45-min easy run for tomorrow',
  'Build me a triathlon training week',
  'How do I improve my swim efficiency?',
]

export default function CoachPanel({ sessions, onSessionsAdd }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('tricoach_chat') || '[]')
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    localStorage.setItem('tricoach_chat', JSON.stringify(messages))
  }, [messages])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          sessions,
        }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json() as { text: string; sessionsToAdd?: Session[] }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text,
        addedSessions: data.sessionsToAdd?.length ? data.sessionsToAdd : undefined,
      }

      setMessages((prev) => [...prev, assistantMsg])

      if (data.sessionsToAdd?.length) {
        onSessionsAdd(data.sessionsToAdd)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl flex flex-col overflow-hidden" style={{ height: '440px' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <MessageSquare size={13} className="text-orange-400" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">AI Coach</span>
          <span className="ml-2 text-xs text-green-400">● powered by Claude</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 text-center pt-2">
              Ask your AI coach anything — or have it add sessions to your calendar.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-slate-700/60 text-slate-100 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
            {m.addedSessions && m.addedSessions.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1 max-w-[88%]">
                {m.addedSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-700/40 rounded-lg px-2.5 py-1.5"
                  >
                    <CalendarPlus size={11} />
                    <span>Added: <span className="font-medium">{s.title}</span> on {s.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <Loader2 size={14} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-700/60 px-3 py-2.5 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask your coach or say 'add a run on Friday'..."
          rows={1}
          className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-none leading-5"
          style={{ maxHeight: '80px', overflowY: 'auto' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="shrink-0 w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  )
}
