'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Mail, Phone, Shield, ShieldCheck, ShieldX, Copy, CheckCheck } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ code: string; link: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ email: '', property_id: '', unit_number: '', rent_amount: '' })

  useEffect(() => {
    fetchTenants()
    fetchProperties()
  }, [])

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setTenants(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const fetchProperties = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setProperties(await res.json())
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/tenants/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setInviteResult({ code: data.inviteCode, link: data.inviteLink })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return <ShieldCheck className="w-4 h-4 text-accent-500" />
      case 'rejected': return <ShieldX className="w-4 h-4 text-red-500" />
      default: return <Shield className="w-4 h-4 text-amber-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Tenants</h2>
          <p className="text-surface-500 text-sm mt-1">Manage tenants and send invitations</p>
        </div>
        <Button onClick={() => { setShowInvite(true); setInviteResult(null) }} icon={<Plus className="w-4 h-4" />}>
          Invite Tenant
        </Button>
      </div>

      {tenants.length === 0 && !loading ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No tenants yet"
          description="Invite your first tenant by sending them an invite link."
          action={<Button onClick={() => setShowInvite(true)} icon={<Plus className="w-4 h-4" />}>Invite Tenant</Button>}
        />
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-glow transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent-600">
                    {tenant.full_name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-surface-900">{tenant.full_name}</h3>
                    {getVerificationIcon(tenant.verification_status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-surface-500">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{tenant.email}</span>
                    {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{tenant.phone}</span>}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-surface-500">{tenant.property_name}</p>
                  <p className="text-sm font-medium text-surface-700">Unit {tenant.unit_number}</p>
                </div>
                <Badge variant={tenant.status === 'active' ? 'success' : tenant.status === 'notice_period' ? 'warning' : 'danger'}>
                  {tenant.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Tenant">
        {inviteResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-accent-50 border border-accent-100 rounded-xl text-center">
              <p className="text-sm text-accent-700 mb-2">Invitation sent! Share this with your tenant:</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-lg font-bold text-accent-800 bg-white px-4 py-2 rounded-lg">{inviteResult.code}</code>
                <button onClick={() => copyToClipboard(inviteResult.link)} className="p-2 hover:bg-accent-100 rounded-lg transition-colors">
                  {copied ? <CheckCheck className="w-4 h-4 text-accent-600" /> : <Copy className="w-4 h-4 text-accent-600" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-surface-400 text-center">Link: {inviteResult.link}</p>
            <Button variant="secondary" className="w-full" onClick={() => setShowInvite(false)}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input label="Tenant Email" type="email" placeholder="tenant@email.com" icon={<Mail className="w-4 h-4" />} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <Select label="Property" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} options={properties.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Unit Number" placeholder="e.g., A-101" value={form.unit_number} onChange={e => setForm({...form, unit_number: e.target.value})} required />
            <Input label="Monthly Rent (₹)" type="number" placeholder="15000" value={form.rent_amount} onChange={e => setForm({...form, rent_amount: e.target.value})} required />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit">Send Invitation</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
