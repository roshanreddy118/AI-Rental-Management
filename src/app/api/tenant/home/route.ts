// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { calculateCurrentRent } from '@/lib/rent-escalation'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    // Get tenant record — strictly only this user's data
    const { data: tenant } = await supabase
      .from('tenants')
      .select(`
        *,
        property:properties!tenants_property_id_fkey(name, address, city, state, pincode),
        unit:units!tenants_unit_id_fkey(unit_number),
        owner:users!tenants_owner_id_fkey(full_name, email)
      `)
      .eq('user_id', payload.userId)
      .eq('status', 'active')
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'No active tenancy found' }, { status: 404 })
    }

    // Calculate rent with 10% annual escalation from move_in_date
    const escalation = calculateCurrentRent(
      tenant.base_rent || tenant.rent_amount,
      tenant.move_in_date
    )

    return NextResponse.json({
      id: tenant.id,
      property_name: tenant.property?.name,
      address: `${tenant.property?.address}, ${tenant.property?.city}, ${tenant.property?.state} - ${tenant.property?.pincode}`,
      unit_number: tenant.unit?.unit_number,
      move_in_date: tenant.move_in_date,
      lease_start: tenant.lease_start,
      lease_end: tenant.lease_end,
      status: tenant.status,
      verification_status: tenant.verification_status,
      
      // Rent with escalation
      base_rent: tenant.base_rent || tenant.rent_amount,
      current_rent: escalation.currentRent,
      years_completed: escalation.yearsCompleted,
      next_increase_date: escalation.nextIncreaseDate,
      next_rent: escalation.nextRent,
      escalation_history: escalation.escalationHistory,
      
      // Landlord info
      owner_name: tenant.owner?.full_name,
      owner_email: tenant.owner?.email,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
