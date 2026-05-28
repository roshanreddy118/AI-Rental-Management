import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { chatWithAI } from '@/lib/ai'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    const { data } = await supabase
      .from('agreements')
      .select(`
        *,
        tenant:tenants!agreements_tenant_id_fkey(
          user:users!tenants_user_id_fkey(full_name)
        ),
        property:properties!agreements_property_id_fkey(name)
      `)
      .eq('owner_id', payload.userId)
      .order('created_at', { ascending: false })

    const enriched = (data || []).map(a => ({
      ...a,
      tenant_name: a.tenant?.user?.full_name,
      property_name: a.property?.name,
    }))

    return NextResponse.json(enriched)
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

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('property_id, unit_id')
      .eq('id', body.tenant_id)
      .single()

    const { data: agreement, error } = await supabase
      .from('agreements')
      .insert({
        tenant_id: body.tenant_id,
        property_id: tenant?.property_id || body.property_id,
        unit_id: tenant?.unit_id || body.unit_id,
        owner_id: payload.userId,
        start_date: body.start_date,
        end_date: body.end_date,
        rent_amount: parseFloat(body.rent_amount),
        deposit_amount: parseFloat(body.deposit_amount),
        terms: body.terms,
        status: 'active',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to save agreement' }, { status: 500 })

    return NextResponse.json(agreement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
