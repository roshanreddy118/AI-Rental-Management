'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, Smartphone, Home } from 'lucide-react'
import { Input, Button } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    otp: '',
  })

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      if (data.user.role === 'owner') {
        router.push('/dashboard')
      } else {
        router.push('/my-home')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }
      setOtpSent(true)
    } catch {
      setError('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid OTP')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      if (data.user.role === 'owner') {
        router.push('/dashboard')
      } else {
        router.push('/my-home')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome back!</h2>
          <p className="text-white/80 text-lg mb-8">
            Your properties are waiting. Check rent status, resolve maintenance requests, and more.
          </p>
          <div className="glass-card !bg-white/10 !border-white/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">₹</span>
              </div>
              <div>
                <p className="text-white font-semibold">3 payments received today</p>
                <p className="text-white/60 text-sm">₹45,000 collected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">LandlordOS</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900 mb-2">Log in to your account</h1>
          <p className="text-surface-500 mb-8">Owner or Tenant — same login</p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-surface-100 rounded-xl">
            <button
              onClick={() => { setMode('password'); setError('') }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'password' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'
              }`}
            >
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />
              Password
            </button>
            <button
              onClick={() => { setMode('otp'); setError(''); setOtpSent(false) }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'otp' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 inline mr-1.5" />
              OTP
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
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
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button type="submit" loading={loading} className="w-full">
                Log In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPLogin} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-4 h-4" />}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              {!otpSent ? (
                <Button type="button" onClick={handleSendOTP} loading={loading} className="w-full">
                  Send OTP
                </Button>
              ) : (
                <>
                  <Input
                    label="Enter OTP"
                    placeholder="6-digit code"
                    icon={<Smartphone className="w-4 h-4" />}
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    maxLength={6}
                    required
                  />
                  <Button type="submit" loading={loading} className="w-full">
                    Verify & Log In
                  </Button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full text-sm text-primary-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-sm text-surface-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 font-medium hover:underline">
              Register as Owner
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
