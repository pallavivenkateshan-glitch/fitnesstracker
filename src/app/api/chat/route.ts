import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const weekAgo = subDays(new Date(), 7).toISOString()
    const monthAgo = subDays(new Date(), 30).toISOString()

    const [mealsRes, activitiesRes, strengthRes, weightRes] = await Promise.all([
      supabase.from('meals').select('name, type, calories, protein, carbs, fat, logged_at').eq('user_id', user.id).gte('logged_at', weekAgo).order('logged_at', { ascending: false }),
      supabase.from('activities').select('name, type, distance, duration, heart_rate_avg, logged_at').eq('user_id', user.id).gte('logged_at', weekAgo).order('logged_at', { ascending: false }),
      supabase.from('strength_logs').select('squat_weight, squat_sets, squat_reps, bench_weight, bench_sets, bench_reps, deadlift_weight, deadlift_sets, deadlift_reps, extras, logged_at').eq('user_id', user.id).gte('logged_at', monthAgo).order('logged_at', { ascending: false }),
      supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(8),
    ])

    const contextData = `
LAST 7 DAYS — MEALS:
${(mealsRes.data ?? []).map(m => `${format(new Date(m.logged_at), 'MMM d')} | ${m.type} | ${m.name}: ${m.calories}kcal, P${m.protein}g C${m.carbs}g F${m.fat}g`).join('\n') || 'None logged'}

LAST 7 DAYS — ACTIVITIES:
${(activitiesRes.data ?? []).map(a => `${format(new Date(a.logged_at), 'MMM d')} | ${a.type} | ${a.name} — ${a.distance ? (a.distance/1000).toFixed(1)+'km' : ''} ${a.duration ? Math.round(a.duration/60)+'min' : ''} ${a.heart_rate_avg ? 'HR '+a.heart_rate_avg : ''}`).join('\n') || 'No activities'}

LAST 30 DAYS — STRENGTH LOGS:
${(strengthRes.data ?? []).map(s => `${format(new Date(s.logged_at), 'MMM d')} | Squat: ${s.squat_weight ?? '-'}kg ${s.squat_sets ?? ''}x${s.squat_reps ?? ''} | Bench: ${s.bench_weight ?? '-'}kg ${s.bench_sets ?? ''}x${s.bench_reps ?? ''} | Deadlift: ${s.deadlift_weight ?? '-'}kg ${s.deadlift_sets ?? ''}x${s.deadlift_reps ?? ''}`).join('\n') || 'No strength data'}

WEIGHT TREND:
${(weightRes.data ?? []).map(w => `${format(new Date(w.logged_at), 'MMM d')}: ${w.weight_kg.toFixed(1)}kg`).join(' → ') || 'No weight logged'}
`

    const systemPrompt = `You are a personal fitness and nutrition coach with access to the user's actual tracking data. Answer questions about their nutrition, training, strength progress, and weight trends using the data provided. Be specific, data-driven, and actionable. Keep responses focused, and always finish your thoughts completely. Reference actual numbers and dates when relevant.

USER DATA:
${contextData}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const reply = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    const lastUser = messages[messages.length - 1]
    if (reply && lastUser?.role === 'user') {
      const { error: saveError } = await supabase.from('chat_messages').insert([
        { user_id: user.id, role: 'user', content: lastUser.content },
        { user_id: user.id, role: 'assistant', content: reply },
      ])
      if (saveError) console.error('Chat history save error:', saveError)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
