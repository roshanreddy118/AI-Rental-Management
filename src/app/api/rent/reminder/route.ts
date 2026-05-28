import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { sendRentReminderEmail } from '@/lib/email'
import { calculateCurrentRent } from '@/lib/rent-escalation'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenant_id } = await req.json()
    const supabase = createServerClient()

    const { data: tenant } = await supabase
      .from('tenants')
      .select(`
        *,
        user:users!tenants_user_id_fkey(full_name, email),
        property:properties!tenants_property_id_fkey(name)
      `)
      .eq('id', tenant_id)
      .eq('owner_id', payload.userId)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    // Calculate current rent with escalation
    const escalation = calculateCurrentRent(tenant.base_rent || tenant.rent_amount, tenant.move_in_date)
    
    // Determine due date (1st of next month)
    const now = new Date()
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const dueDateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    await sendRentReminderEmail(
      tenant.user.email,
      tenant.user.full_name,
      escalation.currentRent,
      dueDateStr,
      tenant.property.name
    )

    // Create notification for tenant
    await supabase.from('notifications').insert({
      user_id: tenant.user_id,
      title: 'Rent Reminder',
      message: `Your rent of ₹${escalation.currentRent.toLocaleString('en-IN')} for ${tenant.property.name} is due on ${dueDateStr}.`,
      type: 'reminder',
    })

    return NextResponse.json({ message: 'Reminder sent successfully' })
  } catch (error: any) {
    console.error('Reminder error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send reminder' }, { status: 500 })
  }
}
