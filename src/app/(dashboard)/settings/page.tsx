'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Bell, Shield } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      setUser(parsed)
      setForm({ full_name: parsed.fullName || parsed.full_name || '', email: parsed.email || '', phone: parsed.phone || '' })
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
      }
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Settings</h2>
        <p className="text-surface-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">Profile</h3>
        </div>
        <div className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled />
          <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Rent due reminders', desc: 'Get notified before rent is due' },
            { label: 'Payment received', desc: 'When a tenant marks payment' },
            { label: 'Maintenance requests', desc: 'New requests from tenants' },
            { label: 'Agreement expiry', desc: '30 days before agreement expires' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50">
              <div>
                <p className="text-sm font-medium text-surface-900">{item.label}</p>
                <p className="text-xs text-surface-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:bg-primary-500 transition-colors">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
