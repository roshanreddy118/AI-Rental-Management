import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken, generateInviteCode } from '@/lib/auth'
import { sendTenantInviteEmail } from '@/lib/email'
import { calculateCurrentRent } from '@/lib/rent-escalation'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    const { data: tenants } = await supabase
      .from('tenants')
      .select(`
        *,
        user:users!tenants_user_id_fkey(full_name, email, phone),
        property:properties!tenants_property_id_fkey(name)
      `)
      .eq('owner_id', payload.userId)
      .order('created_at', { ascending: false })

    // Add current rent with escalation
    const enrichedTenants = (tenants || []).map(t => {
      const escalation = calculateCurrentRent(t.base_rent || t.rent_amount, t.move_in_date)
      return {
        ...t,
        id: t.id,
        full_name: t.user?.full_name,
        email: t.user?.email,
        phone: t.user?.phone,
        property_name: t.property?.name,
        current_rent: escalation.currentRent,
        next_increase_date: escalation.nextIncreaseDate,
        next_rent: escalation.nextRent,
        years_completed: escalation.yearsCompleted,
        escalation_history: escalation.escalationHistory,
      }
    })

    return NextResponse.json(enrichedTenants)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
