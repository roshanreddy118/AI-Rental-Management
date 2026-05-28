'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Bot, Download, Upload } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [tenants, setTenants] = useState<any[]>([])
  const [form, setForm] = useState({ tenant_id: '', start_date: '', end_date: '', rent_amount: '', deposit_amount: '', special_terms: '' })
  const [uploadForm, setUploadForm] = useState({ tenant_id: '', start_date: '', end_date: '', rent_amount: '', deposit_amount: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchAgreements()
    fetchTenants()
  }, [])

  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/agreements', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setAgreements(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const fetchTenants = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTenants(await res.json())
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/agreements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedText(data.agreement)
      }
    } catch {} finally { setGenerating(false) }
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, terms: generatedText }),
    })
    if (res.ok) {
      setShowGenerate(false)
      setGeneratedText('')
      fetchAgreements()
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError('')

    if (!selectedFile) {
      setUploadError('Please select a PDF file')
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('tenant_id', uploadForm.tenant_id)
      formData.append('start_date', uploadForm.start_date)
      formData.append('end_date', uploadForm.end_date)
      formData.append('rent_amount', uploadForm.rent_amount)
      formData.append('deposit_amount', uploadForm.deposit_amount)

      const res = await fetch('/api/agreements/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setShowUpload(false)
        setSelectedFile(null)
        setUploadForm({ tenant_id: '', start_date: '', end_date: '', rent_amount: '', deposit_amount: '' })
        fetchAgreements()
      } else {
        setUploadError(data.error || 'Upload failed')
      }
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Agreements</h2>
          <p className="text-surface-500 text-sm mt-1">AI-generated rental agreements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowUpload(true)} icon={<Upload className="w-4 h-4" />}>
            Upload PDF
          </Button>
          <Button onClick={() => setShowGenerate(true)} icon={<Bot className="w-4 h-4" />}>
            Generate Agreement
          </Button>
        </div>
      </div>

      {agreements.length === 0 && !loading ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No agreements yet"
          description="Generate your first rental agreement using AI. It follows Indian tenancy laws."
          action={<Button onClick={() => setShowGenerate(true)} icon={<Bot className="w-4 h-4" />}>Generate Agreement</Button>}
        />
      ) : (
        <div className="space-y-4">
          {agreements.map((agreement) => (
            <Card key={agreement.id} className="hover:shadow-glow transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-surface-900">{agreement.tenant_name}</h3>
                  <p className="text-sm text-surface-500">{agreement.property_name} • {formatDate(agreement.start_date)} - {formatDate(agreement.end_date)}</p>
                </div>
                <Badge variant={agreement.status === 'active' ? 'success' : agreement.status === 'expired' ? 'danger' : 'info'}>
                  {agreement.status}
                </Badge>
                <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Agreement Modal */}
      <Modal open={showGenerate} onClose={() => { setShowGenerate(false); setGeneratedText('') }} title="Generate Rental Agreement">
        {!generatedText ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <Select label="Tenant" value={form.tenant_id} onChange={e => setForm({...form, tenant_id: e.target.value})} options={tenants.map(t => ({ value: t.id, label: t.full_name }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required />
              <Input label="End Date" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Rent (₹/month)" type="number" value={form.rent_amount} onChange={e => setForm({...form, rent_amount: e.target.value})} required />
              <Input label="Deposit (₹)" type="number" value={form.deposit_amount} onChange={e => setForm({...form, deposit_amount: e.target.value})} required />
            </div>
            <Textarea label="Special Terms (optional)" placeholder="Any special clauses like pet policy, parking, etc." value={form.special_terms} onChange={e => setForm({...form, special_terms: e.target.value})} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button type="submit" loading={generating} icon={<Bot className="w-4 h-4" />}>Generate with AI</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-surface-500">Edit the agreement below to add addresses, phone numbers, or any other details before saving.</p>
            <textarea
              className="w-full h-[450px] p-4 bg-white rounded-xl border border-surface-200 text-sm text-surface-700 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setGeneratedText('')}>Regenerate</Button>
              <Button onClick={handleSave}>Save Agreement</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Agreement Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setUploadError(''); setSelectedFile(null) }} title="Upload Agreement PDF">
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {uploadError}
          </div>
        )}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Agreement PDF</label>
            <div className="border-2 border-dashed border-surface-200 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-surface-900">{selectedFile.name}</p>
                    <p className="text-xs text-surface-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 text-sm hover:underline ml-4">Remove</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                  <p className="text-sm text-surface-600">Click to select PDF file</p>
                  <p className="text-xs text-surface-400 mt-1">Max 10MB</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setSelectedFile(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <Select label="Tenant" value={uploadForm.tenant_id} onChange={e => setUploadForm({...uploadForm, tenant_id: e.target.value})} options={tenants.map(t => ({ value: t.id, label: t.full_name }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={uploadForm.start_date} onChange={e => setUploadForm({...uploadForm, start_date: e.target.value})} required />
            <Input label="End Date" type="date" value={uploadForm.end_date} onChange={e => setUploadForm({...uploadForm, end_date: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rent (₹/month)" type="number" value={uploadForm.rent_amount} onChange={e => setUploadForm({...uploadForm, rent_amount: e.target.value})} required />
            <Input label="Deposit (₹)" type="number" value={uploadForm.deposit_amount} onChange={e => setUploadForm({...uploadForm, deposit_amount: e.target.value})} required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowUpload(false); setUploadError(''); setSelectedFile(null) }}>Cancel</Button>
            <Button type="submit" loading={uploading} icon={<Upload className="w-4 h-4" />}>Upload Agreement</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
