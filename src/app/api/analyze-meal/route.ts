import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, note } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const prompt = `You are a nutrition expert analyzing a meal photo. 
${note ? `Additional context from user: "${note}"` : ''}

Please analyze this meal and provide:
1. The meal name/description
2. Your portion size assumptions (be explicit, e.g. "1 chicken breast ~150g, 1 cup rice ~185g cooked")
3. Estimated macros

Respond in this exact JSON format (no markdown, just JSON):
{
  "name": "meal name",
  "assumptions": "detailed portion size assumptions stated clearly",
  "calories": 500,
  "protein": 35,
  "carbs": 45,
  "fat": 15,
  "confidence": "high|medium|low"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json(data)
  } catch (error) {
    console.error('Analyze meal error:', error)
    return NextResponse.json({ error: 'Failed to analyze meal photo' }, { status: 500 })
  }
}
