'use client'

import { useEffect, useState } from 'react'
import { Wrench, Plus, AlertTriangle, CheckCircle2, Clock, ArrowUpCircle } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function MaintenancePage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolve, setShowResolve] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setRequests(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    const token = localStorage.getItem('token')
    await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, resolution_notes: notes }),
    })
    setShowResolve(null)
    setResolution('')
    fetchRequests()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'badge-danger'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'badge-warning'
      default: return 'badge-info'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': case 'closed': return <CheckCircle2 className="w-4 h-4 text-accent-500" />
      case 'in_progress': return <ArrowUpCircle className="w-4 h-4 text-primary-500" />
      default: return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Maintenance Requests</h2>
          <p className="text-surface-500 text-sm mt-1">Track and resolve tenant maintenance issues</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-3 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map(filter => (
          <button key={filter} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-surface-200 hover:border-primary-300 hover:text-primary-600 transition-all capitalize">
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {requests.length === 0 && !loading ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No maintenance requests"
          description="When tenants raise maintenance issues, they'll appear here."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-glow transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900">{req.title}</h3>
                    <span className={`badge ${getPriorityColor(req.priority)}`}>{req.priority}</span>
                  </div>
                  <p className="text-sm text-surface-500 mb-2">{req.description}</p>
                  <div className="flex items-center gap-4 text-xs text-surface-400">
                    <span>By: {req.tenant_name}</span>
                    <span>{req.property_name} — Unit {req.unit_number}</span>
                    <span>{formatDate(req.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(req.status)}
                  <Badge variant={req.status === 'resolved' ? 'success' : req.status === 'in_progress' ? 'info' : 'warning'}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {req.status === 'open' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100">
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(req.id, 'in_progress')}>
                    Mark In Progress
                  </Button>
                  <Button size="sm" onClick={() => setShowResolve(req.id)}>
                    Resolve
                  </Button>
                </div>
              )}
              {req.status === 'in_progress' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100">
                  <Button size="sm" onClick={() => setShowResolve(req.id)}>
                    Mark Resolved
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal open={!!showResolve} onClose={() => setShowResolve(null)} title="Resolve Request">
        <div className="space-y-4">
          <Textarea label="Resolution Notes" placeholder="Describe how the issue was resolved..." value={resolution} onChange={e => setResolution(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowResolve(null)}>Cancel</Button>
            <Button onClick={() => handleUpdateStatus(showResolve!, 'resolved', resolution)}>Mark Resolved</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
