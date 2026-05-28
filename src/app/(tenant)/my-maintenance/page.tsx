'use client'

import { useEffect, useState } from 'react'
import { Wrench, Plus } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' })

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setRequests(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowAdd(false)
      setForm({ title: '', description: '', category: 'other', priority: 'medium' })
      fetchRequests()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Maintenance Requests</h2>
          <p className="text-surface-500 text-sm mt-1">Report issues and track their resolution</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          New Request
        </Button>
      </div>

      {requests.length === 0 && !loading ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No maintenance requests"
          description="Everything working well? Great! If something breaks, raise a request here."
          action={<Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>Raise Request</Button>}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-surface-900">{req.title}</h3>
                  <p className="text-sm text-surface-500 mt-1">{req.description}</p>
                  <p className="text-xs text-surface-400 mt-2">Raised on {formatDate(req.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={req.status === 'resolved' ? 'success' : req.status === 'in_progress' ? 'info' : 'warning'}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={req.priority === 'urgent' ? 'danger' : req.priority === 'high' ? 'warning' : 'info'}>
                    {req.priority}
                  </Badge>
                </div>
              </div>
              {req.resolution_notes && (
                <div className="mt-3 pt-3 border-t border-surface-100">
                  <p className="text-xs text-surface-400">Resolution:</p>
                  <p className="text-sm text-surface-600">{req.resolution_notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Raise Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Issue Title" placeholder="e.g., Leaking tap in bathroom" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <Textarea label="Description" placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <Select label="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} options={[
            { value: 'plumbing', label: 'Plumbing' },
            { value: 'electrical', label: 'Electrical' },
            { value: 'appliance', label: 'Appliance' },
            { value: 'structural', label: 'Structural' },
            { value: 'pest_control', label: 'Pest Control' },
            { value: 'other', label: 'Other' },
          ]} />
          <Select label="Priority" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} options={[
            { value: 'low', label: 'Low — Not urgent' },
            { value: 'medium', label: 'Medium — Should fix soon' },
            { value: 'high', label: 'High — Affecting daily life' },
            { value: 'urgent', label: 'Urgent — Need immediate attention' },
          ]} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
