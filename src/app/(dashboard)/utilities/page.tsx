'use client'

import { useEffect, useState } from 'react'
import { Zap, Plus, CheckCircle2, Send, RefreshCw, Pencil } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function UtilitiesPage() {
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addingMonthly, setAddingMonthly] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [form, setForm] = useState({ tenant_id: '', type: 'electricity', amount: '', billing_month: '', due_date: '', meter_reading: '', previous_reading: '' })
  const [editBill, setEditBill] = useState<any>(null)
  const [editForm, setEditForm] = useState({ amount: '', due_date: '' })
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  useEffect(() => {
    fetchBills()
    fetchTenants()
  }, [])

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/utilities', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setBills(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const fetchTenants = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTenants(await res.json())
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/utilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    if (res.ok) {
      setShowAdd(false)
      setForm({ tenant_id: '', type: 'electricity', amount: '', billing_month: '', due_date: '', meter_reading: '', previous_reading: '' })
      fetchBills()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to add bill')
    }
  }

  const handleAddMonthlyCharges = async () => {
    if (tenants.length === 0) {
      alert('No tenants found')
      return
    }
    setAddingMonthly(true)
    const token = localStorage.getItem('token')
    const now = new Date()
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0]

    let added = 0
    let skipped = 0

    try {
      for (const tenant of tenants) {
        // Add ₹1000 maintenance charge
        const res1 = await fetch('/api/utilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenant_id: tenant.id, type: 'maintenance_charge', amount: 1000, billing_month: billingMonth, due_date: dueDate }),
        })
        if (res1.ok) added++; else skipped++

        // Add ₹500 water charge
        const res2 = await fetch('/api/utilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenant_id: tenant.id, type: 'water', amount: 500, billing_month: billingMonth, due_date: dueDate }),
        })
        if (res2.ok) added++; else skipped++
      }
      fetchBills()
      if (skipped > 0) {
        alert(`Added ${added} bill(s). Skipped ${skipped} (already exist for this month).`)
      } else {
        alert(`Added maintenance (₹1,000) & water (₹500) for ${tenants.length} tenant(s)`)
      }
    } catch {
      alert('Failed to add monthly charges')
    } finally {
      setAddingMonthly(false)
    }
  }

  const handleMarkPaid = async (billId: string) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/utilities/${billId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paid: true }),
    })
    if (res.ok) fetchBills()
  }

  const handleSendReminder = async (bill: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/utilities/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tenant_id: bill.tenant_id, bill_type: bill.type, amount: bill.amount }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Reminder sent!')
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch {
      alert('Network error')
    }
  }

  const handleEditBill = (bill: any) => {
    setEditBill(bill)
    setEditForm({ amount: String(bill.amount), due_date: bill.due_date })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBill) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/utilities/${editBill.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: parseFloat(editForm.amount), due_date: editForm.due_date }),
    })
    if (res.ok) {
      setEditBill(null)
      fetchBills()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to update bill')
    }
  }

  const typeIcons: Record<string, string> = {
    electricity: '⚡', water: '💧', gas: '🔥', internet: '🌐', maintenance_charge: '🔧'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Utility Bills</h2>
          <p className="text-surface-500 text-sm mt-1">Maintenance (₹1,000) & Water (₹500) per tenant/month</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleAddMonthlyCharges} loading={addingMonthly} icon={<RefreshCw className="w-4 h-4" />}>
            Add Monthly Charges
          </Button>
          <Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
            Add Bill
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!bg-green-50 !border-green-100">
          <p className="text-sm text-green-600 font-medium">Collected</p>
          <p className="text-2xl font-bold text-green-800 mt-1">
            {formatCurrency(bills.filter(b => b.paid).reduce((sum, b) => sum + b.amount, 0))}
          </p>
        </Card>
        <Card className="!bg-amber-50 !border-amber-100">
          <p className="text-sm text-amber-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {formatCurrency(bills.filter(b => !b.paid).reduce((sum, b) => sum + b.amount, 0))}
          </p>
        </Card>
        <Card className="!bg-blue-50 !border-blue-100">
          <p className="text-sm text-blue-600 font-medium">Total Bills</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{bills.length}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'paid', 'unpaid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Unpaid'}
          </button>
        ))}
      </div>

      {bills.length === 0 && !loading ? (
        <EmptyState
          icon={<Zap className="w-8 h-8" />}
          title="No utility bills"
          description="Start tracking utility bills for your tenants."
          action={<Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>Add Bill</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Tenant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Month</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.filter(b => filter === 'all' ? true : filter === 'paid' ? b.paid : !b.paid).map((bill) => (
                  <tr key={bill.id} className="border-b border-surface-50 hover:bg-surface-50">
                    <td className="py-3 px-4">
                      <span className="text-lg mr-2">{typeIcons[bill.type] || '📄'}</span>
                      <span className="text-sm capitalize">{bill.type.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-700">{bill.tenant_name}</td>
                    <td className="py-3 px-4 font-semibold text-surface-900">{formatCurrency(bill.amount)}</td>
                    <td className="py-3 px-4 text-sm text-surface-600">{bill.billing_month}</td>
                    <td className="py-3 px-4 text-sm text-surface-600">{formatDate(bill.due_date)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={bill.paid ? 'success' : 'warning'}>{bill.paid ? 'Paid' : 'Unpaid'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!bill.paid && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="inline-flex items-center gap-1 text-xs text-surface-600 hover:text-surface-700 font-medium px-2 py-1 rounded hover:bg-surface-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleMarkPaid(bill.id)}
                            className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium px-2 py-1 rounded hover:bg-accent-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </button>
                          <button
                            onClick={() => handleSendReminder(bill)}
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Remind
                          </button>
                        </div>
                      )}
                      {bill.paid && (
                        <span className="text-xs text-surface-400">{bill.paid_date ? formatDate(bill.paid_date) : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Bill Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Utility Bill">
        <form onSubmit={handleAdd} className="space-y-4">
          <Select label="Tenant" value={form.tenant_id} onChange={e => setForm({...form, tenant_id: e.target.value})} options={tenants.map(t => ({ value: t.id, label: t.full_name }))} />
          <Select label="Type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} options={[
            { value: 'electricity', label: 'Electricity' },
            { value: 'water', label: 'Water' },
            { value: 'gas', label: 'Gas' },
            { value: 'internet', label: 'Internet' },
            { value: 'maintenance_charge', label: 'Maintenance Charge' },
          ]} />
          <Input label="Amount (₹)" type="number" placeholder="1500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Input label="Billing Month" type="month" value={form.billing_month} onChange={e => setForm({...form, billing_month: e.target.value})} required />
          <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Reading" type="number" placeholder="Optional" value={form.meter_reading} onChange={e => setForm({...form, meter_reading: e.target.value})} />
            <Input label="Previous Reading" type="number" placeholder="Optional" value={form.previous_reading} onChange={e => setForm({...form, previous_reading: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add Bill</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal open={!!editBill} onClose={() => setEditBill(null)} title={`Edit ${editBill?.type?.replace('_', ' ')} Bill`}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <p className="text-sm text-surface-500">Tenant: {editBill?.tenant_name} • Month: {editBill?.billing_month}</p>
          <Input label="Amount (₹)" type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} required />
          <Input label="Due Date" type="date" value={editForm.due_date} onChange={e => setEditForm({...editForm, due_date: e.target.value})} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setEditBill(null)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
