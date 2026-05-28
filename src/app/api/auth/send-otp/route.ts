import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP
    await supabase.from('otp_codes').upsert({
      user_id: user.id,
      email: email.toLowerCase(),
      code: otp,
      expires_at: expiresAt.toISOString(),
      used: false,
    }, { onConflict: 'email' })

    // Send email
    await sendOTPEmail(email, otp, user.full_name)

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
