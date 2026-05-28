import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@aibuzzer.buzz'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenant_id, bill_type, amount } = await req.json()
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

    const typeLabels: Record<string, string> = {
      maintenance_charge: 'Maintenance Charge',
      water: 'Water Bill',
      electricity: 'Electricity Bill',
      gas: 'Gas Bill',
      internet: 'Internet Bill',
    }

    const label = typeLabels[bill_type] || bill_type

    await resend.emails.send({
      from: fromEmail,
      to: tenant.user.email,
      subject: `Payment Reminder — ${label} ₹${amount.toLocaleString('en-IN')} pending`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Hi ${tenant.user.full_name},</h2>
          <p style="color: #475569; font-size: 16px;">This is a reminder that your <strong>${label}</strong> payment is pending.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Property</p>
            <p style="margin: 4px 0 16px; color: #1e293b; font-weight: 600;">${tenant.property.name}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Charge Type</p>
            <p style="margin: 4px 0 16px; color: #1e293b; font-weight: 600;">${label}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Amount Due</p>
            <p style="margin: 4px 0 0; color: #1e293b; font-weight: 600; font-size: 24px;">₹${amount.toLocaleString('en-IN')}</p>
          </div>
          <p style="color: #475569; font-size: 14px;">Please make the payment at the earliest.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">LandlordOS — Smart Property Management</p>
        </div>
      `,
    })

    // Create notification for tenant
    await supabase.from('notifications').insert({
      user_id: tenant.user_id,
      title: `${label} Reminder`,
      message: `Your ${label.toLowerCase()} of ₹${amount.toLocaleString('en-IN')} for ${tenant.property.name} is pending. Please pay at the earliest.`,
      type: 'reminder',
    })

    return NextResponse.json({ message: 'Reminder sent successfully' })
  } catch (error: any) {
    console.error('Utility reminder error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send reminder' }, { status: 500 })
  }
}
