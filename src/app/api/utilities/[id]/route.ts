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

    const updateData: any = {}
    if (body.paid !== undefined) {
      updateData.paid = body.paid
      updateData.paid_date = body.paid ? new Date().toISOString().split('T')[0] : null
    }
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.meter_reading !== undefined) updateData.meter_reading = body.meter_reading
    if (body.previous_reading !== undefined) updateData.previous_reading = body.previous_reading

    const { data, error } = await supabase
      .from('utility_bills')
      .update(updateData)
      .eq('id', params.id)
      .eq('owner_id', payload.userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
