'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Mail, Lock, User, Phone } from 'lucide-react'
import { Input, Button } from '@/components/ui'

function TenantInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteInfo, setInviteInfo] = useState<{ propertyName: string; ownerName: string } | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    inviteCode: code,
  })

  useEffect(() => {
    if (code) {
      setForm(f => ({ ...f, inviteCode: code }))
      // Validate invite code
      fetch(`/api/auth/validate-invite?code=${code}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) {
            setInviteInfo({ propertyName: data.propertyName, ownerName: data.ownerName })
          } else {
            setError('This invite link is invalid or expired.')
          }
        })
        .catch(() => setError('Failed to validate invite'))
    }
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: 'tenant',
          inviteCode: form.inviteCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/my-home')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-surface-50 via-white to-accent-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-900">LandlordOS</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-surface-900 mb-2 text-center">Join as Tenant</h1>
          
          {inviteInfo && (
            <div className="mb-6 p-4 bg-accent-50 border border-accent-100 rounded-xl text-center">
              <p className="text-sm text-accent-700">
                <strong>{inviteInfo.ownerName}</strong> invited you to <strong>{inviteInfo.propertyName}</strong>
              </p>
            </div>
          )}

          <p className="text-surface-500 mb-6 text-center text-sm">
            Create your account to manage rent, maintenance, and more
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Invite Code"
              placeholder="ABCD1234"
              value={form.inviteCode}
              onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Full Name"
              placeholder="Your full name"
              icon={<User className="w-4 h-4" />}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              icon={<Phone className="w-4 h-4" />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              icon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Create Tenant Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function TenantInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <TenantInviteContent />
    </Suspense>
  )
}
