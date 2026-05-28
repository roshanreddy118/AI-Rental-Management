import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken, generateInviteCode } from '@/lib/auth'
import { sendTenantInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { email, property_id, unit_number, rent_amount } = body

    if (!email || !property_id || !unit_number || !rent_amount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get or create unit
    let unitId = null
    const { data: unit } = await supabase
      .from('units')
      .select('id')
      .eq('property_id', property_id)
      .eq('unit_number', unit_number)
      .single()

    if (unit) {
      unitId = unit.id
    } else {
      const { data: newUnit } = await supabase
        .from('units')
        .insert({ property_id, unit_number, status: 'vacant', rent_amount: parseFloat(rent_amount), deposit_amount: 0 })
        .select()
        .single()
      unitId = newUnit?.id
    }

    // Generate invite code
    const inviteCode = generateInviteCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store invite
    await supabase.from('tenant_invites').insert({
      owner_id: payload.userId,
      property_id,
      unit_id: unitId,
      email: email.toLowerCase(),
      invite_code: inviteCode,
      rent_amount: parseFloat(rent_amount),
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })

    // Get property name for email
    const { data: property } = await supabase
      .from('properties')
      .select('name')
      .eq('id', property_id)
      .single()

    // Send invite email
    try {
      await sendTenantInviteEmail(
        email,
        payload.fullName,
        property?.name || 'Property',
        inviteCode
      )
    } catch (emailError) {
      // Email failed but invite was created
      console.error('Failed to send invite email:', emailError)
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/tenant-invite?code=${inviteCode}`

    return NextResponse.json({
      inviteCode,
      inviteLink,
      message: 'Invitation sent successfully',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
