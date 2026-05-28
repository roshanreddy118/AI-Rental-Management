'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function TenantAgreementPage() {
  const [agreement, setAgreement] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgreement()
  }, [])

  const fetchAgreement = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/tenant/agreement', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setAgreement(await res.json())
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">My Agreement</h2>
        <p className="text-surface-500 text-sm mt-1">Your current rental agreement details</p>
      </div>

      {!agreement && !loading ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700">No agreement on file</h3>
          <p className="text-sm text-surface-500 mt-1">Your landlord hasn't uploaded an agreement yet.</p>
        </Card>
      ) : agreement ? (
        <>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900">Rental Agreement</h3>
                  <p className="text-sm text-surface-500">{agreement.property_name}</p>
                </div>
              </div>
              <Badge variant={agreement.status === 'active' ? 'success' : 'warning'}>{agreement.status}</Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-50">
                <p className="text-xs text-surface-400 uppercase tracking-wide">Start Date</p>
                <p className="font-semibold text-surface-900 mt-1">{formatDate(agreement.start_date)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50">
                <p className="text-xs text-surface-400 uppercase tracking-wide">End Date</p>
                <p className="font-semibold text-surface-900 mt-1">{formatDate(agreement.end_date)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50">
                <p className="text-xs text-surface-400 uppercase tracking-wide">Monthly Rent</p>
                <p className="font-semibold text-surface-900 mt-1">{formatCurrency(agreement.rent_amount)}</p>
                <p className="text-xs text-surface-400">+ 10% annual escalation</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50">
                <p className="text-xs text-surface-400 uppercase tracking-wide">Security Deposit</p>
                <p className="font-semibold text-surface-900 mt-1">{formatCurrency(agreement.deposit_amount)}</p>
              </div>
            </div>

            {agreement.terms && (
              <div className="border-t border-surface-100 pt-4">
                <h4 className="text-sm font-semibold text-surface-700 mb-3">Agreement Terms</h4>
                <div className="p-4 bg-surface-50 rounded-xl max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-surface-600 font-mono">{agreement.terms}</pre>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}
