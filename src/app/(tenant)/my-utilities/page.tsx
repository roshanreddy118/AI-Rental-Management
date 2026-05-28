'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { Card, Badge, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function TenantUtilitiesPage() {
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  useEffect(() => { fetchBills() }, [])

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/utilities', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setBills(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const typeIcons: Record<string, string> = { electricity: '⚡', water: '💧', gas: '🔥', internet: '🌐', maintenance_charge: '🔧' }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">My Utilities</h2>
        <p className="text-surface-500 text-sm mt-1">Track your utility bills and payments</p>
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
          description="Your landlord hasn't added any utility bills yet."
        />
      ) : (
        <div className="space-y-3">
          {bills.filter(b => filter === 'all' ? true : filter === 'paid' ? b.paid : !b.paid).map((bill) => (
            <Card key={bill.id} className="hover:shadow-glow transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[bill.type] || '📄'}</span>
                  <div>
                    <p className="font-medium text-surface-900 capitalize">{bill.type.replace('_', ' ')}</p>
                    <p className="text-xs text-surface-400">{bill.billing_month} • Due: {formatDate(bill.due_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-surface-900">{formatCurrency(bill.amount)}</p>
                  <Badge variant={bill.paid ? 'success' : 'warning'}>{bill.paid ? 'Paid' : 'Unpaid'}</Badge>
                </div>
              </div>
              {bill.meter_reading && (
                <div className="mt-3 pt-3 border-t border-surface-100 text-xs text-surface-400">
                  Reading: {bill.previous_reading} → {bill.meter_reading} ({bill.meter_reading - bill.previous_reading} units)
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
