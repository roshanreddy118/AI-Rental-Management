'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, IndianRupee, Wrench, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    monthlyIncome: 0,
    pendingMaintenance: 0,
    rentCollected: 0,
    rentPending: 0,
    occupancyRate: 0,
    utilityCollected: 0,
    utilityPendingAmount: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Properties', value: stats.totalProperties, icon: Building2, color: 'text-primary-600 bg-primary-50', trend: '+1 this month' },
    { label: 'Active Tenants', value: stats.totalTenants, icon: Users, color: 'text-accent-600 bg-accent-50', trend: 'All verified' },
    { label: 'Total Collected', value: formatCurrency(stats.monthlyIncome), icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50', trend: `Rent + Utilities (₹${stats.utilityCollected.toLocaleString('en-IN')} from bills)` },
    { label: 'Maintenance', value: stats.pendingMaintenance, icon: Wrench, color: 'text-amber-600 bg-amber-50', trend: stats.utilityPendingAmount > 0 ? `₹${stats.utilityPendingAmount.toLocaleString('en-IN')} bills pending` : 'All clear' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Welcome back! 👋</h2>
        <p className="text-surface-500 mt-1">Here's what's happening with your properties today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-glow transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-surface-900 mt-1">{stat.value}</p>
                <p className="text-xs text-surface-400 mt-2">{stat.trend}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Rent Collection Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Rent Collection — This Month</h3>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-500">Collected</span>
                <span className="font-medium text-surface-900">
                  {stats.totalTenants > 0 ? Math.round((stats.rentCollected / stats.totalTenants) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-accent rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalTenants > 0 ? (stats.rentCollected / stats.totalTenants) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                  <span className="text-sm text-surface-500">Paid</span>
                </div>
                <p className="text-lg font-bold text-surface-900">{stats.rentCollected}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-surface-500">Pending</span>
                </div>
                <p className="text-lg font-bold text-surface-900">{stats.rentPending}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-surface-500">Overdue</span>
                </div>
                <p className="text-lg font-bold text-surface-900">0</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Add Property', href: '/properties', icon: Building2 },
              { label: 'Invite Tenant', href: '/tenants', icon: Users },
              { label: 'Record Payment', href: '/rent', icon: IndianRupee },
              { label: 'Send Reminder', href: '/utilities', icon: TrendingUp },
            ].map((action, i) => (
              <a
                key={i}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-surface-700">{action.label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <p className="text-sm text-surface-600">{activity.message}</p>
                <span className="text-xs text-surface-400 ml-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-400 text-center py-8">
            No activity yet. Start by adding a property!
          </p>
        )}
      </Card>
    </div>
  )
}
