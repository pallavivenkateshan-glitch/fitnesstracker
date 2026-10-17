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
    { "exercise": "push-ups", "sets": null, "reps": 20 }
  ]
}

Rules:
- Convert lbs to kg if units are specified (divide by 2.205)
- If weight is given without units, assume kg
- Bench press / bench = bench field
- Extras are any exercises not squat/bench/deadlift
- If no strength data found at all, return { "squat": { "weight_kg": null, "sets": null, "reps": null }, "bench": { "weight_kg": null, "sets": null, "reps": null }, "deadlift": { "weight_kg": null, "sets": null, "reps": null }, "extras": [] }`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ data: null })
    }

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Parse strength error:', error)
    return NextResponse.json({ data: null })
  }
}
