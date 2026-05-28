import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // If table doesn't exist yet, return empty
    if (error) {
      console.error('Notifications fetch error:', error.message)
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const unreadCount = (data || []).filter(n => !n.read).length

    return NextResponse.json({ notifications: data || [], unreadCount })
  } catch (err) {
    console.error('Notifications error:', err)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', payload.userId)
      .eq('read', false)

    return NextResponse.json({ message: 'Marked as read' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
