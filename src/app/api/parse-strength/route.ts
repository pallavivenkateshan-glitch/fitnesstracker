import { NextRequest, NextResponse } from 'next/server'
import { parseStrengthNotes } from '@/lib/parseStrength'

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json()

    if (!notes?.trim()) {
      return NextResponse.json({ data: null })
    }

    const data = await parseStrengthNotes(notes)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Parse strength error:', error)
    return NextResponse.json({ data: null })
  }
}
