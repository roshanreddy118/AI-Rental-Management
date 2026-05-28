import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify OTP
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', otp)
      .eq('used', false)
      .single()

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 })
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
