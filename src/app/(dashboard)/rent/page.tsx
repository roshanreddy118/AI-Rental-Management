'use client'

import { useEffect, useState } from 'react'
import { IndianRupee, CheckCircle2, Clock, AlertCircle, Send, Plus } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RentPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecord, setShowRecord] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [form, setForm] = useState({ tenant_id: '', amount: '', payment_method: 'upi', transaction_id: '', notes: '' })

  useEffect(() => {
    fetchPayments()
    fetchTenants()
  }, [])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/rent', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setPayments(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const fetchTenants = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTenants(await res.json())
  }

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/rent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    if (res.ok) {
      setShowRecord(false)
      setForm({ tenant_id: '', amount: '', payment_method: 'upi', transaction_id: '', notes: '' })
      fetchPayments()
    }
  }

  const handleSendReminder = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/rent/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Reminder sent successfully!')
      } else {
        alert(`Failed to send reminder: ${data.error || 'Unknown error'}`)
      }
    } catch {
      alert('Network error. Could not send reminder.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-accent-500" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-surface-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Rent Tracking</h2>
          <p className="text-surface-500 text-sm mt-1">Track payments and send reminders</p>
        </div>
        <Button onClick={() => setShowRecord(true)} icon={<Plus className="w-4 h-4" />}>
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!bg-accent-50 !border-accent-100">
          <p className="text-sm text-accent-600 font-medium">Collected This Month</p>
          <p className="text-2xl font-bold text-accent-800 mt-1">
            {formatCurrency(payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </Card>
        <Card className="!bg-amber-50 !border-amber-100">
          <p className="text-sm text-amber-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {formatCurrency(payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </Card>
        <Card className="!bg-red-50 !border-red-100">
          <p className="text-sm text-red-600 font-medium">Overdue</p>
          <p className="text-2xl font-bold text-red-800 mt-1">
            {formatCurrency(payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </Card>
      </div>

      {/* Payments List */}
      {payments.length === 0 && !loading ? (
        <EmptyState
          icon={<IndianRupee className="w-8 h-8" />}
          title="No payments recorded"
          description="Record your first rent payment to start tracking."
          action={<Button onClick={() => setShowRecord(true)} icon={<Plus className="w-4 h-4" />}>Record Payment</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Tenant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Method</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-surface-900">{payment.tenant_name}</p>
                      <p className="text-xs text-surface-400">{payment.property_name}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-surface-900">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-4 text-sm text-surface-600">{formatDate(payment.due_date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(payment.status)}
                        <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'overdue' ? 'danger' : 'warning'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-600 capitalize">{payment.payment_method || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {payment.status !== 'paid' && (
                        <button
                          onClick={() => handleSendReminder(payment.tenant_id)}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Remind
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Modal */}
      <Modal open={showRecord} onClose={() => setShowRecord(false)} title="Record Rent Payment">
        <form onSubmit={handleRecord} className="space-y-4">
          <Select label="Tenant" value={form.tenant_id} onChange={e => setForm({...form, tenant_id: e.target.value})} options={tenants.map(t => ({ value: t.id, label: `${t.full_name} — ${t.property_name}` }))} />
          <Input label="Amount (₹)" type="number" placeholder="15000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Select label="Payment Method" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} options={[
            { value: 'upi', label: 'UPI' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
            { value: 'cheque', label: 'Cheque' },
          ]} />
          <Input label="Transaction ID (optional)" placeholder="UPI ref or cheque no." value={form.transaction_id} onChange={e => setForm({...form, transaction_id: e.target.value})} />
          <Input label="Notes (optional)" placeholder="Any additional notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowRecord(false)}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
