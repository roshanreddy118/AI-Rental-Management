import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'
import { chatWithAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServerClient()

    // Get tenant and owner details
    let tenantName = 'Tenant'
    let propertyAddress = ''
    
    if (body.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select(`
          user:users!tenants_user_id_fkey(full_name),
          property:properties!tenants_property_id_fkey(name, address, city, state, pincode)
        `)
        .eq('id', body.tenant_id)
        .single()
      
      if (tenant) {
        const user = tenant.user as any
        tenantName = user?.full_name || 'Tenant'
        const p = tenant.property as any
        if (p) propertyAddress = `${p.name}, ${p.address}, ${p.city}, ${p.state} - ${p.pincode}`
      }
    }

    const prompt = `Generate a complete Indian rental agreement with the following details:

LANDLORD: ${payload.fullName}
TENANT: ${tenantName}
PROPERTY: ${propertyAddress}
LEASE PERIOD: ${body.start_date} to ${body.end_date}
MONTHLY RENT: ₹${body.rent_amount}
SECURITY DEPOSIT: ₹${body.deposit_amount}
ANNUAL RENT ESCALATION: 10% increase every year from the date of joining
${body.special_terms ? `SPECIAL TERMS: ${body.special_terms}` : ''}

Generate a legally valid Indian rental agreement following the Model Tenancy Act 2021 format. Include:
1. All standard clauses (maintenance, subletting, termination, notice period)
2. The 10% annual rent escalation clause tied to the tenant's move-in date
3. Security deposit terms (refund conditions)
4. Maintenance responsibilities
5. Signatures section

Format it cleanly for printing.`

    const agreement = await chatWithAI([{ role: 'user', content: prompt }])

    return NextResponse.json({ agreement })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate agreement' }, { status: 500 })
  }
}
