// @ts-nocheck
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
        .from('maintenance_requests')
        .select(`
          *,
          tenant:tenants!maintenance_requests_tenant_id_fkey(
            user:users!tenants_user_id_fkey(full_name),
            property:properties!tenants_property_id_fkey(name),
            unit_id
          )
        `)
        .eq('owner_id', payload.userId)
        .order('created_at', { ascending: false })

      const enriched = (data || []).map(r => ({
        ...r,
        tenant_name: r.tenant?.user?.full_name,
        property_name: r.tenant?.property?.name,
        unit_number: r.unit_number,
      }))

      return NextResponse.json(enriched)
    } else {
      // Tenant sees only their own requests
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', payload.userId)
        .single()

      if (!tenant) return NextResponse.json([])

      const { data } = await supabase
        .from('maintenance_requests')
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
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServerClient()

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, property_id, unit_id, owner_id')
      .eq('user_id', payload.userId)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 })

    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .insert({
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        unit_id: tenant.unit_id,
        owner_id: tenant.owner_id,
        title: body.title,
        description: body.description,
        category: body.category || 'other',
        priority: body.priority || 'medium',
        unit_number: body.unit_number || '',
        status: 'open',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })

    return NextResponse.json(request, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
