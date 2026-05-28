'use client'

import { useEffect, useState } from 'react'
import { Home, Calendar, IndianRupee, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function TenantHomePage() {
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTenantInfo() }, [])

  const fetchTenantInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/tenant/home', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setTenantInfo(await res.json())
    } catch {} finally { setLoading(false) }
  }

  if (loading) return <div className="animate-pulse">Loading...</div>
  if (!tenantInfo) return <div>Unable to load your information</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Welcome Home 🏠</h2>
        <p className="text-surface-500 mt-1">Unit {tenantInfo.unit_number} • {tenantInfo.property_name}</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-surface-500">Current Rent</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{formatCurrency(tenantInfo.current_rent)}</p>
          {tenantInfo.base_rent !== tenantInfo.current_rent && (
            <p className="text-xs text-surface-400 mt-1">Base: {formatCurrency(tenantInfo.base_rent)} + escalation</p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Move-in Date</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{formatDate(tenantInfo.move_in_date)}</p>
          <p className="text-xs text-surface-400 mt-1">{tenantInfo.years_completed} year(s) completed</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Lease Until</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{formatDate(tenantInfo.lease_end)}</p>
          <Badge variant={tenantInfo.status === 'active' ? 'success' : 'warning'}>{tenantInfo.status}</Badge>
        </Card>
      </div>

      {/* Rent Escalation Info */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">Rent Escalation Schedule</h3>
            <p className="text-sm text-surface-500">10% annual increase from your joining date</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {tenantInfo.escalation_history?.map((entry: any, i: number) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
              i === tenantInfo.escalation_history.length - 1 ? 'bg-primary-50 border border-primary-100' : 'bg-surface-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-surface-400">Year {entry.year}</span>
                <span className="text-sm text-surface-600">{formatDate(entry.effectiveFrom)}</span>
              </div>
              <span className={`font-semibold ${i === tenantInfo.escalation_history.length - 1 ? 'text-primary-700' : 'text-surface-700'}`}>
                {formatCurrency(entry.rent)}
              </span>
            </div>
          ))}
          
          {/* Next increase */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-surface-300 bg-white">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-surface-600">Next increase: {formatDate(tenantInfo.next_increase_date)}</span>
            </div>
            <span className="font-semibold text-amber-600">{formatCurrency(tenantInfo.next_rent)}</span>
          </div>
        </div>
      </Card>

      {/* Landlord Contact */}
      <Card>
        <h3 className="font-semibold text-surface-900 mb-3">Your Landlord</h3>
        <p className="text-sm text-surface-600">{tenantInfo.owner_name}</p>
        {tenantInfo.owner_email && (
          <p className="text-sm text-surface-500">{tenantInfo.owner_email}</p>
        )}
      </Card>
    </div>
  )
}
