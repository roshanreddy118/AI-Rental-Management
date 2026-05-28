// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { calculateCurrentRent, getUpcomingRentIncreases } from '@/lib/rent-escalation'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    // Get properties count
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', payload.userId)

    // Get tenants
    const { data: tenants }: any = await supabase
      .from('tenants')
      .select('id, rent_amount, base_rent, move_in_date, status, user:users!tenants_user_id_fkey(full_name)')
      .eq('owner_id', payload.userId)
      .eq('status', 'active')

    const totalTenants = tenants?.length || 0

    // Calculate monthly income with escalation
    let monthlyIncome = 0
    const tenantRentData: any[] = []
    
    for (const t of tenants || []) {
      const escalation = calculateCurrentRent(t.base_rent || t.rent_amount, t.move_in_date)
      monthlyIncome += escalation.currentRent
      tenantRentData.push({
        id: t.id,
        name: (t.user as any)?.full_name || 'Unknown',
        baseRent: t.base_rent || t.rent_amount,
        moveInDate: t.move_in_date,
      })
    }

    // Get upcoming rent increases
    const upcomingIncreases = getUpcomingRentIncreases(tenantRentData)

    // Get rent payments this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: paidThisMonth } = await supabase
      .from('rent_payments')
      .select('id')
      .eq('owner_id', payload.userId)
      .eq('status', 'paid')
      .gte('paid_date', startOfMonth.toISOString().split('T')[0])

    const rentCollected = paidThisMonth?.length || 0
    const rentPending = totalTenants - rentCollected

    // Get pending maintenance
    const { count: pendingMaintenance } = await supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', payload.userId)
      .in('status', ['open', 'in_progress'])

    // Get utility bills collected this month
    const { data: utilityPaidThisMonth } = await supabase
      .from('utility_bills')
      .select('amount')
      .eq('owner_id', payload.userId)
      .eq('paid', true)
      .gte('paid_date', startOfMonth.toISOString().split('T')[0])

    const utilityCollected = (utilityPaidThisMonth || []).reduce((sum, b) => sum + Number(b.amount), 0)

    // Get utility bills pending this month
    const { data: utilityPending } = await supabase
      .from('utility_bills')
      .select('amount')
      .eq('owner_id', payload.userId)
      .eq('paid', false)

    const utilityPendingAmount = (utilityPending || []).reduce((sum, b) => sum + Number(b.amount), 0)

    // Total income = monthly rent + utility collections
    const totalCollected = monthlyIncome + utilityCollected

    return NextResponse.json({
      stats: {
        totalProperties: totalProperties || 0,
        totalTenants,
        monthlyIncome: totalCollected,
        pendingMaintenance: pendingMaintenance || 0,
        rentCollected,
        rentPending: rentPending > 0 ? rentPending : 0,
        occupancyRate: 0,
        utilityCollected,
        utilityPendingAmount,
      },
      upcomingIncreases,
      recentActivity: [],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
