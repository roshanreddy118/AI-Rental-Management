// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { calculateCurrentRent } from '@/lib/rent-escalation'
import { sendRentReminderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    if (payload.role === 'owner') {
      const { data: payments } = await supabase
        .from('rent_payments')
        .select(`
          *,
          tenant:tenants!rent_payments_tenant_id_fkey(
            user:users!tenants_user_id_fkey(full_name),
            property:properties!tenants_property_id_fkey(name),
            base_rent,
            move_in_date
          )
        `)
        .eq('owner_id', payload.userId)
        .order('due_date', { ascending: false })
        .limit(50)

      const enriched = (payments || []).map(p => ({
        ...p,
        tenant_name: p.tenant?.user?.full_name,
        property_name: p.tenant?.property?.name,
      }))

      return NextResponse.json(enriched)
    } else {
      // Tenant sees only their own payments
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', payload.userId)
        .single()

      if (!tenant) return NextResponse.json([])

      const { data: payments } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('due_date', { ascending: false })

      return NextResponse.json(payments || [])
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServerClient()

    // Get tenant details to calculate current rent with escalation
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*, property:properties!tenants_property_id_fkey(name)')
      .eq('id', body.tenant_id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const escalation = calculateCurrentRent(tenant.base_rent || tenant.rent_amount, tenant.move_in_date)

    const { data: payment, error } = await supabase
      .from('rent_payments')
      .insert({
        tenant_id: body.tenant_id,
        owner_id: payload.userId,
        unit_id: tenant.unit_id,
        property_id: tenant.property_id,
        amount: body.amount || escalation.currentRent,
        due_date: body.due_date || new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: body.payment_method,
        transaction_id: body.transaction_id || null,
        status: 'paid',
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })

    return NextResponse.json(payment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
