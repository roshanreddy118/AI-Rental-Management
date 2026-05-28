import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { hashPassword, signToken, generateInviteCode } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, password, role, inviteCode, otp } = body

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify OTP for owner registration
    if (role !== 'tenant') {
      if (!otp) {
        return NextResponse.json({ error: 'Email verification code is required' }, { status: 400 })
      }

      const { data: otpRecord } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', otp)
        .eq('used', false)
        .single()

      if (!otpRecord) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 })
      }

      // Mark OTP as used
      await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id)
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
    }

    // If tenant registration, validate invite code
    let invite = null
    if (role === 'tenant') {
      if (!inviteCode) {
        return NextResponse.json({ error: 'Invite code is required for tenant registration' }, { status: 400 })
      }
      
      const { data: inviteData } = await supabase
        .from('tenant_invites')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .single()

      if (!inviteData) {
        return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 })
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invite code has expired' }, { status: 400 })
      }

      invite = inviteData
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        password_hash: passwordHash,
        role: role || 'owner',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // If tenant, create tenant record and update invite
    if (role === 'tenant' && invite) {
      const now = new Date().toISOString().split('T')[0]
      const leaseEnd = new Date()
      leaseEnd.setFullYear(leaseEnd.getFullYear() + 1)

      await supabase.from('tenants').insert({
        user_id: user.id,
        owner_id: invite.owner_id,
        property_id: invite.property_id,
        unit_id: invite.unit_id,
        move_in_date: now,
        lease_start: now,
        lease_end: leaseEnd.toISOString().split('T')[0],
        rent_amount: invite.rent_amount || 0,
        base_rent: invite.rent_amount || 0,  // Store original rent for escalation calc
        deposit_paid: 0,
        status: 'active',
        verification_status: 'pending',
      })

      // Update invite status
      await supabase
        .from('tenant_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      // Update unit status
      if (invite.unit_id) {
        await supabase
          .from('units')
          .update({ status: 'occupied', tenant_id: user.id })
          .eq('id', invite.unit_id)
      }
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
