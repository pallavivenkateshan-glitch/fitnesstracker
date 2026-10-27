import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json()

    if (!notes?.trim()) {
      return NextResponse.json({ data: null })
    }

    const prompt = `Extract strength training data from these workout notes. Return ONLY valid JSON with no markdown.

Notes: "${notes}"

Return this exact JSON structure (use null for missing values):
{
  "squat": { "weight_kg": null, "sets": null, "reps": null },
  "bench": { "weight_kg": null, "sets": null, "reps": null },
  "deadlift": { "weight_kg": null, "sets": null, "reps": null },
  "extras": [
    { "exercise": "plank", "sets": null, "reps": null, "weight_kg": null, "duration_seconds": 60 }
  ]
}

Rules:
- Convert lbs to kg if units are specified (divide by 2.205)
- If weight is given without units, assume kg
- Bench press / bench = bench field
- Extras are any exercises not squat/bench/deadlift, each as:
  { "exercise": "name", "sets": null, "reps": null, "weight_kg": null, "duration_seconds": null }
- duration_seconds: convert any time to seconds (e.g. "60s" = 60, "1 min" = 60, "1m30s" = 90, "45 seconds" = 45)
- For timed exercises like planks, side planks, and farmers walk, extract duration_seconds if mentioned
- For farmers walk, also extract weight_kg if mentioned (the weight carried)
- If no strength data found at all, return null`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock?.type === 'text' ? textBlock.text : ''

    // Strip markdown fences if present
    const raw = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    if (!raw || raw === 'null') return NextResponse.json({ data: null })

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ data: null })

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Parse strength error:', error)
    return NextResponse.json({ data: null })
  }
}
