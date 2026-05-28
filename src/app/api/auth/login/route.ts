import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
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
