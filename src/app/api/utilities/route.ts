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

    if (payload.role === 'owner') {
      const { data } = await supabase
        .from('utility_bills')
        .select(`
          *,
          tenant:tenants!utility_bills_tenant_id_fkey(
            user:users!tenants_user_id_fkey(full_name)
          )
        `)
        .eq('owner_id', payload.userId)
        .order('created_at', { ascending: false })

      const enriched = (data || []).map(b => ({
        ...b,
        tenant_name: b.tenant?.user?.full_name,
      }))

      return NextResponse.json(enriched)
    } else {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', payload.userId)
        .single()

      if (!tenant) return NextResponse.json([])

      const { data } = await supabase
        .from('utility_bills')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })

      return NextResponse.json(data || [])
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

    // Check for duplicate: same tenant + same type + same billing month
    const { data: existing } = await supabase
      .from('utility_bills')
      .select('id')
      .eq('tenant_id', body.tenant_id)
      .eq('type', body.type)
      .eq('billing_month', body.billing_month)
      .eq('owner_id', payload.userId)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `A ${body.type.replace('_', ' ')} bill already exists for this tenant for ${body.billing_month}. Edit the existing one instead.` }, { status: 409 })
    }

    // Get tenant's property and unit
    const { data: tenant } = await supabase
      .from('tenants')
      .select('property_id, unit_id')
      .eq('id', body.tenant_id)
      .single()

    const { data: bill, error } = await supabase
      .from('utility_bills')
      .insert({
        tenant_id: body.tenant_id,
        property_id: tenant?.property_id,
        unit_id: tenant?.unit_id,
        owner_id: payload.userId,
        type: body.type,
        amount: body.amount,
        billing_month: body.billing_month,
        due_date: body.due_date,
        meter_reading: body.meter_reading ? parseFloat(body.meter_reading) : null,
        previous_reading: body.previous_reading ? parseFloat(body.previous_reading) : null,
        paid: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to add bill' }, { status: 500 })

    return NextResponse.json(bill, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
