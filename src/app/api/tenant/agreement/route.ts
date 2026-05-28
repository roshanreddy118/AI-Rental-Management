// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

    // Get tenant record
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, property_id')
      .eq('user_id', payload.userId)
      .single()

    if (!tenant) return NextResponse.json(null)

    // Get agreement for this tenant only
    const { data: agreement } = await supabase
      .from('agreements')
      .select(`
        *,
        property:properties!agreements_property_id_fkey(name)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!agreement) return NextResponse.json(null)

    return NextResponse.json({
      ...agreement,
      property_name: agreement.property?.name,
    })
  } catch {
    return NextResponse.json(null, { status: 200 })
  }
}
