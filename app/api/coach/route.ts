import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SessionInput {
  date: string
  discipline: string
  title: string
  duration: number
  distance?: number
  distanceUnit?: string
  intensity?: string
  notes?: string
  completed: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(sessions: SessionInput[]): string {
  const today = new Date().toISOString().split('T')[0]
  const completed = sessions
    .filter((s) => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50)

  const upcoming = sessions
    .filter((s) => !s.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 20)

  function fmt(s: SessionInput) {
    const dist = s.distance ? ` — ${s.distance}${s.distanceUnit ?? ''}` : ''
    const note = s.notes ? ` (${s.notes})` : ''
    return `  ${s.date} [${s.discipline}] ${s.title} — ${s.duration}min${dist}${note}`
  }

  return `You are an expert triathlon coach and sports scientist. You have full access to this athlete's recent training history and can add sessions directly to their calendar.

Today's date is ${today}.

## Athlete Training History

### Recent completed sessions (most recent first):
${completed.map(fmt).join('\n') || '  (none yet)'}

### Upcoming planned sessions:
${upcoming.map(fmt).join('\n') || '  (none planned)'}

When the athlete asks you to schedule or add a session, use the create_session tool. You can add multiple sessions in one response (e.g. a full week plan). After adding sessions, briefly confirm what you added and why.

Use this training data to give personalized, specific advice. Reference their actual workouts when relevant. Be concise and actionable.`
}

const CREATE_SESSION_TOOL: Anthropic.Tool = {
  name: 'create_session',
  description: 'Add a training session to the athlete\'s calendar. Use this when the athlete asks you to schedule or plan a session.',
  input_schema: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      discipline: {
        type: 'string',
        enum: ['swim', 'bike', 'run', 'lift', 'brick', 'yoga', 'rest', 'race', 'other'],
        description: 'Type of training session',
      },
      title: { type: 'string', description: 'Short descriptive name for the session, e.g. "Easy Tempo Run"' },
      duration: { type: 'number', description: 'Duration in minutes' },
      distance: { type: 'number', description: 'Distance (optional)' },
      distanceUnit: {
        type: 'string',
        enum: ['km', 'mi', 'yards', 'meters'],
        description: 'Unit for distance',
      },
      intensity: {
        type: 'string',
        enum: ['easy', 'moderate', 'hard', 'race'],
        description: 'Training intensity',
      },
      notes: { type: 'string', description: 'Optional workout details or coaching notes' },
    },
    required: ['date', 'discipline', 'title', 'duration', 'intensity'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const { messages, sessions } = await req.json() as { messages: Message[]; sessions: SessionInput[] }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const systemPrompt = buildSystemPrompt(sessions || [])
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const createdSessions: SessionInput[] = []

    // Agentic tool-use loop
    let response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      tools: [CREATE_SESSION_TOOL],
      messages: anthropicMessages,
    })

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => {
        if (block.name === 'create_session') {
          const input = block.input as {
            date: string
            discipline: string
            title: string
            duration: number
            intensity: string
            distance?: number
            distanceUnit?: string
            notes?: string
          }
          const newSession: SessionInput = {
            ...input,
            completed: false,
          }
          createdSessions.push({ ...newSession, date: input.date })
          return {
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Session "${input.title}" on ${input.date} added successfully.`,
          }
        }
        return {
          type: 'tool_result',
          tool_use_id: block.id,
          content: 'Unknown tool',
          is_error: true,
        }
      })

      response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        thinking: { type: 'adaptive' },
        system: systemPrompt,
        tools: [CREATE_SESSION_TOOL],
        messages: [
          ...anthropicMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
      })
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return NextResponse.json({
      text,
      sessionsToAdd: createdSessions.map((s) => ({
        id: uuidv4(),
        date: s.date,
        discipline: s.discipline,
        title: s.title,
        duration: s.duration,
        distance: s.distance,
        distanceUnit: s.distanceUnit,
        intensity: s.intensity || 'moderate',
        notes: s.notes,
        completed: false,
      })),
    })
  } catch (err) {
    console.error('Coach API error:', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
