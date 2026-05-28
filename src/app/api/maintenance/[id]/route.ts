import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServerClient()

    const updateData: any = { status: body.status }
    if (body.resolution_notes) updateData.resolution_notes = body.resolution_notes
    if (body.status === 'resolved') updateData.resolved_at = new Date().toISOString()

    const { error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', params.id)
      .eq('owner_id', payload.userId)

    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    return NextResponse.json({ message: 'Updated successfully' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
