import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { force } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = format(new Date(), 'yyyy-MM-dd')

    // Check cached insight unless force refresh
    if (!force) {
      const { data: cached } = await supabase
        .from('daily_insights')
        .select('content')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (cached) {
        return NextResponse.json({ insight: cached.content })
      }
    }

    // Gather today's data
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()
    const weekAgo = subDays(new Date(), 7).toISOString()

    const [mealsRes, activitiesRes, weightRes, strengthRes] = await Promise.all([
      supabase.from('meals').select('name, type, calories, protein, carbs, fat').eq('user_id', user.id).gte('logged_at', todayStart).lte('logged_at', todayEnd),
      supabase.from('activities').select('name, type, distance, duration, heart_rate_avg').eq('user_id', user.id).gte('logged_at', todayStart).lte('logged_at', todayEnd),
      supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(4),
      supabase.from('strength_logs').select('squat_weight, bench_weight, deadlift_weight, logged_at').eq('user_id', user.id).gte('logged_at', weekAgo).order('logged_at', { ascending: false }).limit(5),
    ])

    const meals = mealsRes.data ?? []
    const activities = activitiesRes.data ?? []
    const weights = weightRes.data ?? []
    const strengthLogs = strengthRes.data ?? []

    if (meals.length === 0 && activities.length === 0) {
      return NextResponse.json({
        insight: "No data logged yet today. Start by logging a meal or syncing your Strava activities to get personalized insights."
      })
    }

    const totalCalories = meals.reduce((s, m) => s + m.calories, 0)
    const totalProtein = meals.reduce((s, m) => s + m.protein, 0)
    const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0)
    const totalFat = meals.reduce((s, m) => s + m.fat, 0)

    const context = `
TODAY'S MEALS (${meals.length} logged):
${meals.map(m => `- ${m.name} (${m.type}): ${m.calories}kcal, ${m.protein}g protein, ${m.carbs}g carbs, ${m.fat}g fat`).join('\n')}
Total: ${Math.round(totalCalories)} kcal, ${Math.round(totalProtein)}g protein, ${Math.round(totalCarbs)}g carbs, ${Math.round(totalFat)}g fat

TODAY'S ACTIVITIES:
${activities.length === 0 ? 'Rest day' : activities.map(a => `- ${a.name} (${a.type}): ${a.distance ? (a.distance/1000).toFixed(1)+'km' : ''} ${a.duration ? Math.round(a.duration/60)+'min' : ''} ${a.heart_rate_avg ? 'avg HR '+a.heart_rate_avg : ''}`).join('\n')}

RECENT WEIGHT (last 4 weeks):
${weights.map(w => `- ${format(new Date(w.logged_at), 'MMM d')}: ${w.weight_kg.toFixed(1)}kg`).join('\n')}

RECENT STRENGTH:
${strengthLogs.map(s => `- Squat: ${s.squat_weight ?? 'N/A'}kg | Bench: ${s.bench_weight ?? 'N/A'}kg | Deadlift: ${s.deadlift_weight ?? 'N/A'}kg`).join('\n')}
`

    const prompt = `You are a personal fitness and nutrition coach. Based on today's data, write a concise, specific, and actionable insight (2-4 sentences max). Be direct and reference actual numbers. Focus on what matters most today — either a positive callout, a gap to address, or a key observation.

${context}

Write the insight in second person ("You..."). Do not use bullet points. Be conversational and specific, not generic.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const insight = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Cache it
    await supabase
      .from('daily_insights')
      .upsert({ user_id: user.id, content: insight, date: today, generated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Generate insights error:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
