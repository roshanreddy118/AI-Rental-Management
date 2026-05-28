import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: invite } = await supabase
      .from('tenant_invites')
      .select(`
        *,
        properties(name),
        owner:users!tenant_invites_owner_id_fkey(full_name)
      `)
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single()

    if (!invite || new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({
      valid: true,
      propertyName: invite.properties?.name || 'Property',
      ownerName: invite.owner?.full_name || 'Owner',
    })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
