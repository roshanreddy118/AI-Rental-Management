import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', payload.userId)
      .order('created_at', { ascending: false })

    // Get occupied unit counts for each property
    const propertyIds = (properties || []).map(p => p.id)
    let occupiedCounts: Record<string, number> = {}

    if (propertyIds.length > 0) {
      const { data: units } = await supabase
        .from('units')
        .select('property_id, status')
        .in('property_id', propertyIds)
        .eq('status', 'occupied')

      if (units) {
        for (const unit of units) {
          occupiedCounts[unit.property_id] = (occupiedCounts[unit.property_id] || 0) + 1
        }
      }
    }

    const result = (properties || []).map(p => ({
      ...p,
      occupied_units: occupiedCounts[p.id] || 0,
    }))

    return NextResponse.json(result)
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

    // Create property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        owner_id: payload.userId,
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        type: body.type,
        total_units: body.total_units,
        description: body.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Property creation error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create property' }, { status: 500 })
    }

    // Create units for the property
    const units = []
    for (let i = 1; i <= body.total_units; i++) {
      units.push({
        property_id: property.id,
        unit_number: `${i}`,
        status: 'vacant',
        rent_amount: 0,
        deposit_amount: 0,
      })
    }
    await supabase.from('units').insert(units)

    return NextResponse.json(property, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
