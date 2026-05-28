import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tenantId = formData.get('tenant_id') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const rentAmount = formData.get('rent_amount') as string
    const depositAmount = formData.get('deposit_amount') as string

    if (!file || !tenantId || !startDate || !endDate || !rentAmount || !depositAmount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Ensure storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === 'agreements')) {
      await supabase.storage.createBucket('agreements', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
      })
    }

    // Upload file to Supabase Storage
    const fileName = `${payload.userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('agreements')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get the file URL
    const { data: urlData } = supabase.storage
      .from('agreements')
      .getPublicUrl(fileName)

    // Get tenant info for property/unit reference
    const { data: tenant } = await supabase
      .from('tenants')
      .select('property_id, unit_id')
      .eq('id', tenantId)
      .single()

    // Create agreement record
    const { data: agreement, error: dbError } = await supabase
      .from('agreements')
      .insert({
        tenant_id: tenantId,
        property_id: tenant?.property_id,
        unit_id: tenant?.unit_id,
        owner_id: payload.userId,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        deposit_amount: parseFloat(depositAmount),
        terms: `[PDF uploaded: ${file.name}]`,
        agreement_url: urlData.publicUrl || fileName,
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save agreement record' }, { status: 500 })
    }

    return NextResponse.json(agreement, { status: 201 })
  } catch (error) {
    console.error('Agreement upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
