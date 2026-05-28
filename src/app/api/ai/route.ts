import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { chatWithAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const response = await chatWithAI(messages)

    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
