'use client'

import { useEffect, useState } from 'react'
import { IndianRupee, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function TenantRentPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [rentInfo, setRentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    try {
      const [paymentsRes, homeRes] = await Promise.all([
        fetch('/api/rent', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tenant/home', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (paymentsRes.ok) setPayments(await paymentsRes.json())
      if (homeRes.ok) setRentInfo(await homeRes.json())
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">My Rent</h2>
        <p className="text-surface-500 text-sm mt-1">Your payment history and current dues</p>
      </div>

      {/* Current Rent Card */}
      {rentInfo && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="!bg-gradient-to-r !from-accent-500 !to-accent-700 !text-white !border-none">
            <p className="text-accent-100 text-sm">Current Monthly Rent</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(rentInfo.current_rent)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-accent-200 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>10% annual escalation • Year {rentInfo.years_completed}</span>
            </div>
          </Card>
          <Card>
            <p className="text-sm text-surface-500">Next Increase</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{formatCurrency(rentInfo.next_rent)}</p>
            <p className="text-xs text-surface-400 mt-2">Effective from {formatDate(rentInfo.next_increase_date)}</p>
          </Card>
        </div>
      )}

      {/* Payment History */}
      <Card>
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-8">No payment records yet</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-50">
                <div className="flex items-center gap-3">
                  {payment.status === 'paid' ? (
                    <CheckCircle2 className="w-5 h-5 text-accent-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-surface-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-surface-400">Due: {formatDate(payment.due_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
                  {payment.paid_date && (
                    <p className="text-xs text-surface-400 mt-1">Paid: {formatDate(payment.paid_date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
