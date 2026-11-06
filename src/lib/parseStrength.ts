import Anthropic from '@anthropic-ai/sdk'
import type { ExtraExercise } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedStrength {
  squat?: { weight_kg: number | null; sets: number | null; reps: number | null }
  bench?: { weight_kg: number | null; sets: number | null; reps: number | null }
  deadlift?: { weight_kg: number | null; sets: number | null; reps: number | null }
  extras?: ExtraExercise[]
}

function buildPrompt(notes: string) {
  return `Extract strength training data from these workout notes. Return ONLY valid JSON with no markdown.

Notes: "${notes}"

Return this exact JSON structure (use null for missing values):
{
  "squat": { "weight_kg": null, "sets": null, "reps": null },
  "bench": { "weight_kg": null, "sets": null, "reps": null },
  "deadlift": { "weight_kg": null, "sets": null, "reps": null },
  "extras": [
    { "exercise": "plank", "category": "plank", "sets": null, "reps": null, "weight_kg": null, "duration_seconds": 60, "distance_m": null }
  ]
}

Rules:
- Convert lbs to kg if units are specified (divide by 2.205)
- If weight is given without units, assume kg
- Bench press / bench = bench field
- Extras are any exercises not squat/bench/deadlift, each as:
  { "exercise": "name", "category": "...", "sets": null, "reps": null, "weight_kg": null, "duration_seconds": null, "distance_m": null }
- category must be one of:
  - "plank": forearm plank, front plank, high plank, plank holds
  - "side_plank": side plank, left/right side plank. If the time is given "each side" or per side, duration_seconds is the time for ONE side
  - "farmers_walk": farmer's walk, farmers carry, farmer carry, suitcase carry. Put the weight carried in weight_kg (if two dumbbells, use the weight of each, as written), and distance_m if a distance is given
  - "accessory": everything else
- duration_seconds: convert any time to seconds (e.g. "60s" = 60, "1 min" = 60, "1m30s" = 90, "45 seconds" = 45)
- For timed exercises (planks, side planks, farmers walk) extract duration_seconds if mentioned
- If no strength data found at all, return null`
}

export async function parseStrengthNotes(notes: string): Promise<ParsedStrength | null> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: buildPrompt(notes) }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock?.type === 'text' ? textBlock.text : ''

    // Strip markdown fences if present
    const raw = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    if (!raw || raw === 'null') return null

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Parse strength error:', e)
    return null
  }
}
