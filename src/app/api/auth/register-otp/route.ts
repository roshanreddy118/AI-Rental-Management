import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, fullName } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'An account already exists with this email' }, { status: 409 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP (upsert so resend works)
    await supabase.from('otp_codes').upsert({
      email: email.toLowerCase(),
      code: otp,
      expires_at: expiresAt.toISOString(),
      used: false,
    }, { onConflict: 'email' })

    // Send verification email
    await sendOTPEmail(email, otp, fullName || 'there')

    return NextResponse.json({ message: 'Verification code sent to your email' })
  } catch (error) {
    console.error('Register OTP error:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
